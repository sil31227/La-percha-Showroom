# Push Notifications para Vendedoras (Clientes)

**Fecha:** 2026-07-13
**Estado:** Diseñado

## Resumen

Extender el sistema de push notifications (hoy solo admin) para que las vendedoras reciban alertas en el navegador cuando: alguien compra su producto, el admin aprueba/rechaza su publicación, o se confirma el pago.

## Alcance

- **Audiencia:** Solo vendedoras aprobadas (`seller_status === "approved"`).
- **Suscripción:** Botón en `/vender`, visible cuando la vendedora está aprobada.
- **Eventos notificados:**
  1. Alguien compra su producto (al crear pedido o preferencia MP).
  2. Admin aprueba o rechaza su producto (desde moderación).
  3. Pago confirmado vía webhook de MercadoPago.
- **No incluye:** Compradores que quieran seguir sus pedidos, usuarios no vendedores.

## Decisiones de diseño

- **Enfoque:** Extender tabla, API y helper existentes (refactor mínimo a `push.ts`).
- **Servicio del backend:** Se usan endpoints server-side para enviar push; en los casos donde la acción viene del cliente (store admin), se llama a un endpoint nuevo `POST /api/push/notify-seller`.
- **Service worker:** El mismo `public/sw.js`, modificando `notificationclick` para que no hardcodee URLs de admin.

---

## 1. Base de datos

Agregar columna a `push_subscriptions`:

```sql
ALTER TABLE push_subscriptions
  ADD COLUMN user_id UUID REFERENCES auth.users(id);
```

- `user_id = NULL` para suscripciones de admin (comportamiento actual).
- `user_id = <UUID>` para suscripciones de vendedora.

---

## 2. API de suscripción (`POST /api/push/subscribe`)

**Modificar** la ruta existente.

**Request body (nuevo):**

```json
{
  "endpoint": "...",
  "keys": { "p256dh": "...", "auth": "..." },
  "audience": "admin" | "seller"
}
```

**Lógica:**
- Si `audience === "seller"`, obtener `user_id` del token de sesión (no del body).
- Upsert sobre `endpoint`, guardando `audience` y `user_id`.
- Si `audience` no es "seller", guardar `audience = "admin"`, `user_id = NULL`.

**Seguridad:** El `user_id` nunca se recibe del cliente; se extrae de `supabase.auth.getUser()` server-side.

---

## 3. API de envío de push a seller (`POST /api/push/notify-seller`)

Nueva ruta, usada desde el store admin y potencialmente desde otras APIs server-side.

**Request body:**

```json
{
  "userId": "<uuid de la vendedora>",
  "title": "¡Vendiste un producto!",
  "body": "Alguien compró 'Vestido floreado'...",
  "url": "/perfil/publicaciones"
}
```

**Lógica:**
- Validar que `userId` venga.
- Llamar a `sendSellerPush(userId, { title, body, url })`.
- Responder `{ ok: true }` o `{ error }`.

---

## 4. Helper `push.ts` (refactor)

### Actual
```ts
sendAdminPush(payload)  // solo query audience = "admin"
```

### Nuevo
```ts
// Genérica, reemplaza la lógica de sendAdminPush
async function sendPush(opts: { audience: string; userId?: string }, payload: PushPayload): Promise<void>

// Wrappers (conveniencia)
sendAdminPush(payload)    // sendPush({ audience: "admin" }, payload)
sendSellerPush(userId: string, payload)  // sendPush({ audience: "seller", userId }, payload)
```

**sendPush** consulta `push_subscriptions` con:
- `audience = opts.audience`
- Si `opts.userId`, también `user_id = opts.userId`.

Limpieza de suscripciones inválidas (404/410) sigue igual.

`PushPayload`:
```ts
interface PushPayload {
  title: string
  body: string
  url: string
  tag?: string
}
```

---

## 5. Service Worker (`public/sw.js`)

Modificar eventos:

### `push`
Sin cambios. Usa `event.data.json()` y muestra notificación con `showNotification(title, options)`.

### `notificationclick`
- Leer `event.notification.data.url` del payload.
- Si existe, buscar pestaña abierta con esa URL y enfocarla; si no, abrir nueva.
- Fallback genérico: `"/perfil"` (ya que lo usan vendedoras y compradores).
- Ya no hardcodear `/admin/pedidos`; ese URL vendrá siempre en el payload.

---

## 6. Componente `EnableSellerPush` (cliente)

**Ubicación:** Dentro de `/vender/page.tsx`, visible solo si `seller_status === "approved"`.

**Props/comportamiento:**
- Al montar: verifica `navigator.serviceWorker` y `Notification`.
- Si `Notification.permission === "granted"`: muestra estado "Notificaciones activadas".
- Si `Notification.permission === "denied"`: muestra "Notificaciones bloqueadas. Activalas desde configuración del navegador.".
- Si `Notification.permission === "default"`: muestra botón "Activar notificaciones de ventas".
- Al clickear: registra SW, pide permiso, crea suscripción, hace POST a `/api/push/subscribe` con `audience: "seller"`.
- No pide user_id (el backend lo saca de la sesión).

**Estados visuales:**
| Estado | UI |
|--------|-----|
| `unsupported` | Mensaje si no hay SW/Notification API |
| `prompt` | Botón "🔔 Activar notificaciones de ventas" |
| `loading` | Spinner en el botón |
| `granted` | Badge verde "Notificaciones activadas" |
| `denied` | Texto pequeño + ícono bloqueado |

---

## 7. Puntos de integración

### 7a. Al crear un pedido — `POST /api/checkout/crear-pedido`

Después de insertar pedidos y antes del `sendAdminPush`, buscar `vendedor_id` de cada producto:

```
.select("id, titulo, precio, imagenes, vendedor_nombre, vendedor_tipo, vendedor_id, status, variantes, stock")
```

Por cada `vendedor_id` único, llamar:
```ts
sendSellerPush(vendedorId, {
  title: "¡Vendiste un producto!",
  body: `Alguien compró "${titulo}". Revisá tus publicaciones.`,
  url: "/perfil/publicaciones",
  tag: `venta-${orderId}-${vendedorId}`,
}).catch(() => {})
```

### 7b. Al crear preferencia MP — `POST /api/mercadopago/crear-preferencia`

Misma lógica que 7a. Agregar `vendedor_id` al select de productos y enviar push por cada vendedor único.

### 7c. Admin aprueba/rechaza — Store `approveProduct` / `rejectProduct`

En `src/store/useAdminStore.ts`, después de `createNotification`, agregar:

```ts
fetch("/api/push/notify-seller", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    userId: product.vendedor_id,
    title: "¡Tu prenda fue publicada!",  // o "Tu prenda no fue aprobada"
    body: `"${product.titulo}" ya está a la venta.`,  // o mensaje de rechazo
    url: "/perfil/publicaciones",
  }),
}).catch(() => {})
```

### 7d. Pago confirmado — `POST /api/mercadopago/webhook`

Después de confirmar pago, por cada pedido buscar el `producto_id` asociado y luego su `vendedor_id`. Enviar push:

```ts
sendSellerPush(vendedorId, {
  title: "✅ Pago confirmado",
  body: `Recibiste el pago por "${titulo}".`,
  url: "/perfil/saldo",
  tag: `pago-${externalReference}-${vendedorId}`,
}).catch(() => {})
```

**Nota:** Requiere que la tabla `pedidos` tenga una columna `producto_id` o `vendedor_id`. Si no existe, se debe agregar a la migración y a la inserción de pedidos.

---

## 8. Error handling

- Todos los `sendSellerPush` se envuelven en `.catch(() => {})` (mismo patrón que `sendAdminPush`). Si falla el push, el pedido/publicación se concreta igual.
- Si faltan las envs VAPID, `sendPush` loguea warning y no hace nada.
- Si una vendedora no tiene suscripción push registrada, `sendPush` simplemente no envía nada.

---

## 9. Cambios en archivos

| Archivo | Tipo | Cambio |
|---------|------|--------|
| `supabase/migration-push-admin.sql` | Modificar | Agregar columna `user_id` |
| `src/app/api/push/subscribe/route.ts` | Modificar | Aceptar `audience`, extraer `user_id` de sesión |
| `src/app/api/push/notify-seller/route.ts` | Nuevo | Endpoint server-side para enviar push a seller |
| `src/lib/push.ts` | Modificar | Refactor genérico `sendPush` + `sendSellerPush` |
| `public/sw.js` | Modificar | `notificationclick` usa `url` del payload, quitar hardcodeo |
| `src/app/(cliente)/vender/page.tsx` | Modificar | Agregar `EnableSellerPush` o integrarlo inline |
| `src/store/useAdminStore.ts` | Modificar | Llamar a `/api/push/notify-seller` en approve/reject |
| `src/app/api/checkout/crear-pedido/route.ts` | Modificar | Agregar `vendedor_id` al select + push a sellers |
| `src/app/api/mercadopago/crear-preferencia/route.ts` | Modificar | Ídem |
| `src/app/api/mercadopago/webhook/route.ts` | Modificar | Push a sellers tras pago confirmado |

# Notificaciones push al admin — Diseño

Fecha: 2026-07-13

## Problema

Cuando entra una compra/pedido, el admin no recibe ninguna notificación en el
teléfono. Hoy los pedidos se insertan en la tabla `pedidos` (desde
`/api/checkout/crear-pedido` y confirmados en el webhook de Mercado Pago) y solo
se envían emails a `ADMIN_EMAIL`. La PWA admin ya está anclada al inicio del
iPhone, pero no hay service worker ni push web, así que no llega ningún aviso
inmediato.

## Objetivo

Enviar notificaciones push al dispositivo del admin (iPhone, PWA instalada)
cuando ocurre:

1. **Pedido nuevo** — al crearse el pedido (efectivo, retiro, coordinación).
2. **Pago confirmado** — cuando Mercado Pago confirma el pago (webhook).
3. **Nueva publicación** para moderar.
4. **Registro** de vendedora nueva.

## Contexto técnico

- Next.js 16 desplegado en Vercel (HTTPS). ✓ Requisito de push web.
- PWA admin ya instalada vía `/admin-manifest.json`. ✓ Requisito de iOS.
- iOS 16.4+ permite push web **solo** si: PWA instalada + HTTPS + service worker
  registrado + suscripción VAPID + permiso solicitado tras un gesto del usuario
  (un toque). El diseño respeta esto: el permiso se pide con un botón.
- El panel `/admin` está protegido solo por URL (no hay login de admin). Por eso
  las suscripciones se guardan sin `user_id`: cualquier dispositivo que toque
  "Activar notificaciones" en `/admin` queda suscripto.

## Arquitectura

### 1. Claves VAPID (envs)

Variables de entorno nuevas:

- `VAPID_PUBLIC_KEY` — clave pública (servidor).
- `VAPID_PRIVATE_KEY` — clave privada (servidor).
- `VAPID_SUBJECT` — `mailto:` del admin (ej. `mailto:sil31227@gmail.com`).
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` — misma pública, expuesta al cliente para
  suscribir.

Se generan una vez con un script (`web-push generate-vapid-keys`) y se agregan a
`.env.local`, a Vercel y a `.env.example` (sin valores).

### 2. Service worker — `public/sw.js`

Archivo estático servido desde la raíz (scope `/`). Maneja:

- `push`: parsea el payload JSON `{ title, body, url, tag }` y muestra la
  notificación con el logo.
- `notificationclick`: cierra la notificación y abre/foco la URL indicada
  (`/admin/pedidos`, `/admin/moderacion`, `/admin/registros`). Si ya hay una
  ventana de la PWA abierta, la enfoca en vez de abrir otra.

### 3. Tabla Supabase — `push_subscriptions`

Migración SQL nueva (`supabase/migration-push-admin.sql`):

```sql
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  endpoint   TEXT NOT NULL UNIQUE,
  p256dh     TEXT NOT NULL,
  auth       TEXT NOT NULL,
  audience   TEXT NOT NULL DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
-- Solo el service_role (API routes) escribe/lee. Sin políticas públicas.
```

`endpoint` es único: reactivar en el mismo dispositivo hace upsert, no duplica.
`audience` queda para futuro (hoy siempre `admin`).

### 4. Botón "Activar notificaciones" (cliente)

Componente `EnableAdminPush` montado en el layout admin (top-bar mobile y drawer,
más un ítem en el sidebar desktop). Flujo al tocar:

1. Registra `/sw.js` (`navigator.serviceWorker.register`).
2. `Notification.requestPermission()` (requiere gesto → el toque del botón).
3. `pushManager.subscribe({ userVisibleOnly: true, applicationServerKey })` con
   la pública VAPID.
4. `POST /api/push/subscribe` con la suscripción.

Estados visibles: no soportado, permiso pedido/activado, bloqueado (con guía),
activado ✓. Detecta `Notification.permission` y suscripción existente para
mostrar el estado correcto sin volver a pedir.

### 5. API routes / helper

- `POST /api/push/subscribe` → valida y hace upsert en `push_subscriptions` con
  `service_role` (patrón `createAdminClient`).
- Helper `src/lib/push.ts` → `sendAdminPush({ title, body, url, tag })`:
  - Configura `web-push` con las VAPID.
  - Lee todas las suscripciones `audience = 'admin'`.
  - Envía a cada una; si una devuelve 404/410 (expirada), la borra.
  - Best-effort: envuelto en try/catch, nunca lanza hacia el caller.

### 6. Disparadores

Se llama a `sendAdminPush()` (sin `await` bloqueante / con `catch`) en:

- `src/app/api/checkout/crear-pedido/route.ts` — tras insertar los pedidos:
  "Nuevo pedido #<orderId>" · body con comprador + total · url `/admin/pedidos`.
- `src/app/api/mercadopago/webhook/route.ts` — cuando se confirma el pago (misma
  rama donde hoy se dispara el email de pago confirmado):
  "Pago confirmado #<orderId>" · url `/admin/pedidos`.
- `src/app/api/email/nueva-publicacion/route.ts` — "Nueva prenda para moderar" ·
  url `/admin/moderacion`.
- `src/app/api/registros/crear/route.ts` — "Nueva vendedora registrada" · url
  `/admin/registros`.

En todos los casos el push es adicional al email actual; si falla, no rompe la
operación (igual que hoy con los emails).

## Manejo de errores

- Suscripción del cliente: si el navegador no soporta push o el permiso está
  bloqueado, se muestra guía; no rompe la PWA.
- Envío: suscripciones expiradas (410/404) se eliminan; el resto se ignora en
  logs. La creación de pedidos nunca falla por un error de push.

## Testing / verificación

- `web-push generate-vapid-keys` genera claves válidas.
- Verificación manual en el iPhone: instalar PWA (ya está), tocar "Activar",
  aceptar permiso, hacer una compra de prueba → llega la notificación y al tocar
  abre `/admin/pedidos`.
- Fallback local: si faltan las envs VAPID, `sendAdminPush` no hace nada (log de
  advertencia), igual que Resend cuando falta la API key.

## Dependencias

- Agregar `web-push` a `dependencies`.
- `@types/web-push` a `devDependencies`.

## Fuera de alcance (YAGNI)

- Login/roles de admin (el panel sigue gateado por URL).
- Notificaciones push a vendedoras/compradores (solo admin por ahora).
- Centro de preferencias de notificación por tipo.

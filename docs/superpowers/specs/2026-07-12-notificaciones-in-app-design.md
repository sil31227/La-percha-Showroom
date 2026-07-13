# Notificaciones in-app para vendedoras

Fecha: 2026-07-12
Estado: Diseño aprobado (pendiente plan de implementación)

## Problema

Cuando la admin aprueba (o rechaza) una prenda en Moderación, o aprueba/rechaza
una solicitud de vendedora, la usuaria no recibe ningún aviso dentro de la app.
La pantalla `vender/page.tsx` promete "Te avisamos cuando esté publicada", pero
`approveProduct` en `useAdminStore.ts` no dispara nada. El resultado: la
vendedora no se entera de que su prenda ya está publicada y a la venta.

Decisión del usuario: el aviso debe ser **in-app** (no email), visible en una
**página dentro de Perfil** con un **badge** de no leídas.

## Alcance

Eventos que generan notificación:

- `product_approved` — la prenda fue aprobada y está publicada.
- `product_rejected` — la prenda fue rechazada.
- `seller_approved` — la solicitud de vendedora fue aprobada.
- `seller_rejected` — la solicitud de vendedora fue rechazada.

Fuera de alcance (YAGNI): notificaciones de ventas/pedidos, push del navegador,
email, preferencias de notificación.

## Modelo de datos

Nueva tabla `notifications`:

| columna      | tipo         | notas                                              |
|--------------|--------------|----------------------------------------------------|
| `id`         | TEXT PK      | `notif-<timestamp>-<rand>`                         |
| `user_id`    | UUID         | destinatario (= `profiles.id` / `auth.users.id`)   |
| `type`       | TEXT CHECK   | uno de los 4 tipos del alcance                     |
| `title`      | TEXT         | ej. "¡Tu prenda fue publicada!"                    |
| `body`       | TEXT         | texto descriptivo                                  |
| `link`       | TEXT NULL    | ruta interna, ej. `/producto/<id>`                 |
| `read`       | BOOLEAN      | default `false`                                    |
| `created_at` | TIMESTAMPTZ  | default `NOW()`                                    |

Índice por `(user_id, created_at DESC)`.

### RLS (mismo patrón que el schema actual)

- `notifications_select_own`: `SELECT` con `auth.uid() = user_id`.
- `notifications_update_own`: `UPDATE` con `auth.uid() = user_id` (para marcar leído).
- `admin_all_notifications`: `ALL USING (true) WITH CHECK (true)` — permite que
  el panel admin (anon key) inserte, igual que las policies `admin_all_*`
  existentes.

### Cambio en `productos`

Agregar columna `vendedor_id UUID` (nullable, por compatibilidad con productos
existentes y de la Tienda Oficial). Se completa al publicar con `user.id`. Es
necesaria porque hoy `productos` solo guarda `vendedor_nombre` y no se puede
resolver de forma fiable el id de la vendedora a partir del nombre.

Migración en `supabase/` como archivo nuevo (ej. `migration-notificaciones.sql`),
siguiendo el estilo de las migraciones existentes.

## Flujo

### Publicar prenda (`vender/page.tsx`)
`handleSubmit` agrega `vendedor_id: user.id` al insert de `productos`. Sin otros
cambios.

### Aprobación/rechazo de prenda (`useAdminStore.ts`)
`approveProduct(id)` y `rejectProduct(id)`: además de actualizar `status`,
insertan una fila en `notifications` para el `vendedor_id` del producto
(si existe), con:

- approved → title "¡Tu prenda fue publicada!", body con el título, `link` a
  `/producto/<id>`, type `product_approved`.
- rejected → title "Tu prenda no fue aprobada", body con el título, type
  `product_rejected`, sin link.

Si el producto no tiene `vendedor_id` (Tienda Oficial o productos viejos), no se
crea notificación.

### Aprobación/rechazo de vendedora (`useAdminStore.ts`)
`approveVendor(id)` y `rejectVendor(id)`: se quita el `fetch` al endpoint de
email (`/api/email/vendor-status`) y en su lugar se inserta una notificación
para el id de la vendedora (`vendedores.id` = user id):

- approved → type `seller_approved`, title "¡Ya podés vender en La Percha!",
  `link` a `/vender`.
- rejected → type `seller_rejected`, title "Actualización de tu solicitud".

(El endpoint de email `vendor-status` queda sin usar; se puede dejar en el repo
o borrar en el plan; por defecto se deja para no ampliar el alcance.)

### Lectura en la app
Nuevo store `useNotificationsStore` (zustand), con la misma forma que los stores
actuales:

- `items: Notification[]`, `unreadCount` (derivado), `loaded`.
- `load(userId)`: `select * from notifications where user_id = ? order by
  created_at desc`.
- `markAllRead(userId)`: update `read = true` de las no leídas + estado local.
- `markRead(id)`.

Estrategia de actualización: fetch al montar + polling liviano (cada ~20 s,
como ya hace `vender/page.tsx` con `refreshProfile`). Sin realtime para evitar
tener que habilitar replication.

## UI

### Página `/perfil/notificaciones`
Nueva ruta bajo `(cliente)/perfil/notificaciones/page.tsx`. Lista de tarjetas
con ícono según tipo (CheckCircle / XCircle), título, body, fecha relativa y, si
hay `link`, un enlace "Ver". Al abrir la página se marca todo como leído.
Estado vacío con ilustración/emoji, siguiendo el estilo de `publicaciones/page.tsx`.

### Entrada + badge
- En `perfil/page.tsx`: nueva fila "Notificaciones" (ícono `Bell`) que linkea a
  `/perfil/notificaciones`, con un punto/contador cuando `unreadCount > 0`.
- En `ClienteNavbar.tsx`: punto rojo sobre el avatar/ícono de Perfil (desktop) y
  sobre el tab Perfil (mobile) cuando hay no leídas. Reutiliza el patrón visual
  de los badges de carrito/favoritos existentes.
- El contador se alimenta de `useNotificationsStore`, inicializado junto con
  auth (fetch cuando hay `user`).

## Componentes y límites

- `useNotificationsStore` — única fuente de verdad del estado de notificaciones
  (datos + no leídas + acciones). No conoce UI.
- Página `notificaciones` — presentación + marcar leído al montar.
- Badge en navbar/perfil — solo lee `unreadCount`.
- `useAdminStore` (approve/reject) — productor de notificaciones.
- `vender/page.tsx` — solo agrega `vendedor_id` al publicar.

## Errores y borde

- Insert de notificación con `.catch` que no rompe la aprobación (best-effort,
  como el `fetch` de email actual).
- `vendedor_id` ausente → se omite la notificación de producto sin error.
- Polling se limpia en unmount.
- El badge solo se muestra tras hidratación (patrón `hidratado` ya usado en el
  navbar) para evitar mismatch SSR.

## Testing / verificación

No hay framework de tests en el repo (solo `next build` y `eslint`). Verificación:

1. `bun run lint` sin errores nuevos.
2. `bun run build` compila.
3. Prueba manual: publicar prenda como usuaria → aprobar desde admin →
   aparece notificación + badge → abrir página marca como leída → link abre la
   prenda publicada. Ídem rechazo y aprobación de vendedora.

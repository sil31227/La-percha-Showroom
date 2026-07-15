# Despacho con notificaciones al comprador

## Problema

1. Botón "Confirmar despacho" en Mis Ventas no da feedback visual (sin spinner, sin estado disabled, errores silenciosos). La vendedora percibe que "no hace nada".
2. Al despachar, solo se envía email al comprador. No hay notificación in-app ni push. El comprador no se entera hasta que entra manualmente a Mis Compras.

## Alcance

- Arreglar UX del botón "Confirmar despacho"
- Crear notificación in-app para el comprador al despachar
- Enviar push notification al comprador al despachar
- Componente `EnableBuyerPush` para que compradores activen push

## Cambios

### 1. UX botón despacho — `src/app/(cliente)/perfil/ventas/page.tsx`

- Botón "Confirmar despacho": agregar `Loader2` spinner y `disabled` mientras procesa
- Si `session?.access_token` es nulo, mostrar error "Sesión expirada, volvé a ingresar"
- Mostrar feedback de éxito tras despacho exitoso

### 2. Nuevos tipos de notificación — `src/lib/types.ts`

Agregar a `NotificationType`:
```ts
| "order_shipped"
| "order_delivered"
```

Agregar a `ICONS` en notificaciones/page.tsx con icono `Truck` y estilo `bg-info-50 text-info-600`.

### 3. Migración DB — nuevo archivo `supabase/migration-order-notifications.sql`

Ampliar CHECK constraint de `notifications.type` para incluir `order_shipped` y `order_delivered`.

### 4. Notificación in-app al comprador — `src/app/api/pedidos/despachar/route.ts`

Después del update del pedido:
- Buscar `user_id` del comprador por `comprador_email` en `auth.users`
- Insertar en `notifications`: `type: "order_shipped"`, `title: "Tu pedido está en camino"`, `body: "Pedido #ID — producto. Seguimiento: XXXXXX"` (si es Correo Argentino), `link: "/perfil/compras"`
- Enviar push al buyer con `sendBuyerPush()`

### 5. Push para compradores — `src/lib/push.ts`

Agregar `sendBuyerPush(userId, payload)` con audience `"buyer"`.

### 6. Componente EnableBuyerPush — nuevo archivo `src/app/(cliente)/perfil/compras/EnableBuyerPush.tsx`

Copia de `EnableSellerPush.tsx` adaptada:
- `audience: "buyer"` en lugar de `"seller"`
- Texto: "Activar notificaciones de envíos"
- Se renderiza en la página de "Mis compras"

### 7. Mostrar notificaciones de pedidos — `src/app/(cliente)/perfil/notificaciones/page.tsx`

Agregar `order_shipped` y `order_delivered` al map `ICONS`:
- `order_shipped: { icon: Truck, className: "bg-info-50 text-info-600" }`
- `order_delivered: { icon: CheckCircle, className: "bg-success-50 text-success-600" }`

## No se modifica

- "Mis compras" ya muestra tracking y link de rastreo (estado `shipped` + Correo Argentino)
- El badge de notificaciones no leídas en el perfil ya funciona
- El email de pedido enviado (`/api/email/pedido-enviado`) ya funciona correctamente

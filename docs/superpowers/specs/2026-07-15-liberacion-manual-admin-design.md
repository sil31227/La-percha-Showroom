# Notificación a Admin + Liberación Manual de Fondos

## Problema

Actualmente, cuando la compradora confirma la recepción del pedido en `/api/pedidos/confirmar-entrega`, la RPC `confirmar_entrega` libera automáticamente los fondos al vendedor (cambia venta a `liberado` y acredita saldo). La admin no recibe ninguna notificación de esto ni tiene control sobre la liberación de fondos.

## Alcance

- Modificar `confirmar_entrega` para que, en pedidos de Feria, **no libere fondos automáticamente** (solo marque el pedido como entregado)
- Crear notificación in-app para la admin cuando la compradora confirma recepción
- Enviar push notification a la admin
- Nueva página `/admin/ventas` donde la admin ve todos los pedidos entregados con fondos pendientes de liberar
- Cada fila muestra: producto, vendedora (link a su perfil), monto bruto, comisión (20%), monto a liberar (80%), fecha del pedido
- Botón "Liberar" por cada venta pendiente, que ejecuta la liberación y notifica a la vendedora

## Cambios

### 1. Migración de base de datos — `supabase/migration-release-manual.sql`

- Reemplazar la función `confirmar_entrega` con una nueva versión que acepte `p_liberacion_automatica BOOLEAN DEFAULT true`
  - Cuando `false`: solo actualiza `pedidos.status = 'delivered'`, no toca `ventas` ni `profiles.balance`
  - Cuando `true` (default, usado por admin/oficial): comportamiento actual (libera fondos)
- Crear nueva función RPC `liberar_fondos(p_venta_id TEXT)`:
  - Verifica que la venta existe y está en `pendiente`
  - Verifica que el pedido asociado está en `delivered`
  - Actualiza `ventas.status = 'liberado'`, `ventas.liberado_at = NOW()`
  - Acredita `profiles.balance += venta.monto_neto`
- Los pedidos de tipo `feria` ahora solo pasan a `delivered` sin liberar fondos

### 2. API confirmar-entrega — `src/app/api/pedidos/confirmar-entrega/route.ts`

- Pasar `p_liberacion_automatica := false` al RPC `confirmar_entrega`
- Después de confirmar, crear notificación `order_delivered` para la admin:
  ```ts
  await supabase.from("notifications").insert({
    user_id: adminId,  // obtenido via get_user_id_by_email(ADMIN_EMAIL)
    type: "order_delivered",
    title: "Entrega confirmada",
    body: `La compradora confirmó la recepción del pedido #${pedidoId} - ${productoTitulo}`,
    link: "/admin/ventas",
  })
  ```
- Enviar push a admin via `sendAdminPush()`
- Enviar push a vendedora via `sendSellerPush()` informando que la compradora confirmó

### 3. Nuevo API admin ventas — `src/app/api/admin/ventas/route.ts`

- `GET` — lista ventas `pendiente` cuyos pedidos están en `delivered`
  - JOIN entre `ventas`, `pedidos` y `profiles` para traer: venta id, pedido id, producto_titulo, vendedor_id, vendedor_nombre (profiles.full_name), monto_bruto, comision, monto_neto, created_at
- `POST` — liberar una venta específica:
  - Recibe `{ ventaId }`
  - Llama `liberar_fondos(p_venta_id)`
  - Crea notificación `order_delivered` para la vendedora: "Tus fondos fueron liberados"
  - Envía push a la vendedora

### 4. Nueva página admin — `src/app/(admin)/admin/ventas/page.tsx`

- Carga ventas pendientes de liberación desde `GET /api/admin/ventas`
- Tabla con columnas:
  - Producto (título)
  - Vendedora (nombre + link a `/admin/vendedores` filtrando por ese vendedor)
  - Monto bruto
  - Comisión (20%)
  - A liberar (80%)
  - Fecha del pedido
  - Acción: botón "Liberar" con confirmación
- Al liberar, llama a `POST /api/admin/ventas` con `{ ventaId }`
- Tras liberación exitosa, remueve la fila de la tabla (o muestra feedback)

### 5. Store — `src/store/useAdminStore.ts`

- Nuevo tipo `PendienteLiberacion`:
  ```ts
  interface PendienteLiberacion {
    venta_id: string
    pedido_id: string
    producto_titulo: string
    vendedor_id: string
    vendedor_nombre: string
    monto_bruto: number
    comision: number
    monto_neto: number
    created_at: string
  }
  ```
- Nuevos métodos:
  - `loadVentasPendientes()` — fetch GET lista
  - `liberarFondos(ventaId: string)` — fetch POST liberar
- Estado: `ventasPendientes: PendienteLiberacion[]`

### 6. Sidebar — `src/app/(admin)/sidebar.tsx`

- Agregar ítem: `{ href: "/admin/ventas", label: "Ventas", icon: DollarSign }`

### 7. Notificaciones

- Nueva variante de `order_delivered` con link `/admin/ventas` para admin
- Ícono: `DollarSign` para notificaciones de liberación pendiente
- Los tipos de notificación ya soportan `order_delivered` en `src/lib/types.ts` y en el CHECK constraint de la DB

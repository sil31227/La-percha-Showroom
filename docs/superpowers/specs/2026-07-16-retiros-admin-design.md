# Retiros Admin: Gestión completa + mejoras de saldo

## Contexto

El sistema de retiros para vendedoras "feria" está incompleto: las vendedoras pueden solicitar retiros pero no hay ninguna herramienta admin para gestionarlos. Además, la página de saldo no diferencia claramente entre saldo disponible y pendiente de liberar. Se detectó un posible bug donde ventas "liberadas" no acreditan el balance de la vendedora.

## Alcance

### 1. Bug fix: `confirmar_entrega` no actualiza `profiles.balance`

El RPC `confirmar_entrega` actualiza `ventas.status = 'liberado'` y `profiles.balance`. Si la venta se marca como liberado pero el balance no se actualiza, puede ser por RLS bloqueando el UPDATE silenciosamente (la función usa SECURITY DEFINER pero auth.uid() es NULL con service_role).

**Fix:** Agregar al RPC una validación post-update + `RAISE EXCEPTION` si el balance no se actualizó, o cambiar el enfoque para que la actualización de balance use una ruta que siempre funcione con service_role.

### 2. Mejora de la página de saldo (`/perfil/saldo`)

- Mostrar **saldo disponible** (balance actual para retirar)
- Mostrar **saldo pendiente de liberar** (ventas con status "pendiente", monto_neto sumado)
- Mostrar **total ganado** (liberado + pendiente)
- Tarjeta visual con colores claros para cada estado
- Cuando balance = 0 pero hay pendiente, mostrar mensaje: "Tenés $X pendientes de liberación. Se acreditan cuando la compradora confirme la entrega."

### 3. Admin: API de retiros (`/api/admin/retiros`)

**GET:** Listar retiros con filtro opcional `?status=solicitado|pagado|rechazado`
- Joinea con `vendedores` para obtener datos bancarios (CBU, banco, titular, alias, tipo_cuenta)
- Orden: más recientes primero

**PATCH:** `{ action: "pagar" | "rechazar", retiroId }` 
- `pagar`: llama al RPC `marcar_retiro_pagado`
- `rechazar`: nuevo RPC `rechazar_retiro(p_retiro_id, p_motivo)` que actualiza status + opcionalmente devuelve el monto al balance

### 4. Admin: página de retiros (`/admin/retiros`)

- **Tabs:** Pendientes | Pagados | Rechazados
- **Lista:** cada fila muestra vendedora (nombre/email), monto, CBU/banco/titular, fecha de solicitud
- **Acciones en pendientes:**
  - "Marcar como pagado" → modal de confirmación
  - "Rechazar" → modal con motivo opcional
- **Badge de pendientes** en sidebar con contador

### 5. Notificaciones al admin

Cuando se crea un retiro (`/api/saldo/retirar`):
- Push notification a admins con `sendAdminPush()`
- In-app notification en tabla `notifications` para todos los admins suscritos
- El cuerpo muestra: "{Vendedora} solicitó retiro de ${monto}"

### 6. Sidebar

Agregar item "Retiros" con ícono `Banknote` y badge de pendientes.

## Archivos a modificar/crear

| Archivo | Acción |
|---|---|
| `supabase/schema.sql` | Agregar RPC `rechazar_retiro`, fix `confirmar_entrega` |
| `src/app/api/admin/retiros/route.ts` | Nuevo: GET + PATCH |
| `src/app/api/saldo/retirar/route.ts` | Agregar notificación al admin |
| `src/app/(admin)/admin/retiros/page.tsx` | Nueva página |
| `src/app/(admin)/sidebar.tsx` | Agregar link + badge |
| `src/app/(cliente)/perfil/saldo/page.tsx` | Mejorar UI de estados |
| `src/store/useAdminStore.ts` | Agregar fetchRetiros, markRetiroPagado, rejectRetiro |
| `src/lib/push.ts` | Verificar sendAdminPush existe |

## No incluido

- Emails de confirmación de retiro a la vendedora (se puede agregar después)
- Transferencia bancaria automática (sigue siendo manual)
- Historial de retiros en detalle del vendedor (ya se ve en su perfil)

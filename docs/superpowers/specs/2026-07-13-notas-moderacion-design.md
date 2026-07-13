# Notas de Moderacion -- Design Spec

Fecha: 2026-07-13
Rama: feat/detalle-publicacion-moderacion

## Resumen

Sistema de notas de moderacion para que el admin pueda documentar sus decisiones
al aprobar, rechazar o pedir cambios sobre productos pendientes de revision.
Historial completo de interacciones visible dentro del modal de detalle.

## Alcance

**En este spec** -- Notas internas de moderacion en el panel admin.
**Fuera de este spec** -- Resenas publicas de compradores (spec separado).

## Decisiones de diseno

| Decision | Valor |
|----------|-------|
| Acciones | 3: Aprobar / Pedir cambios / Rechazar |
| Notas | Opcionales para toda accion |
| Historial | Tabla separada, cronologico, dentro del modal |
| UI de notas | Mini-dialog con textarea + confirmar (como el delete actual) |

---

## 1. Base de datos

### Migracion: `migration-moderacion-notas.sql`

```sql
-- Agregar changes_requested al CHECK de status
ALTER TABLE productos DROP CONSTRAINT IF EXISTS productos_status_check;
ALTER TABLE productos ADD CONSTRAINT productos_status_check
  CHECK (status IN ('pending','approved','rejected','changes_requested'));

-- Nueva tabla de notas
CREATE TABLE comentarios_moderacion (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  producto_id TEXT NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL REFERENCES auth.users(id),
  tipo_accion TEXT NOT NULL CHECK (tipo_accion IN ('approved','rejected','changes_requested')),
  texto TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_comentarios_producto ON comentarios_moderacion(producto_id, created_at DESC);

-- RLS: solo admin
ALTER TABLE comentarios_moderacion ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_full_access" ON comentarios_moderacion
  FOR ALL USING (auth.uid() IN (SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'));
```

## 2. Tipos

### Nuevo tipo en `src/lib/types.ts`

```ts
export type ModerationActionType = 'approved' | 'rejected' | 'changes_requested'

export interface ModerationNote {
  id: string
  producto_id: string
  admin_id: string
  tipo_accion: ModerationActionType
  texto: string | null
  created_at: string
}
```

### Cambio en `src/store/useAdminStore.ts`

```ts
// ProductStatus ahora incluye changes_requested
export type ProductStatus = "pending" | "approved" | "rejected" | "changes_requested"
```

## 3. API

### Nueva ruta: `POST /api/admin/moderacion/nota`

Body: `{ producto_id: string, tipo_accion: 'approved' | 'rejected' | 'changes_requested', texto?: string }`

Hace en una transaccion logica:
1. `INSERT INTO comentarios_moderacion` con el texto de la nota
2. `UPDATE productos SET status = tipo_accion` 
3. Si la accion no es approve, envia push + notificacion a la vendedora

Respuesta: `{ note: ModerationNote }` o 400/500 con error.

### Carga de notas

El store debe cargar las notas de cada producto visible en moderacion. Dos opciones:
- A. Cargar todas las notas de todos los productos pendientes en `loadFromSupabase()` (una query extra con `.in("producto_id", ids)`)
- B. Cargar notas de un producto especifico on-demand al abrir el modal

Se elige **A** para evitar loading states en el modal.

## 4. Store changes

### Nuevos metodos en `useAdminStore`

```ts
// Reemplaza approveProduct y rejectProduct
updateProductStatus: (id: string, status: ProductStatus, texto?: string) => Promise<void>

// Notas cargadas durante loadFromSupabase
moderationNotes: Record<string, ModerationNote[]>  // producto_id -> notas
```

### Removidos
- `approveProduct(id)` -- absorbido por `updateProductStatus`
- `rejectProduct(id)` -- absorbido por `updateProductStatus`

## 5. UI -- ProductDetailModal

### Footer (producto pending)
```
┌──────────────────────────────────────────────────┐
│ [Aprobar]   [Pedir cambios]   [Rechazar]   [🗑] │
│  success     outline           danger       ghost│
└──────────────────────────────────────────────────┘
```

### Footer (producto con status previo)
```
┌──────────────────────────────────────────────────┐
│ "Ya fue aprobada/rechazada/se pidieron cambios"  │
│                                      [🗑] ghost  │
└──────────────────────────────────────────────────┘
```

### Mini-dialog de nota (para Rechazar y Pedir cambios)
```
┌─────────────────────────────────────┐
│ ¿[Rechazar | Pedir cambios en]      │
│     publicación?                     │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Motivo (opcional)...            │ │
│ │                                 │ │
│ │                                 │ │
│ └─────────────────────────────────┘ │
│                                     │
│  [Cancelar]    [Confirmar acción]   │
└─────────────────────────────────────┘
```

Aprobar va directo sin dialog (nota no util en ese caso).

### Seccion de historial (en el body, antes del footer)

```
Historial de moderacion
┌──────────────────────────────────────────────────┐
│ ⬤ Rechazada · hace 2 dias                        │
│   Las fotos no muestran bien el estado real.      │
│   Por favor volve a sacarlas con buena luz.       │
│ ──────────────────────────────────────────────── │
│ ⬤ Cambios pedidos · hace 3 dias                  │
│   Falta especificar el talle real en cm.          │
│ ──────────────────────────────────────────────── │
│ ⬤ Enviada a revision · hace 4 dias               │
│   (sin nota)                                      │
└──────────────────────────────────────────────────┘
```

Colores de indicador:
- approved → success (verde)
- rejected → error (terracota/rojo)
- changes_requested → warning (ambar/naranja)

Si no hay historial (primera revision): no se muestra la seccion.

### Audit trail
Siempre se inserta un registro en `comentarios_moderacion` al tomar una accion,
incluso sin texto. Esto da trazabilidad de cuando se tomo cada decision.

### Botones inline en la lista
Los botones check/X de cada fila siguen funcionando igual (aprueban/rechazan
sin nota, insertando registro con texto=NULL). No se agrega boton "pedir cambios"
inline porque requiere mas contexto.

### NotificationType
Extender `NotificationType` en `src/lib/types.ts` con `"product_changes_requested"`.

### Cambio en la pagina moderacion

Los botones inline de la lista (check / X) y los filtros deben contemplar el nuevo estado `changes_requested`:
- Boton check: aprueba directo (sin nota)
- Boton X: rechaza directo (sin nota, como antes)
- Nuevo filtro "Cambios pedidos" junto a Pendientes/Aprobadas/Rechazadas/Todas

El texto del estado en la lista: "Cambios pedidos" con badge warning.

## 6. Notificaciones

Cuando se piden cambios:
- Push a la vendedora: "Tu prenda necesita cambios"
- Notificacion in-app: tipo `product_changes_requested`
- Mensaje: `"${producto.titulo}" necesita algunos cambios antes de publicarse.${texto ? " Motivo: " + texto : ""}`

Cuando se rechaza con nota:
- Incluir el texto de la nota en el mensaje de push/notificacion

## 7. Archivos afectados

| Archivo | Cambio |
|---------|--------|
| `supabase/migration-moderacion-notas.sql` | Nuevo: migracion |
| `src/lib/types.ts` | Agregar `ModerationNote`, `ModerationActionType` |
| `src/store/useAdminStore.ts` | Nuevo `ProductStatus`, reemplazar approve/reject, agregar `updateProductStatus`, cargar notas |
| `src/app/(admin)/admin/moderacion/page.tsx` | Modal: 3 botones, historial, mini-dialog; pagina: filtro changes_requested |
| `src/app/api/admin/moderacion/nota/route.ts` | Nuevo endpoint |

## 8. Que NO se incluye

- Resenas publicas de compradores (spec separado)
- Edicion de notas ya creadas (son inmutables)
- Eliminacion de notas individuales
- Replies/respuestas de la vendedora a las notas de moderacion
- UI de cambios pedidos en el panel de la vendedora (no existe aun, pero las notificaciones le llegan)

# Notas de Moderacion — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Agregar sistema de notas de moderacion con 3 acciones (Aprobar/Pedir cambios/Rechazar), historial y audit trail para el panel admin.

**Architecture:** Migracion SQL para tabla `comentarios_moderacion` + status `changes_requested`. Endpoint POST `/api/admin/moderacion/nota` con admin client (bypassea RLS). Store unificado con `updateProductStatus`. UI en ProductDetailModal con 3 botones, mini-dialog para notas, y seccion de historial.

**Tech Stack:** Supabase (admin client), Next.js API Routes, Zustand store, Tailwind CSS, Lucide icons.

## Global Constraints

- Idioma: espanol argentino, voseo
- Las notas siempre son opcionales (nunca required en el form)
- Siempre se inserta registro en `comentarios_moderacion` (incluso sin texto)
- El estado `changes_requested` debe tratarse igual que `rejected` en filtros y badges
- No se modifica el comportamiento de los botones inline check/X de la lista

---

### Task 1: Migracion SQL

**Files:**
- Create: `supabase/migration-moderacion-notas.sql`

**Interfaces:**
- Produces: tabla `comentarios_moderacion`, nuevo valor `changes_requested` en CHECK de `productos.status`

- [ ] **Step 1: Crear el archivo de migracion**

Crea `supabase/migration-moderacion-notas.sql`:

```sql
-- Agregar changes_requested al CHECK de status de productos
ALTER TABLE productos DROP CONSTRAINT IF EXISTS productos_status_check;
ALTER TABLE productos ADD CONSTRAINT productos_status_check
  CHECK (status IN ('pending','approved','rejected','changes_requested'));

-- Tabla de notas de moderacion
CREATE TABLE IF NOT EXISTS comentarios_moderacion (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  producto_id TEXT NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL,
  tipo_accion TEXT NOT NULL CHECK (tipo_accion IN ('approved','rejected','changes_requested')),
  texto TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comentarios_producto ON comentarios_moderacion(producto_id, created_at DESC);

ALTER TABLE comentarios_moderacion ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_full_access" ON comentarios_moderacion
  FOR ALL USING (true);
```

- [ ] **Step 2: Ejecutar la migracion en Supabase**

```bash
# Aplica la migracion (ajusta segun tu entorno):
# Opcion A - via psql: psql $DATABASE_URL -f supabase/migration-moderacion-notas.sql
# Opcion B - via Supabase dashboard SQL editor: copiar y pegar el contenido
```

- [ ] **Step 3: Verificar que la tabla se creo correctamente**

Ejecuta en el SQL editor de Supabase:
```sql
SELECT table_name FROM information_schema.tables WHERE table_name = 'comentarios_moderacion';
-- Debe devolver 1 fila.

SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint WHERE conname = 'productos_status_check';
-- Debe mostrar: CHECK (status IN ('pending','approved','rejected','changes_requested'))
```

- [ ] **Step 4: Commit**

```bash
git add supabase/migration-moderacion-notas.sql
git commit -m "db: migracion para comentarios_moderacion y status changes_requested"
```

---

### Task 2: Tipos

**Files:**
- Modify: `src/lib/types.ts`
- Modify: `src/store/useAdminStore.ts`

**Interfaces:**
- Produces: `ModerationNote`, `ModerationActionType`, `ProductStatus` actualizado, `NotificationType` actualizado, `ModerationNotesMap`

- [ ] **Step 1: Agregar tipos en src/lib/types.ts**

Agrega al final del archivo, antes del ultimo `export` o cierre:

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

Actualiza `NotificationType` existente:
```ts
// Cambia la linea existente:
export type NotificationType =
  | "product_approved"
  | "product_rejected"
  | "seller_approved"
  | "seller_rejected"

// Por:
export type NotificationType =
  | "product_approved"
  | "product_rejected"
  | "product_changes_requested"
  | "seller_approved"
  | "seller_rejected"
```

- [ ] **Step 2: Actualizar ProductStatus en src/store/useAdminStore.ts**

Cambia la linea:
```ts
export type ProductStatus = "pending" | "approved" | "rejected"
```
Por:
```ts
export type ProductStatus = "pending" | "approved" | "rejected" | "changes_requested"
```

- [ ] **Step 3: Agregar type para el mapa de notas**

Agrega al final del bloque `interface AdminState`, antes del cierre `}`:

```ts
moderationNotes: Record<string, ModerationNote[]>
```

Asegurate de importar `ModerationNote`:
```ts
// Agrega al import de @/lib/types:
import type { Variante, ProductType, ShippingConfig, NotificationType, ModerationNote } from "@/lib/types"
```

- [ ] **Step 4: Inicializar moderationNotes en el create()**

En el objeto inicial de `create<AdminState>`, agrega:
```ts
moderationNotes: {},
```
(junto a los demas campos como `products: []`, `vendors: []`, etc.)

- [ ] **Step 5: Commit**

```bash
git add src/lib/types.ts src/store/useAdminStore.ts
git commit -m "feat: agregar tipos ModerationNote, ModerationActionType, changes_requested al store"
```

---

### Task 3: API Route

**Files:**
- Create: `src/app/api/admin/moderacion/nota/route.ts`

**Interfaces:**
- Consumes: `createAdminClient` de `@/lib/supabase-admin`
- Produces: `POST /api/admin/moderacion/nota` — body `{ producto_id, tipo_accion, texto? }`, respuesta `{ note: ModerationNote }`

- [ ] **Step 1: Crear directorio y archivo**

```bash
mkdir -p src/app/api/admin/moderacion/nota
```

Crea `src/app/api/admin/moderacion/nota/route.ts`:

```ts
import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-admin"

const VALID_ACTIONS = ["approved", "rejected", "changes_requested"]

export async function POST(request: Request) {
  try {
    const { producto_id, tipo_accion, texto } = await request.json()

    if (!producto_id || !tipo_accion) {
      return NextResponse.json({ error: "Faltan producto_id o tipo_accion" }, { status: 400 })
    }

    if (!VALID_ACTIONS.includes(tipo_accion)) {
      return NextResponse.json({ error: "tipo_accion invalido" }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { data: note, error: noteError } = await supabase
      .from("comentarios_moderacion")
      .insert({
        producto_id,
        admin_id: "00000000-0000-0000-0000-000000000000",
        tipo_accion,
        texto: texto || null,
      })
      .select()
      .single()

    if (noteError) {
      return NextResponse.json({ error: noteError.message }, { status: 500 })
    }

    const { error: updateError } = await supabase
      .from("productos")
      .update({ status: tipo_accion })
      .eq("id", producto_id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ note })
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
```

- [ ] **Step 2: Verificar que el archivo compila**

```bash
npx tsc --noEmit src/app/api/admin/moderacion/nota/route.ts 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/admin/moderacion/nota/route.ts
git commit -m "feat: endpoint POST /api/admin/moderacion/nota"
```

---

### Task 4: Store — updateProductStatus y carga de notas

**Files:**
- Modify: `src/store/useAdminStore.ts`

**Interfaces:**
- Consumes: `ModerationNote` de `@/lib/types`, `supabase` de `@/lib/supabase`
- Produce: `updateProductStatus()` metodo, `moderationNotes` populado en `loadFromSupabase()`
- Remueve: `approveProduct()`, `rejectProduct()` (absorbidos por updateProductStatus)

- [ ] **Step 1: Agregar updateProductStatus a la interface AdminState**

En la interface `AdminState`, reemplaza las lineas de `approveProduct` y `rejectProduct`:

```ts
// REMOVER estas dos lineas:
approveProduct: (id: string) => Promise<void>
rejectProduct: (id: string) => Promise<void>

// AGREGAR esta linea en su lugar:
updateProductStatus: (id: string, status: ProductStatus, texto?: string) => Promise<void>
```

- [ ] **Step 2: Reemplazar approveProduct y rejectProduct en el create()**

En el objeto de `create<AdminState>((set, get) => ({...}))`, busca el bloque que contiene `approveProduct` y `rejectProduct` y reemplazalo completo por:

```ts
updateProductStatus: async (id, status, texto) => {
  const product = get().products.find(p => p.id === id)

  const { data: note } = await supabase
    .from("comentarios_moderacion")
    .insert({
      producto_id: id,
      admin_id: "00000000-0000-0000-0000-000000000000",
      tipo_accion: status,
      texto: texto || null,
    })
    .select()
    .single()

  await supabase.from("productos").update({ status }).eq("id", id)

  if (status !== "approved" && product?.vendedor_id) {
    const title =
      status === "rejected"
        ? "Tu prenda no fue aprobada"
        : "Tu prenda necesita cambios"
    const body =
      status === "rejected"
        ? `"${product.titulo}" no paso la moderacion.${texto ? " Motivo: " + texto : ""} Podes revisarla y volver a publicarla.`
        : `"${product.titulo}" necesita algunos cambios antes de publicarse.${texto ? " Motivo: " + texto : ""}`

    createNotification(
      product.vendedor_id,
      status === "rejected" ? "product_rejected" : "product_changes_requested",
      title,
      body,
      null
    )

    fetch("/api/push/notify-seller", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: product.vendedor_id,
        title,
        body,
        url: "/perfil/publicaciones",
      }),
    }).catch(() => {})
  }

  if (note) {
    set(s => ({
      products: s.products.map(p => p.id === id ? { ...p, status: status as ProductStatus } : p),
      moderationNotes: {
        ...s.moderationNotes,
        [id]: [note as ModerationNote, ...(s.moderationNotes[id] || [])],
      },
    }))
  } else {
    set(s => ({
      products: s.products.map(p => p.id === id ? { ...p, status: status as ProductStatus } : p),
    }))
  }
},
```

- [ ] **Step 3: Cargar notas en loadFromSupabase**

En el metodo `loadFromSupabase`, despues de obtener los resultados y antes del `set({...})`:

Agrega:
```ts
let moderationNotes: Record<string, ModerationNote[]> = {}
const productIds = (pRes.data || []).map((p: { id: string }) => p.id)
if (productIds.length > 0) {
  const { data: notes } = await supabase
    .from("comentarios_moderacion")
    .select("*")
    .in("producto_id", productIds)
    .order("created_at", { ascending: false })
  if (notes) {
    for (const note of notes) {
      const pid = note.producto_id
      if (!moderationNotes[pid]) moderationNotes[pid] = []
      moderationNotes[pid].push(note as ModerationNote)
    }
  }
}
```

Y agrega `moderationNotes` al objeto del `set()`:
```ts
set({
  products: (pRes.data || []) as AdminProduct[],
  vendors: (vRes.data || []) as VendorRequest[],
  orders: (oRes.data || []) as AdminOrder[],
  categories: (cRes.data || []) as unknown as AdminCategory[],
  faq: (fRes.data || []) as FAQItem[],
  terms: tRes.data?.contenido || "",
  moderationNotes,  // <-- agregar esta linea
  loaded: true,
})
```

- [ ] **Step 4: Verificar compilacion**

```bash
npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 5: Commit**

```bash
git add src/store/useAdminStore.ts
git commit -m "feat: updateProductStatus reemplaza approve/reject, carga notas de moderacion"
```

---

### Task 5: UI — ProductDetailModal (3 botones, mini-dialog, historial)

**Files:**
- Modify: `src/app/(admin)/admin/moderacion/page.tsx`

**Interfaces:**
- Consumes: `useAdminStore().updateProductStatus`, `useAdminStore().moderationNotes`
- Cambia: `ProductDetailModal` — footer con 3 botones, mini-dialog para notas, seccion de historial

**Helper de fecha relativa** (agregar al principio del archivo):

```ts
function timeAgo(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diffMs = now - then
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return "ahora"
  if (mins < 60) return `hace ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `hace ${hours} h`
  const days = Math.floor(hours / 24)
  if (days === 1) return "ayer"
  return `hace ${days} dias`
}
```

**Labels y colores de acciones:**

```ts
const ACTION_LABEL: Record<string, string> = {
  approved: "Aprobada",
  rejected: "Rechazada",
  changes_requested: "Cambios pedidos",
}

const ACTION_COLOR: Record<string, string> = {
  approved: "bg-success-500",
  rejected: "bg-error-500",
  changes_requested: "bg-warning-500 text-warning-700",
}
```

- [ ] **Step 1: Actualizar import de lucide-react**

Agrega `Edit3` al import de lucide-react:
```tsx
import { Check, X, Trash2, Package, Tag, Ruler, Palette, Layers, Truck, Store, Edit3 } from "lucide-react"
```

- [ ] **Step 2: Agregar estado noteDialog al modal**

Dentro de `ProductDetailModal`, agrega el estado para el mini-dialog:
```tsx
function ProductDetailModal({ product, onClose, onApprove, onReject, onDelete }: {
  product: AdminProduct
  onClose: () => void
  onApprove: (id: string) => void
  onReject: (id: string) => void
  onDelete: (id: string) => void
}) {
  const [showDelete, setShowDelete] = useState(false)
  const [noteDialog, setNoteDialog] = useState<{ action: "rejected" | "changes_requested" } | null>(null)
  const [noteText, setNoteText] = useState("")
  const { updateProductStatus, moderationNotes } = useAdminStore()
```

- [ ] **Step 3: Reemplazar el footer de botones**

Busca el bloque del footer (lineas 139-168) y reemplazalo por:

```tsx
<div className="flex gap-3 px-5 py-4 border-t border-border-subtle shrink-0">
  {product.status === "pending" ? (
    <>
      <button
        onClick={() => { onApprove(product.id); onClose() }}
        className="flex-1 h-11 rounded-full bg-success-500 text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-success-600 transition-colors"
      >
        <Check className="w-4.5 h-4.5" />
        Aprobar
      </button>
      <button
        onClick={() => { setNoteDialog({ action: "changes_requested" }); setNoteText("") }}
        className="flex-1 h-11 rounded-full border border-border-default text-text-body text-sm font-semibold flex items-center justify-center gap-2 hover:bg-surface-sunken transition-colors"
      >
        <Edit3 className="w-4 h-4" />
        Pedir cambios
      </button>
      <button
        onClick={() => { setNoteDialog({ action: "rejected" }); setNoteText("") }}
        className="flex-1 h-11 rounded-full bg-error-500 text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-error-600 transition-colors"
      >
        <X className="w-4.5 h-4.5" />
        Rechazar
      </button>
    </>
  ) : (
    <p className="flex-1 text-center text-sm text-text-muted py-2">
      Esta publicacion ya fue {product.status === "approved" ? "aprobada" : product.status === "changes_requested" ? "marcada con cambios pedidos" : "rechazada"}
    </p>
  )}
  <button
    onClick={() => setShowDelete(true)}
    className="w-11 h-11 shrink-0 rounded-full border border-border-default flex items-center justify-center hover:bg-error-50 hover:text-error-500 hover:border-error-200 transition-colors"
  >
    <Trash2 className="w-4 h-4" />
  </button>
</div>
```

- [ ] **Step 4: Agregar seccion de historial en el body**

Antes del cierre del `overflow-y-auto flex-1` div (antes de la linea `<div className="flex gap-3 px-5 py-4...">`), agrega:

```tsx
{(() => {
  const notes = moderationNotes[product.id]
  if (!notes || notes.length === 0) return null
  return (
    <div className="px-5 pb-2">
      <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">Historial de moderacion</p>
      <div className="space-y-2">
        {notes.map((note, i) => (
          <div key={note.id} className={i < notes.length - 1 ? "border-b border-border-subtle pb-2" : ""}>
            <div className="flex items-center gap-2 mb-1">
              <span className={`w-2 h-2 rounded-full ${ACTION_COLOR[note.tipo_accion] || "bg-surface-sunken"}`} />
              <span className="text-xs font-semibold text-text-muted">
                {ACTION_LABEL[note.tipo_accion] || note.tipo_accion} · {timeAgo(note.created_at)}
              </span>
            </div>
            {note.texto ? (
              <p className="text-sm text-text-body ml-4">{note.texto}</p>
            ) : (
              <p className="text-xs text-text-subtle italic ml-4">(sin nota)</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
})()}
```

- [ ] **Step 5: Agregar mini-dialog de nota**

Agrega despues del bloque `{showDelete && (...)}` (antes del cierre del div principal del modal):

```tsx
{noteDialog && (
  <div className="absolute inset-0 z-10 flex items-end lg:items-center justify-center">
    <div className="absolute inset-0 bg-carob-900/40 backdrop-blur-sm" onClick={() => setNoteDialog(null)} />
    <div className="relative bg-surface-card rounded-t-2xl lg:rounded-2xl p-6 w-full lg:max-w-sm">
      <p className="font-semibold text-text-strong mb-2">
        {noteDialog.action === "rejected" ? "Rechazar publicacion" : "Pedir cambios"}
      </p>
      <p className="text-sm text-text-muted mb-4">
        {noteDialog.action === "rejected"
          ? "La vendedora recibira una notificacion con el motivo."
          : "La vendedora recibira una notificacion con los cambios que necesita."}
      </p>
      <textarea
        value={noteText}
        onChange={e => setNoteText(e.target.value)}
        placeholder="Motivo (opcional)..."
        rows={3}
        className="w-full rounded-xl border border-border-default bg-surface-sunken px-3 py-2 text-sm text-text-body placeholder:text-text-subtle resize-none focus:outline-none focus:border-brand mb-5"
      />
      <div className="flex gap-3">
        <button
          onClick={() => setNoteDialog(null)}
          className="flex-1 h-10 rounded-full border border-border-default text-sm font-semibold"
        >
          Cancelar
        </button>
        <button
          onClick={() => {
            updateProductStatus(product.id, noteDialog.action, noteText || undefined)
            setNoteDialog(null)
            onClose()
          }}
          className={`flex-1 h-10 rounded-full text-white text-sm font-semibold ${noteDialog.action === "rejected" ? "bg-error-500 hover:bg-error-600" : "bg-warning-500 hover:bg-warning-600"}`}
        >
          {noteDialog.action === "rejected" ? "Rechazar" : "Pedir cambios"}
        </button>
      </div>
    </div>
  </div>
)}
```

- [ ] **Step 6: Verificar compilacion**

```bash
npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 7: Commit**

```bash
git add src/app/\(admin\)/admin/moderacion/page.tsx
git commit -m "feat: ProductDetailModal con 3 botones, mini-dialog de nota e historial"
```

---

### Task 6: Pagina de moderacion — filtros y badges

**Files:**
- Modify: `src/app/(admin)/admin/moderacion/page.tsx`

**Interfaces:**
- Consume: `ProductDetailModal` ya actualizado del Task 5
- Cambia: filtros incluyen `changes_requested`, badges en lista, texto de estado

- [ ] **Step 1: Actualizar array de filtros**

Busca la linea:
```tsx
const FILTERS = [{ v: "pending" as const, l: "Pendientes", c: counts.pending }, { v: "approved" as const, l: "Aprobadas", c: counts.approved }, { v: "rejected" as const, l: "Rechazadas", c: counts.rejected }, { v: "all" as const, l: "Todas", c: counts.all }]
```

Y actualizala para incluir `changes_requested`:
```tsx
const counts = { all: products.length, pending: products.filter(p => p.status === "pending").length, approved: products.filter(p => p.status === "approved").length, rejected: products.filter(p => p.status === "rejected").length, changes_requested: products.filter(p => p.status === "changes_requested").length }
const FILTERS = [{ v: "pending" as const, l: "Pendientes", c: counts.pending }, { v: "approved" as const, l: "Aprobadas", c: counts.approved }, { v: "changes_requested" as const, l: "Cambios pedidos", c: counts.changes_requested }, { v: "rejected" as const, l: "Rechazadas", c: counts.rejected }, { v: "all" as const, l: "Todas", c: counts.all }]
```

- [ ] **Step 2: Actualizar el estado del filtro para incluir changes_requested**

Cambia:
```tsx
const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending")
```
Por:
```tsx
const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected" | "changes_requested">("pending")
```

- [ ] **Step 3: Agregar badge para changes_requested en la lista**

En el mapa de productos (linea 207+), busca la linea del badge:
```tsx
{p.status === "pending" ? <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-warning-50 text-warning-600">Pendiente</span> : p.status === "approved" ? <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-success-50 text-success-600">Aprobada</span> : <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-error-50 text-error-500">Rechazada</span>}
```

Reemplazala por:
```tsx
{p.status === "pending" ? <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-warning-50 text-warning-600">Pendiente</span> : p.status === "approved" ? <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-success-50 text-success-600">Aprobada</span> : p.status === "changes_requested" ? <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-warning-50 text-warning-600">Cambios pedidos</span> : <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-error-50 text-error-500">Rechazada</span>}
```

- [ ] **Step 4: Actualizar onApprove y onReject en ProductDetailModal**

Busca la instancia de `ProductDetailModal` al final del componente:
```tsx
<ProductDetailModal
  product={detailProduct}
  onClose={() => setDetailProduct(null)}
  onApprove={approveProduct}
  onReject={rejectProduct}
  onDelete={removeStoreProduct}
/>
```

Actualiza para usar `updateProductStatus`:
```tsx
<ProductDetailModal
  product={detailProduct}
  onClose={() => setDetailProduct(null)}
  onApprove={(id) => updateProductStatus(id, "approved")}
  onReject={(id) => updateProductStatus(id, "rejected")}
  onDelete={removeStoreProduct}
/>
```

Y extrae `updateProductStatus` del store en la pagina:
```tsx
const { products, loaded, loadFromSupabase, updateProductStatus, removeStoreProduct } = useAdminStore()
```

(en lugar de `approveProduct, rejectProduct`)

- [ ] **Step 5: Actualizar los botones inline de la lista**

Los botones inline check/X de la lista usan `approveProduct` y `rejectProduct`. Actualizalos:
```tsx
// Cambiar:
onClick={() => approveProduct(p.id)}
// Por:
onClick={() => updateProductStatus(p.id, "approved")}

// Cambiar:
onClick={() => rejectProduct(p.id)}
// Por:
onClick={() => updateProductStatus(p.id, "rejected")}
```

- [ ] **Step 6: Verificar compilacion**

```bash
npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 7: Commit**

```bash
git add src/app/\(admin\)/admin/moderacion/page.tsx
git commit -m "feat: filtros changes_requested, badges, updateProductStatus en moderacion"
```

---

## Self-Review

**Spec coverage:** Cada seccion del spec tiene su task:
- Seccion 1 (DB) → Task 1
- Seccion 2 (Tipos) → Task 2
- Seccion 3 (API) → Task 3
- Seccion 4 (Store) → Task 4
- Seccion 5 (UI) → Tasks 5, 6
- Seccion 6 (Notificaciones) → Incluido en Task 4 (updateProductStatus)

**Placeholder scan:** Sin TBDs ni placeholders.

**Type consistency:**
- `ModerationNote` definido en Task 2, usado en Tasks 3, 4, 5 ✓
- `ProductStatus` actualizado en Task 2, usado en Tasks 4, 6 ✓
- `updateProductStatus` definido en Task 4, usado en Tasks 5, 6 ✓
- `moderationNotes` definido en Task 2, populado en Task 4, usado en Task 5 ✓

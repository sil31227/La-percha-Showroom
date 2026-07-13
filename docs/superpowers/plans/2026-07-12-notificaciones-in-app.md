# Notificaciones in-app para vendedoras — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Avisar a la vendedora dentro de la app cuando la admin aprueba/rechaza su prenda o su solicitud de vendedora, con una página en Perfil y un badge de no leídas.

**Architecture:** Nueva tabla `notifications` en Supabase producida por las acciones del panel admin (`useAdminStore`) y consumida por un store zustand (`useNotificationsStore`) que alimenta una página `/perfil/notificaciones` y badges en Perfil/navbar. Fetch al montar + polling liviano; sin email ni realtime.

**Tech Stack:** Next.js 16 (App Router, RSC + "use client"), React 19, zustand 5, Supabase JS 2, Tailwind 4, lucide-react.

## Global Constraints

- No hay framework de tests en el repo. "Verificación" = `bun run lint` (script `lint` = `eslint`) y `bun run build`, más prueba manual descrita. No inventar un test runner.
- Seguir el estilo existente: componentes `"use client"` cuando usan hooks; stores zustand con `create((set, get) => ...)`; clases Tailwind con tokens del design system (`text-text-strong`, `bg-surface-card`, `border-border-subtle`, `bg-brand`, `text-text-muted`, etc.).
- Cliente Supabase: `import { supabase } from "@/lib/supabase"`.
- Los inserts de notificaciones son best-effort: envolver en `.catch`/try y nunca romper la aprobación.
- IDs de texto con el patrón del repo: `` `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` ``.
- Badges solo tras hidratación (patrón `hidratado` ya usado en `ClienteNavbar.tsx`) para evitar mismatch SSR.
- Commits frecuentes, uno por task.

---

### Task 1: Migración de base de datos

**Files:**
- Create: `supabase/migration-notificaciones.sql`

**Interfaces:**
- Produces: tabla `notifications(id TEXT, user_id UUID, type TEXT, title TEXT, body TEXT, link TEXT, read BOOLEAN, created_at TIMESTAMPTZ)`; columna `productos.vendedor_id UUID`.

- [ ] **Step 1: Escribir la migración**

Create `supabase/migration-notificaciones.sql`:

```sql
-- Migration: notificaciones in-app para vendedoras
-- Run in Supabase SQL Editor

BEGIN;

-- 1. Tabla notifications
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('product_approved','product_rejected','seller_approved','seller_rejected')),
  title TEXT NOT NULL,
  body TEXT DEFAULT '',
  link TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS notifications_user_created_idx
  ON notifications (user_id, created_at DESC);

-- 2. Columna vendedor_id en productos
ALTER TABLE productos ADD COLUMN IF NOT EXISTS vendedor_id UUID;

-- 3. RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_select_own" ON notifications
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notifications_update_own" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "admin_all_notifications" ON notifications
  FOR ALL USING (true) WITH CHECK (true);

COMMIT;
```

- [ ] **Step 2: Aplicar en Supabase**

Ejecutar el contenido de `supabase/migration-notificaciones.sql` en el SQL Editor del proyecto Supabase (el equipo lo corre manualmente, igual que las otras migraciones). Verificar que la tabla `notifications` y la columna `productos.vendedor_id` existen.

- [ ] **Step 3: Commit**

```bash
git add supabase/migration-notificaciones.sql
git commit -m "feat(db): tabla notifications y columna productos.vendedor_id"
```

---

### Task 2: Tipo Notification + store useNotificationsStore

**Files:**
- Modify: `src/lib/types.ts` (agregar tipo al final)
- Create: `src/store/useNotificationsStore.ts`

**Interfaces:**
- Produces:
  - Tipo `Notification = { id: string; user_id: string; type: NotificationType; title: string; body?: string; link?: string | null; read: boolean; created_at?: string }` con `NotificationType = "product_approved" | "product_rejected" | "seller_approved" | "seller_rejected"`.
  - Store `useNotificationsStore` con: `items: Notification[]`, `loaded: boolean`, `unreadCount: () => number`, `load(userId: string): Promise<void>`, `markAllRead(userId: string): Promise<void>`, `clear(): void`.

- [ ] **Step 1: Agregar el tipo en `src/lib/types.ts`**

Agregar al final del archivo:

```ts
export type NotificationType =
  | "product_approved"
  | "product_rejected"
  | "seller_approved"
  | "seller_rejected"

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  body?: string
  link?: string | null
  read: boolean
  created_at?: string
}
```

- [ ] **Step 2: Crear el store**

Create `src/store/useNotificationsStore.ts`:

```ts
import { create } from "zustand"
import { supabase } from "@/lib/supabase"
import type { Notification } from "@/lib/types"

interface NotificationsState {
  items: Notification[]
  loaded: boolean
  unreadCount: () => number
  load: (userId: string) => Promise<void>
  markAllRead: (userId: string) => Promise<void>
  clear: () => void
}

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  items: [],
  loaded: false,

  unreadCount: () => get().items.filter(n => !n.read).length,

  load: async (userId) => {
    if (!userId) return
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
    set({ items: (data || []) as Notification[], loaded: true })
  },

  markAllRead: async (userId) => {
    if (!userId) return
    const hasUnread = get().items.some(n => !n.read)
    set(s => ({ items: s.items.map(n => ({ ...n, read: true })) }))
    if (hasUnread) {
      await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", userId)
        .eq("read", false)
    }
  },

  clear: () => set({ items: [], loaded: false }),
}))
```

- [ ] **Step 3: Verificar typecheck/lint**

Run: `bun run lint`
Expected: sin errores nuevos en `src/store/useNotificationsStore.ts` ni `src/lib/types.ts`.

- [ ] **Step 4: Commit**

```bash
git add src/lib/types.ts src/store/useNotificationsStore.ts
git commit -m "feat(store): useNotificationsStore y tipo Notification"
```

---

### Task 3: Guardar vendedor_id al publicar

**Files:**
- Modify: `src/app/(cliente)/vender/page.tsx:255-272` (objeto insert de `productos`)

**Interfaces:**
- Consumes: `user.id` de `useAuthStore`.
- Produces: filas de `productos` con `vendedor_id` poblado.

- [ ] **Step 1: Agregar vendedor_id al insert**

En `handleSubmit`, dentro de `supabase.from("productos").insert({ ... })`, agregar el campo junto a `vendedor_nombre`:

```ts
      vendedor_nombre: user.name,
      vendedor_id: user.id,
      vendedor_tipo: "feria",
```

- [ ] **Step 2: Verificar build**

Run: `bun run lint`
Expected: sin errores nuevos.

- [ ] **Step 3: Commit**

```bash
git add "src/app/(cliente)/vender/page.tsx"
git commit -m "feat(vender): guardar vendedor_id al publicar prenda"
```

---

### Task 4: Producir notificaciones desde el panel admin

**Files:**
- Modify: `src/store/useAdminStore.ts` (interface `AdminProduct`, `approveProduct`, `rejectProduct`, `approveVendor`, `rejectVendor`)

**Interfaces:**
- Consumes: tabla `notifications` (Task 1), `productos.vendedor_id` (Task 3), `vendedores.id`/`email`/`nombre`.
- Produces: filas en `notifications` al aprobar/rechazar.

- [ ] **Step 1: Agregar vendedor_id a AdminProduct**

En la interface `AdminProduct` (cerca de la línea 14), agregar el campo:

```ts
  vendedor_nombre: string; vendedor_id?: string; vendedor_tipo: "oficial" | "feria"
```

- [ ] **Step 2: Agregar helper de inserción arriba del store**

Justo antes de `export const useAdminStore = create<AdminState>(...)`, agregar:

```ts
async function createNotification(userId: string | undefined, type: string, title: string, body: string, link: string | null) {
  if (!userId) return
  const id = `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
  await supabase.from("notifications").insert({ id, user_id: userId, type, title, body, link, read: false }).then(
    () => {},
    () => {}
  )
}
```

- [ ] **Step 3: Notificar en approveProduct / rejectProduct**

Reemplazar los métodos actuales (líneas ~94-101) por:

```ts
  approveProduct: async (id) => {
    const product = get().products.find(p => p.id === id)
    await supabase.from("productos").update({ status: "approved" }).eq("id", id)
    createNotification(
      product?.vendedor_id,
      "product_approved",
      "¡Tu prenda fue publicada!",
      `"${product?.titulo || "Tu prenda"}" ya está publicada y a la venta en La Percha.`,
      `/producto/${id}`
    )
    set(s => ({ products: s.products.map(p => p.id === id ? { ...p, status: "approved" as const } : p) }))
  },
  rejectProduct: async (id) => {
    const product = get().products.find(p => p.id === id)
    await supabase.from("productos").update({ status: "rejected" }).eq("id", id)
    createNotification(
      product?.vendedor_id,
      "product_rejected",
      "Tu prenda no fue aprobada",
      `"${product?.titulo || "Tu prenda"}" no pasó la moderación esta vez. Podés revisarla y volver a publicarla.`,
      null
    )
    set(s => ({ products: s.products.map(p => p.id === id ? { ...p, status: "rejected" as const } : p) }))
  },
```

- [ ] **Step 4: Notificar en approveVendor / rejectVendor**

En `approveVendor`, reemplazar el bloque `if (vendor?.email) { fetch(...) }` por:

```ts
    createNotification(
      id,
      "seller_approved",
      "¡Ya podés vender en La Percha!",
      "Tu solicitud fue aprobada. Publicá tus prendas y empezá a vender.",
      "/vender"
    )
```

En `rejectVendor`, reemplazar el bloque `if (vendor?.email) { fetch(...) }` por:

```ts
    createNotification(
      id,
      "seller_rejected",
      "Actualización de tu solicitud",
      "Tu solicitud para vender no fue aprobada en esta ocasión.",
      null
    )
```

Eliminar la variable `vendor` en `approveVendor`/`rejectVendor` si queda sin uso (el `get().vendors.find` ya no es necesario). Si `vendor` no se usa en otro lado del método, quitar la línea `const vendor = get().vendors.find(v => v.id === id)`.

- [ ] **Step 5: Verificar lint**

Run: `bun run lint`
Expected: sin errores ni warnings de variables sin usar en `useAdminStore.ts`.

- [ ] **Step 6: Commit**

```bash
git add src/store/useAdminStore.ts
git commit -m "feat(admin): crear notificaciones al aprobar/rechazar prenda y vendedora"
```

---

### Task 5: Inicializador y polling de notificaciones

**Files:**
- Create: `src/components/NotificationsInitializer.tsx`
- Modify: `src/app/(cliente)/layout.tsx`

**Interfaces:**
- Consumes: `useAuthStore().user`, `useNotificationsStore().load/clear`.
- Produces: carga automática + polling de notificaciones para el badge global.

- [ ] **Step 1: Crear el componente inicializador**

Create `src/components/NotificationsInitializer.tsx`:

```tsx
"use client"
import { useEffect } from "react"
import { useAuthStore } from "@/store/useAuthStore"
import { useNotificationsStore } from "@/store/useNotificationsStore"

export function NotificationsInitializer() {
  const userId = useAuthStore(s => s.user?.id)
  const load = useNotificationsStore(s => s.load)
  const clear = useNotificationsStore(s => s.clear)

  useEffect(() => {
    if (!userId) { clear(); return }
    load(userId)
    const interval = setInterval(() => load(userId), 20000)
    return () => clearInterval(interval)
  }, [userId, load, clear])

  return null
}
```

- [ ] **Step 2: Montar en el layout de cliente**

En `src/app/(cliente)/layout.tsx`, importar y renderizar junto a `AuthInitializer`:

```tsx
import NavbarWrapper from "@/components/NavbarWrapper";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { AuthInitializer } from "@/components/AuthInitializer";
import { NotificationsInitializer } from "@/components/NotificationsInitializer";

export default function ClienteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg-page flex flex-col lg:pt-16">
      <AuthInitializer />
      <NotificationsInitializer />

      <main className="flex-1 pb-20 lg:pb-0">{children}</main>
      <NavbarWrapper />
      <WhatsAppButton />
    </div>
  );
}
```

- [ ] **Step 3: Verificar build**

Run: `bun run lint`
Expected: sin errores nuevos.

- [ ] **Step 4: Commit**

```bash
git add src/components/NotificationsInitializer.tsx "src/app/(cliente)/layout.tsx"
git commit -m "feat(cliente): cargar notificaciones con polling en el layout"
```

---

### Task 6: Página /perfil/notificaciones

**Files:**
- Create: `src/app/(cliente)/perfil/notificaciones/page.tsx`

**Interfaces:**
- Consumes: `useAuthStore().user`, `useNotificationsStore` (`items`, `loaded`, `load`, `markAllRead`).
- Produces: ruta `/perfil/notificaciones`.

- [ ] **Step 1: Crear la página**

Create `src/app/(cliente)/perfil/notificaciones/page.tsx`:

```tsx
"use client"
import { useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, CheckCircle, XCircle, Bell, Loader2 } from "lucide-react"
import { useAuthStore } from "@/store/useAuthStore"
import { useNotificationsStore } from "@/store/useNotificationsStore"
import type { NotificationType } from "@/lib/types"

const ICONS: Record<NotificationType, { icon: typeof CheckCircle; className: string }> = {
  product_approved: { icon: CheckCircle, className: "bg-success-50 text-success-600" },
  seller_approved: { icon: CheckCircle, className: "bg-success-50 text-success-600" },
  product_rejected: { icon: XCircle, className: "bg-error-50 text-error-500" },
  seller_rejected: { icon: XCircle, className: "bg-error-50 text-error-500" },
}

export default function NotificacionesPage() {
  const userId = useAuthStore(s => s.user?.id)
  const { items, loaded, load, markAllRead } = useNotificationsStore()

  useEffect(() => {
    if (!userId) return
    load(userId).then(() => markAllRead(userId))
  }, [userId, load, markAllRead])

  return (
    <div className="flex flex-col min-h-screen">
      <header className="h-16 flex items-center gap-3 px-5 bg-bg-page border-b border-border-subtle sticky top-0 z-10 lg:top-16">
        <Link href="/perfil" className="w-9 h-9 rounded-full bg-surface-sunken flex items-center justify-center shrink-0">
          <ArrowLeft className="w-4 h-4 text-text-muted" />
        </Link>
        <h1 className="font-display text-xl text-text-strong">Notificaciones</h1>
      </header>

      <div className="flex-1 px-4 lg:px-6 py-4 space-y-3 pb-24 lg:pb-10 max-w-lg mx-auto w-full">
        {!loaded ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-brand animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Bell className="w-10 h-10 text-text-subtle" />
            <p className="text-text-muted text-sm">No tenés notificaciones todavía</p>
          </div>
        ) : (
          items.map(n => {
            const cfg = ICONS[n.type]
            const Icon = cfg.icon
            const card = (
              <div className="bg-surface-card rounded-xl border border-border-subtle p-4 flex items-start gap-3">
                <span className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${cfg.className}`}>
                  <Icon className="w-4.5 h-4.5" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-strong">{n.title}</p>
                  {n.body && <p className="text-xs text-text-muted mt-0.5 leading-relaxed">{n.body}</p>}
                  {n.created_at && (
                    <p className="text-[10px] text-text-subtle mt-1.5">
                      {new Date(n.created_at).toLocaleDateString("es-AR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  )}
                </div>
              </div>
            )
            return n.link
              ? <Link key={n.id} href={n.link} className="block">{card}</Link>
              : <div key={n.id}>{card}</div>
          })
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verificar build**

Run: `bun run lint`
Expected: sin errores nuevos.

- [ ] **Step 3: Commit**

```bash
git add "src/app/(cliente)/perfil/notificaciones/page.tsx"
git commit -m "feat(perfil): pagina de notificaciones"
```

---

### Task 7: Entrada en Perfil + badge

**Files:**
- Modify: `src/app/(cliente)/perfil/page.tsx`

**Interfaces:**
- Consumes: `useNotificationsStore().unreadCount`.
- Produces: link "Notificaciones" con badge.

- [ ] **Step 1: Importar Bell, el store y estado de hidratación**

En `src/app/(cliente)/perfil/page.tsx`:

- Agregar `Bell` a la lista de imports de `lucide-react`.
- Agregar imports y estado dentro del componente:

```tsx
import { useEffect, useState } from "react"
import { useNotificationsStore } from "@/store/useNotificationsStore"
```

Dentro de `PerfilPage`, antes del `if (user)`:

```tsx
  const unread = useNotificationsStore(s => s.unreadCount())
  const [hidratado, setHidratado] = useState(false)
  useEffect(() => { setHidratado(true) }, [])
```

- [ ] **Step 2: Agregar la fila "Notificaciones"**

Justo después del bloque `Link href="/perfil/compras"` (antes de "Editar perfil"), insertar:

```tsx
          <Link href="/perfil/notificaciones"
            className="flex items-center justify-between px-4 py-3.5 rounded-lg hover:bg-surface-sunken transition-colors">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-text-muted" />
              <span className="text-sm text-text-body">Notificaciones</span>
            </div>
            {hidratado && unread > 0 ? (
              <span className="min-w-5 h-5 px-1.5 rounded-full bg-brand text-white text-[10px] font-bold flex items-center justify-center">
                {unread}
              </span>
            ) : (
              <ChevronRight className="w-4 h-4 text-text-subtle" />
            )}
          </Link>
```

- [ ] **Step 3: Verificar build**

Run: `bun run lint`
Expected: sin errores nuevos.

- [ ] **Step 4: Commit**

```bash
git add "src/app/(cliente)/perfil/page.tsx"
git commit -m "feat(perfil): entrada Notificaciones con badge de no leidas"
```

---

### Task 8: Badge en el navbar (Perfil)

**Files:**
- Modify: `src/components/ClienteNavbar.tsx`

**Interfaces:**
- Consumes: `useNotificationsStore().unreadCount`.
- Produces: punto rojo sobre el acceso a Perfil (desktop + mobile) cuando hay no leídas.

- [ ] **Step 1: Leer unreadCount**

En `ClienteNavbar.tsx`, junto a los otros selectores de store (cerca de `favCount`), agregar el import y el selector:

```tsx
import { useNotificationsStore } from "@/store/useNotificationsStore"
```

Dentro del componente:

```tsx
  const unread = useNotificationsStore(s => s.unreadCount())
```

- [ ] **Step 2: Badge en el link Perfil de desktop**

Envolver el contenido del `Link href="/perfil"` de desktop (el que muestra avatar + nombre) agregando `relative` a su className y un punto tras el avatar:

```tsx
            {user ? (
              <Link href="/perfil"
                className="relative flex items-center gap-2 px-2 py-1 rounded-full hover:bg-surface-sunken transition-colors">
                <img src={user.avatar} alt={user.name}
                  className="w-7 h-7 rounded-full object-cover ring-2 ring-matcha-100" />
                {hidratado && unread > 0 && (
                  <span className="absolute -top-0.5 left-6 w-3 h-3 rounded-full bg-error-500 ring-2 ring-bg-page" />
                )}
                <span className="text-sm font-semibold text-text-body hidden xl:inline">{user.name}</span>
              </Link>
            ) : (
```

- [ ] **Step 3: Badge en el tab Perfil de mobile**

En el `Link href="/perfil"` del bottom-nav mobile, agregar `relative` al className y el punto dentro:

```tsx
        <Link href="/perfil"
          className="relative flex flex-col items-center gap-0.5 w-14 h-14 justify-center">
          <User className={`w-5.5 h-5.5 ${isPerfil ? 'text-text-strong' : 'text-text-muted'}`} />
          {hidratado && unread > 0 && (
            <span className="absolute top-1.5 right-3 w-2.5 h-2.5 rounded-full bg-error-500" />
          )}
          <span className={`text-[10px] ${isPerfil ? 'text-text-strong font-semibold' : 'text-text-muted'}`}>
            Perfil
          </span>
        </Link>
```

- [ ] **Step 4: Verificar build completo**

Run: `bun run lint && bun run build`
Expected: lint sin errores nuevos; build compila.

- [ ] **Step 5: Commit**

```bash
git add src/components/ClienteNavbar.tsx
git commit -m "feat(navbar): punto de notificaciones no leidas en Perfil"
```

---

### Task 9: Verificación manual end-to-end

**Files:** ninguno (verificación).

- [ ] **Step 1: Correr la app**

Run: `bun run dev`

- [ ] **Step 2: Flujo prenda**

1. Iniciar sesión como usuaria vendedora aprobada y publicar una prenda (`/vender`).
2. En el panel admin (`/admin/moderacion`) aprobar la prenda.
3. Como la usuaria, esperar hasta 20s o recargar: el ícono de Perfil (navbar) muestra punto rojo y la fila "Notificaciones" muestra el contador.
4. Abrir `/perfil/notificaciones`: aparece "¡Tu prenda fue publicada!" con link; al abrir la página el contador se limpia; el link abre `/producto/<id>`.
5. Repetir rechazando otra prenda → aparece "Tu prenda no fue aprobada" sin link.

- [ ] **Step 3: Flujo vendedora**

1. Con una cuenta nueva, solicitar ser vendedora (`/vender` → "Quiero ser vendedora").
2. En `/admin/vendedores` aprobar la solicitud.
3. Como la usuaria, verificar la notificación "¡Ya podés vender en La Percha!" con link a `/vender`.

- [ ] **Step 4: Confirmar y cerrar**

Confirmar que todos los checks pasan. No hay commit (solo verificación).

## Self-Review

- **Cobertura del spec:** tabla `notifications` + RLS (Task 1), `vendedor_id` en productos (Task 1/3), producer en approve/reject de producto y vendedora + baja del email (Task 4), store (Task 2), fetch on-mount + polling (Task 5), página en Perfil (Task 6), badge en Perfil y navbar (Task 7/8), verificación lint/build/manual (Tasks + Task 9). Todos los puntos del spec tienen task.
- **Placeholders:** ninguno; todos los steps incluyen código o comandos concretos.
- **Consistencia de tipos:** `Notification`/`NotificationType` definidos en Task 2 y reutilizados en Tasks 4/6; `unreadCount()` es método (se invoca con `()`) en store y consumidores; `load(userId)`, `markAllRead(userId)`, `clear()` consistentes entre store, initializer y página; `vendedor_id` consistente entre migración, insert de vender y lectura en admin store.

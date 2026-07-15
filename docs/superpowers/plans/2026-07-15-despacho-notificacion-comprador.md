# Despacho con notificaciones al comprador — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cuando una vendedora despacha un pedido, notificar al comprador por in-app + push + email, y arreglar el feedback visual del botón de despacho.

**Architecture:** Se extiende el sistema de notificaciones existente (tabla `notifications` + store Zustand + polling 20s) con dos nuevos tipos `order_shipped`/`order_delivered`. Se agrega `sendBuyerPush()` en `push.ts` y un componente `EnableBuyerPush` para que el comprador active push. La API de despacho existente se extiende para crear la notificación in-app y disparar el push.

**Tech Stack:** TypeScript, Next.js 16 App Router, Supabase, web-push, Zustand, Tailwind CSS

## Global Constraints

- Notificaciones in-app usan la tabla `notifications` con RLS: SELECT/UPDATE owner, INSERT any (via admin client)
- Push subscriptions usan la tabla `push_subscriptions` con audience: "admin" | "seller" | "buyer"
- Migraciones SQL existentes en `supabase/` son idempotentes con `IF NOT EXISTS`
- Seguir patrones existentes: `createAdminClient()` para bypass de RLS, `sendSellerPush()` como template
- NotificationType en `types.ts` debe coincidir con el CHECK constraint de la DB

---

## File Map

| Archivo | Acción | Responsabilidad |
|---------|--------|----------------|
| `supabase/migration-order-notifications.sql` | Crear | Ampliar CHECK constraint de `notifications.type` |
| `src/lib/types.ts` | Modificar | Agregar `order_shipped`, `order_delivered` a `NotificationType` |
| `src/lib/push.ts` | Modificar | Agregar `sendBuyerPush()` |
| `src/app/api/push/subscribe/route.ts` | Modificar | Aceptar audience `"buyer"` |
| `src/app/api/pedidos/despachar/route.ts` | Modificar | Crear notificación in-app + push al comprador |
| `src/app/(cliente)/perfil/ventas/page.tsx` | Modificar | UX botón: spinner, disabled, error sesión |
| `src/app/(cliente)/perfil/notificaciones/page.tsx` | Modificar | Iconos para `order_shipped`, `order_delivered` |
| `src/app/(cliente)/perfil/compras/EnableBuyerPush.tsx` | Crear | Componente de suscripción push para compradores |
| `src/app/(cliente)/perfil/compras/page.tsx` | Modificar | Renderizar `EnableBuyerPush` |

---

### Task 1: Migración DB — nuevos tipos de notificación

**Files:**
- Create: `supabase/migration-order-notifications.sql`

**Interfaces:**
- Produce: CHECK constraint ampliado en tabla `notifications` para aceptar `order_shipped`, `order_delivered`

- [ ] **Step 1: Crear archivo de migración**

```sql
-- Migration: nuevos tipos de notificación para pedidos (order_shipped, order_delivered)
--           + función helper para buscar user_id por email
-- Ejecutar en Supabase SQL Editor o con node supabase/migrate.mjs

BEGIN;

ALTER TABLE notifications
  DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE notifications
  ADD CONSTRAINT notifications_type_check
  CHECK (type IN ('product_approved','product_rejected','seller_approved','seller_rejected','order_shipped','order_delivered'));

CREATE OR REPLACE FUNCTION get_user_id_by_email(p_email TEXT)
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT id FROM auth.users WHERE email = LOWER(p_email) LIMIT 1;
$$;

COMMIT;
```

- [ ] **Step 2: Ejecutar migración**

```bash
node supabase/migrate.mjs supabase/migration-order-notifications.sql
```

- [ ] **Step 3: Commit**

```bash
git add supabase/migration-order-notifications.sql
git commit -m "db: agregar order_shipped y order_delivered a notifications.type CHECK"
```

---

### Task 2: Nuevos tipos en TypeScript

**Files:**
- Modify: `src/lib/types.ts:80-85`

**Interfaces:**
- Produce: `NotificationType` incluye `"order_shipped" | "order_delivered"`

- [ ] **Step 1: Agregar los nuevos tipos**

En `src/lib/types.ts`, línea 80-85, cambiar:

```ts
export type NotificationType =
  | "product_approved"
  | "product_rejected"
  | "product_changes_requested"
  | "seller_approved"
  | "seller_rejected"
```

Por:

```ts
export type NotificationType =
  | "product_approved"
  | "product_rejected"
  | "product_changes_requested"
  | "seller_approved"
  | "seller_rejected"
  | "order_shipped"
  | "order_delivered"
```

- [ ] **Step 2: Verificar que TypeScript compila**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/types.ts
git commit -m "feat: agregar order_shipped y order_delivered a NotificationType"
```

---

### Task 3: Función sendBuyerPush

**Files:**
- Modify: `src/lib/push.ts:86-88`

**Interfaces:**
- Produce: `sendBuyerPush(userId: string, payload: PushPayload): Promise<void>` — envía push a suscripciones con audience `"buyer"` filtradas por `user_id`

- [ ] **Step 1: Agregar sendBuyerPush**

En `src/lib/push.ts`, después de `sendSellerPush` (línea 88), agregar:

```ts
export async function sendBuyerPush(userId: string, payload: PushPayload): Promise<void> {
  await sendPush({ audience: "buyer", userId }, payload)
}
```

- [ ] **Step 2: Verificar que TypeScript compila**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/push.ts
git commit -m "feat: agregar sendBuyerPush()"
```

---

### Task 4: API suscripción push acepta audience "buyer"

**Files:**
- Modify: `src/app/api/push/subscribe/route.ts`

**Interfaces:**
- Consumes: audience `"buyer"` desde el body
- Produce: guarda `push_subscriptions` con `audience = "buyer"` y `user_id` del token

- [ ] **Step 1: Modificar validación de audience y agregar caso buyer**

En `src/app/api/push/subscribe/route.ts`, reemplazar la línea 17:

```ts
const audience = body.audience === "seller" ? "seller" : "admin"
```

Por:

```ts
let audience = "admin"
if (body.audience === "seller") audience = "seller"
else if (body.audience === "buyer") audience = "buyer"
```

Y después del bloque `if (audience === "seller") { ... }` (línea 48), agregar el caso buyer:

```ts
if (audience === "buyer") {
  if (!body.access_token) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser(body.access_token)

  if (authError || !user) {
    return NextResponse.json({ error: "Token inválido o expirado" }, { status: 401 })
  }

  userId = user.id
}
```

- [ ] **Step 2: Verificar que TypeScript compila**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/push/subscribe/route.ts
git commit -m "feat: aceptar audience buyer en push subscribe"
```

---

### Task 5: Notificación in-app + push al despachar

**Files:**
- Modify: `src/app/api/pedidos/despachar/route.ts`

**Interfaces:**
- Consumes: `sendBuyerPush` de Task 3, `createAdminClient`
- Produce: crea registro en `notifications` y envía push al comprador después del update del pedido

- [ ] **Step 1: Modificar la API de despacho**

En `src/app/api/pedidos/despachar/route.ts`, agregar el import de push y modificar el bloque después del update:

```ts
import { sendBuyerPush } from "@/lib/push"
```

Reemplazar el bloque después del `update` (líneas 46-58) con:

```ts
  let buyerUserId: string | null = null

  if (pedido.comprador_email) {
    const { data: buyerIdData } = await supabase
      .rpc("get_user_id_by_email", { p_email: pedido.comprador_email })
      .maybeSingle()

    buyerUserId = (buyerIdData as string) || null
  }

  if (pedido.comprador_email) {
    const esCorreo = pedido.metodo_envio === "correo_sucursal" || pedido.metodo_envio === "correo_domicilio"

    const baseUrl = req.headers.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"

    fetch(`${baseUrl}/api/email/pedido-enviado`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: pedido.comprador_email,
        orderId: pedido.id,
        producto_titulo: pedido.producto_titulo,
        metodo_envio: pedido.metodo_envio,
        seguimiento: seguimiento || "",
      }),
    }).catch(() => {})

    if (buyerUserId) {
      const body = esCorreo && seguimiento
        ? `Pedido #${pedido.id.slice(-8)} — ${pedido.producto_titulo}. Seguimiento: ${seguimiento}`
        : `Pedido #${pedido.id.slice(-8)} — ${pedido.producto_titulo}.`

      await supabase.from("notifications").insert({
        id: `order-shipped-${pedidoId}-${Date.now()}`,
        user_id: buyerUserId,
        type: "order_shipped",
        title: "Tu pedido está en camino",
        body,
        link: "/perfil/compras",
      })

      sendBuyerPush(buyerUserId, {
        title: "Tu pedido está en camino",
        body: body,
        url: "/perfil/compras",
        tag: `pedido-enviado-${pedidoId}`,
      }).catch(() => {})
    }
  }
```

- [ ] **Step 2: Verificar que TypeScript compila**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/pedidos/despachar/route.ts
git commit -m "feat: notificacion in-app y push al comprador al despachar"
```

---

### Task 6: UX botón despacho (spinner, disabled, error sesión)

**Files:**
- Modify: `src/app/(cliente)/perfil/ventas/page.tsx`

**Interfaces:**
- Consumes: `session` de `useAuthStore`
- Produce: botón "Confirmar despacho" con spinner, disabled, y manejo de sesión expirada

- [ ] **Step 1: Modificar la función despachar**

En `src/app/(cliente)/perfil/ventas/page.tsx`, reemplazar la función `despachar` (líneas 78-104):

```ts
  const [successMsg, setSuccessMsg] = useState("")

  async function despachar(pedidoId: string) {
    if (!session?.access_token) {
      setErrorMsg("Sesión expirada, volvé a ingresar")
      return
    }
    setDespachandoId(pedidoId)
    setErrorMsg("")
    try {
      const res = await fetch("/api/pedidos/despachar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ pedidoId, seguimiento }),
      })
      const data = await res.json().catch(() => ({ error: "Error de conexión" }))
      if (!res.ok) {
        setErrorMsg(data.error || "No se pudo despachar el pedido")
        setDespachandoId(null)
        return
      }
      setSeguimiento("")
      setDespachandoId(null)
      setSuccessMsg("Pedido despachado. La compradora recibirá una notificación.")
      fetchPedidos()
      setTimeout(() => setSuccessMsg(""), 4000)
    } catch {
      setErrorMsg("Error de conexión")
      setDespachandoId(null)
    }
  }
```

- [ ] **Step 2: Modificar el botón "Confirmar despacho"**

En `src/app/(cliente)/perfil/ventas/page.tsx`, líneas 227-234, cambiar el botón:

```tsx
                            <button
                              onClick={() => despachar(pedido.id)}
                              disabled={despachandoId !== null}
                              className="flex-1 h-9 rounded-full bg-brand hover:bg-brand-hover text-white text-xs font-semibold
                                transition-colors flex items-center justify-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed">
                              {despachandoId === pedido.id ? (
                                <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Despachando...</>
                              ) : (
                                <><Truck className="w-3.5 h-3.5" /> Confirmar despacho</>
                              )}
                            </button>
```

- [ ] **Step 3: Agregar mensaje de éxito**

Después del `useEffect` (línea 62), agregar el estado `successMsg` (ya incluido en Step 1). Y en el JSX, dentro de `pending_shipment` block, después de `{errorMsg && ...}`, agregar:

```tsx
                         {successMsg && (
                           <p className="text-[10px] text-success-600 font-medium">{successMsg}</p>
                         )}
```

E insertarlo justo después de la línea 219 (`{errorMsg && ...}`), es decir, debajo del mensaje de error dentro del bloque `despachandoId === pedido.id`.

- [ ] **Step 4: Verificar que TypeScript compila**

```bash
npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add src/app/(cliente)/perfil/ventas/page.tsx
git commit -m "fix: UX boton despacho con spinner, disabled y error sesion"
```

---

### Task 7: Iconos para nuevos tipos de notificación

**Files:**
- Modify: `src/app/(cliente)/perfil/notificaciones/page.tsx:9-15`

**Interfaces:**
- Consumes: `NotificationType` de `types.ts` con `order_shipped`, `order_delivered`
- Produce: Map `ICONS` completo con todos los tipos

- [ ] **Step 1: Agregar íconos**

En `src/app/(cliente)/perfil/notificaciones/page.tsx`, importar `Truck`:

Línea 4, agregar `Truck` al import de lucide-react:

```tsx
import { ArrowLeft, CheckCircle, XCircle, Bell, Loader2, Edit3, Truck } from "lucide-react"
```

Y en el objeto `ICONS` (líneas 9-15), agregar los nuevos tipos:

```tsx
const ICONS: Record<NotificationType, { icon: typeof CheckCircle; className: string }> = {
  product_approved: { icon: CheckCircle, className: "bg-success-50 text-success-600" },
  seller_approved: { icon: CheckCircle, className: "bg-success-50 text-success-600" },
  product_rejected: { icon: XCircle, className: "bg-error-50 text-error-500" },
  seller_rejected: { icon: XCircle, className: "bg-error-50 text-error-500" },
  product_changes_requested: { icon: Edit3, className: "bg-warning-50 text-warning-600" },
  order_shipped: { icon: Truck, className: "bg-info-50 text-info-600" },
  order_delivered: { icon: CheckCircle, className: "bg-success-50 text-success-600" },
}
```

- [ ] **Step 2: Verificar que TypeScript compila**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/app/(cliente)/perfil/notificaciones/page.tsx
git commit -m "feat: iconos para order_shipped y order_delivered en notificaciones"
```

---

### Task 8: Componente EnableBuyerPush

**Files:**
- Create: `src/app/(cliente)/perfil/compras/EnableBuyerPush.tsx`
- Modify: `src/app/(cliente)/perfil/compras/page.tsx`

**Interfaces:**
- Produce: `EnableBuyerPush` componente que suscribe al comprador a push con audience `"buyer"`
- Consume: API `/api/push/subscribe` (modificada en Task 4)

- [ ] **Step 1: Crear el componente**

Crear `src/app/(cliente)/perfil/compras/EnableBuyerPush.tsx`:

```tsx
"use client"
import { useEffect, useState } from "react"
import { Bell, BellOff, BellRing, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) outputArray[i] = rawData.charCodeAt(i)
  return outputArray
}

type PushState = "loading" | "unsupported" | "default" | "granted" | "denied" | "subscribing"

export function EnableBuyerPush() {
  const [state, setState] = useState<PushState>("loading")

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
      setState("unsupported")
      return
    }
    setState(Notification.permission as PushState)
  }, [])

  async function enable() {
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    if (!vapidKey) {
      alert("Falta configurar NEXT_PUBLIC_VAPID_PUBLIC_KEY.")
      return
    }
    setState("subscribing")
    try {
      const reg = await navigator.serviceWorker.register("/sw.js")
      const permission = await Notification.requestPermission()
      if (permission !== "granted") {
        setState(permission as PushState)
        return
      }

      const existing = await reg.pushManager.getSubscription()
      const sub =
        existing ||
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey) as Uint8Array<ArrayBuffer>,
        }))

      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        alert("Debés iniciar sesión para activar notificaciones.")
        return
      }

      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...sub.toJSON(), audience: "buyer", access_token: session.access_token }),
      })
      if (!res.ok) throw new Error("No se pudo guardar la suscripción")

      setState("granted")
    } catch (err) {
      console.error("[EnableBuyerPush]", err)
      alert("No se pudieron activar las notificaciones. Reintentá.")
      setState(Notification.permission as PushState)
    }
  }

  if (state === "loading" || state === "unsupported") return null

  if (state === "granted") {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-matcha-700 bg-matcha-50">
        <BellRing className="w-3.5 h-3.5 text-matcha-600" />
        Notificaciones de envíos activadas
      </div>
    )
  }

  if (state === "denied") {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-text-muted bg-surface-sunken">
        <BellOff className="w-3.5 h-3.5" />
        Notificaciones bloqueadas. Activalas en los ajustes del navegador.
      </div>
    )
  }

  return (
    <button
      onClick={enable}
      disabled={state === "subscribing"}
      className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-white bg-brand hover:opacity-90 transition-opacity disabled:opacity-60"
    >
      {state === "subscribing" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Bell className="w-3.5 h-3.5" />}
      Activar notificaciones de envíos
    </button>
  )
}
```

- [ ] **Step 2: Importar y renderizar en Mis Compras**

En `src/app/(cliente)/perfil/compras/page.tsx`, agregar el import (después de los imports existentes, línea 6):

```tsx
import { EnableBuyerPush } from "./EnableBuyerPush"
```

Y en el JSX, después del `</header>` (línea 101) y antes de `<div className="flex-1 ...">` (línea 103), agregar:

```tsx
      <div className="px-4 lg:px-6 pt-3 max-w-lg mx-auto w-full">
        <EnableBuyerPush />
      </div>
```

- [ ] **Step 3: Verificar que TypeScript compila**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add src/app/(cliente)/perfil/compras/EnableBuyerPush.tsx src/app/(cliente)/perfil/compras/page.tsx
git commit -m "feat: EnableBuyerPush para que compradores activen push"
```

---

### Task 9: Verificación final

- [ ] **Step 1: TypeScript**

```bash
npx tsc --noEmit
```
Expected: sin errores.

- [ ] **Step 2: Build de Next.js**

```bash
npx next build
```
Expected: build exitoso sin errores.

- [ ] **Step 3: Revisar diff final**

```bash
git log --oneline -10
```

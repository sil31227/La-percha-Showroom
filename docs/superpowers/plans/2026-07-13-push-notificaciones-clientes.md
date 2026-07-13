# Push Notifications para Vendedoras — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extender el sistema de push notifications para que vendedoras aprobadas reciban alertas en el navegador cuando alguien compra su producto, el admin aprueba/rechaza su publicación, o se confirma un pago.

**Architecture:** Se agrega columna `user_id` a la tabla `push_subscriptions`. Se refactoriza `push.ts` con una función genérica `sendPush` con wrappers `sendAdminPush`/`sendSellerPush`. El sw.js se vuelve genérico. Se crea componente `EnableSellerPush` en `/vender` y endpoint `POST /api/push/notify-seller` para que el store admin pueda disparar pushes. Las rutas de checkout y webhook invocan `sendSellerPush` por cada vendedora involucrada.

**Tech Stack:** Next.js, Supabase, web-push, Service Worker API, Notification API

## Global Constraints

- Solo vendedoras con `seller_status === "approved"` pueden suscribirse.
- La suscripción guarda `user_id` extraído del token de sesión (nunca del cliente).
- Fallos de push no bloquean pedidos/publicaciones (`.catch(() => {})`).
- Mismo service worker (`/sw.js`) para admin y sellers.
- Sin migraciones nuevas en Supabase; solo se agrega un `ALTER TABLE` al SQL de migración existente.

---

### Task 1: DB — Agregar columna `user_id` a `push_subscriptions`

**Files:**
- Modify: `supabase/migration-push-admin.sql`

**Interfaces:**
- Produces: columna `user_id UUID REFERENCES auth.users(id)` nullable en `push_subscriptions`

- [ ] **Step 1: Actualizar archivo de migración**

Agregar el ALTER TABLE al final, antes del COMMIT:

```sql
-- Migration: suscripciones push del admin (web push / VAPID)
-- Run in Supabase SQL Editor

BEGIN;

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  endpoint   TEXT NOT NULL UNIQUE,
  p256dh     TEXT NOT NULL,
  auth       TEXT NOT NULL,
  audience   TEXT NOT NULL DEFAULT 'admin',
  user_id    UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS push_subscriptions_audience_idx
  ON push_subscriptions (audience);

CREATE INDEX IF NOT EXISTS push_subscriptions_user_id_idx
  ON push_subscriptions (user_id);

-- RLS: solo el service_role (rutas API del servidor) accede.
-- Sin políticas públicas => el anon key no puede leer ni escribir.
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

COMMIT;
```

- [ ] **Step 2: Si la tabla ya existe en Supabase, ejecutar el ALTER manualmente**

```
ALTER TABLE push_subscriptions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
CREATE INDEX IF NOT EXISTS push_subscriptions_user_id_idx ON push_subscriptions (user_id);
```

- [ ] **Step 3: Commit**

```bash
git add supabase/migration-push-admin.sql
git commit -m "db: agregar user_id a push_subscriptions para sellers"
```

---

### Task 2: Refactorizar `push.ts` — función genérica `sendPush` + `sendSellerPush`

**Files:**
- Modify: `src/lib/push.ts`

**Interfaces:**
- Consumes: columna `user_id` en `push_subscriptions` (Task 1)
- Produces: `sendPush(opts, payload)`, `sendAdminPush(payload)`, `sendSellerPush(userId, payload)`, `PushPayload`

- [ ] **Step 1: Reescribir `src/lib/push.ts`**

```ts
import webpush from "web-push"
import { createAdminClient } from "@/lib/supabase-admin"

export interface PushPayload {
  title: string
  body: string
  url?: string
  tag?: string
}

let configured = false

function ensureConfigured(): boolean {
  const publicKey = process.env.VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  const subject =
    process.env.VAPID_SUBJECT ||
    (process.env.ADMIN_EMAIL ? `mailto:${process.env.ADMIN_EMAIL}` : "mailto:noreply@example.com")

  if (!publicKey || !privateKey) {
    console.warn("[push] Faltan VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY. Push deshabilitado.")
    return false
  }

  if (!configured) {
    webpush.setVapidDetails(subject, publicKey, privateKey)
    configured = true
  }
  return true
}

async function sendPush(
  opts: { audience: string; userId?: string },
  payload: PushPayload
): Promise<void> {
  try {
    if (!ensureConfigured()) return

    const supabase = createAdminClient()
    let query = supabase
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth")
      .eq("audience", opts.audience)

    if (opts.userId) {
      query = query.eq("user_id", opts.userId)
    }

    const { data: subs, error } = await query

    if (error || !subs?.length) return

    const body = JSON.stringify({
      title: payload.title,
      body: payload.body,
      url: payload.url || (opts.audience === "admin" ? "/admin/pedidos" : "/perfil"),
      tag: payload.tag,
    })

    await Promise.all(
      subs.map(async (s) => {
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            body
          )
        } catch (err: unknown) {
          const statusCode = (err as { statusCode?: number }).statusCode
          if (statusCode === 404 || statusCode === 410) {
            await supabase.from("push_subscriptions").delete().eq("id", s.id)
          } else {
            console.error("[push] Error enviando a suscripción", s.id, err)
          }
        }
      })
    )
  } catch (err) {
    console.error("[push] Error inesperado en sendPush:", err)
  }
}

export async function sendAdminPush(payload: PushPayload): Promise<void> {
  await sendPush({ audience: "admin" }, payload)
}

export async function sendSellerPush(userId: string, payload: PushPayload): Promise<void> {
  await sendPush({ audience: "seller", userId }, payload)
}
```

- [ ] **Step 2: Verificar que los imports de `sendAdminPush` sigan funcionando**

```bash
bunx tsc --noEmit src/app/api/checkout/crear-pedido/route.ts 2>&1 | head -20
```

Expected: ningún error relacionado a `sendAdminPush`.

- [ ] **Step 3: Commit**

```bash
git add src/lib/push.ts
git commit -m "refactor(push): sendPush generico + sendSellerPush"
```

---

### Task 3: API subscribe — aceptar `audience`, extraer `user_id` de sesión

**Files:**
- Modify: `src/app/api/push/subscribe/route.ts`

**Interfaces:**
- Consumes: `sendPush` refactor (Task 2), columna `user_id` (Task 1)
- Produces: endpoint acepta `{ endpoint, keys: { p256dh, auth }, audience }`, guarda con `user_id` si audience es "seller"

- [ ] **Step 1: Modificar `src/app/api/push/subscribe/route.ts`**

```ts
import { createAdminClient } from "@/lib/supabase-admin"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

interface SubscribeBody {
  endpoint?: string
  keys?: { p256dh?: string; auth?: string }
  audience?: string
}

export async function POST(req: Request) {
  try {
    const body: SubscribeBody = await req.json()
    const endpoint = body.endpoint
    const p256dh = body.keys?.p256dh
    const auth = body.keys?.auth
    const audience = body.audience === "seller" ? "seller" : "admin"

    if (!endpoint || !p256dh || !auth) {
      return NextResponse.json({ error: "Suscripción inválida" }, { status: 400 })
    }

    let userId: string | null = null
    if (audience === "seller") {
      const supabaseAuth = createRouteHandlerClient({ cookies })
      const { data: { user } } = await supabaseAuth.auth.getUser()
      if (!user) {
        return NextResponse.json({ error: "No autenticado" }, { status: 401 })
      }
      userId = user.id
    }

    const supabase = createAdminClient()
    const { error } = await supabase
      .from("push_subscriptions")
      .upsert(
        { endpoint, p256dh, auth, audience, user_id: userId },
        { onConflict: "endpoint" }
      )

    if (error) {
      console.error("[push/subscribe] Error guardando suscripción:", error)
      return NextResponse.json({ error: "No se pudo guardar la suscripción" }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[push/subscribe] Error:", err)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
```

- [ ] **Step 2: Verificar compilación**

```bash
bunx tsc --noEmit src/app/api/push/subscribe/route.ts 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/push/subscribe/route.ts
git commit -m "feat: subscribe API acepta audience seller y guarda user_id"
```

---

### Task 4: Nuevo endpoint `POST /api/push/notify-seller`

**Files:**
- Create: `src/app/api/push/notify-seller/route.ts`

**Interfaces:**
- Consumes: `sendSellerPush` (Task 2)
- Produces: endpoint que recibe `{ userId, title, body, url }` y dispara push

- [ ] **Step 1: Crear `src/app/api/push/notify-seller/route.ts`**

```ts
import { NextResponse } from "next/server"
import { sendSellerPush } from "@/lib/push"

export async function POST(req: Request) {
  try {
    const { userId, title, body, url } = await req.json()

    if (!userId || !title || !body) {
      return NextResponse.json({ error: "Faltan campos requeridos: userId, title, body" }, { status: 400 })
    }

    await sendSellerPush(userId, { title, body, url })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[push/notify-seller] Error:", err)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
```

- [ ] **Step 2: Verificar ruta**

```bash
ls -la src/app/api/push/notify-seller/route.ts
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/push/notify-seller/route.ts
git commit -m "feat: endpoint notify-seller para push a vendedoras"
```

---

### Task 5: Service Worker genérico

**Files:**
- Modify: `public/sw.js`

**Interfaces:**
- Consumes: payload con `{ title, body, url, tag }`
- Produces: `notificationclick` navega a la URL del payload, sin hardcodear `/admin`

- [ ] **Step 1: Reescribir `public/sw.js`**

```js
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: "La Percha", body: event.data ? event.data.text() : "" };
  }

  const title = data.title || "La Percha";
  const options = {
    body: data.body || "",
    icon: "/logo.jpg",
    badge: "/logo.jpg",
    tag: data.tag || undefined,
    data: { url: data.url || "/perfil" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || "/perfil";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          return client.focus().then((focused) => {
            if (focused && "navigate" in focused) return focused.navigate(targetUrl);
          });
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
    })
  );
});
```

- [ ] **Step 2: Commit**

```bash
git add public/sw.js
git commit -m "feat: sw.js generico, quitar hardcodeo de /admin"
```

---

### Task 6: Componente `EnableSellerPush` + integración en `/vender`

**Files:**
- Create: `src/app/(cliente)/vender/EnableSellerPush.tsx`
- Modify: `src/app/(cliente)/vender/page.tsx` (agregar import y renderizado)

**Interfaces:**
- Consumes: `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `POST /api/push/subscribe` con `audience: "seller"`
- Produces: botón de activar notificaciones visible cuando `seller_status === "approved"`

- [ ] **Step 1: Crear `src/app/(cliente)/vender/EnableSellerPush.tsx`**

```tsx
"use client"
import { useEffect, useState } from "react"
import { Bell, BellOff, BellRing, Loader2 } from "lucide-react"

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) outputArray[i] = rawData.charCodeAt(i)
  return outputArray
}

type PushState = "loading" | "unsupported" | "default" | "granted" | "denied" | "subscribing"

export function EnableSellerPush() {
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

      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...sub.toJSON(), audience: "seller" }),
      })
      if (!res.ok) throw new Error("No se pudo guardar la suscripción")

      setState("granted")
    } catch (err) {
      console.error("[EnableSellerPush]", err)
      alert("No se pudieron activar las notificaciones. Reintentá.")
      setState(Notification.permission as PushState)
    }
  }

  if (state === "loading" || state === "unsupported") return null

  if (state === "granted") {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-matcha-700 bg-matcha-50">
        <BellRing className="w-3.5 h-3.5 text-matcha-600" />
        Notificaciones de ventas activadas
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
      Activar notificaciones de ventas
    </button>
  )
}
```

- [ ] **Step 2: Integrar en `src/app/(cliente)/vender/page.tsx`**

Agregar el import al principio (junto a los otros imports):

```tsx
import { EnableSellerPush } from "./EnableSellerPush"
```

Y agregar el componente justo DESPUÉS del `<header>` y ANTES del formulario de publicación de producto (en el estado `approved`). Buscar dónde empieza el formulario para vendedoras aprobadas (después del `if (user.seller_status === 'none')` block) y agregar:

```tsx
<div className="px-5 pt-4">
  <EnableSellerPush />
</div>
```

La ubicación exacta es: justo antes del `<form onSubmit={submit}>` (que está después de todos los early returns).

- [ ] **Step 3: Commit**

```bash
git add src/app/(cliente)/vender/EnableSellerPush.tsx src/app/(cliente)/vender/page.tsx
git commit -m "feat: EnableSellerPush en /vender para vendedoras aprobadas"
```

---

### Task 7: Integración en `POST /api/checkout/crear-pedido` — push a vendedoras

**Files:**
- Modify: `src/app/api/checkout/crear-pedido/route.ts`

**Interfaces:**
- Consumes: `sendSellerPush` (Task 2)
- Produces: push a cada vendedora cuando alguien compra su producto

- [ ] **Step 1: Agregar `vendedor_id` al select de productos**

Cambiar la línea 54:
```
.select("id, titulo, precio, imagenes, vendedor_nombre, vendedor_tipo, status, variantes, stock")
```
por:
```
.select("id, titulo, precio, imagenes, vendedor_nombre, vendedor_id, vendedor_tipo, status, variantes, stock")
```

- [ ] **Step 2: Agregar import de `sendSellerPush`**

Cambiar la línea 3:
```ts
import { sendAdminPush } from "@/lib/push"
```
por:
```ts
import { sendAdminPush, sendSellerPush } from "@/lib/push"
```

- [ ] **Step 3: Agregar push a sellers después del `sendAdminPush`**

Justo después del bloque `sendAdminPush` (línea ~185) y antes del return, agregar:

```ts
const vendedoresNotificados = new Set<string>()
for (const item of validItems) {
  const prod = productMap.get(item.productId)
  if (prod && (prod as Record<string, unknown>).vendedor_id) {
    const vid = (prod as Record<string, unknown>).vendedor_id as string
    if (!vendedoresNotificados.has(vid)) {
      vendedoresNotificados.add(vid)
      sendSellerPush(vid, {
        title: "¡Vendiste un producto!",
        body: `Alguien compró "${prod.titulo}". Revisá tus publicaciones.`,
        url: "/perfil/publicaciones",
        tag: `venta-${orderId}-${vid}`,
      }).catch(() => {})
    }
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/api/checkout/crear-pedido/route.ts
git commit -m "feat: push a vendedoras al crear pedido"
```

---

### Task 8: Integración en `POST /api/mercadopago/crear-preferencia` — push a vendedoras

**Files:**
- Modify: `src/app/api/mercadopago/crear-preferencia/route.ts`

**Interfaces:**
- Consumes: `sendSellerPush` (Task 2)
- Produces: push a cada vendedora al crear preferencia MP

- [ ] **Step 1: Agregar `vendedor_id` al select de productos**

Cambiar la línea 62:
```
.select("id, titulo, precio, imagenes, vendedor_nombre, vendedor_tipo, status, variantes, stock")
```
por:
```
.select("id, titulo, precio, imagenes, vendedor_nombre, vendedor_id, vendedor_tipo, status, variantes, stock")
```

- [ ] **Step 2: Agregar import de `sendSellerPush`**

Agregar después de la línea 1:
```ts
import { sendSellerPush } from "@/lib/push"
```

- [ ] **Step 3: Agregar push a sellers después de insertar pedidos**

Justo después del loop `for (const item of validItems)` que inserta en `pedidos` (línea ~186) y antes de `const mpClient = new MercadoPagoConfig(...)`, agregar:

```ts
const vendedoresNotificados = new Set<string>()
for (const item of validItems) {
  const prod = productMap.get(item.productId)
  if (prod && (prod as Record<string, unknown>).vendedor_id) {
    const vid = (prod as Record<string, unknown>).vendedor_id as string
    if (!vendedoresNotificados.has(vid)) {
      vendedoresNotificados.add(vid)
      sendSellerPush(vid, {
        title: "¡Vendiste un producto!",
        body: `Alguien compró "${prod.titulo}". Revisá tus publicaciones.`,
        url: "/perfil/publicaciones",
        tag: `venta-${orderId}-${vid}`,
      }).catch(() => {})
    }
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/api/mercadopago/crear-preferencia/route.ts
git commit -m "feat: push a vendedoras al crear preferencia MP"
```

---

### Task 9: Admin store — push al aprobar/rechazar producto

**Files:**
- Modify: `src/store/useAdminStore.ts`

**Interfaces:**
- Consumes: `POST /api/push/notify-seller` (Task 4)
- Produces: push a la vendedora cuando admin aprueba o rechaza

- [ ] **Step 1: Modificar `approveProduct`**

En la función `approveProduct` (línea ~105), después del `createNotification(...)` y antes del `set(...)`, agregar:

```ts
fetch("/api/push/notify-seller", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    userId: product?.vendedor_id,
    title: "¡Tu prenda fue publicada!",
    body: `"${product?.titulo || "Tu prenda"}" ya está publicada y a la venta.`,
    url: "/perfil/publicaciones",
  }),
}).catch(() => {})
```

- [ ] **Step 2: Modificar `rejectProduct`**

En la función `rejectProduct` (línea ~117), después del `createNotification(...)` y antes del `set(...)`, agregar:

```ts
fetch("/api/push/notify-seller", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    userId: product?.vendedor_id,
    title: "Tu prenda no fue aprobada",
    body: `"${product?.titulo || "Tu prenda"}" no pasó la moderación. Podés revisarla y volver a publicarla.`,
    url: "/perfil/publicaciones",
  }),
}).catch(() => {})
```

- [ ] **Step 3: Commit**

```bash
git add src/store/useAdminStore.ts
git commit -m "feat: push a vendedora al aprobar/rechazar producto"
```

---

### Task 10: Webhook MercadoPago — push a vendedoras por pago confirmado

**Files:**
- Modify: `src/app/api/mercadopago/webhook/route.ts`

**Interfaces:**
- Consumes: `sendSellerPush` (Task 2)
- Produce: push a cada vendedora cuando el pago se confirma vía webhook MP

- [ ] **Step 1: Agregar import de `sendSellerPush`**

Cambiar la línea 4:
```ts
import { sendAdminPush } from "@/lib/push"
```
por:
```ts
import { sendAdminPush, sendSellerPush } from "@/lib/push"
```

- [ ] **Step 2: Modificar el select de pedidos para incluir `vendedor_id`**

Cambiar la línea 39 (dentro del webhook):
```
.select("id, comprador_email, producto_titulo, talle, precio, direccion, metodo_envio, costo_envio, mail_pago_enviado")
```
por:
```
.select("id, comprador_email, producto_titulo, talle, precio, direccion, metodo_envio, costo_envio, mail_pago_enviado, vendedor_id")
```

**Nota:** Si la tabla `pedidos` aún no tiene columna `vendedor_id`, agregarla primero. Consultar la migración o crearla con:
```sql
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS vendedor_id UUID REFERENCES auth.users(id);
```
También se debe poblar `vendedor_id` al insertar pedidos en las rutas de checkout (Tasks 7 y 8). Si los pedidos ya insertados no tienen `vendedor_id`, para esos casos el push simplemente no se enviará.

- [ ] **Step 3: Agregar push a sellers después del `sendAdminPush` existente**

Justo después del bloque `sendAdminPush` (línea ~81), agregar:

```ts
const sellersNotified = new Set<string>()
for (const p of pedidos) {
  if (p.vendedor_id && !sellersNotified.has(p.vendedor_id)) {
    sellersNotified.add(p.vendedor_id)
    sendSellerPush(p.vendedor_id, {
      title: "✅ Pago confirmado",
      body: `Recibiste el pago por "${p.producto_titulo}".`,
      url: "/perfil/saldo",
      tag: `pago-${externalReference}-${p.vendedor_id}`,
    }).catch(() => {})
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/api/mercadopago/webhook/route.ts
git commit -m "feat: push a vendedoras por pago confirmado (webhook MP)"
```

---

### Task 11: Agregar `vendedor_id` a la inserción de pedidos en ambas rutas de checkout

**Files:**
- Modify: `src/app/api/checkout/crear-pedido/route.ts`
- Modify: `src/app/api/mercadopago/crear-preferencia/route.ts`

**Interfaces:**
- Consumes: `vendedor_id` de los productos seleccionados
- Produce: columna `vendedor_id` poblada en cada inserción de pedido

- [ ] **Step 1: En checkout/crear-pedido, agregar `vendedor_id` al insert**

En la línea ~160-177, dentro del `for (const item of validItems)`, agregar al objeto de insert:

```ts
producto_id: item.productId,
vendedor_id: (productMap.get(item.productId) as Record<string, unknown>)?.vendedor_id as string | undefined,
```

Justo después de `producto_imagen: item.image,`.

- [ ] **Step 2: En mercadopago/crear-preferencia, agregar `vendedor_id` al insert**

En la línea ~168-185, dentro del `for (const item of validItems)`, agregar al objeto de insert:

```ts
producto_id: item.productId,
vendedor_id: (productMap.get(item.productId) as Record<string, unknown>)?.vendedor_id as string | undefined,
```

Justo después de `producto_imagen: item.image,`.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/checkout/crear-pedido/route.ts src/app/api/mercadopago/crear-preferencia/route.ts
git commit -m "feat: guardar vendedor_id al crear pedidos"
```

---

### Task 12: Verificación final

**Files:**
- (verificación de build, sin cambios de código)

- [ ] **Step 1: TypeScript check del proyecto completo**

```bash
bunx tsc --noEmit 2>&1 | tail -30
```

Esperado: sin errores nuevos. Puede haber errores preexistentes no relacionados.

- [ ] **Step 2: Lint check**

```bash
bun run lint 2>&1 | tail -20
```

- [ ] **Step 3: Revisión manual de cambios**

```bash
git diff --stat HEAD~11..HEAD
```

- [ ] **Step 4: Commit final (si hay ajustes del lint)**

```bash
git add -A
git commit -m "chore: ajustes finales de lint"
```

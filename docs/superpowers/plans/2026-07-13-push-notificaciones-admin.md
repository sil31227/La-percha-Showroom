# Notificaciones Push al Admin — Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enviar notificaciones push web al iPhone del admin (PWA instalada) cuando entra un pedido nuevo, se confirma un pago, se publica una prenda para moderar o se registra una vendedora.

**Architecture:** Un service worker estático (`public/sw.js`) recibe eventos `push` y abre la sección correspondiente del panel al tocarlos. Un botón en el panel admin registra el SW, pide permiso (gesto requerido en iOS) y guarda la suscripción VAPID en una tabla nueva de Supabase (`push_subscriptions`) vía API con `service_role`. Un helper `sendAdminPush()` con la librería `web-push` envía a todas las suscripciones desde las rutas API existentes donde ya se disparan emails.

**Tech Stack:** Next.js 16 (App Router), React 19, Supabase (`@supabase/supabase-js`), `web-push`, TypeScript, desplegado en Vercel (HTTPS).

## Global Constraints

- No hay framework de tests ni script `test` en `package.json`. La verificación por tarea es: `npx tsc --noEmit` (typecheck), `npm run lint` (eslint) y verificación manual documentada. No inventar tests automáticos.
- El push es **best-effort**: envuelto en try/catch, nunca debe lanzar ni romper la operación que lo dispara (creación de pedido, webhook, email). Mismo patrón que los emails de Resend hoy.
- Si faltan las envs VAPID, el helper no hace nada y loguea una advertencia (mismo patrón que Resend cuando falta `RESEND_API_KEY`).
- El panel `/admin` está gateado solo por URL (no hay login de admin). Las suscripciones se guardan sin `user_id`, con `audience = 'admin'`.
- Acceso a Supabase desde el servidor SIEMPRE vía `createAdminClient()` de `@/lib/supabase-admin` (usa `SUPABASE_SERVICE_ROLE_KEY`).
- Idioma de la UI y textos de notificación: español (es-AR).
- No commitear valores reales de claves VAPID. Solo nombres en `.env.example`.

---

### Task 1: Dependencia web-push + generación de claves VAPID

**Files:**
- Modify: `package.json` (agregar `web-push` y `@types/web-push`)
- Modify: `.env.example` (agregar nombres de envs VAPID)
- Create: `.env.local` (agregar claves generadas — NO se commitea, está en `.gitignore`)

**Interfaces:**
- Produces: envs `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY` disponibles en runtime.

- [ ] **Step 1: Instalar web-push**

```bash
npm install web-push
npm install -D @types/web-push
```

- [ ] **Step 2: Generar claves VAPID**

```bash
npx web-push generate-vapid-keys --json
```

Salida ejemplo (las tuyas serán distintas):

```json
{"publicKey":"BEl...xyz","privateKey":"aB3...Qk"}
```

Copiar `publicKey` y `privateKey`.

- [ ] **Step 3: Agregar las claves a `.env.local`**

Agregar al final de `.env.local` (crear el archivo si no existe; reemplazar por los valores reales del Step 2):

```
# Web Push (VAPID)
VAPID_PUBLIC_KEY=<publicKey generada>
VAPID_PRIVATE_KEY=<privateKey generada>
VAPID_SUBJECT=mailto:sil31227@gmail.com
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<publicKey generada, la misma que VAPID_PUBLIC_KEY>
```

- [ ] **Step 4: Documentar los nombres en `.env.example`**

Agregar al final de `.env.example`:

```
# Web Push (VAPID) — generar con: npx web-push generate-vapid-keys --json
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
```

- [ ] **Step 5: Verificar typecheck y commit**

Run: `npx tsc --noEmit`
Expected: sin errores.

```bash
git add package.json package-lock.json .env.example
git commit -m "chore: agregar web-push y envs VAPID"
```

Nota: `.env.local` NO se commitea (ver `.gitignore`). Recordar cargar las 4 envs también en Vercel → Settings → Environment Variables.

---

### Task 2: Migración Supabase — tabla push_subscriptions

**Files:**
- Create: `supabase/migration-push-admin.sql`

**Interfaces:**
- Produces: tabla `push_subscriptions` con columnas `id`, `endpoint` (unique), `p256dh`, `auth`, `audience`, `created_at`.

- [ ] **Step 1: Crear el archivo de migración**

Crear `supabase/migration-push-admin.sql`:

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
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS push_subscriptions_audience_idx
  ON push_subscriptions (audience);

-- RLS: solo el service_role (rutas API del servidor) accede.
-- Sin políticas públicas => el anon key no puede leer ni escribir.
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

COMMIT;
```

- [ ] **Step 2: Ejecutar la migración en Supabase**

Abrir Supabase → SQL Editor → pegar el contenido de `supabase/migration-push-admin.sql` → Run.
Expected: "Success. No rows returned".

- [ ] **Step 3: Verificar la tabla**

En Supabase → Table Editor: confirmar que existe `push_subscriptions` con las columnas indicadas.

- [ ] **Step 4: Commit**

```bash
git add supabase/migration-push-admin.sql
git commit -m "feat(db): tabla push_subscriptions para push del admin"
```

---

### Task 3: Service worker (public/sw.js)

**Files:**
- Create: `public/sw.js`

**Interfaces:**
- Consumes: payload push JSON `{ title: string, body: string, url: string, tag?: string }`.
- Produces: SW servido en `/sw.js` (scope `/`) que muestra notificaciones y maneja el click abriendo `url`.

- [ ] **Step 1: Escribir el service worker**

Crear `public/sw.js`:

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
    data = { title: "La Percha Admin", body: event.data ? event.data.text() : "" };
  }

  const title = data.title || "La Percha Admin";
  const options = {
    body: data.body || "",
    icon: "/logo.jpg",
    badge: "/logo.jpg",
    tag: data.tag || undefined,
    data: { url: data.url || "/admin/pedidos" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || "/admin/pedidos";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes("/admin") && "focus" in client) {
          client.focus();
          if ("navigate" in client) client.navigate(targetUrl);
          return;
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
    })
  );
});
```

- [ ] **Step 2: Verificar que se sirve**

Run: `npm run dev` y luego en otra terminal:

```bash
curl -s -o /dev/null -w "%{http_code} %{content_type}\n" http://localhost:3000/sw.js
```

Expected: `200 application/javascript` (o `text/javascript`).

- [ ] **Step 3: Commit**

```bash
git add public/sw.js
git commit -m "feat(pwa): service worker para push del admin"
```

---

### Task 4: Helper de envío — src/lib/push.ts

**Files:**
- Create: `src/lib/push.ts`

**Interfaces:**
- Consumes: `createAdminClient()` de `@/lib/supabase-admin`; envs VAPID; tabla `push_subscriptions`.
- Produces: `export async function sendAdminPush(payload: { title: string; body: string; url?: string; tag?: string }): Promise<void>` — best-effort, nunca lanza.

- [ ] **Step 1: Escribir el helper**

Crear `src/lib/push.ts`:

```ts
import webpush from "web-push"
import { createAdminClient } from "@/lib/supabase-admin"

export interface AdminPushPayload {
  title: string
  body: string
  url?: string
  tag?: string
}

let configured = false

function ensureConfigured(): boolean {
  const publicKey = process.env.VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  const subject = process.env.VAPID_SUBJECT || "mailto:admin@lapercha.com"

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

export async function sendAdminPush(payload: AdminPushPayload): Promise<void> {
  try {
    if (!ensureConfigured()) return

    const supabase = createAdminClient()
    const { data: subs, error } = await supabase
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth")
      .eq("audience", "admin")

    if (error || !subs?.length) return

    const body = JSON.stringify({
      title: payload.title,
      body: payload.body,
      url: payload.url || "/admin/pedidos",
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
    console.error("[push] Error inesperado en sendAdminPush:", err)
  }
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: sin errores.

- [ ] **Step 3: Commit**

```bash
git add src/lib/push.ts
git commit -m "feat: helper sendAdminPush con web-push"
```

---

### Task 5: API route — POST /api/push/subscribe

**Files:**
- Create: `src/app/api/push/subscribe/route.ts`

**Interfaces:**
- Consumes: body `{ endpoint: string, keys: { p256dh: string, auth: string } }` (formato estándar de `PushSubscription.toJSON()`).
- Produces: upsert en `push_subscriptions` por `endpoint`; responde `{ ok: true }` o error.

- [ ] **Step 1: Escribir la ruta**

Crear `src/app/api/push/subscribe/route.ts`:

```ts
import { createAdminClient } from "@/lib/supabase-admin"
import { NextResponse } from "next/server"

interface SubscribeBody {
  endpoint?: string
  keys?: { p256dh?: string; auth?: string }
}

export async function POST(req: Request) {
  try {
    const body: SubscribeBody = await req.json()
    const endpoint = body.endpoint
    const p256dh = body.keys?.p256dh
    const auth = body.keys?.auth

    if (!endpoint || !p256dh || !auth) {
      return NextResponse.json({ error: "Suscripción inválida" }, { status: 400 })
    }

    const supabase = createAdminClient()
    const { error } = await supabase
      .from("push_subscriptions")
      .upsert(
        { endpoint, p256dh, auth, audience: "admin" },
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

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: sin errores.

- [ ] **Step 3: Verificar la ruta (con dev server)**

Run (con `npm run dev` activo):

```bash
curl -s -X POST http://localhost:3000/api/push/subscribe \
  -H "Content-Type: application/json" \
  -d '{"endpoint":"","keys":{}}'
```

Expected: `{"error":"Suscripción inválida"}` con status 400.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/push/subscribe/route.ts
git commit -m "feat(api): ruta para guardar suscripción push del admin"
```

---

### Task 6: Componente cliente EnableAdminPush

**Files:**
- Create: `src/app/(admin)/EnableAdminPush.tsx`

**Interfaces:**
- Consumes: `NEXT_PUBLIC_VAPID_PUBLIC_KEY`; endpoint `POST /api/push/subscribe`; `/sw.js`.
- Produces: `export function EnableAdminPush()` — componente client que registra el SW, pide permiso y suscribe. Se monta en el layout admin (Task 7).

- [ ] **Step 1: Escribir el componente**

Crear `src/app/(admin)/EnableAdminPush.tsx`:

```tsx
"use client"
import { useEffect, useState } from "react"
import { Bell, BellOff, BellRing, Loader2 } from "lucide-react"

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) outputArray[i] = rawData.charCodeAt(i)
  return outputArray
}

type PushState = "loading" | "unsupported" | "default" | "granted" | "denied" | "subscribing"

export function EnableAdminPush() {
  const [state, setState] = useState<PushState>("loading")

  useEffect(() => {
    if (typeof window === "undefined") return
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
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
        }))

      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      })
      if (!res.ok) throw new Error("No se pudo guardar la suscripción")

      setState("granted")
    } catch (err) {
      console.error("[EnableAdminPush]", err)
      alert("No se pudieron activar las notificaciones. Reintentá.")
      setState(Notification.permission as PushState)
    }
  }

  if (state === "loading" || state === "unsupported") return null

  if (state === "granted") {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-matcha-700 bg-matcha-50">
        <BellRing className="w-3.5 h-3.5 text-matcha-600" />
        Notificaciones activadas
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
      Activar notificaciones
    </button>
  )
}
```

- [ ] **Step 2: Typecheck y lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: sin errores (advertencias de lint aceptables solo si no son del archivo nuevo).

- [ ] **Step 3: Commit**

```bash
git add "src/app/(admin)/EnableAdminPush.tsx"
git commit -m "feat(admin): componente para activar notificaciones push"
```

---

### Task 7: Montar el botón en el panel admin

**Files:**
- Modify: `src/app/(admin)/sidebar.tsx`

**Interfaces:**
- Consumes: `EnableAdminPush` de `./EnableAdminPush` (Task 6).
- Produces: botón visible en el drawer mobile y en el sidebar desktop.

- [ ] **Step 1: Importar el componente**

En `src/app/(admin)/sidebar.tsx`, agregar el import junto a los otros (después de la línea `import { useAdminStore } from "@/store/useAdminStore"`):

```tsx
import { EnableAdminPush } from "./EnableAdminPush"
```

- [ ] **Step 2: Agregar el botón en el drawer mobile**

En el drawer mobile, insertar el componente antes del link "Salir del admin". Reemplazar:

```tsx
            <Link href="/" className="flex items-center gap-2 px-3 py-3 rounded-lg text-xs text-text-muted hover:bg-surface-sunken transition-colors mt-2">
              <LogOut className="w-3.5 h-3.5" />
              Salir del admin
            </Link>
```

por:

```tsx
            <div className="mt-2 mb-1">
              <EnableAdminPush />
            </div>
            <Link href="/" className="flex items-center gap-2 px-3 py-3 rounded-lg text-xs text-text-muted hover:bg-surface-sunken transition-colors">
              <LogOut className="w-3.5 h-3.5" />
              Salir del admin
            </Link>
```

- [ ] **Step 3: Agregar el botón en el sidebar desktop**

En el sidebar desktop, insertar antes del link "Salir del admin" final. Reemplazar:

```tsx
        <Link href="/" className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs text-text-muted hover:bg-surface-sunken transition-colors">
          <LogOut className="w-3.5 h-3.5" />
          Salir del admin
        </Link>
```

por:

```tsx
        <div className="mb-2">
          <EnableAdminPush />
        </div>
        <Link href="/" className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs text-text-muted hover:bg-surface-sunken transition-colors">
          <LogOut className="w-3.5 h-3.5" />
          Salir del admin
        </Link>
```

- [ ] **Step 4: Typecheck y lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: sin errores.

- [ ] **Step 5: Verificación manual**

Run: `npm run dev`. Abrir `http://localhost:3000/admin` en el navegador. En desktop ver el botón "Activar notificaciones" arriba de "Salir del admin"; en mobile (o vista responsive), abrir el drawer (botón ⋯) y ver el botón. Tocarlo → el navegador debe pedir permiso de notificaciones.

- [ ] **Step 6: Commit**

```bash
git add "src/app/(admin)/sidebar.tsx"
git commit -m "feat(admin): montar botón de notificaciones en sidebar y drawer"
```

---

### Task 8: Disparar push al crear pedido

**Files:**
- Modify: `src/app/api/checkout/crear-pedido/route.ts`

**Interfaces:**
- Consumes: `sendAdminPush` de `@/lib/push` (Task 4).

- [ ] **Step 1: Importar el helper**

En `src/app/api/checkout/crear-pedido/route.ts`, agregar tras la línea `import { NextResponse } from "next/server"`:

```ts
import { sendAdminPush } from "@/lib/push"
```

- [ ] **Step 2: Disparar el push antes del return de éxito**

En `crear-pedido/route.ts`, justo antes de `return NextResponse.json({ ok: true, orderId, ... })` (después del loop que inserta los pedidos), agregar:

```ts
    const totalPush = subtotal + shipping
    await sendAdminPush({
      title: "🛍️ Nuevo pedido",
      body: `${compradorNombre} · $${totalPush.toLocaleString("es-AR")} · #${orderId}`,
      url: "/admin/pedidos",
      tag: `pedido-${orderId}`,
    })
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: sin errores.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/checkout/crear-pedido/route.ts
git commit -m "feat(checkout): push al admin al crear pedido"
```

---

### Task 9: Disparar push al confirmar pago (webhook MP)

**Files:**
- Modify: `src/app/api/mercadopago/webhook/route.ts`

**Interfaces:**
- Consumes: `sendAdminPush` de `@/lib/push` (Task 4).

- [ ] **Step 1: Importar el helper**

En `src/app/api/mercadopago/webhook/route.ts`, agregar tras `import { createAdminClient } from "@/lib/supabase-admin"`:

```ts
import { sendAdminPush } from "@/lib/push"
```

- [ ] **Step 2: Disparar el push dentro de la rama `if (!yaEnviado)`**

En `webhook/route.ts`, dentro del bloque `if (!yaEnviado) { ... }`, después de actualizar `mail_pago_enviado` (la llamada a `supabase.from("pedidos").update({ mail_pago_enviado: true })...`), agregar:

```ts
        await sendAdminPush({
          title: "✅ Pago confirmado",
          body: `Pedido #${externalReference} · $${(subtotal + costoEnvio).toLocaleString("es-AR")}`,
          url: "/admin/pedidos",
          tag: `pago-${externalReference}`,
        })
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: sin errores.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/mercadopago/webhook/route.ts
git commit -m "feat(mp): push al admin al confirmar pago"
```

---

### Task 10: Disparar push en nueva publicación y registro

**Files:**
- Modify: `src/app/api/email/nueva-publicacion/route.ts`
- Modify: `src/app/api/registros/crear/route.ts`

**Interfaces:**
- Consumes: `sendAdminPush` de `@/lib/push` (Task 4).

- [ ] **Step 1: Nueva publicación — importar y disparar**

En `src/app/api/email/nueva-publicacion/route.ts`, agregar tras `import { NextRequest, NextResponse } from "next/server"`:

```ts
import { sendAdminPush } from "@/lib/push"
```

Luego, justo antes de `return NextResponse.json({ ok: true })` (después del bloque `if (resend) { ... }`), agregar:

```ts
    await sendAdminPush({
      title: "🔔 Nueva prenda para moderar",
      body: `${titulo} · ${vendedora} · $${Number(precio).toLocaleString("es-AR")}`,
      url: "/admin/moderacion",
    })
```

- [ ] **Step 2: Registro — importar y disparar**

En `src/app/api/registros/crear/route.ts`, agregar tras `import { NextRequest, NextResponse } from "next/server"`:

```ts
import { sendAdminPush } from "@/lib/push"
```

Luego, justo antes de `return NextResponse.json({ ok: true })` (después del `fetch` a `verification_tokens`), agregar:

```ts
    await sendAdminPush({
      title: "👤 Nueva vendedora registrada",
      body: `${name || email}`,
      url: "/admin/registros",
    })
```

- [ ] **Step 3: Typecheck y lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: sin errores.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/email/nueva-publicacion/route.ts src/app/api/registros/crear/route.ts
git commit -m "feat(admin): push en nueva publicación y registro de vendedora"
```

---

### Task 11: Verificación end-to-end en producción

**Files:** ninguno (verificación manual).

**Interfaces:**
- Consumes: todo lo anterior desplegado en Vercel con las 4 envs VAPID cargadas.

- [ ] **Step 1: Cargar envs VAPID en Vercel**

Vercel → Settings → Environment Variables: agregar `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (mismos valores que `.env.local`). Redeploy.

- [ ] **Step 2: Build de producción local (sanity check)**

Run: `npm run build`
Expected: build exitoso sin errores de tipos.

- [ ] **Step 3: Activar notificaciones en el iPhone**

En el iPhone, abrir la PWA admin ya anclada al inicio → abrir el menú (⋯) → tocar "Activar notificaciones" → aceptar el permiso. Debe quedar "Notificaciones activadas".

Verificar en Supabase → Table Editor → `push_subscriptions` que apareció una fila nueva.

- [ ] **Step 4: Probar cada disparador**

- Hacer una compra de prueba (efectivo/retiro) → llega "🛍️ Nuevo pedido"; al tocar abre `/admin/pedidos`.
- Pagar con Mercado Pago (o simular webhook aprobado) → llega "✅ Pago confirmado".
- Publicar una prenda como vendedora → llega "🔔 Nueva prenda para moderar".
- Registrar una vendedora nueva → llega "👤 Nueva vendedora registrada".

- [ ] **Step 5: Confirmar comportamiento best-effort**

Con las envs VAPID ausentes en local, hacer una compra → el pedido se crea igual (el push loguea advertencia pero no rompe). Confirmar en logs.

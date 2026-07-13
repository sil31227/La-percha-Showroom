# Mails de pedido, seguimiento y retiro en local — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enviar mail al cliente cuando MP confirma el pago, avisar por mail + mostrar seguimiento de Correo Argentino cuando la admin marca "Enviado", y agregar retiro en local con pago en efectivo coordinado por WhatsApp.

**Architecture:** Next.js App Router (16) + Supabase + Resend + Mercado Pago. Los mails se envían desde rutas API server-side que reusan el template visual existente. La idempotencia del mail de pago usa una columna en `pedidos`. El retiro en local se modela con un flag `retiro_local` por producto y un nuevo método de envío `retiro_local`.

**Tech Stack:** TypeScript, Next.js 16, React 19, Zustand, Supabase JS, Resend, MercadoPago SDK, Tailwind.

## Global Constraints

- No hay test runner en el proyecto. Verificación por tarea = `npm run lint` + `npm run build` + prueba manual descrita. No agregar framework de tests.
- No agregar comentarios al código salvo los ya existentes.
- Reusar el template HTML de mail existente (verde `#809671`, Playfair Display, fondo `#f8f6f2`, tarjeta `#ffffff` con borde `#ede9e0`).
- Variables de entorno existentes: `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `NEXT_PUBLIC_SITE_URL`, `MERCADOPAGO_ACCESS_TOKEN`.
- WhatsApp admin: `5492494371107` (constante `ADMIN_WHATSAPP` en paso-3).
- Método de envío retiro en local = string `"retiro_local"`. Métodos Correo Argentino = `"correo_sucursal"`, `"correo_domicilio"`.
- Mail de pago confirmado: SOLO Mercado Pago.
- Precios/formato: `toLocaleString("es-AR")`.

---

### Task 1: Migración de base de datos y tipos

**Files:**
- Create: `supabase/migration-mails-seguimiento.sql`
- Modify: `src/lib/types.ts` (ShippingMethod)
- Modify: `src/store/useAdminStore.ts` (AdminProduct, AdminOrder, StoreProductForm)

**Interfaces:**
- Produces: columnas `pedidos.mail_pago_enviado BOOLEAN`, `pedidos.seguimiento TEXT`, `productos.retiro_local BOOLEAN`. Tipo `ShippingMethod` incluye `'retiro_local'`. `AdminProduct.retiro_local?: boolean`, `AdminOrder.seguimiento?: string`, `StoreProductForm.retiro_local: boolean`.

- [ ] **Step 1: Crear el archivo de migración**

Create `supabase/migration-mails-seguimiento.sql`:

```sql
-- Mails de pedido, seguimiento de envío y retiro en local
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS mail_pago_enviado BOOLEAN DEFAULT false;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS seguimiento TEXT;
ALTER TABLE productos ADD COLUMN IF NOT EXISTS retiro_local BOOLEAN DEFAULT false;

-- Los productos de tienda oficial permiten retiro en local por defecto
UPDATE productos SET retiro_local = true WHERE vendedor_tipo = 'oficial' AND retiro_local IS NOT true;
```

- [ ] **Step 2: Aplicar la migración en Supabase**

Ejecutar el SQL en el panel de Supabase (SQL Editor) o con el runner del proyecto:
Run: `node supabase/migrate.mjs` si soporta archivos sueltos; si no, copiar/pegar el SQL en el SQL Editor de Supabase.
Expected: columnas creadas sin error.

- [ ] **Step 3: Actualizar `ShippingMethod` en types.ts**

Modify `src/lib/types.ts` línea 71:

```typescript
export type ShippingMethod = 'correo_sucursal' | 'correo_domicilio' | 'arreglar_vendedor' | 'retiro_local'
```

- [ ] **Step 4: Agregar campos a las interfaces del admin store**

Modify `src/store/useAdminStore.ts`.

En `AdminProduct` (línea 13), agregar `retiro_local`:

```typescript
  envio_gratis?: boolean; destacado?: boolean; tipo: ProductType; retiro_local?: boolean
```

En `AdminOrder` (línea 27), agregar `seguimiento`:

```typescript
  metodo_envio?: string; costo_envio?: number; seguimiento?: string
```

En `StoreProductForm` (línea 38), agregar `retiro_local`:

```typescript
  envio_gratis: boolean; destacado: boolean; tipo: ProductType; retiro_local: boolean
```

- [ ] **Step 5: Verificar y commitear**

Run: `npm run lint`
Expected: sin errores nuevos.

```bash
git add supabase/migration-mails-seguimiento.sql src/lib/types.ts src/store/useAdminStore.ts
git commit -m "feat(db): columnas mail_pago_enviado, seguimiento y retiro_local + tipos"
```

---

### Task 2: Ruta de mail de pago confirmado

**Files:**
- Create: `src/app/api/email/pedido-confirmado/route.ts`

**Interfaces:**
- Produces: `POST /api/email/pedido-confirmado` que acepta JSON `{ email, orderId, items: {titulo,talle,precio}[], direccion?, metodo_envio?, costo_envio?, subtotal, total }` y devuelve `{ ok: true }` o `{ error }`.

- [ ] **Step 1: Crear la ruta**

Create `src/app/api/email/pedido-confirmado/route.ts`:

```typescript
import { Resend } from "resend"
import { NextRequest, NextResponse } from "next/server"

const RESEND_KEY = process.env.RESEND_API_KEY
const resend = RESEND_KEY ? new Resend(RESEND_KEY) : null
const FROM = process.env.RESEND_FROM_EMAIL || "La Percha Showroom <onboarding@resend.dev>"

const METODO_LABEL: Record<string, string> = {
  correo_sucursal: "Correo Argentino (sucursal)",
  correo_domicilio: "Correo Argentino (domicilio)",
  arreglar_vendedor: "Arreglar con el vendedor",
  retiro_local: "Retiro en local",
}

interface Item { titulo: string; talle?: string; precio: number }

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, orderId, items, direccion, metodo_envio, costo_envio, subtotal, total } = body as {
      email?: string; orderId?: string; items?: Item[]; direccion?: string
      metodo_envio?: string; costo_envio?: number; subtotal?: number; total?: number
    }
    if (!email || !orderId || !items?.length) {
      return NextResponse.json({ error: "Faltan datos" }, { status: 400 })
    }

    if (resend) {
      const { error } = await resend.emails.send({
        from: FROM,
        to: email,
        subject: `Confirmamos tu pago · Pedido #${orderId}`,
        html: pedidoConfirmadoEmail({
          orderId, items, direccion,
          metodoLabel: METODO_LABEL[metodo_envio || ""] || metodo_envio || "",
          costoEnvio: costo_envio || 0,
          subtotal: subtotal || items.reduce((s, i) => s + i.precio, 0),
          total: total || 0,
        }),
      })
      if (error) {
        console.error("Error enviando mail pago confirmado (Resend):", error)
        return NextResponse.json({ ok: false, error: error.message }, { status: 502 })
      }
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error inesperado"
    console.error("Error mail pago confirmado:", e)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

function money(n: number) {
  return `$ ${n.toLocaleString("es-AR")}`
}

function pedidoConfirmadoEmail(d: {
  orderId: string; items: Item[]; direccion?: string
  metodoLabel: string; costoEnvio: number; subtotal: number; total: number
}) {
  const rows = d.items.map(i => `
    <tr>
      <td style="padding: 8px 0; font-size: 14px; color: #463828;">${i.titulo}${i.talle ? ` <span style="color:#a39584;">· Talle ${i.talle}</span>` : ""}</td>
      <td style="padding: 8px 0; font-size: 14px; color: #463828; text-align: right; font-weight: 600;">${money(i.precio)}</td>
    </tr>`).join("")

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: 'Inter', -apple-system, sans-serif; background: #f8f6f2; color: #463828; margin: 0; padding: 0;">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #ede9e0;">
  <tr>
    <td style="padding: 40px 32px 24px; text-align: center;">
      <h1 style="font-family: 'Playfair Display', 'Times New Roman', serif; font-weight: 500; font-size: 28px; color: #809671; margin: 0 0 8px;">La Percha Showroom</h1>
      <p style="font-size: 13px; color: #a39584; margin: 0; letter-spacing: 3px; text-transform: uppercase;">Pago confirmado</p>
    </td>
  </tr>
  <tr>
    <td style="padding: 0 32px 8px;">
      <p style="font-size: 16px; line-height: 1.6; margin: 0 0 8px;">¡Confirmamos tu pago!</p>
      <p style="font-size: 14px; line-height: 1.6; margin: 0 0 16px; color: #725C3A;">Pedido <strong>#${d.orderId}</strong>. Te avisamos cuando lo despachemos.</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-top: 1px solid #ede9e0; margin-top: 8px;">
        ${rows}
      </table>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-top: 1px solid #ede9e0; margin-top: 8px;">
        <tr><td style="padding: 8px 0 2px; font-size: 13px; color: #a39584;">Subtotal</td><td style="padding: 8px 0 2px; font-size: 13px; color: #463828; text-align: right;">${money(d.subtotal)}</td></tr>
        <tr><td style="padding: 2px 0; font-size: 13px; color: #a39584;">Envío${d.metodoLabel ? ` (${d.metodoLabel})` : ""}</td><td style="padding: 2px 0; font-size: 13px; color: #463828; text-align: right;">${d.costoEnvio === 0 ? "Gratis" : money(d.costoEnvio)}</td></tr>
        <tr><td style="padding: 8px 0; font-size: 15px; color: #463828; font-weight: 700; border-top: 1px solid #ede9e0;">Total</td><td style="padding: 8px 0; font-size: 15px; color: #809671; font-weight: 700; text-align: right; border-top: 1px solid #ede9e0;">${money(d.total)}</td></tr>
      </table>
      ${d.direccion ? `<p style="font-size: 12px; color: #a39584; line-height: 1.5; margin: 16px 0 0;">Envío a: ${d.direccion}</p>` : ""}
    </td>
  </tr>
  <tr>
    <td style="background: #f8f6f2; padding: 20px 32px; text-align: center;">
      <p style="font-size: 11px; color: #a39584; margin: 0;">La Percha Showroom · Bahía Blanca, Argentina</p>
    </td>
  </tr>
</table>
</body>
</html>`
}
```

- [ ] **Step 2: Verificar build y commitear**

Run: `npm run lint && npm run build`
Expected: compila sin errores.

```bash
git add src/app/api/email/pedido-confirmado/route.ts
git commit -m "feat(email): ruta de mail de pago confirmado"
```

---

### Task 3: Disparar mail de pago confirmado desde el webhook de MP (idempotente)

**Files:**
- Modify: `src/app/api/mercadopago/webhook/route.ts`

**Interfaces:**
- Consumes: `POST /api/email/pedido-confirmado` (Task 2). Columnas `mail_pago_enviado`, `direccion`, `metodo_envio`, `costo_envio`, `comprador_email`, `producto_titulo`, `talle`, `precio` de `pedidos`.

- [ ] **Step 1: Reemplazar el bloque de actualización de pedidos del webhook**

Modify `src/app/api/mercadopago/webhook/route.ts`. Reemplazar desde la línea 34 (`const now = ...`) hasta el `return NextResponse.json({ ok: true })` final (línea 52) por:

```typescript
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"

    const { data: pedidos } = await supabase
      .from("pedidos")
      .select("id, comprador_email, producto_titulo, talle, precio, direccion, metodo_envio, costo_envio, mail_pago_enviado")
      .like("id", `${externalReference}%`)

    if (pedidos?.length) {
      const yaEnviado = pedidos.some(p => p.mail_pago_enviado)

      if (!yaEnviado) {
        const email = pedidos.find(p => p.comprador_email)?.comprador_email || ""
        const costoEnvio = Number(pedidos[0].costo_envio) || 0
        const subtotal = pedidos.reduce((s, p) => s + Number(p.precio), 0)

        if (email) {
          try {
            await fetch(`${siteUrl}/api/email/pedido-confirmado`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email,
                orderId: externalReference,
                items: pedidos.map(p => ({ titulo: p.producto_titulo, talle: p.talle, precio: Number(p.precio) })),
                direccion: pedidos[0].direccion,
                metodo_envio: pedidos[0].metodo_envio,
                costo_envio: costoEnvio,
                subtotal,
                total: subtotal + costoEnvio,
              }),
            })
          } catch (mailErr) {
            console.error("Error disparando mail pago confirmado:", mailErr)
          }
        }

        await supabase
          .from("pedidos")
          .update({ mail_pago_enviado: true })
          .like("id", `${externalReference}%`)
      }
    }

    return NextResponse.json({ ok: true })
```

- [ ] **Step 2: Verificar que no quede la variable `now` sin usar**

Confirmar que se eliminó `const now = new Date().toISOString()` (ya no se usa en el webhook).
Run: `npm run lint`
Expected: sin warning de variable no usada.

- [ ] **Step 3: Prueba manual (opcional, requiere entorno MP)**

Con un pago de prueba MP aprobado, verificar en logs que se llama a `/api/email/pedido-confirmado` una sola vez aunque el webhook se reciba varias veces, y que el pedido queda con `mail_pago_enviado = true`.

- [ ] **Step 4: Commitear**

```bash
git add src/app/api/mercadopago/webhook/route.ts
git commit -m "feat(mp): enviar mail de pago confirmado desde webhook (idempotente)"
```

---

### Task 4: Ruta de mail de pedido enviado

**Files:**
- Create: `src/app/api/email/pedido-enviado/route.ts`

**Interfaces:**
- Produces: `POST /api/email/pedido-enviado` que acepta `{ email, orderId, producto_titulo, metodo_envio, seguimiento? }` y devuelve `{ ok: true }` o `{ error }`.

- [ ] **Step 1: Crear la ruta**

Create `src/app/api/email/pedido-enviado/route.ts`:

```typescript
import { Resend } from "resend"
import { NextRequest, NextResponse } from "next/server"

const RESEND_KEY = process.env.RESEND_API_KEY
const resend = RESEND_KEY ? new Resend(RESEND_KEY) : null
const FROM = process.env.RESEND_FROM_EMAIL || "La Percha Showroom <onboarding@resend.dev>"

const TRACKING_URL = "https://www.correoargentino.com.ar/formularios/e-commerce"

function esCorreoArgentino(metodo?: string) {
  return metodo === "correo_sucursal" || metodo === "correo_domicilio"
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, orderId, producto_titulo, metodo_envio, seguimiento } = body as {
      email?: string; orderId?: string; producto_titulo?: string
      metodo_envio?: string; seguimiento?: string
    }
    if (!email || !orderId) {
      return NextResponse.json({ error: "Faltan datos" }, { status: 400 })
    }

    if (resend) {
      const { error } = await resend.emails.send({
        from: FROM,
        to: email,
        subject: `Tu pedido #${orderId} está en camino`,
        html: pedidoEnviadoEmail({
          orderId,
          producto: producto_titulo || "tu pedido",
          correo: esCorreoArgentino(metodo_envio),
          seguimiento: seguimiento || "",
        }),
      })
      if (error) {
        console.error("Error enviando mail pedido enviado (Resend):", error)
        return NextResponse.json({ ok: false, error: error.message }, { status: 502 })
      }
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error inesperado"
    console.error("Error mail pedido enviado:", e)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

function pedidoEnviadoEmail(d: { orderId: string; producto: string; correo: boolean; seguimiento: string }) {
  const bloqueCorreo = d.correo
    ? `<p style="font-size: 15px; line-height: 1.6; margin: 0 0 16px; color: #725C3A;">Tu pedido fue enviado por <strong>Correo Argentino</strong>.</p>
       ${d.seguimiento ? `<div style="text-align: center; margin: 16px 0;">
         <p style="font-size: 12px; color: #a39584; margin: 0 0 4px;">Número de seguimiento</p>
         <p style="font-size: 18px; font-weight: 700; color: #463828; margin: 0 0 12px; letter-spacing: 1px;">${d.seguimiento}</p>
         <a href="${TRACKING_URL}" style="display: inline-block; background: #809671; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 100px; font-size: 14px; font-weight: 600;">Seguir mi envío</a>
       </div>` : ""}`
    : `<p style="font-size: 15px; line-height: 1.6; margin: 0 0 16px; color: #725C3A;">Tu pedido fue despachado.</p>`

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: 'Inter', -apple-system, sans-serif; background: #f8f6f2; color: #463828; margin: 0; padding: 0;">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #ede9e0;">
  <tr>
    <td style="padding: 40px 32px 24px; text-align: center;">
      <h1 style="font-family: 'Playfair Display', 'Times New Roman', serif; font-weight: 500; font-size: 28px; color: #809671; margin: 0 0 8px;">La Percha Showroom</h1>
      <p style="font-size: 13px; color: #a39584; margin: 0; letter-spacing: 3px; text-transform: uppercase;">Tu pedido está en camino</p>
    </td>
  </tr>
  <tr>
    <td style="padding: 0 32px 24px;">
      <p style="font-size: 16px; line-height: 1.6; margin: 0 0 8px;">¡Buenas noticias!</p>
      <p style="font-size: 14px; line-height: 1.6; margin: 0 0 16px; color: #725C3A;">Pedido <strong>#${d.orderId}</strong> — ${d.producto}.</p>
      ${bloqueCorreo}
      <p style="font-size: 12px; color: #a39584; line-height: 1.5; margin: 16px 0 0;">Gracias por comprar en La Percha Showroom.</p>
    </td>
  </tr>
  <tr>
    <td style="background: #f8f6f2; padding: 20px 32px; text-align: center;">
      <p style="font-size: 11px; color: #a39584; margin: 0;">La Percha Showroom · Bahía Blanca, Argentina</p>
    </td>
  </tr>
</table>
</body>
</html>`
}
```

- [ ] **Step 2: Verificar y commitear**

Run: `npm run lint && npm run build`
Expected: compila sin errores.

```bash
git add src/app/api/email/pedido-enviado/route.ts
git commit -m "feat(email): ruta de mail de pedido enviado con seguimiento"
```

---

### Task 5: Admin — campo de seguimiento obligatorio al enviar + disparo del mail

**Files:**
- Modify: `src/store/useAdminStore.ts:244-247` (markOrderShipped)
- Modify: `src/app/(admin)/admin/pedidos/page.tsx`

**Interfaces:**
- Consumes: `POST /api/email/pedido-enviado` (Task 4).
- Produces: `markOrderShipped(id: string, seguimiento?: string)` guarda `status: 'shipped'` y `seguimiento`, y dispara el mail.

- [ ] **Step 1: Actualizar la firma de markOrderShipped en la interfaz**

Modify `src/store/useAdminStore.ts` línea 59:

```typescript
  markOrderShipped: (id: string, seguimiento?: string) => Promise<void>
```

- [ ] **Step 2: Actualizar la implementación de markOrderShipped**

Modify `src/store/useAdminStore.ts` (líneas 244-247):

```typescript
  markOrderShipped: async (id, seguimiento) => {
    await supabase.from("pedidos").update({ status: "shipped", seguimiento: seguimiento || null }).eq("id", id)
    const order = get().orders.find(o => o.id === id)
    set(s => ({ orders: s.orders.map(o => o.id === id ? { ...o, status: "shipped" as const, seguimiento } : o) }))
    if (order?.comprador_email) {
      fetch("/api/email/pedido-enviado", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: order.comprador_email,
          orderId: order.id,
          producto_titulo: order.producto_titulo,
          metodo_envio: order.metodo_envio,
          seguimiento: seguimiento || "",
        }),
      }).catch(() => {})
    }
  },
```

- [ ] **Step 3: Agregar UI de seguimiento en la página de pedidos**

Modify `src/app/(admin)/admin/pedidos/page.tsx`.

Reemplazar la desestructuración (línea 20) para no cambiar nombres y agregar estado de tracking. Agregar tras la línea 22 (`const [expanded, ...]`):

```typescript
  const [trackingId, setTrackingId] = useState<string | null>(null)
  const [trackingValue, setTrackingValue] = useState("")
```

Reemplazar el botón "Enviar" (línea 52) por lógica que exija seguimiento para Correo Argentino:

```tsx
                    {o.status === "pending_shipment" && (() => {
                      const esCorreo = o.metodo_envio === "correo_sucursal" || o.metodo_envio === "correo_domicilio"
                      if (esCorreo && trackingId !== o.id) {
                        return <button onClick={() => { setTrackingId(o.id); setTrackingValue("") }} className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-semibold bg-info-50 text-info-600 hover:bg-info-500 hover:text-white transition-colors"><Truck className="w-3 h-3" /> Enviar</button>
                      }
                      if (!esCorreo) {
                        return <button onClick={() => markOrderShipped(o.id)} className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-semibold bg-info-50 text-info-600 hover:bg-info-500 hover:text-white transition-colors"><Truck className="w-3 h-3" /> Enviar</button>
                      }
                      return null
                    })()}
```

Agregar el panel de carga de seguimiento dentro de la tarjeta, justo antes del cierre `</div>` del bloque `p-4` (antes de la línea 58, después del bloque `{isOpen && ...}`):

```tsx
                {trackingId === o.id && (
                  <div className="mt-4 pt-4 border-t border-border-subtle space-y-2">
                    <label className="block text-xs font-semibold text-text-strong">Número de seguimiento (Correo Argentino)</label>
                    <input value={trackingValue} onChange={e => setTrackingValue(e.target.value)}
                      placeholder="Ej: CA123456789AR"
                      className="w-full h-10 rounded-lg border border-border-default px-3 text-sm text-text-strong bg-surface-card focus:outline-none focus:border-brand" />
                    <div className="flex gap-2">
                      <button
                        onClick={() => { if (trackingValue.trim()) { markOrderShipped(o.id, trackingValue.trim()); setTrackingId(null) } }}
                        disabled={!trackingValue.trim()}
                        className={`flex-1 h-10 rounded-full text-[12px] font-semibold transition-colors ${trackingValue.trim() ? "bg-info-500 text-white hover:bg-info-600" : "bg-info-50 text-info-600/50 cursor-not-allowed"}`}>
                        Confirmar envío
                      </button>
                      <button onClick={() => setTrackingId(null)} className="px-4 h-10 rounded-full text-[12px] font-medium text-text-muted hover:bg-surface-sunken transition-colors">Cancelar</button>
                    </div>
                  </div>
                )}
```

Agregar `retiro_local` y `arreglar_vendedor` al `METODO_LABEL` local (líneas 13-17):

```typescript
const METODO_LABEL: Record<string, string> = {
  correo_sucursal: "Correo Argentino (sucursal)",
  correo_domicilio: "Correo Argentino (domicilio)",
  arreglar_vendedor: "Arreglar con el vendedor",
  retiro_local: "Retiro en local",
}
```

- [ ] **Step 4: Verificar y prueba manual**

Run: `npm run lint && npm run build`
Expected: compila sin errores.

Prueba manual: en `/admin/pedidos`, un pedido `correo_sucursal` pendiente muestra "Enviar" → abre campo de seguimiento → "Confirmar envío" solo se habilita con texto → al confirmar pasa a "Enviado". Un pedido `arreglar_vendedor` se envía directo sin pedir seguimiento.

- [ ] **Step 5: Commitear**

```bash
git add src/store/useAdminStore.ts "src/app/(admin)/admin/pedidos/page.tsx"
git commit -m "feat(admin): seguimiento obligatorio al enviar por Correo Argentino + mail"
```

---

### Task 6: Cliente — mostrar "Enviado por Correo Argentino" + seguimiento en Mis compras

**Files:**
- Modify: `src/app/(cliente)/perfil/compras/page.tsx`

**Interfaces:**
- Consumes: columnas `metodo_envio`, `seguimiento` de `pedidos`.

- [ ] **Step 1: Agregar campos al tipo y al select**

Modify `src/app/(cliente)/perfil/compras/page.tsx`.

En la interfaz `Pedido` (líneas 8-16), agregar:

```typescript
  metodo_envio: string | null
  seguimiento: string | null
```

En el `.select(...)` (línea 41):

```typescript
      .select("id, producto_titulo, producto_imagen, precio, status, talle, created_at, metodo_envio, seguimiento")
```

- [ ] **Step 2: Agregar constante de link de rastreo y helper**

Agregar tras los objetos `STATUS_STYLE` (después de la línea 30):

```typescript
const TRACKING_URL = "https://www.correoargentino.com.ar/formularios/e-commerce"

function esCorreoArgentino(metodo: string | null) {
  return metodo === "correo_sucursal" || metodo === "correo_domicilio"
}
```

- [ ] **Step 3: Mostrar el detalle de envío en la tarjeta**

Modify: reemplazar el bloque del footer de cada tarjeta (líneas 101-103) por:

```tsx
              <div className="px-4 py-2.5 bg-surface-sunken space-y-1">
                <span className="block text-[10px] text-text-muted">Orden #{pedido.id}</span>
                {pedido.status === "shipped" && esCorreoArgentino(pedido.metodo_envio) && (
                  <div className="text-[11px] text-info-600">
                    <span className="font-semibold">Enviado por Correo Argentino</span>
                    {pedido.seguimiento && (
                      <>
                        {" · "}Seguimiento: <span className="font-mono">{pedido.seguimiento}</span>
                        {" · "}<a href={TRACKING_URL} target="_blank" rel="noopener noreferrer" className="underline">Rastrear</a>
                      </>
                    )}
                  </div>
                )}
              </div>
```

- [ ] **Step 4: Verificar y prueba manual**

Run: `npm run lint && npm run build`
Expected: compila sin errores.

Prueba manual: en `/perfil/compras`, un pedido `shipped` con método Correo Argentino muestra "Enviado por Correo Argentino" + número + link "Rastrear".

- [ ] **Step 5: Commitear**

```bash
git add "src/app/(cliente)/perfil/compras/page.tsx"
git commit -m "feat(compras): mostrar envío por Correo Argentino y seguimiento"
```

---

### Task 7: Habilitar retiro en local en publicación (feria) y tienda (admin)

**Files:**
- Modify: `src/app/(cliente)/vender/page.tsx`
- Modify: `src/app/(admin)/admin/tienda/page.tsx`

**Interfaces:**
- Produces: los productos se guardan con `retiro_local` en `productos`.

- [ ] **Step 1: Agregar estado en vender**

Modify `src/app/(cliente)/vender/page.tsx` tras la línea 52 (`const [freeShipping, ...]`):

```typescript
  const [retiroLocal, setRetiroLocal] = useState(false)
```

- [ ] **Step 2: Guardar retiro_local al publicar**

Modify `src/app/(cliente)/vender/page.tsx` en el insert (línea 266), agregar tras `envio_gratis: freeShipping,`:

```typescript
      retiro_local: retiroLocal,
```

- [ ] **Step 3: Agregar toggle de retiro en local en el formulario de vender**

Modify: insertar un bloque nuevo justo después del cierre del bloque "Envío" (después de la línea 508 aprox., cierre del `<div>` del toggle envío gratis). Usar el mismo patrón visual:

```tsx
        {/* Retiro en local */}
        <div className="bg-surface-card rounded-xl border border-border-subtle p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-matcha-50 flex items-center justify-center">
                <Truck className="w-4 h-4 text-brand" />
              </span>
              <div>
                <p className="text-sm font-semibold text-text-strong">Permitir retiro en local</p>
                <p className="text-[11px] text-text-muted">
                  {retiroLocal
                    ? 'La compradora puede retirar y pagar en efectivo coordinando con La Percha.'
                    : 'Solo envío. Sin retiro en local.'}
                </p>
              </div>
            </div>
            <button type="button"
              onClick={() => setRetiroLocal(o => !o)}
              className={`relative w-12 h-7 rounded-full transition-colors duration-200
                ${retiroLocal ? 'bg-success-500' : 'bg-border-default'}`}>
              <span className={`absolute top-0.5 w-6 h-6 rounded-full bg-white transition-transform duration-200
                ${retiroLocal ? 'translate-x-5.5' : 'translate-x-0.5'}`} />
            </button>
          </div>
        </div>
```

- [ ] **Step 4: Agregar retiro_local al EMPTY y al form del admin tienda**

Modify `src/app/(admin)/admin/tienda/page.tsx`.

En `EMPTY` (línea 33), agregar `retiro_local: true` (default de tienda oficial):

```typescript
  envio_gratis: false, destacado: false, tipo: "ropa", retiro_local: true,
```

En el mapeo al editar (línea 174, junto a `envio_gratis: p.envio_gratis || false`), agregar:

```typescript
      retiro_local: p.retiro_local ?? true,
```

En el objeto `data: StoreProductForm` (línea 346), verificar que incluya `retiro_local: form.retiro_local` (agregar si el objeto lista campos explícitamente).

- [ ] **Step 5: Agregar checkbox de retiro en local en el form del admin**

Modify `src/app/(admin)/admin/tienda/page.tsx` dentro del bloque de checkboxes (líneas 839-848), agregar un tercer `<label>`:

```tsx
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.retiro_local} onChange={e => setForm(f => ({ ...f, retiro_local: e.target.checked }))} className="accent-brand w-4 h-4 rounded" />
            <span className="flex items-center gap-1.5 text-sm text-text-body"><Truck className="w-4 h-4 text-brand" /> Permitir retiro en local</span>
          </label>
```

- [ ] **Step 6: Verificar que addStoreProduct/updateStoreProduct persistan retiro_local**

Modify `src/store/useAdminStore.ts`: revisar `addStoreProduct` y `updateStoreProduct`. Si construyen el objeto de insert/update campo por campo, agregar `retiro_local: p.retiro_local`. Si hacen spread del form, no requiere cambio.

Run: `grep -n "retiro_local\|envio_gratis" src/store/useAdminStore.ts`
Expected: `retiro_local` presente en add/update store product.

- [ ] **Step 7: Verificar y commitear**

Run: `npm run lint && npm run build`
Expected: compila sin errores.

Prueba manual: publicar una prenda de feria con el toggle activado y confirmar en Supabase que `retiro_local = true`. Editar un producto oficial en admin y verificar el checkbox.

```bash
git add "src/app/(cliente)/vender/page.tsx" "src/app/(admin)/admin/tienda/page.tsx" src/store/useAdminStore.ts
git commit -m "feat(productos): toggle 'permitir retiro en local' en vender y admin"
```

---

### Task 8: Checkout paso-1 — opción "Retiro en local" y salto de dirección

**Files:**
- Modify: `src/app/(cliente)/checkout/paso-1/page.tsx`

**Interfaces:**
- Consumes: `productos.retiro_local`, `useShopStore.cart`, `setShipping`.
- Produces: `sessionStorage.checkout_shipping_method` puede valer `"retiro_local"` con costo 0; dirección opcional en ese caso.

- [ ] **Step 1: Traer flags retiro_local del carrito**

Modify `src/app/(cliente)/checkout/paso-1/page.tsx`.

Agregar import de supabase al inicio:

```typescript
import { supabase } from "@/lib/supabase"
```

Agregar al store selectors (junto a `subtotal`/`setShipping`, ~línea 63):

```typescript
  const cart = useShopStore(s => s.cart)
```

Agregar estado y efecto tras el estado existente (~línea 72):

```typescript
  const [allowRetiro, setAllowRetiro] = useState(false)

  useEffect(() => {
    const ids = cart.map(i => i.productId)
    if (!ids.length) { setAllowRetiro(false); return }
    supabase.from("productos").select("id, retiro_local").in("id", ids)
      .then(({ data }) => {
        const all = !!data && data.length === ids.length && data.every(p => p.retiro_local === true)
        setAllowRetiro(all)
      })
  }, [cart])
```

- [ ] **Step 2: Agregar la etiqueta y el cálculo para retiro_local**

Modify: agregar a `METODO_LABEL` (líneas 16-20):

```typescript
  retiro_local: "Retiro en local (coordinar con La Percha)",
```

En `calcShipping` (línea 22), agregar al inicio del cuerpo:

```typescript
  if (method === "retiro_local") return 0
```

- [ ] **Step 3: Renderizar la opción de retiro solo si allowRetiro**

Modify: en el `.map` de métodos (línea 172), cambiar el array para incluir retiro condicionalmente:

```tsx
              {(["correo_sucursal", "correo_domicilio", "arreglar_vendedor", ...(allowRetiro ? ["retiro_local"] as ShippingMethod[] : [])] as ShippingMethod[]).map(method => (
```

- [ ] **Step 4: Omitir validación de dirección en retiro en local**

Modify: cambiar `validate` para recibir el método y saltear los campos de dirección:

```typescript
function validate(form: FormData, method: ShippingMethod | ""): Errors {
  const e: Errors = {}
  if (!form.nombre.trim()) e.nombre = 'Requerido'
  if (!form.email.trim() || !form.email.includes('@')) e.email = 'Email inválido'
  if (method === "retiro_local") return e
  if (!form.provincia) e.provincia = 'Requerido'
  if (!form.ciudad.trim()) e.ciudad = 'Requerido'
  if (!form.cp.trim()) e.cp = 'Requerido'
  if (!form.direccion.trim()) e.direccion = 'Requerido'
  return e
}
```

Actualizar la llamada en `handleContinuar` (línea 87):

```typescript
    const e = validate(form, shippingMethod)
```

- [ ] **Step 5: Ocultar los campos de dirección cuando es retiro en local**

Modify: envolver el bloque de inputs de provincia/ciudad/cp/dirección (líneas 135-165) en una condición. Cambiar la apertura del `<div className="space-y-4">` para que provincia/ciudad/cp/dirección solo se muestren si `shippingMethod !== "retiro_local"`. Concretamente, envolver desde el `<div className="space-y-1">` de Provincia hasta el cierre del `<div>` de Dirección con:

```tsx
          {shippingMethod !== "retiro_local" && (
            <>
              {/* ...campos provincia, ciudad, cp, dirección... */}
            </>
          )}
```

- [ ] **Step 6: Verificar y prueba manual**

Run: `npm run lint && npm run build`
Expected: compila sin errores.

Prueba manual: con carrito de solo productos `retiro_local=true`, aparece "Retiro en local"; al elegirlo se ocultan los campos de dirección y "Continuar" funciona con solo nombre+email. Con un producto sin retiro en el carrito, la opción no aparece.

- [ ] **Step 7: Commitear**

```bash
git add "src/app/(cliente)/checkout/paso-1/page.tsx"
git commit -m "feat(checkout): opción retiro en local en paso 1"
```

---

### Task 9: Checkout paso-2/paso-3 — pago en efectivo y coordinación por WhatsApp

**Files:**
- Modify: `src/app/(cliente)/checkout/paso-2/page.tsx`
- Modify: `src/app/(cliente)/checkout/paso-3/page.tsx`
- Modify: `src/app/api/checkout/crear-pedido/route.ts`
- Modify: `src/app/api/mercadopago/crear-preferencia/route.ts`

**Interfaces:**
- Consumes: `useShopStore.shippingMethod`. `POST /api/checkout/crear-pedido`.
- Produces: método de pago `"efectivo"`; paso-3 muestra botón WhatsApp de coordinación cuando `metodo_envio === "retiro_local"`.

- [ ] **Step 1: Agregar retiro_local al cálculo de envío en los endpoints**

Modify `src/app/api/checkout/crear-pedido/route.ts` en `calcularCostoEnvio` (línea 18), agregar al inicio:

```typescript
  if (metodo === "retiro_local") return 0
```

Modify `src/app/api/mercadopago/crear-preferencia/route.ts` en `calcularCostoEnvio` (línea 24), agregar al inicio:

```typescript
  if (metodo === "retiro_local") return 0
```

- [ ] **Step 2: Mostrar "Pago en efectivo" en paso-2 solo para retiro en local**

Modify `src/app/(cliente)/checkout/paso-2/page.tsx`.

Agregar selector del método de envío (junto a `shippingMethod`, ya existe en línea 19). Tras el bloque de la tarjeta de transferencia (después de la línea 133, dentro del `<div className="space-y-3">`), agregar:

```tsx
          {shippingMethod === "retiro_local" && (
            <PaymentMethodCard
              id="efectivo"
              value="efectivo"
              selected={method}
              onChange={(v) => { setMethod(v); setError(false); setApiError("") }}
              label="Pago en efectivo"
              description="Coordinás el pago al retirar en el local">
              <p className="text-xs text-text-muted bg-matcha-50 rounded-lg p-2.5">
                Total a pagar: <strong>$ {totalConEnvio.toLocaleString("es-AR")}</strong>. Coordinás la cita previa por WhatsApp para retirar y pagar en efectivo.
              </p>
            </PaymentMethodCard>
          )}
```

(El flujo de "efectivo" cae en el `else` de `handleConfirmar` que guarda `checkout_payment` y navega a paso-3, igual que transferencia.)

- [ ] **Step 3: Agregar helper de WhatsApp de retiro en paso-3**

Modify `src/app/(cliente)/checkout/paso-3/page.tsx`.

Tras `buildTransferWhatsAppUrl` (línea 29), agregar:

```typescript
function buildRetiroWhatsAppUrl(orderNumber: string): string {
  const text = `Hola La Percha! Quiero coordinar el retiro en local de mi pedido #${orderNumber}.`
  return `https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent(text)}`
}
```

- [ ] **Step 4: Detectar retiro en local y mostrar coordinación en paso-3**

Modify `src/app/(cliente)/checkout/paso-3/page.tsx`.

Leer el método de envío guardado. Ya se lee `checkout_shipping_method` en el `useEffect` (línea 49) como `shipMethod` y se guarda label en `shippingMethodLabel`. Agregar un estado para el método crudo. Tras la línea 40 (`const [shippingMethodLabel, ...]`):

```typescript
  const [shippingMethodRaw, setShippingMethodRaw] = useState("")
```

En el `useEffect`, tras `const shipMethod = ...` (línea 49):

```typescript
    setShippingMethodRaw(shipMethod)
```

Nota: en el flujo no-MP, `checkout_shipping_method` se borra al final (línea 118). Capturar el valor antes de borrarlo (ya se lee al inicio del effect, así que `setShippingMethodRaw(shipMethod)` queda correcto).

Agregar la constante de detección junto a `isTransfer` (línea 133):

```typescript
  const isRetiroLocal = shippingMethodRaw === "retiro_local"
```

- [ ] **Step 5: Renderizar botón de WhatsApp de coordinación de retiro**

Modify `src/app/(cliente)/checkout/paso-3/page.tsx` en la vista de éxito (return final). Cambiar el título/subtítulo y agregar el botón.

En el encabezado (línea 212-227), cambiar el mensaje para retiro:

```tsx
          <h1 className="font-display text-2xl text-text-strong">
            {isFromMP ? "¡Pago confirmado!" : isRetiroLocal ? "¡Pedido registrado!" : isTransfer ? "¡Pedido registrado!" : "¡Pedido confirmado!"}
          </h1>
          <p className="text-text-muted text-sm mt-1">
            Orden <span className="font-mono font-semibold text-text-strong">#{orderNumber}</span>
          </p>
          {isRetiroLocal ? (
            <p className="text-text-muted text-sm mt-1">
              Coordiná tu cita previa por WhatsApp para retirar en el local
            </p>
          ) : isTransfer ? (
            <p className="text-text-muted text-sm mt-1">
              Para continuar con tu pedido, escribinos por WhatsApp
            </p>
          ) : email && (
            <p className="text-text-muted text-sm mt-1">
              Te enviamos los detalles a <strong>{email}</strong>
            </p>
          )}
```

Tras el bloque `{isTransfer && (...)}` (líneas 229-238), agregar el botón de retiro:

```tsx
        {isRetiroLocal && (
          <a href={buildRetiroWhatsAppUrl(orderNumber)}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full h-13 flex items-center justify-center gap-2
              bg-[#25D366] hover:bg-[#20bd5a] text-white
              font-semibold rounded-lg transition-colors">
            Coordinar retiro por WhatsApp
          </a>
        )}
```

- [ ] **Step 6: Verificar y prueba manual**

Run: `npm run lint && npm run build`
Expected: compila sin errores.

Prueba manual end-to-end: carrito con productos `retiro_local=true` → paso-1 elegir "Retiro en local" → paso-2 aparece "Pago en efectivo" (y también MP/transferencia) → elegir efectivo → paso-3 muestra "¡Pedido registrado!" + botón "Coordinar retiro por WhatsApp". Verificar que el pedido se creó con `metodo_envio = 'retiro_local'` y `costo_envio = 0`.

- [ ] **Step 7: Commitear**

```bash
git add "src/app/(cliente)/checkout/paso-2/page.tsx" "src/app/(cliente)/checkout/paso-3/page.tsx" src/app/api/checkout/crear-pedido/route.ts src/app/api/mercadopago/crear-preferencia/route.ts
git commit -m "feat(checkout): pago en efectivo y coordinación de retiro por WhatsApp"
```

---

## Notas de verificación final

Tras completar todas las tareas:
- Run: `npm run lint && npm run build` — todo verde.
- Recorrido manual de los tres flujos:
  1. Compra MP aprobada → llega mail de pago confirmado (una sola vez).
  2. Admin marca "Enviar" en pedido Correo Argentino → carga seguimiento → cliente recibe mail y ve "Enviado por Correo Argentino" + seguimiento en Mis compras.
  3. Compra retiro en local + efectivo → confirmación con botón WhatsApp para coordinar cita previa.

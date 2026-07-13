# Envío Configurable con Métodos de Envío — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Agregar selección de método de envío en el checkout del cliente y permitir que la admin configure los precios de envío desde el panel de administración.

**Architecture:** Nueva tabla `configuracion_envio` en Supabase, nueva página admin `/admin/envio`, endpoint `GET /api/configuracion-envio`, selector de método de envío en checkout paso-1, banner de envío gratis en layout cliente, y actualización de las APIs de checkout para usar la nueva lógica de precios.

**Tech Stack:** Next.js 15 App Router, Supabase, Zustand, TypeScript, MercadoPago SDK

## Global Constraints

- Seguir patrones existentes del código (estilos CSS con clases de Tailwind del design system, estructura de admin pages, uso de `createAdminClient()` para queries server-side)
- Métodos de envío: `correo_sucursal`, `correo_domicilio`, `arreglar_vendedor`
- Defaults: sucursal=$3500, domicilio=$6500, free_threshold=$60000, domicilio_surcharge=$3000
- Lógica de precios: si subtotal >= free_threshold → sucursal=$0, domicilio=domicilio_surcharge; si no → precios completos; arreglar_vendedor=$0 siempre
- Las APIs deben validar que el costo_envio recibido coincida con la lógica (anti-tampering)
- Pedidos existentes sin metodo_envio deben manejarse gracefulmente en admin

---

### Task 1: Migración SQL

**Files:**
- Create: `supabase/migration-envio.sql`

**Interfaces:**
- Produces: tabla `configuracion_envio` y columnas `metodo_envio`, `costo_envio` en `pedidos`

- [ ] **Step 1: Escribir la migración SQL**

```sql
-- Migration: shipping configuration support
-- Run: psql o copiar-pegar en Supabase SQL Editor

BEGIN;

-- 1. Config table (single row)
CREATE TABLE IF NOT EXISTS configuracion_envio (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  sucursal_price INT NOT NULL DEFAULT 3500,
  domicilio_price INT NOT NULL DEFAULT 6500,
  free_threshold INT NOT NULL DEFAULT 60000,
  domicilio_surcharge INT NOT NULL DEFAULT 3000,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default row if not exists
INSERT INTO configuracion_envio (id, sucursal_price, domicilio_price, free_threshold, domicilio_surcharge)
VALUES (1, 3500, 6500, 60000, 3000)
ON CONFLICT (id) DO NOTHING;

-- 2. Add columns to pedidos
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS metodo_envio TEXT;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS costo_envio INT DEFAULT 0;

COMMIT;
```

- [ ] **Step 2: Ejecutar migración en Supabase SQL Editor**

Ir a https://supabase.com/dashboard → SQL Editor y ejecutar el contenido de `supabase/migration-envio.sql`.

Verificar que:
- Existe la tabla `configuracion_envio` con 1 fila y los defaults
- La tabla `pedidos` tiene las columnas `metodo_envio` y `costo_envio`

- [ ] **Step 3: Commit**

```bash
git add supabase/migration-envio.sql
git commit -m "db: agregar configuracion_envio y columnas metodo_envio/costo_envio en pedidos"
```

---

### Task 2: Tipos y Store de Admin

**Files:**
- Modify: `src/lib/types.ts:69`
- Modify: `src/store/useAdminStore.ts:28-29,45,65,67-70`

**Interfaces:**
- Consumes: nada
- Produces: `ShippingConfig` type, `AdminOrder.metodo_envio` y `costo_envio`, `useAdminStore.shippingConfig`, `loadShippingConfig()`, `updateShippingConfig()`

- [ ] **Step 1: Agregar tipo ShippingConfig en types.ts**

```typescript
// Al final de src/lib/types.ts, después de Filters:
export type ShippingMethod = 'correo_sucursal' | 'correo_domicilio' | 'arreglar_vendedor'

export interface ShippingConfig {
  sucursal_price: number
  domicilio_price: number
  free_threshold: number
  domicilio_surcharge: number
}
```

Abrir `src/lib/types.ts`, ir al final del archivo, y agregar esas líneas.

- [ ] **Step 2: Agregar metodo_envio y costo_envio a AdminOrder**

En `src/store/useAdminStore.ts:23-27`, cambiar la línea de AdminOrder:

```typescript
export interface AdminOrder {
  id: string; producto_titulo: string; producto_imagen?: string; precio: number
  comprador_nombre?: string; comprador_email?: string; vendedor_nombre?: string; vendedor_email?: string
  talle?: string; direccion?: string; status: OrderStatus; created_at?: string
  metodo_envio?: string; costo_envio?: number
}
```

- [ ] **Step 3: Agregar shippingConfig al AdminState y sus acciones**

En `src/store/useAdminStore.ts`, en la interface `AdminState` (línea ~41), después de `terms: string` agregar:

```typescript
  shippingConfig: ShippingConfig | null
  loadShippingConfig: () => Promise<void>
  updateShippingConfig: (config: ShippingConfig) => Promise<void>
```

Importar `ShippingConfig` al inicio del archivo. Cambiar:
```typescript
import type { Variante, ProductType } from "@/lib/types"
```
Por:
```typescript
import type { Variante, ProductType, ShippingConfig } from "@/lib/types"
```

- [ ] **Step 4: Implementar las acciones en el create**

En el objeto de `create<AdminState>`, en el estado inicial (línea ~68), después de `terms: "", loaded: false`, agregar:

```typescript
  shippingConfig: null,
```

Y después del último método (`updateTerms` en ~268), agregar:

```typescript
  loadShippingConfig: async () => {
    const { data } = await supabase.from("configuracion_envio").select("*").single()
    if (data) set({ shippingConfig: data as ShippingConfig })
  },
  updateShippingConfig: async (config) => {
    await supabase.from("configuracion_envio").upsert({ id: 1, ...config, updated_at: new Date().toISOString() })
    set({ shippingConfig: config })
  },
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/types.ts src/store/useAdminStore.ts
git commit -m "feat: agregar tipos y store para configuracion de envio"
```

---

### Task 3: Endpoint GET /api/configuracion-envio

**Files:**
- Create: `src/app/api/configuracion-envio/route.ts`

**Interfaces:**
- Produces: `GET /api/configuracion-envio` devuelve `{ sucursal_price, domicilio_price, free_threshold, domicilio_surcharge }`

- [ ] **Step 1: Crear el archivo y la carpeta**

```bash
mkdir -p src/app/api/configuracion-envio
```

- [ ] **Step 2: Escribir la ruta**

```typescript
import { createAdminClient } from "@/lib/supabase-admin"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = createAdminClient()
  const { data, error } = await supabase.from("configuracion_envio").select("*").single()

  if (error || !data) {
    return NextResponse.json({ error: "Configuración no encontrada" }, { status: 500 })
  }

  return NextResponse.json({
    sucursal_price: data.sucursal_price,
    domicilio_price: data.domicilio_price,
    free_threshold: data.free_threshold,
    domicilio_surcharge: data.domicilio_surcharge,
  })
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/configuracion-envio/route.ts
git commit -m "feat: endpoint GET /api/configuracion-envio"
```

---

### Task 4: Página admin /admin/envio

**Files:**
- Create: `src/app/(admin)/admin/envio/page.tsx`

**Interfaces:**
- Consumes: `useAdminStore.shippingConfig`, `loadShippingConfig()`, `updateShippingConfig()`
- Produce: página de configuración de envío accesible desde sidebar

- [ ] **Step 1: Crear la carpeta y el archivo**

```bash
mkdir -p "src/app/(admin)/admin/envio"
```

- [ ] **Step 2: Escribir la página**

```typescript
"use client"
import { useEffect, useState } from "react"
import { useAdminStore } from "@/store/useAdminStore"
import type { ShippingConfig } from "@/lib/types"

export default function EnvioPage() {
  const { shippingConfig, loadShippingConfig, updateShippingConfig } = useAdminStore()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState<ShippingConfig>({
    sucursal_price: 3500,
    domicilio_price: 6500,
    free_threshold: 60000,
    domicilio_surcharge: 3000,
  })

  useEffect(() => { loadShippingConfig() }, [])

  useEffect(() => {
    if (shippingConfig) setForm(shippingConfig)
  }, [shippingConfig])

  const set = (key: keyof ShippingConfig) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, [key]: Number(e.target.value) || 0 }))
    setSaved(false)
  }

  const handleSave = async () => {
    setSaving(true)
    await updateShippingConfig(form)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (!shippingConfig) return <div className="p-5 lg:pt-7 text-sm text-text-muted">Cargando...</div>

  const inputClass = "w-full h-12 rounded-lg border border-border-default px-4 text-sm text-text-strong placeholder:text-text-subtle bg-surface-card focus:outline-none focus:border-brand transition-colors"

  return (
    <div className="p-5 lg:p-7 lg:pt-7 space-y-5 max-w-lg">
      <div>
        <h1 className="font-display text-2xl text-text-strong">Configuración de envío</h1>
        <p className="text-sm text-text-muted mt-1">Precios y umbrales para los métodos de envío</p>
      </div>

      <div className="bg-surface-card rounded-xl border border-border-subtle p-5 space-y-4">
        <div className="space-y-1">
          <label className="block text-sm font-semibold text-text-strong">Precio envío a sucursal</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">$</span>
            <input type="number" value={form.sucursal_price} onChange={set("sucursal_price")} className={`${inputClass} pl-8`} />
          </div>
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-semibold text-text-strong">Precio envío a domicilio</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">$</span>
            <input type="number" value={form.domicilio_price} onChange={set("domicilio_price")} className={`${inputClass} pl-8`} />
          </div>
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-semibold text-text-strong">Monto mínimo para envío gratis</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">$</span>
            <input type="number" value={form.free_threshold} onChange={set("free_threshold")} className={`${inputClass} pl-8`} />
          </div>
          <p className="text-xs text-text-muted">Pedidos por este monto o más tienen envío gratis a sucursal</p>
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-semibold text-text-strong">Diferencia a domicilio (envío gratis)</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">$</span>
            <input type="number" value={form.domicilio_surcharge} onChange={set("domicilio_surcharge")} className={`${inputClass} pl-8`} />
          </div>
          <p className="text-xs text-text-muted">Cuando aplica envío gratis, el comprador paga solo esta diferencia si elige domicilio</p>
        </div>
      </div>

      <button onClick={handleSave} disabled={saving}
        className={`w-full h-13 font-semibold rounded-lg transition-colors ${saved ? "bg-success-500 text-white" : "bg-brand hover:bg-brand-hover text-text-on-brand"}`}>
        {saving ? "Guardando..." : saved ? "Guardado" : "Guardar cambios"}
      </button>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add "src/app/(admin)/admin/envio/page.tsx"
git commit -m "feat: pagina admin de configuracion de envio"
```

---

### Task 5: Agregar Envío al sidebar admin

**Files:**
- Modify: `src/app/(admin)/sidebar.tsx:5,8,20-26`

**Interfaces:**
- Consume: nada nuevo (usa `Truck` icon de lucide-react)

- [ ] **Step 1: Agregar Truck a los imports y NAV entry**

En `src/app/(admin)/sidebar.tsx:5`, cambiar:
```typescript
import { LayoutDashboard, ShieldCheck, Users, Store, Package, ShoppingBag, Tags, HelpCircle, UserPlus, Menu, X, LogOut, MoreHorizontal } from "lucide-react"
```
Agregar `Truck`:
```typescript
import { LayoutDashboard, ShieldCheck, Users, Store, Package, ShoppingBag, Tags, HelpCircle, UserPlus, Menu, X, LogOut, MoreHorizontal, Truck } from "lucide-react"
```

Agregar entry en el array NAV (antes de FAQ, después de Pedidos):
```typescript
  { href: "/admin/envio", label: "Envío", icon: Truck },
```

Agregar entry en MOBILE_TABS (después de Pedidos):
```typescript
  { href: "/admin/envio", label: "Envío", icon: Truck },
```

- [ ] **Step 2: Commit**

```bash
git add "src/app/(admin)/sidebar.tsx"
git commit -m "feat: agregar entry de Envio en sidebar admin"
```

---

### Task 6: Modificar admin/pedidos para mostrar método y costo de envío

**Files:**
- Modify: `src/app/(admin)/admin/pedidos/page.tsx:51`

**Interfaces:**
- Consume: `AdminOrder.metodo_envio`, `AdminOrder.costo_envio`

- [ ] **Step 1: Agregar label de método de envío y costo en sección expandida**

En `src/app/(admin)/admin/pedidos/page.tsx:6`, agregar el mapeo de labels:
```typescript
const METODO_LABEL: Record<string, string> = {
  correo_sucursal: "Correo Argentino (sucursal)",
  correo_domicilio: "Correo Argentino (domicilio)",
  arreglar_vendedor: "Arreglar con el vendedor",
}
```

En la línea 51 (el bloque expandido `isOpen &&`), agregar métricas de envío después de la línea de Mail:
```typescript
{isOpen && <div className="mt-4 pt-4 border-t border-border-subtle space-y-2"><div className="flex items-center gap-2 text-xs text-text-muted"><MapPin className="w-3.5 h-3.5" />{o.direccion}</div>{o.metodo_envio && <div className="flex items-center gap-2 text-xs text-text-muted"><Truck className="w-3.5 h-3.5" />{METODO_LABEL[o.metodo_envio] || o.metodo_envio}{o.costo_envio != null && <span className="ml-1 font-semibold text-price">· ${o.costo_envio.toLocaleString("es-AR")}</span>}</div>}<div className="flex items-center gap-2 text-xs text-text-muted"><Mail className="w-3.5 h-3.5" />Comprador: {o.comprador_email} · Vendedor: {o.vendedor_email}</div></div>}
```

- [ ] **Step 2: Commit**

```bash
git add "src/app/(admin)/admin/pedidos/page.tsx"
git commit -m "feat: mostrar metodo y costo de envio en admin/pedidos"
```

---

### Task 7: Store del shop — agregar shipping state

**Files:**
- Modify: `src/store/useShopStore.ts:37-53`

**Interfaces:**
- Produce: `shippingMethod`, `shippingCost`, `setShipping()` en `useShopStore`

- [ ] **Step 1: Agregar shipping al interface y al create**

En la interface `ShopStore` (después de `cartTotal()`), agregar:
```typescript
  shippingMethod: string | null
  shippingCost: number
  setShipping: (method: string, cost: number) => void
```

En el estado inicial de `create` (después de `cart: [],`), agregar:
```typescript
  shippingMethod: null,
  shippingCost: 0,
```

Después del método `clearCart`, agregar:
```typescript
  setShipping: (method, cost) => set({ shippingMethod: method, shippingCost: cost }),
```

- [ ] **Step 2: Commit**

```bash
git add src/store/useShopStore.ts
git commit -m "feat: agregar shipping state en useShopStore"
```

---

### Task 8: Checkout paso-1 — agregar selector de método de envío

**Files:**
- Modify: `src/app/(cliente)/checkout/paso-1/page.tsx:1-129`

**Interfaces:**
- Consumes: `GET /api/configuracion-envio`, `useShopStore.cartTotal`, `useShopStore.setShipping`
- Produces: guarda `metodo_envio` y `costo_envio` en sessionStorage

- [ ] **Step 1: Reescribir el componente completo**

Borrar todo el contenido de `src/app/(cliente)/checkout/paso-1/page.tsx` y reemplazar con:

```typescript
"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { CheckoutStepper } from "@/components/CheckoutStepper"
import { useShopStore } from "@/store/useShopStore"
import type { ShippingConfig, ShippingMethod } from "@/lib/types"

const PROVINCIAS = [
  'Buenos Aires','CABA','Catamarca','Chaco','Chubut','Córdoba',
  'Corrientes','Entre Ríos','Formosa','Jujuy','La Pampa','La Rioja',
  'Mendoza','Misiones','Neuquén','Río Negro','Salta','San Juan',
  'San Luis','Santa Cruz','Santa Fe','Santiago del Estero',
  'Tierra del Fuego','Tucumán',
]

const METODO_LABEL: Record<ShippingMethod, string> = {
  correo_sucursal: "Correo Argentino a sucursal",
  correo_domicilio: "Correo Argentino a domicilio",
  arreglar_vendedor: "Arreglar con el vendedor",
}

function calcShipping(method: ShippingMethod, subtotal: number, cfg: ShippingConfig): number {
  if (method === "arreglar_vendedor") return 0
  if (subtotal >= cfg.free_threshold) {
    if (method === "correo_sucursal") return 0
    if (method === "correo_domicilio") return cfg.domicilio_surcharge
  }
  if (method === "correo_sucursal") return cfg.sucursal_price
  if (method === "correo_domicilio") return cfg.domicilio_price
  return 0
}

function formatShippingLabel(method: ShippingMethod, subtotal: number, cfg: ShippingConfig): string {
  const cost = calcShipping(method, subtotal, cfg)
  if (cost === 0) return `${METODO_LABEL[method]} — Gratis`
  return `${METODO_LABEL[method]} — $${cost.toLocaleString("es-AR")}`
}

interface FormData {
  nombre: string
  email: string
  provincia: string
  ciudad: string
  cp: string
  direccion: string
}

type Errors = Partial<Record<keyof FormData, string>>

function validate(form: FormData): Errors {
  const e: Errors = {}
  if (!form.nombre.trim()) e.nombre = 'Requerido'
  if (!form.email.trim() || !form.email.includes('@')) e.email = 'Email inválido'
  if (!form.provincia) e.provincia = 'Requerido'
  if (!form.ciudad.trim()) e.ciudad = 'Requerido'
  if (!form.cp.trim()) e.cp = 'Requerido'
  if (!form.direccion.trim()) e.direccion = 'Requerido'
  return e
}

export default function CheckoutPaso1() {
  const router = useRouter()
  const subtotal = useShopStore(s => s.cartTotal())
  const setShipping = useShopStore(s => s.setShipping)

  const [form, setForm] = useState<FormData>({
    nombre: '', email: '', provincia: '', ciudad: '', cp: '', direccion: '',
  })
  const [errors, setErrors] = useState<Errors>({})
  const [shippingMethod, setShippingMethod] = useState<ShippingMethod | "">("")
  const [shipError, setShipError] = useState(false)
  const [cfg, setCfg] = useState<ShippingConfig | null>(null)

  useEffect(() => {
    fetch("/api/configuracion-envio")
      .then(r => r.json())
      .then(d => { if (!d.error) setCfg(d) })
      .catch(() => {})
  }, [])

  const set = (key: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(f => ({ ...f, [key]: e.target.value }))
    setErrors(ev => ({ ...ev, [key]: undefined }))
  }

  const handleContinuar = () => {
    const e = validate(form)
    if (!shippingMethod) { setShipError(true); setErrors(e); return }
    setShipError(false)

    if (Object.keys(e).length > 0) { setErrors(e); return }

    const cost = cfg ? calcShipping(shippingMethod as ShippingMethod, subtotal, cfg) : 0

    sessionStorage.setItem('checkout_address', JSON.stringify(form))
    sessionStorage.setItem('checkout_shipping_method', shippingMethod)
    sessionStorage.setItem('checkout_shipping_cost', String(cost))

    setShipping(shippingMethod, cost)

    router.push('/checkout/paso-2')
  }

  const inputClass = (err?: string) =>
    `w-full h-12 rounded-lg border px-4 text-sm text-text-strong
    placeholder:text-text-subtle bg-surface-card
    focus:outline-none focus:border-brand transition-colors
    ${err ? 'border-error-500' : 'border-border-default'}`

  const radioClass = (selected: boolean) =>
    `w-full flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${selected ? 'border-brand bg-brand/5' : 'border-border-subtle bg-surface-card'}`

  return (
    <div className="w-full lg:max-w-lg lg:mx-auto">
      <CheckoutStepper currentStep={1} />

      <div className="px-4 lg:px-0 pb-32 lg:pb-10 space-y-6 mt-2">
        <h2 className="font-display text-xl text-text-strong">Dirección y envío</h2>

        {/* Dirección */}
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="block text-sm font-semibold text-text-strong">Nombre completo</label>
            <input value={form.nombre} onChange={set('nombre')} placeholder="Ej: María García"
              className={inputClass(errors.nombre)} />
            {errors.nombre && <p className="text-xs text-error-500">{errors.nombre}</p>}
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-semibold text-text-strong">Email</label>
            <input type="email" value={form.email} onChange={set('email')} placeholder="tu@email.com"
              className={inputClass(errors.email)} />
            {errors.email && <p className="text-xs text-error-500">{errors.email}</p>}
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-semibold text-text-strong">Provincia</label>
            <select value={form.provincia} onChange={set('provincia')}
              className={inputClass(errors.provincia)}>
              <option value="">Seleccioná una provincia</option>
              {PROVINCIAS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            {errors.provincia && <p className="text-xs text-error-500">{errors.provincia}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-text-strong">Ciudad</label>
              <input value={form.ciudad} onChange={set('ciudad')} placeholder="Ej: Rosario"
                className={inputClass(errors.ciudad)} />
              {errors.ciudad && <p className="text-xs text-error-500">{errors.ciudad}</p>}
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-text-strong">Código postal</label>
              <input value={form.cp} onChange={set('cp')} placeholder="Ej: 2000"
                className={inputClass(errors.cp)} />
              {errors.cp && <p className="text-xs text-error-500">{errors.cp}</p>}
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-semibold text-text-strong">Dirección</label>
            <input value={form.direccion} onChange={set('direccion')} placeholder="Ej: San Martín 1234"
              className={inputClass(errors.direccion)} />
            {errors.direccion && <p className="text-xs text-error-500">{errors.direccion}</p>}
          </div>
        </div>

        {/* Método de envío */}
        <div className="space-y-3">
          <h3 className="font-display text-lg text-text-strong">Método de envío</h3>
          {cfg && (
            <div className="space-y-2">
              {(["correo_sucursal", "correo_domicilio", "arreglar_vendedor"] as ShippingMethod[]).map(method => (
                <label key={method} className={radioClass(shippingMethod === method)}>
                  <input type="radio" name="shipping" value={method}
                    checked={shippingMethod === method}
                    onChange={() => { setShippingMethod(method); setShipError(false) }}
                    className="mt-0.5 accent-brand" />
                  <div>
                    <p className="text-sm font-semibold text-text-strong">{METODO_LABEL[method]}</p>
                    <p className="text-xs text-text-muted">{formatShippingLabel(method, subtotal, cfg)}</p>
                  </div>
                </label>
              ))}
            </div>
          )}
          {!cfg && <p className="text-sm text-text-muted">Cargando opciones de envío...</p>}
          {shipError && <p className="text-xs text-error-500">Seleccioná un método de envío</p>}
        </div>
      </div>

      {/* CTA */}
      <div className="fixed bottom-20 inset-x-0 mx-auto w-full max-w-107.5
        bg-bg-page border-t border-border-subtle px-4 pt-3 pb-4
        lg:static lg:bottom-auto lg:border-t-0 lg:pt-4 lg:pb-0
        lg:px-0 lg:max-w-full z-10">
        <button onClick={handleContinuar}
          className="w-full h-13 bg-brand hover:bg-brand-hover
            text-text-on-brand font-semibold rounded-lg transition-colors">
          Continuar →
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verificar que compila**

```bash
cd /home/marti/Documentos/La-percha-Showroom && npx tsc --noEmit --pretty 2>&1 | head -30
```

- [ ] **Step 3: Commit**

```bash
git add "src/app/(cliente)/checkout/paso-1/page.tsx"
git commit -m "feat: agregar selector de metodo de envio en checkout paso-1"
```

---

### Task 9: Checkout paso-2 — mostrar total con envío

**Files:**
- Modify: `src/app/(cliente)/checkout/paso-2/page.tsx:15,30-58,83-115`

**Interfaces:**
- Consumes: `useShopStore.shippingMethod`, `useShopStore.shippingCost`

- [ ] **Step 1: Modificar para incluir shipping en el total y enviar en API calls**

Abrir `src/app/(cliente)/checkout/paso-2/page.tsx` y hacer estos cambios:

Línea 15: después de leer `total`, agregar:
```typescript
  const shippingCost = useShopStore(s => s.shippingCost)
  const shippingMethod = useShopStore(s => s.shippingMethod)
  const totalConEnvio = total + shippingCost
```

Línea 36-41: en el body del fetch de mercadopago, agregar `metodo_envio` y `costo_envio`:
```typescript
          body: JSON.stringify({
            items: cart,
            direccion: address,
            email: user?.email || (address as Record<string, string>)?.email,
            payerName: user?.name || (address as Record<string, string>)?.name,
            metodo_envio: shippingMethod,
            costo_envio: shippingCost,
          }),
```

En el PaymentMethodCard de MercadoPago (línea ~83): cambiar `total` por `totalConEnvio`:
```typescript
                  Total: $ {totalConEnvio.toLocaleString("es-AR")}
```

En el PaymentMethodCard de Transferencia (línea ~112): cambiar `total` por `totalConEnvio` y mostrar shipping por separado:
Reemplazar el bloque de las líneas 108-119 (Monto + comprobante) con:
```typescript
              <div className="flex justify-between py-1 border-b border-border-subtle">
                <span className="text-text-muted">Subtotal</span>
                <span className="text-text-strong">$ {total.toLocaleString("es-AR")}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border-subtle">
                <span className="text-text-muted">Envío</span>
                <span className="text-text-strong">{shippingCost === 0 ? "Gratis" : `$ ${shippingCost.toLocaleString("es-AR")}`}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-text-muted font-semibold">Monto</span>
                <span className="font-bold text-price">$ {totalConEnvio.toLocaleString("es-AR")}</span>
              </div>
              <p className="text-xs text-text-muted bg-warning-50 rounded-lg p-2.5 mt-1">
                Envianos el comprobante a <strong>sil31227@gmail.com</strong> con el número de orden
              </p>
```

- [ ] **Step 2: Commit**

```bash
git add "src/app/(cliente)/checkout/paso-2/page.tsx"
git commit -m "feat: mostrar total con envio en checkout paso-2"
```

---

### Task 10: Checkout paso-3 — mostrar shipping en resumen

**Files:**
- Modify: `src/app/(cliente)/checkout/paso-3/page.tsx:87-95,227-232`

**Interfaces:**
- Consumes: sessionStorage `checkout_shipping_method`, `checkout_shipping_cost`

- [ ] **Step 1: Leer shipping de sessionStorage y enviarlo a la API**

En `src/app/(cliente)/checkout/paso-3/page.tsx`, en el bloque del fetch a `/api/checkout/crear-pedido` (líneas 76-96), después de leer `paymentMethod`:

```typescript
      let shippingMethod = ""
      let shippingCost = 0
      try {
        shippingMethod = sessionStorage.getItem("checkout_shipping_method") || ""
        shippingCost = Number(sessionStorage.getItem("checkout_shipping_cost")) || 0
      } catch {}
```

Y en el body del fetch (línea ~90), agregar:
```typescript
        metodo_envio: shippingMethod,
        costo_envio: shippingCost,
```

- [ ] **Step 2: Mostrar shipping en el resumen de la orden**

En la sección de resumen de la orden (bloque success, líneas 224-233), después del total, agregar el desglose:

Cambiar el bloque de total actual por:
```typescript
            <div className="px-4 py-3 border-t border-border-subtle space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Subtotal</span>
                <span className="text-text-strong">$ {getSubtotal().toLocaleString("es-AR")}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Envío</span>
                <span className="text-text-strong">{getShippingCost() === 0 ? "Gratis" : `$ ${getShippingCost().toLocaleString("es-AR")}`}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-border-subtle">
                <span className="font-semibold text-text-strong">Total</span>
                <span className="font-bold text-price">
                  $ {(getSubtotal() + getShippingCost()).toLocaleString("es-AR")}
                </span>
              </div>
            </div>
```

Pero necesito definir las helpers. Voy a agregarlas como funciones dentro del componente. Agregar dentro de `Paso3Content`, antes del return "loading":

```typescript
  const getSubtotal = () => items.reduce((s, i) => s + i.price, 0)
  const getShippingCost = () => {
    try {
      return Number(sessionStorage.getItem("checkout_shipping_cost")) || 0
    } catch { return 0 }
  }
  const getTotal = () => getSubtotal() + getShippingCost()
```

Y reemplazar las referencias a `orderTotal` con cálculos dinámicos donde se muestre el total.

También en el bloque de loading de items desde el carrito (línea 39), guardar el costo de envío:
```typescript
          const shipCost = Number(sessionStorage.getItem("checkout_shipping_cost")) || 0
          setShippingCostDisplay(shipCost)
```

Agregar el state:
```typescript
  const [shippingCostDisplay, setShippingCostDisplay] = useState(0)
```

Hmm, esto se está volviendo muy complejo para expresar en cambios puntuales. Voy a reescribir el archivo completo para paso-3.

- [ ] **Step 1 alternativo: Reescribir paso-3 completo**

Reemplazar todo el contenido de `src/app/(cliente)/checkout/paso-3/page.tsx`:

```typescript
"use client"
import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { CheckCircle, Loader2, AlertCircle, Clock } from "lucide-react"
import { useShopStore } from "@/store/useShopStore"
import { CheckoutStepper } from "@/components/CheckoutStepper"

interface CartItem {
  productId: string
  title: string
  price: number
  image: string
  size: string
  store_type: string
}

function Paso3Content() {
  const searchParams = useSearchParams()
  const cart = useShopStore(s => s.cart)
  const total = useShopStore(s => s.cartTotal())
  const clearCart = useShopStore(s => s.clearCart)
  const [orderNumber, setOrderNumber] = useState("")
  const [email, setEmail] = useState("")
  const [items, setItems] = useState<CartItem[]>([])
  const [shippingCost, setShippingCost] = useState(0)
  const [shippingMethodLabel, setShippingMethodLabel] = useState("")
  const [status, setStatus] = useState<"loading" | "success" | "pending" | "error">("loading")
  const [errorMsg, setErrorMsg] = useState("")

  const METODO_LABEL: Record<string, string> = {
    correo_sucursal: "Correo Argentino (sucursal)",
    correo_domicilio: "Correo Argentino (domicilio)",
    arreglar_vendedor: "Arreglar con el vendedor",
  }

  const mpStatus = searchParams.get("status")
  const mpOrderId = searchParams.get("order_id")
  const isFromMP = !!mpStatus

  useEffect(() => {
    const shipMethod = sessionStorage.getItem("checkout_shipping_method") || ""
    const shipCost = Number(sessionStorage.getItem("checkout_shipping_cost")) || 0
    setShippingCost(shipCost)
    setShippingMethodLabel(METODO_LABEL[shipMethod] || shipMethod)

    if (isFromMP) {
      if (mpStatus === "approved" || mpStatus === "pending") {
        setItems([...cart])
        setOrderNumber(mpOrderId || "")
        setStatus(mpStatus as "success" | "pending")
        try {
          const addrRaw = sessionStorage.getItem("checkout_address")
          if (addrRaw) setEmail(JSON.parse(addrRaw).email || "")
        } catch {}
        clearCart()
        ;["checkout_order_id", "checkout_address", "checkout_payment", "checkout_shipping_method", "checkout_shipping_cost"].forEach(k => sessionStorage.removeItem(k))
        return
      }

      if (mpStatus === "rejected") {
        setStatus("error")
        setErrorMsg("El pago fue rechazado. Intentá con otro método.")
        return
      }
    }

    const capturedItems = [...cart]
    setItems(capturedItems)

    let checkoutEmail = ""
    let address: unknown = null
    let paymentMethod = ""
    let shippingMethod = ""
    let shippingCost = 0

    try {
      const addrRaw = sessionStorage.getItem("checkout_address")
      if (addrRaw) {
        address = JSON.parse(addrRaw)
        checkoutEmail = (address as Record<string, string>).email || ""
      }
      paymentMethod = sessionStorage.getItem("checkout_payment") || ""
      shippingMethod = sessionStorage.getItem("checkout_shipping_method") || ""
      shippingCost = Number(sessionStorage.getItem("checkout_shipping_cost")) || 0
    } catch {}

    setEmail(checkoutEmail)
    setShippingCost(shippingCost)
    setShippingMethodLabel(METODO_LABEL[shippingMethod] || shippingMethod)

    fetch("/api/checkout/crear-pedido", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: capturedItems,
        direccion: address,
        email: checkoutEmail,
        paymentMethod,
        metodo_envio: shippingMethod,
        costo_envio: shippingCost,
      }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.ok) {
          setOrderNumber(data.orderId)
          setStatus("success")
          clearCart()
          ;["checkout_address", "checkout_payment", "checkout_shipping_method", "checkout_shipping_cost"].forEach(k => sessionStorage.removeItem(k))
        } else {
          setStatus("error")
          setErrorMsg(data.error || "Error al crear el pedido")
        }
      })
      .catch(() => {
        setStatus("error")
        setErrorMsg("Error de conexión. Intentá de nuevo.")
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const orderTotal = items.reduce((s, i) => s + i.price, 0) + (status === "loading" ? 0 : shippingCost)

  if (status === "loading") {
    return (
      <div className="w-full lg:max-w-lg lg:mx-auto">
        <CheckoutStepper currentStep={3} />
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <Loader2 className="w-10 h-10 text-brand animate-spin" />
          <p className="text-text-muted text-sm">
            {isFromMP ? "Verificando tu pago..." : "Creando tu pedido..."}
          </p>
        </div>
      </div>
    )
  }

  if (status === "error") {
    return (
      <div className="w-full lg:max-w-lg lg:mx-auto">
        <CheckoutStepper currentStep={3} />
        <div className="px-4 lg:px-0 py-8 flex flex-col items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-error-50 flex items-center justify-center">
            <AlertCircle className="w-10 h-10 text-error-500" />
          </div>
          <div className="text-center">
            <h1 className="font-display text-2xl text-text-strong">Algo salió mal</h1>
            <p className="text-text-muted text-sm mt-1">{errorMsg}</p>
          </div>
          <Link href="/checkout/paso-2"
            className="w-full max-w-xs h-13 flex items-center justify-center
              bg-brand hover:bg-brand-hover text-text-on-brand
              font-semibold rounded-lg transition-colors">
            Intentar de nuevo
          </Link>
        </div>
      </div>
    )
  }

  if (status === "pending") {
    return (
      <div className="w-full lg:max-w-lg lg:mx-auto">
        <CheckoutStepper currentStep={3} />
        <div className="px-4 lg:px-0 py-8 flex flex-col items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-warning-50 flex items-center justify-center">
            <Clock className="w-10 h-10 text-warning-500" />
          </div>
          <div className="text-center">
            <h1 className="font-display text-2xl text-text-strong">Pago en proceso</h1>
            <p className="text-text-muted text-sm mt-1">
              Tu pago está siendo procesado. Te avisaremos cuando se confirme.
            </p>
            {orderNumber && (
              <p className="text-text-muted text-sm mt-1">
                Orden <span className="font-mono font-semibold text-text-strong">#{orderNumber}</span>
              </p>
            )}
          </div>
          <Link href="/home"
            className="w-full h-13 flex items-center justify-center
              bg-brand hover:bg-brand-hover text-text-on-brand
              font-semibold rounded-lg transition-colors">
            Volver al inicio
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full lg:max-w-lg lg:mx-auto">
      <CheckoutStepper currentStep={3} />

      <div className="px-4 lg:px-0 py-8 flex flex-col items-center gap-6">
        <div className="w-20 h-20 rounded-full bg-success-50 flex items-center justify-center">
          <CheckCircle className="w-10 h-10 text-success-500" />
        </div>

        <div className="text-center">
          <h1 className="font-display text-2xl text-text-strong">
            {isFromMP ? "¡Pago confirmado!" : "¡Pedido confirmado!"}
          </h1>
          <p className="text-text-muted text-sm mt-1">
            Orden <span className="font-mono font-semibold text-text-strong">#{orderNumber}</span>
          </p>
          {email && (
            <p className="text-text-muted text-sm mt-1">
              Te enviamos los detalles a <strong>{email}</strong>
            </p>
          )}
        </div>

        {items.length > 0 && (
          <div className="w-full bg-surface-card rounded-xl border border-border-subtle overflow-hidden">
            <div className="px-4 py-3 border-b border-border-subtle">
              <p className="text-sm font-semibold text-text-strong">Tu pedido</p>
            </div>
            <div className="divide-y divide-border-subtle">
              {items.map(item => (
                <div key={item.productId} className="flex items-center gap-3 px-4 py-3">
                  <img src={item.image} alt={item.title}
                    className="w-12 h-12 rounded-md object-cover bg-surface-sunken shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text-strong truncate">{item.title}</p>
                    <p className="text-xs text-text-muted">Talle {item.size}</p>
                  </div>
                  <p className="text-sm font-bold text-price shrink-0">
                    $ {item.price.toLocaleString("es-AR")}
                  </p>
                </div>
              ))}
            </div>
            <div className="px-4 py-3 border-t border-border-subtle space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Subtotal</span>
                <span className="text-text-strong">$ {items.reduce((s, i) => s + i.price, 0).toLocaleString("es-AR")}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Envío {shippingMethodLabel && <span className="text-xs">({shippingMethodLabel})</span>}</span>
                <span className="text-text-strong">{shippingCost === 0 ? "Gratis" : `$ ${shippingCost.toLocaleString("es-AR")}`}</span>
              </div>
              <div className="flex justify-between pt-1.5 border-t border-border-subtle">
                <span className="font-semibold text-text-strong">Total</span>
                <span className="font-bold text-price">
                  $ {orderTotal.toLocaleString("es-AR")}
                </span>
              </div>
            </div>
          </div>
        )}

        <Link href="/home"
          className="w-full h-13 flex items-center justify-center
            bg-brand hover:bg-brand-hover text-text-on-brand
            font-semibold rounded-lg transition-colors">
          Seguir comprando
        </Link>
      </div>
    </div>
  )
}

export default function CheckoutPaso3() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-brand animate-spin" />
      </div>
    }>
      <Paso3Content />
    </Suspense>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add "src/app/(cliente)/checkout/paso-3/page.tsx"
git commit -m "feat: mostrar metodo y costo de envio en checkout paso-3"
```

---

### Task 11: Modificar API crear-pedido

**Files:**
- Modify: `src/app/api/checkout/crear-pedido/route.ts:17,55-83`

**Interfaces:**
- Consumes: body con `metodo_envio` y `costo_envio`
- Produce: inserta `metodo_envio` y `costo_envio` en pedidos

- [ ] **Step 1: Reescribir crear-pedido con validación de shipping**

Reemplazar el contenido de `src/app/api/checkout/crear-pedido/route.ts`:

```typescript
import { createAdminClient } from "@/lib/supabase-admin"
import { NextResponse } from "next/server"

interface CheckoutItem {
  productId: string
  title: string
  price: number
  image: string
  size: string
  store_type: string
}

function calcularCostoEnvio(
  metodo: string,
  subtotal: number,
  cfg: { sucursal_price: number; domicilio_price: number; free_threshold: number; domicilio_surcharge: number }
): number {
  if (metodo === "arreglar_vendedor") return 0
  if (subtotal >= cfg.free_threshold) {
    if (metodo === "correo_sucursal") return 0
    if (metodo === "correo_domicilio") return cfg.domicilio_surcharge
  }
  if (metodo === "correo_sucursal") return cfg.sucursal_price
  if (metodo === "correo_domicilio") return cfg.domicilio_price
  return 0
}

export async function POST(req: Request) {
  const supabase = createAdminClient()

  try {
    const body: {
      items: CheckoutItem[]
      direccion: unknown
      email?: string
      paymentMethod?: string
      metodo_envio?: string
      costo_envio?: number
    } = await req.json()
    const { items, direccion, email, paymentMethod, metodo_envio, costo_envio } = body

    if (!items?.length) {
      return NextResponse.json({ error: "El carrito está vacío" }, { status: 400 })
    }

    const ids = items.map(i => i.productId)

    const { data: products, error: productError } = await supabase
      .from("productos")
      .select("id, titulo, precio, imagenes, vendedor_nombre, vendedor_tipo, status")
      .in("id", ids)

    if (productError || !products) {
      return NextResponse.json({ error: "Error al validar productos" }, { status: 500 })
    }

    if (products.length !== ids.length) {
      return NextResponse.json({ error: "Uno o más productos no existen" }, { status: 400 })
    }

    const productMap = new Map(products.map(p => [p.id, p]))

    const validItems = items.map(item => {
      const prod = productMap.get(item.productId)!
      return {
        ...item,
        title: prod.titulo,
        price: Number(prod.precio),
        image: (prod.imagenes as string[])?.[0] || item.image,
        vendedor_nombre: prod.vendedor_nombre,
        vendedor_tipo: prod.vendedor_tipo,
      }
    })

    const subtotal = validItems.reduce((sum, i) => sum + i.price, 0)

    // Validar costo de envío contra configuración
    const { data: cfgData } = await supabase.from("configuracion_envio").select("*").single()
    const metodo = metodo_envio || "arreglar_vendedor"
    let shipping = 0

    if (cfgData) {
      shipping = calcularCostoEnvio(metodo, subtotal, cfgData)
      if (costo_envio !== undefined && costo_envio !== shipping) {
        return NextResponse.json({ error: "El costo de envío no coincide con la configuración actual" }, { status: 400 })
      }
    } else if (costo_envio !== undefined) {
      shipping = costo_envio
    }

    const orderId = `LP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
    const now = new Date().toISOString()

    for (const item of validItems) {
      await supabase.from("pedidos").insert({
        id: `${orderId}-${item.productId.slice(-4)}`,
        producto_titulo: item.title,
        producto_imagen: item.image,
        precio: item.price,
        comprador_nombre: email || "Comprador",
        comprador_email: email || "",
        vendedor_nombre: item.vendedor_nombre,
        vendedor_email: "",
        talle: item.size,
        direccion: typeof direccion === "object" ? JSON.stringify(direccion) : String(direccion || ""),
        status: "pending_shipment",
        metodo_envio: metodo,
        costo_envio: shipping,
        created_at: now,
      })
    }

    return NextResponse.json({
      ok: true,
      orderId,
      total: subtotal + shipping,
      subtotal,
      shipping,
      metodo_envio: metodo,
      paymentMethod: paymentMethod || "mercadopago",
    })
  } catch (err) {
    console.error("Error creando pedido:", err)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/checkout/crear-pedido/route.ts
git commit -m "feat: validar y persistir metodo/costo de envio en crear-pedido"
```

---

### Task 12: Modificar API crear-preferencia (MercadoPago)

**Files:**
- Modify: `src/app/api/mercadopago/crear-preferencia/route.ts:27-34,127-175`

**Interfaces:**
- Consumes: body con `metodo_envio` y `costo_envio`
- Produce: inserta `metodo_envio` y `costo_envio` en pedidos, pasa `shipments.cost` real a MP

- [ ] **Step 1: Reescribir crear-preferencia con shipping real**

Reemplazar el contenido de `src/app/api/mercadopago/crear-preferencia/route.ts`:

```typescript
import { NextResponse } from "next/server"
import { MercadoPagoConfig, Preference } from "mercadopago"
import { createAdminClient } from "@/lib/supabase-admin"

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"

interface CheckoutItem {
  productId: string
  title: string
  price: number
  image: string
  size: string
  store_type: string
  variantLabel?: string
  variantPrice?: number
  variantAttributes?: Record<string, string>
}

function calcularCostoEnvio(
  metodo: string,
  subtotal: number,
  cfg: { sucursal_price: number; domicilio_price: number; free_threshold: number; domicilio_surcharge: number }
): number {
  if (metodo === "arreglar_vendedor") return 0
  if (subtotal >= cfg.free_threshold) {
    if (metodo === "correo_sucursal") return 0
    if (metodo === "correo_domicilio") return cfg.domicilio_surcharge
  }
  if (metodo === "correo_sucursal") return cfg.sucursal_price
  if (metodo === "correo_domicilio") return cfg.domicilio_price
  return 0
}

export async function POST(req: Request) {
  const supabase = createAdminClient()
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN

  if (!accessToken) {
    return NextResponse.json({ error: "Mercado Pago no configurado" }, { status: 500 })
  }

  try {
    const body: {
      items: CheckoutItem[]
      direccion: unknown
      email?: string
      payerName?: string
      metodo_envio?: string
      costo_envio?: number
    } = await req.json()
    const { items, direccion, email, payerName, metodo_envio, costo_envio } = body

    if (!items?.length) {
      return NextResponse.json({ error: "El carrito está vacío" }, { status: 400 })
    }

    const ids = items.map(i => i.productId)

    const { data: products, error: productError } = await supabase
      .from("productos")
      .select("id, titulo, precio, imagenes, vendedor_nombre, vendedor_tipo, status, variantes, stock")
      .in("id", ids)

    if (productError || !products) {
      return NextResponse.json({ error: "Error al validar productos" }, { status: 500 })
    }

    if (products.length !== ids.length) {
      return NextResponse.json({ error: "Uno o más productos no existen" }, { status: 400 })
    }

    const productMap = new Map(products.map(p => [p.id, p]))

    for (const item of items) {
      const prod = productMap.get(item.productId)!
      if (item.variantLabel) {
        const variantes = (prod.variantes as Array<Record<string, unknown>>) || []
        const variant = variantes.find(
          (v: Record<string, unknown>) => v.nombre === item.variantLabel
        )
        if (!variant) {
          return NextResponse.json(
            { error: `Variante "${item.variantLabel}" no encontrada para "${prod.titulo}"` },
            { status: 400 }
          )
        }
        const variantStock = Number(variant.stock)
        if (isNaN(variantStock) || variantStock < 1) {
          return NextResponse.json(
            { error: `Sin stock de "${item.variantLabel}" para "${prod.titulo}"` },
            { status: 400 }
          )
        }
      } else {
        const generalStock = Number(prod.stock)
        if (isNaN(generalStock) || generalStock < 1) {
          return NextResponse.json(
            { error: `Sin stock para "${prod.titulo}"` },
            { status: 400 }
          )
        }
      }
    }

    for (const item of items) {
      const prod = productMap.get(item.productId)!
      if (item.variantLabel) {
        const variantes = (prod.variantes as Array<Record<string, unknown>>) || []
        const variantIdx = variantes.findIndex(
          (v: Record<string, unknown>) => v.nombre === item.variantLabel
        )
        if (variantIdx !== -1) {
          const updatedVariants = [...variantes]
          const oldStock = Number(updatedVariants[variantIdx].stock)
          updatedVariants[variantIdx] = {
            ...updatedVariants[variantIdx],
            stock: Math.max(0, oldStock - 1),
          }
          await supabase
            .from("productos")
            .update({ variantes: updatedVariants })
            .eq("id", item.productId)
        }
      } else {
        const newStock = Math.max(0, Number(prod.stock) - 1)
        await supabase
          .from("productos")
          .update({ stock: newStock })
          .eq("id", item.productId)
      }
    }

    const validItems = items.map(item => {
      const prod = productMap.get(item.productId)!
      return {
        ...item,
        title: prod.titulo as string,
        price: item.variantPrice || Number(prod.precio),
        image: (prod.imagenes as string[])?.[0] || item.image,
        vendedor_nombre: prod.vendedor_nombre as string,
      }
    })

    const subtotal = validItems.reduce((sum, i) => sum + i.price, 0)

    // Validar costo de envío contra configuración
    const { data: cfgData } = await supabase.from("configuracion_envio").select("*").single()
    const metodo = metodo_envio || "arreglar_vendedor"
    let shipping = 0

    if (cfgData) {
      shipping = calcularCostoEnvio(metodo, subtotal, cfgData)
      if (costo_envio !== undefined && costo_envio !== shipping) {
        return NextResponse.json({ error: "El costo de envío no coincide con la configuración actual" }, { status: 400 })
      }
    } else if (costo_envio !== undefined) {
      shipping = costo_envio
    }

    const orderId = `LP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
    const now = new Date().toISOString()

    for (const item of validItems) {
      await supabase.from("pedidos").insert({
        id: `${orderId}-${item.productId.slice(-4)}`,
        producto_titulo: item.title,
        producto_imagen: item.image,
        precio: item.price,
        comprador_nombre: payerName || email || "Comprador",
        comprador_email: email || "",
        vendedor_nombre: item.vendedor_nombre,
        vendedor_email: "",
        talle: item.size,
        variante_label: item.variantLabel,
        variante_atributos: item.variantAttributes,
        direccion: typeof direccion === "object" ? JSON.stringify(direccion) : String(direccion || ""),
        status: "pending_shipment",
        metodo_envio: metodo,
        costo_envio: shipping,
        created_at: now,
      })
    }

    const mpClient = new MercadoPagoConfig({ accessToken })
    const preference = new Preference(mpClient)

    const result = await preference.create({
      body: {
        external_reference: orderId,
        items: validItems.map(item => ({
          id: item.productId,
          title: item.title,
          description: item.size ? `Talle ${item.size}` : "",
          unit_price: item.price,
          quantity: 1,
          picture_url: item.image,
        })),
        shipments: shipping > 0 ? { cost: shipping, mode: "not_specified" } : undefined,
        back_urls: {
          success: `${siteUrl}/checkout/paso-3?status=approved&order_id=${orderId}`,
          pending: `${siteUrl}/checkout/paso-3?status=pending&order_id=${orderId}`,
          failure: `${siteUrl}/checkout/paso-2?status=rejected`,
        },
        auto_return: "approved",
        notification_url: `${siteUrl}/api/mercadopago/webhook`,
        payer: email ? { email, name: payerName || email } : undefined,
        statement_descriptor: "La Percha Showroom",
      },
    })

    return NextResponse.json({
      ok: true,
      orderId,
      initPoint: result.init_point,
      sandboxInitPoint: result.sandbox_init_point,
      preferenceId: result.id,
      total: subtotal + shipping,
      subtotal,
      shipping,
      metodo_envio: metodo,
    })
  } catch (err) {
    console.error("Error creando preferencia MP:", err)
    return NextResponse.json({ error: "Error al crear la preferencia de pago" }, { status: 500 })
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/mercadopago/crear-preferencia/route.ts
git commit -m "feat: validar y persistir metodo/costo de envio en MercadoPago"
```

---

### Task 13: FreeShippingBanner + layout cliente

**Files:**
- Create: `src/components/FreeShippingBanner.tsx`
- Modify: `src/app/(cliente)/layout.tsx:2,10`

**Interfaces:**
- Produce: banner sticky con el free_threshold de la config

- [ ] **Step 1: Crear el componente**

```typescript
"use client"
import { useEffect, useState } from "react"

export function FreeShippingBanner() {
  const [threshold, setThreshold] = useState<number | null>(null)

  useEffect(() => {
    fetch("/api/configuracion-envio")
      .then(r => r.json())
      .then(d => { if (!d.error) setThreshold(d.free_threshold) })
      .catch(() => {})
  }, [])

  if (!threshold) return null

  return (
    <div className="sticky top-0 z-30 bg-matcha-50 border-b border-matcha-200 text-center py-2 px-4">
      <p className="text-xs font-semibold text-matcha-800">
        Envío gratis a partir de $ {threshold.toLocaleString("es-AR")}
      </p>
    </div>
  )
}
```

- [ ] **Step 2: Agregar al layout cliente**

En `src/app/(cliente)/layout.tsx`:
```typescript
import NavbarWrapper from "@/components/NavbarWrapper";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { AuthInitializer } from "@/components/AuthInitializer";
import { FreeShippingBanner } from "@/components/FreeShippingBanner";

export default function ClienteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg-page flex flex-col lg:pt-16">
      <AuthInitializer />
      <FreeShippingBanner />
      <main className="flex-1 pb-20 lg:pb-0">{children}</main>
      <NavbarWrapper />
      <WhatsAppButton />
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/FreeShippingBanner.tsx "src/app/(cliente)/layout.tsx"
git commit -m "feat: banner de envio gratis en layout cliente"
```

---

### Task 14: Integración final — verificación y push

- [ ] **Step 1: Verificar que compila**

```bash
cd /home/marti/Documentos/La-percha-Showroom && npx tsc --noEmit --pretty 2>&1 | head -50
```

- [ ] **Step 2: Push a rama y crear PR**

```bash
git push origin feat/envio-configurable
gh pr create --repo sil31227/La-percha-Showroom --base main --head feat/envio-configurable --title "feat: envío configurable con selección de método en checkout" --body "Agrega:\n- Tabla configuracion_envio en DB\n- Página admin /admin/envio para configurar precios\n- Selector de método de envío en checkout paso-1\n- Validación server-side del costo de envío\n- Banner de envío gratis en web cliente\n- Método y costo de envío visibles en admin/pedidos"
```

- [ ] **Step 3: Commit**

```bash
git commit -m "feat: integracion final de envio configurable"
```

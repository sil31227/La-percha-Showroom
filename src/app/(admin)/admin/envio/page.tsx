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

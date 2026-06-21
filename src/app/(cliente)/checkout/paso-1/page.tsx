"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { CheckoutStepper } from "@/components/CheckoutStepper"

const PROVINCIAS = [
  'Buenos Aires','CABA','Catamarca','Chaco','Chubut','Córdoba',
  'Corrientes','Entre Ríos','Formosa','Jujuy','La Pampa','La Rioja',
  'Mendoza','Misiones','Neuquén','Río Negro','Salta','San Juan',
  'San Luis','Santa Cruz','Santa Fe','Santiago del Estero',
  'Tierra del Fuego','Tucumán',
]

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
  const [form, setForm] = useState<FormData>({
    nombre: '', email: '', provincia: '', ciudad: '', cp: '', direccion: '',
  })
  const [errors, setErrors] = useState<Errors>({})

  const set = (key: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(f => ({ ...f, [key]: e.target.value }))
    setErrors(ev => ({ ...ev, [key]: undefined }))
  }

  const handleContinuar = () => {
    const e = validate(form)
    if (Object.keys(e).length > 0) { setErrors(e); return }
    // Guardar en sessionStorage para paso 3
    sessionStorage.setItem('checkout_address', JSON.stringify(form))
    router.push('/checkout/paso-2')
  }

  const inputClass = (err?: string) =>
    `w-full h-12 rounded-lg border px-4 text-sm text-text-strong
    placeholder:text-text-subtle bg-surface-card
    focus:outline-none focus:border-brand transition-colors
    ${err ? 'border-error-500' : 'border-border-default'}`

  return (
    <div className="w-full lg:max-w-lg lg:mx-auto">
      <CheckoutStepper currentStep={1} />

      <div className="px-4 lg:px-0 pb-32 lg:pb-10 space-y-4 mt-2">
        <h2 className="font-display text-xl text-text-strong">Datos de entrega</h2>

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

"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useAuthStore } from "@/store/useAuthStore"
import { supabase } from "@/lib/supabase"
import { ArrowLeft, Banknote, Check, Copy, Loader2 } from "lucide-react"

export default function DatosVendedoraPage() {
  const { user } = useAuthStore()
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    fullName: "",
    bank: "",
    accountType: "caja_ahorro" as "caja_ahorro" | "cuenta_corriente",
    cbu: "",
    alias: "",
  })

  const [showCbu, setShowCbu] = useState(false)
  const [copied, setCopied] = useState("")

  useEffect(() => {
    if (!user?.id) return
    supabase.from("vendedores").select("cbu, banco, tipo_cuenta, alias, titular").eq("id", user.id).maybeSingle().then(({ data }) => {
      setForm({
        fullName: (data?.titular as string) || user.name || "",
        bank: (data?.banco as string) || "",
        accountType: ((data?.tipo_cuenta as string) || "caja_ahorro") as "caja_ahorro" | "cuenta_corriente",
        cbu: (data?.cbu as string) || "",
        alias: (data?.alias as string) || "",
      })
    })
  }, [user?.id, user?.name])

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text)
    setCopied(label)
    setTimeout(() => setCopied(""), 2000)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user?.id) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from("vendedores")
        .upsert({
          id: user.id,
          nombre: user.name,
          email: user.email,
          avatar: user.avatar,
          cbu: form.cbu,
          banco: form.bank,
          tipo_cuenta: form.accountType,
          alias: form.alias,
          titular: form.fullName,
        })

      if (error) {
        alert("Error al guardar los datos: " + error.message)
        setSaving(false)
        return
      }

      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      alert("Error al guardar los datos: " + (err instanceof Error ? err.message : "Error de conexión"))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="h-16 flex items-center gap-3 px-5 bg-bg-page border-b border-border-subtle sticky top-0 z-10 lg:top-16">
        <Link href="/perfil" className="w-9 h-9 rounded-full bg-surface-sunken flex items-center justify-center shrink-0">
          <ArrowLeft className="w-4 h-4 text-text-muted" />
        </Link>
        <h1 className="font-display text-xl text-text-strong">Datos de vendedora</h1>
      </header>

      <form onSubmit={handleSubmit}
        className="flex-1 px-4 lg:px-6 py-6 space-y-6 pb-24 lg:pb-10 max-w-lg mx-auto w-full">

        <div className="bg-surface-card rounded-xl border border-border-subtle p-5 space-y-5">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-matcha-100 flex items-center justify-center">
              <Banknote className="w-4 h-4 text-matcha-500" />
            </span>
            <div>
              <p className="text-sm font-semibold text-text-strong">Cuenta de cobro</p>
              <p className="text-[11px] text-text-muted">Acá te depositamos las ganancias de tus ventas</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wide mb-1.5">
              Nombre del titular
            </label>
            <input type="text" value={form.fullName}
              onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))}
              className="w-full h-11 px-4 rounded-lg bg-surface-sunken text-sm text-text-body
                border border-transparent focus:border-brand focus:outline-none transition-colors" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wide mb-1.5">
              Banco
            </label>
            <input type="text" value={form.bank}
              onChange={e => setForm(p => ({ ...p, bank: e.target.value }))}
              placeholder="Ej: Santander, Galicia, BBVA..."
              className="w-full h-11 px-4 rounded-lg bg-surface-sunken text-sm text-text-body
                placeholder:text-text-muted border border-transparent
                focus:border-brand focus:outline-none transition-colors" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wide mb-1.5">
              Tipo de cuenta
            </label>
            <div className="flex gap-2">
              {[
                { value: 'caja_ahorro' as const, label: 'Caja de ahorro' },
                { value: 'cuenta_corriente' as const, label: 'Cuenta corriente' },
              ].map(o => (
                <button key={o.value} type="button"
                  onClick={() => setForm(p => ({ ...p, accountType: o.value }))}
                  className={`flex-1 h-11 rounded-lg text-sm font-semibold transition-colors border
                    ${form.accountType === o.value
                      ? 'bg-brand border-brand text-white'
                      : 'border-border-default text-text-body hover:border-brand'}`}>
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wide mb-1.5">
              CBU
            </label>
            <div className="relative">
              <input
                type={showCbu ? "text" : "password"}
                value={form.cbu}
                onChange={e => setForm(p => ({ ...p, cbu: e.target.value }))}
                className="w-full h-11 px-4 pr-16 rounded-lg bg-surface-sunken text-sm text-text-body
                  font-mono tracking-wider border border-transparent
                  focus:border-brand focus:outline-none transition-colors" />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                <button type="button"
                  onClick={() => setShowCbu(o => !o)}
                  className="w-7 h-7 rounded-md hover:bg-almond-200 flex items-center justify-center
                    text-text-muted text-[10px] font-semibold">
                  {showCbu ? 'Ocultar' : 'Ver'}
                </button>
                <button type="button"
                  onClick={() => copyToClipboard(form.cbu, 'cbu')}
                  className="w-7 h-7 rounded-md hover:bg-almond-200 flex items-center justify-center
                    text-text-muted">
                  {copied === 'cbu' ? <Check className="w-3.5 h-3.5 text-success-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wide mb-1.5">
              Alias
            </label>
            <div className="relative">
              <input type="text" value={form.alias}
                onChange={e => setForm(p => ({ ...p, alias: e.target.value }))}
                placeholder="Ej: maria.percha"
                className="w-full h-11 px-4 pr-10 rounded-lg bg-surface-sunken text-sm text-text-body
                  border border-transparent focus:border-brand focus:outline-none transition-colors" />
              <button type="button"
                onClick={() => copyToClipboard(form.alias, 'alias')}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-md
                  hover:bg-almond-200 flex items-center justify-center text-text-muted">
                {copied === 'alias' ? <Check className="w-3.5 h-3.5 text-success-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

        <button type="submit" disabled={saving}
          className="w-full h-12 bg-brand hover:bg-brand-hover text-white
            font-semibold rounded-full transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed">
          {saving ? (
            <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</span>
          ) : saved ? '✓ Guardado' : 'Guardar cambios'}
        </button>

        <div className="bg-info-50 border border-info-200 rounded-xl p-4">
          <p className="text-xs text-info-600 leading-relaxed">
            Tus datos bancarios están seguros. Solo los usamos para transferirte las ganancias
            de tus ventas cuando la compradora confirma la entrega.
          </p>
        </div>
      </form>
    </div>
  )
}

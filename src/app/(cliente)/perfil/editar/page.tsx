"use client"
import { useState, useRef } from "react"
import Link from "next/link"
import { useAuthStore } from "@/store/useAuthStore"
import { supabase } from "@/lib/supabase"
import { ArrowLeft, User, Banknote, Mail, Phone, Camera, ShieldCheck, Loader2 } from "lucide-react"

export default function EditarPerfilPage() {
  const { user, updateProfile } = useAuthStore()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const [profile, setProfile] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    avatar: user?.avatar || "",
  })

  const [payment, setPayment] = useState({
    fullName: user?.name || "",
    bank: "",
    accountType: "caja_ahorro" as "caja_ahorro" | "cuenta_corriente",
    cbu: "",
    alias: "",
  })

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("folder", "avatars")

      const res = await fetch("/api/upload", { method: "POST", body: formData })
      const data = await res.json()

      if (data.url) {
        setProfile(p => ({ ...p, avatar: data.url }))
      } else {
        console.error("Error al subir foto:", data.error)
      }
    } catch (err) {
      console.error("Error al subir foto:", err)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user?.id) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: profile.name,
          avatar_url: profile.avatar,
          phone: profile.phone,
        })
        .eq("id", user.id)

      if (error) {
        console.error("Error al guardar perfil:", error.message)
        return
      }

      updateProfile?.({
        name: profile.name,
        avatar: profile.avatar,
        phone: profile.phone,
      })

      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      console.error("Error al guardar perfil:", err)
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
        <h1 className="font-display text-xl text-text-strong">Editar perfil</h1>
      </header>

      <form onSubmit={handleSubmit}
        className="flex-1 px-4 lg:px-6 py-6 space-y-8 pb-24 lg:pb-10 max-w-lg mx-auto w-full">

        {/* Personal info */}
        <div className="bg-surface-card rounded-xl border border-border-subtle p-5 space-y-5">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-matcha-100 flex items-center justify-center">
              <User className="w-4 h-4 text-matcha-500" />
            </span>
            <div>
              <p className="text-sm font-semibold text-text-strong">Información personal</p>
              <p className="text-[11px] text-text-muted">Tus datos visibles en la comunidad</p>
            </div>
          </div>

          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              {uploading ? (
                <div className="w-20 h-20 rounded-full ring-4 ring-matcha-100 bg-surface-sunken flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-brand animate-spin" />
                </div>
              ) : (
                <img src={profile.avatar || "https://i.pravatar.cc/120?u=user"} alt="" className="w-20 h-20 rounded-full object-cover ring-4 ring-matcha-100" />
              )}
              <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}
                className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-brand text-white flex items-center justify-center shadow-md hover:bg-brand-hover transition-colors disabled:opacity-50">
                <Camera className="w-3.5 h-3.5" />
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarUpload}
                className="hidden" />
            </div>
            <input type="text" value={profile.avatar}
              onChange={e => setProfile(p => ({ ...p, avatar: e.target.value }))}
              placeholder="URL de foto de perfil"
              className="w-full max-w-xs h-9 px-3 rounded-lg bg-surface-sunken text-xs text-text-body border border-transparent focus:border-brand outline-none text-center" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wide mb-1.5">Nombre</label>
            <input type="text" value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
              className="w-full h-11 px-4 rounded-lg bg-surface-sunken text-sm text-text-body border border-transparent focus:border-brand outline-none" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wide mb-1.5">Email</label>
            <div className="flex items-center gap-1.5">
              <Mail className="w-4 h-4 text-text-muted shrink-0" />
              <input type="email" value={profile.email} disabled
                className="w-full h-11 px-4 rounded-lg bg-surface-sunken text-sm text-text-muted border border-transparent outline-none" />
            </div>
            <p className="text-[10px] text-text-muted mt-1">El email no se puede cambiar</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wide mb-1.5">Teléfono</label>
            <div className="flex items-center gap-1.5">
              <Phone className="w-4 h-4 text-text-muted shrink-0" />
              <input type="tel" value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
                placeholder="+54 9 249 412-3456"
                className="w-full h-11 px-4 rounded-lg bg-surface-sunken text-sm text-text-body border border-transparent focus:border-brand outline-none" />
            </div>
          </div>
        </div>

        {/* Payment / cobro info */}
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
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wide mb-1.5">Nombre del titular</label>
            <input type="text" value={payment.fullName}
              onChange={e => setPayment(p => ({ ...p, fullName: e.target.value }))}
              className="w-full h-11 px-4 rounded-lg bg-surface-sunken text-sm text-text-body border border-transparent focus:border-brand outline-none" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wide mb-1.5">Banco</label>
            <input type="text" value={payment.bank} onChange={e => setPayment(p => ({ ...p, bank: e.target.value }))}
              placeholder="Ej: Santander, Galicia, BBVA..."
              className="w-full h-11 px-4 rounded-lg bg-surface-sunken text-sm text-text-body border border-transparent focus:border-brand outline-none" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wide mb-1.5">Tipo de cuenta</label>
            <div className="flex gap-2">
              {[
                { value: "caja_ahorro" as const, label: "Caja de ahorro" },
                { value: "cuenta_corriente" as const, label: "Cuenta corriente" },
              ].map(o => (
                <button key={o.value} type="button" onClick={() => setPayment(p => ({ ...p, accountType: o.value }))}
                  className={`flex-1 h-11 rounded-lg text-sm font-semibold transition-colors border ${payment.accountType === o.value ? 'bg-brand border-brand text-white' : 'border-border-default text-text-body hover:border-brand'}`}>
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wide mb-1.5">CBU</label>
            <input type="text" value={payment.cbu} onChange={e => setPayment(p => ({ ...p, cbu: e.target.value }))}
              placeholder="22 dígitos"
              className="w-full h-11 px-4 rounded-lg bg-surface-sunken text-sm text-text-body font-mono border border-transparent focus:border-brand outline-none" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wide mb-1.5">Alias</label>
            <input type="text" value={payment.alias} onChange={e => setPayment(p => ({ ...p, alias: e.target.value }))}
              placeholder="Ej: maria.percha"
              className="w-full h-11 px-4 rounded-lg bg-surface-sunken text-sm text-text-body border border-transparent focus:border-brand outline-none" />
          </div>
        </div>

        <button type="submit" disabled={saving || uploading}
          className="w-full h-12 bg-brand hover:bg-brand-hover text-white font-semibold rounded-full transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed">
          {saving ? (
            <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</span>
          ) : saved ? "✓ Guardado" : "Guardar cambios"}
        </button>

        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-info-50 border border-info-200">
          <ShieldCheck className="w-4 h-4 text-info-500 shrink-0" />
          <p className="text-xs text-info-600 leading-relaxed">
            Tus datos bancarios están seguros. Solo los usamos para transferirte las ganancias de tus ventas.
          </p>
        </div>
      </form>
    </div>
  )
}

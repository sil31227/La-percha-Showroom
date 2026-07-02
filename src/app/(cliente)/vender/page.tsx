"use client"
import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { ArrowLeft, Camera, Plus, X, ShieldCheck, Package, BadgePercent, Truck, Clock, FileText, CheckCircle, Upload } from "lucide-react"
import { useAuthStore } from "@/store/useAuthStore"
import { supabase } from "@/lib/supabase"

const CONDITIONS = [
  { value: 'new_tag', label: 'Nuevo con etiqueta' },
  { value: 'new', label: 'Nuevo' },
  { value: 'like_new', label: 'Como nuevo' },
  { value: 'used', label: 'Usado' },
]
const SIZES = ['XS','S','M','L','XL','Único']

export default function VenderPage() {
  const { user, requestSeller, refreshProfile } = useAuthStore()
  const [terms, setTerms] = useState("")
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [showTerms, setShowTerms] = useState(false)

  useEffect(() => {
    supabase.from("terminos").select("contenido").single().then(({ data }) => {
      if (data) setTerms(data.contenido)
    })
  }, [])

  useEffect(() => {
    if (user?.seller_status !== "pending") return
    refreshProfile()
    const interval = setInterval(refreshProfile, 15000)
    return () => clearInterval(interval)
  }, [user?.seller_status])

  useEffect(() => {
    supabase.from("categorias").select("id, nombre").eq("tipo", "ropa").order("orden")
      .then(({ data }) => {
        if (data && data.length > 0) {
          setCategories(data)
          setCategory(data[0].id)
        }
      })
  }, [])
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [brand, setBrand] = useState("")
  const [price, setPrice] = useState("")
  const [category, setCategory] = useState("")
  const [categories, setCategories] = useState<{id: string, nombre: string}[]>([])
  const [condition, setCondition] = useState("like_new")
  const [selectedSizes, setSelectedSizes] = useState<string[]>([])
  const [freeShipping, setFreeShipping] = useState(false)
  const [sent, setSent] = useState(false)
  const [images, setImages] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [deletedImages, setDeletedImages] = useState<string[]>([])
  const [selectedColors, setSelectedColors] = useState<string[]>([])
  const [newColor, setNewColor] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!user) {
    return (
      <div className="flex flex-col min-h-screen">
        <header className="h-16 flex items-center gap-3 px-5 bg-bg-page border-b border-border-subtle sticky top-0 z-10 lg:top-16">
          <Link href="/home" className="w-9 h-9 rounded-full bg-surface-sunken flex items-center justify-center shrink-0">
            <ArrowLeft className="w-4 h-4 text-text-muted" />
          </Link>
          <h1 className="font-display text-xl text-text-strong">Vender</h1>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center gap-5 px-5 text-center">
          <p className="text-5xl">👗</p>
          <div>
            <p className="text-text-strong font-semibold text-base">¿Querés vender?</p>
            <p className="text-text-muted text-sm mt-1 max-w-xs">
              Ingresá o creá tu cuenta para publicar tus prendas.
            </p>
          </div>
          <div className="flex flex-col gap-2.5 w-full max-w-xs">
            <Link href="/ingresar"
              className="w-full h-12 bg-brand hover:bg-brand-hover text-text-on-brand
                font-semibold rounded-full flex items-center justify-center transition-colors">
              Iniciar sesión
            </Link>
            <Link href="/ingresar/registrarse"
              className="w-full h-12 border border-border-default text-text-body
                font-semibold rounded-full flex items-center justify-center
                hover:border-brand hover:text-brand transition-colors">
              Registrarme
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (user.seller_status === 'pending') {
    return (
      <div className="flex flex-col min-h-screen">
        <header className="h-16 flex items-center gap-3 px-5 bg-bg-page border-b border-border-subtle sticky top-0 z-10 lg:top-16">
          <Link href="/home" className="w-9 h-9 rounded-full bg-surface-sunken flex items-center justify-center shrink-0">
            <ArrowLeft className="w-4 h-4 text-text-muted" />
          </Link>
          <h1 className="font-display text-xl text-text-strong">Vender</h1>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center gap-5 px-5 text-center">
          <p className="text-5xl">⏳</p>
          <div>
            <p className="text-text-strong font-semibold text-base">Solicitud enviada</p>
            <p className="text-text-muted text-sm mt-1 max-w-xs">
              Estamos revisando tu perfil. Te avisamos por email cuando esté aprobado. Suele tardar menos de 24 horas.
            </p>
          </div>
          <Link href="/home"
            className="px-6 py-2.5 rounded-full bg-brand text-white font-semibold text-sm hover:bg-brand-hover transition-colors">
            Volver al inicio
          </Link>
        </div>
      </div>
    )
  }

  if (user.seller_status === 'none') {
    if (!termsAccepted) {
      return (
        <div className="flex flex-col min-h-screen">
          <header className="h-16 flex items-center gap-3 px-5 bg-bg-page border-b border-border-subtle sticky top-0 z-10 lg:top-16">
            <Link href="/home" className="w-9 h-9 rounded-full bg-surface-sunken flex items-center justify-center shrink-0">
              <ArrowLeft className="w-4 h-4 text-text-muted" />
            </Link>
            <h1 className="font-display text-xl text-text-strong">Términos y condiciones</h1>
          </header>
          <div className="flex-1 flex flex-col px-5 py-6 max-w-md mx-auto w-full">
            <div className="flex-1 bg-surface-card rounded-xl border border-border-subtle p-5 mb-5 overflow-y-auto">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-matcha-600" />
                <h2 className="font-display text-lg text-text-strong">Para vender en La Percha</h2>
              </div>
              <div className="text-sm text-text-body whitespace-pre-line leading-relaxed">
                {terms}
              </div>
            </div>
            <label className="flex items-start gap-3 mb-4 cursor-pointer">
              <input type="checkbox" checked={termsAccepted} onChange={e => setTermsAccepted(e.target.checked)}
                className="accent-brand w-4 h-4 mt-0.5 rounded" />
              <span className="text-xs text-text-muted">Acepto los términos y condiciones de La Percha Showroom para vender mis productos.</span>
            </label>
            <button onClick={() => requestSeller()} disabled={!termsAccepted}
              className="w-full h-12 bg-brand hover:bg-brand-hover text-white font-semibold rounded-full flex items-center justify-center gap-2 transition-colors disabled:opacity-40">
              <ShieldCheck className="w-4 h-4" />
              Quiero ser vendedora
            </button>
          </div>
        </div>
      )
    }

    return (
      <div className="flex flex-col min-h-screen">
        <header className="h-16 flex items-center gap-3 px-5 bg-bg-page border-b border-border-subtle sticky top-0 z-10 lg:top-16">
          <Link href="/home" className="w-9 h-9 rounded-full bg-surface-sunken flex items-center justify-center shrink-0">
            <ArrowLeft className="w-4 h-4 text-text-muted" />
          </Link>
          <h1 className="font-display text-xl text-text-strong">Vender</h1>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center px-5 py-8 gap-6 max-w-md mx-auto w-full">
          <div className="w-14 h-14 rounded-full bg-success-50 flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-success-500" />
          </div>
          <div className="text-center space-y-2">
            <p className="text-text-strong font-semibold text-lg">Vendé en La Percha</p>
            <p className="text-text-muted text-sm leading-relaxed">
              Publicá tus prendas y llegá a toda la comunidad. Vos te quedás con el 80% de cada venta.
            </p>
          </div>

          <div className="w-full space-y-3 bg-surface-sunken rounded-xl p-4">
            {[
              { icon: ShieldCheck, label: 'Moderación', sub: 'Revisamos cada prenda antes de publicar' },
              { icon: BadgePercent, label: 'Comisión 20%', sub: 'Solo pagás cuando vendés' },
              { icon: Truck, label: 'Envíos', sub: 'Coordinás con la compradora o usás Correo Argentino' },
              { icon: Clock, label: 'Pago rápido', sub: 'Recibís tu dinero cuando se confirma la entrega' },
            ].map(item => (
              <div key={item.label} className="flex items-start gap-3">
                <span className="w-8 h-8 rounded-lg bg-matcha-100 flex items-center justify-center shrink-0 mt-0.5">
                  <item.icon className="w-4 h-4 text-matcha-500" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-text-strong">{item.label}</p>
                  <p className="text-xs text-text-muted">{item.sub}</p>
                </div>
              </div>
            ))}
          </div>

          <button onClick={requestSeller}
            className="w-full h-12 bg-brand hover:bg-brand-hover text-white
              font-semibold rounded-full flex items-center justify-center gap-2
              transition-colors shadow-lg shadow-brand/20">
            <ShieldCheck className="w-4 h-4" />
            Quiero ser vendedora
          </button>

          <button onClick={() => setTermsAccepted(false)}
            className="text-xs text-text-muted hover:underline">
            Ver términos y condiciones
          </button>
        </div>
      </div>
    )
  }

  function toggleSize(s: string) {
    setSelectedSizes(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
    )
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files; if (!files?.length) return
    setUploading(true)
    for (const file of Array.from(files)) {
      const fd = new FormData(); fd.append("file", file)
      try {
        const res = await fetch("/api/upload", { method: "POST", body: fd })
        const data = await res.json()
        if (data.url) setImages(prev => [...prev, data.url])
      } catch { /* ignore */ }
    }
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  function removeImage(index: number) {
    const url = images[index]
    setImages(prev => prev.filter((_, j) => j !== index))
    if (url && url.includes("hvmctiqzjbqsghuwhquk.supabase.co")) {
      setDeletedImages(prev => [...prev, url])
    }
  }

  function addColor() {
    if (!newColor.trim()) return
    if (selectedColors.includes(newColor.trim())) return
    setSelectedColors(prev => [...prev, newColor.trim()])
    setNewColor("")
  }

  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    setSubmitting(true)
    const productId = `prod-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    const { error } = await supabase.from("productos").insert({
      id: productId,
      titulo: title,
      descripcion: description,
      marca: brand,
      precio: Number(price),
      categoria_id: category,
      estado: condition,
      talles: selectedSizes,
      colores: selectedColors,
      imagenes: images,
      envio_gratis: freeShipping,
      tipo: "ropa",
      vendedor_nombre: user.name,
      vendedor_tipo: "feria",
      status: "pending",
      created_at: new Date().toISOString(),
    })
    setSubmitting(false)
    if (error) {
      console.error("Error publicando:", error)
      return
    }
    fetch("/api/email/nueva-publicacion", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ titulo: title, vendedora: user.name, precio: price }),
    }).catch(() => {})
    if (deletedImages.length > 0) {
      const paths = deletedImages.map(url => { const parts = url.split("/productos/"); return parts[1]?.split("?")[0] }).filter(Boolean) as string[]
      if (paths.length > 0) fetch("/api/imagenes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ paths }) }).catch(() => {})
    }
    setDeletedImages([])
    setSent(true)
  }

  if (sent) {
    return (
      <div className="flex flex-col min-h-screen">
        <header className="h-16 flex items-center gap-3 px-5 bg-bg-page border-b border-border-subtle sticky top-0 z-10 lg:top-16">
          <Link href="/home" className="w-9 h-9 rounded-full bg-surface-sunken flex items-center justify-center shrink-0">
            <ArrowLeft className="w-4 h-4 text-text-muted" />
          </Link>
          <h1 className="font-display text-xl text-text-strong">Vender</h1>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-5 text-center">
          <p className="text-5xl">✨</p>
          <p className="text-text-strong font-semibold text-lg">¡Prenda publicada!</p>
          <p className="text-text-muted text-sm max-w-xs">
            Tu prenda ya está en revisión. Te avisamos cuando esté publicada en La Percha.
          </p>
          <div className="flex gap-3 mt-2">
            <Link href="/home"
              className="px-5 py-2.5 rounded-full border border-border-default text-text-body font-semibold text-sm hover:border-brand transition-colors">
              Volver al inicio
            </Link>
            <button onClick={() => { setSent(false); setTitle(""); setDescription(""); setBrand(""); setPrice(""); setSelectedSizes([]); setSelectedColors([]); setImages([]); setDeletedImages([]) }}
              className="px-5 py-2.5 rounded-full bg-brand text-text-on-brand font-semibold text-sm hover:bg-brand-hover transition-colors">
              Publicar otra
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="h-16 flex items-center gap-3 px-5 bg-bg-page border-b border-border-subtle sticky top-0 z-10 lg:top-16">
        <Link href="/home" className="w-9 h-9 rounded-full bg-surface-sunken flex items-center justify-center shrink-0">
          <ArrowLeft className="w-4 h-4 text-text-muted" />
        </Link>
        <h1 className="font-display text-xl text-text-strong">Publicar prenda</h1>
      </header>

      <form onSubmit={handleSubmit}
        className="flex-1 max-w-2xl mx-auto w-full px-4 lg:px-6 py-6 space-y-6 pb-24 lg:pb-10">

        {/* Fotos */}
        <div>
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">Fotos *</p>
          {images.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2 mb-3">
              {images.map((url, i) => (
                <div key={i} className="relative shrink-0">
                  <img src={url} alt="" className="w-24 h-32 rounded-lg object-cover" />
                  <button type="button" onClick={() => removeImage(i)} className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-error-500 text-white flex items-center justify-center"><X className="w-3 h-3" /></button>
                </div>
              ))}
            </div>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileUpload} className="hidden" />
          <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="w-full h-24 rounded-xl border-2 border-dashed border-border-default bg-surface-sunken flex flex-col items-center justify-center gap-1 text-text-muted hover:border-brand hover:text-brand transition-colors disabled:opacity-50">
            {uploading ? <span className="text-sm">Subiendo...</span> : <><Camera className="w-5 h-5" /><span className="text-xs font-semibold">Subir fotos</span><span className="text-[10px]">JPG, PNG, WebP hasta 10MB</span></>}
          </button>
        </div>

        {/* Título */}
        <div>
          <label className="block text-xs font-semibold text-text-muted uppercase tracking-wide mb-1.5">
            Título
          </label>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)}
            placeholder="Ej: Vestido lino sage talle M"
            required
            className="w-full h-11 px-4 rounded-lg bg-surface-sunken text-sm text-text-body
              placeholder:text-text-muted border border-transparent
              focus:border-brand focus:outline-none transition-colors" />
        </div>

        {/* Descripción */}
        <div>
          <label className="block text-xs font-semibold text-text-muted uppercase tracking-wide mb-1.5">
            Descripción
          </label>
          <textarea value={description} onChange={e => setDescription(e.target.value)}
            placeholder="Contá los detalles: tela, estado, color, ocasiones de uso..."
            rows={3} required
            className="w-full px-4 py-3 rounded-lg bg-surface-sunken text-sm text-text-body
              placeholder:text-text-muted border border-transparent resize-none
              focus:border-brand focus:outline-none transition-colors" />
        </div>

        {/* Marca + Precio */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wide mb-1.5">
              Marca
            </label>
            <input type="text" value={brand} onChange={e => setBrand(e.target.value)}
              placeholder="Ej: Jazmín Chebar"
              required
              className="w-full h-11 px-4 rounded-lg bg-surface-sunken text-sm text-text-body
                placeholder:text-text-muted border border-transparent
                focus:border-brand focus:outline-none transition-colors" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wide mb-1.5">
              Precio
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-muted">$</span>
              <input type="number" value={price} onChange={e => setPrice(e.target.value)}
                placeholder="9.800"
                min={0} step={100} required
                className="w-full h-11 pl-7 pr-4 rounded-lg bg-surface-sunken text-sm text-text-body
                  placeholder:text-text-muted border border-transparent
                  focus:border-brand focus:outline-none transition-colors" />
            </div>
          </div>
        </div>

        {/* Categoría */}
        <div>
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">Categoría</p>
          <div className="flex gap-2">
            {categories.map(c => (
              <button key={c.id} type="button"
                onClick={() => setCategory(c.id)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors border
                  ${category === c.id
                    ? 'bg-brand border-brand text-text-on-brand'
                    : 'border-border-default text-text-body hover:border-brand'}`}>
                {c.nombre}
              </button>
            ))}
          </div>
        </div>

        {/* Talles */}
        <div>
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">Talles</p>
          <div className="flex flex-wrap gap-2">
            {SIZES.map(s => (
              <button key={s} type="button"
                onClick={() => toggleSize(s)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-colors
                  ${selectedSizes.includes(s)
                    ? 'bg-brand border-brand text-text-on-brand'
                    : 'border-border-default text-text-body hover:border-brand'}`}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Colores */}
        <div>
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">Colores</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {["Negro","Blanco","Beige","Gris","Verde","Azul","Rojo","Rosa","Amarillo","Marrón"].map(c => (
              <button key={c} type="button"
                onClick={() => setSelectedColors(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c])}
                className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-colors
                  ${selectedColors.includes(c)
                    ? 'bg-surface-inverse text-white border-surface-inverse'
                    : 'border-border-default text-text-body hover:border-brand'}`}>
                {c}
              </button>
            ))}
            {selectedColors.filter(c => !["Negro","Blanco","Beige","Gris","Verde","Azul","Rojo","Rosa","Amarillo","Marrón"].includes(c)).map(c => (
              <span key={c} className="inline-flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-semibold bg-surface-inverse text-white">
                {c}
                <button type="button" onClick={() => setSelectedColors(prev => prev.filter(x => x !== c))} className="hover:text-error-200"><X className="w-3 h-3" /></button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input value={newColor} onChange={e => setNewColor(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addColor() } }} placeholder="Agregar color..." className="flex-1 h-9 px-3 rounded-lg bg-surface-sunken text-xs border border-transparent focus:border-brand outline-none" />
            <button type="button" onClick={addColor} className="px-3 h-9 rounded-full bg-surface-sunken text-xs font-semibold hover:bg-matcha-100 transition-colors">+</button>
          </div>
        </div>

        {/* Estado */}
        <div>
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">Estado</p>
          <div className="space-y-2">
            {CONDITIONS.map(c => (
              <label key={c.value} className="flex items-center gap-3 cursor-pointer py-1.5">
                <input type="radio" name="condition"
                  checked={condition === c.value}
                  onChange={() => setCondition(c.value)}
                  className="accent-brand w-4 h-4" />
                <span className="text-sm text-text-body">{c.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Envío */}
        <div className="bg-surface-card rounded-xl border border-border-subtle p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-success-50 flex items-center justify-center">
                <Truck className="w-4 h-4 text-success-500" />
              </span>
              <div>
                <p className="text-sm font-semibold text-text-strong">Envío gratis</p>
                <p className="text-[11px] text-text-muted">
                  {freeShipping
                    ? 'La compradora no paga envío. Ideal para vender más rápido.'
                    : 'La compradora paga el envío.'}
                </p>
              </div>
            </div>
            <button type="button"
              onClick={() => setFreeShipping(o => !o)}
              className={`relative w-12 h-7 rounded-full transition-colors duration-200
                ${freeShipping ? 'bg-success-500' : 'bg-border-default'}`}>
              <span className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-sm
                transition-transform duration-200
                ${freeShipping ? 'translate-x-5.5' : 'translate-x-0.5'}`} />
            </button>
          </div>
        </div>

        <button type="submit" disabled={submitting}
          className="w-full h-12 bg-brand hover:bg-brand-hover text-text-on-brand
            font-semibold rounded-lg transition-colors disabled:opacity-60">
          {submitting ? "Publicando..." : "Publicar prenda"}
        </button>

        <p className="text-[10px] text-text-subtle text-center">
          Al publicar aceptás que La Percha retiene el <strong>20%</strong> de comisión sobre el precio de venta.
        </p>
      </form>
    </div>
  )
}

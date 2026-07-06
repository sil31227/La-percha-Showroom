"use client"
import { useEffect, useState } from "react"
import { useAdminStore, type AdminProduct } from "@/store/useAdminStore"
import { Check, X, Trash2 } from "lucide-react"

export default function ModeracionPage() {
  const { products, loaded, loadFromSupabase, approveProduct, rejectProduct, removeStoreProduct } = useAdminStore()
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending")
  const [selected, setSelected] = useState<AdminProduct | null>(null)
  const [showDelete, setShowDelete] = useState<string | null>(null)

  useEffect(() => { loadFromSupabase() }, [])

  if (!loaded) return <div className="p-5 lg:pt-7 text-sm text-text-muted">Cargando...</div>

  const filtered = products.filter(p => filter === "all" ? true : p.status === filter)
  const counts = { all: products.length, pending: products.filter(p => p.status === "pending").length, approved: products.filter(p => p.status === "approved").length, rejected: products.filter(p => p.status === "rejected").length }
  const FILTERS = [{ v: "pending" as const, l: "Pendientes", c: counts.pending }, { v: "approved" as const, l: "Aprobadas", c: counts.approved }, { v: "rejected" as const, l: "Rechazadas", c: counts.rejected }, { v: "all" as const, l: "Todas", c: counts.all }]

  return (
    <div className="p-5 lg:p-7 lg:pt-7 space-y-5 max-w-4xl">
      <div><h1 className="font-display text-2xl text-text-strong">Moderación</h1><p className="text-sm text-text-muted mt-1">Aprobá o rechazá publicaciones</p></div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map(f => (
          <button key={f.v} onClick={() => setFilter(f.v)} className={`shrink-0 px-3.5 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition-colors ${filter === f.v ? 'bg-brand text-white' : 'bg-surface-sunken text-text-body'}`}>{f.l}<span className="ml-1.5 opacity-70">{f.c}</span></button>
        ))}
      </div>
      <div className="bg-surface-card rounded-xl border border-border-subtle divide-y divide-border-subtle">
        {filtered.length === 0 ? <div className="px-4 py-12 text-center text-sm text-text-muted">No hay publicaciones {filter === "pending" ? "pendientes" : filter === "approved" ? "aprobadas" : filter === "rejected" ? "rechazadas" : ""}</div> : filtered.map(p => (
          <div key={p.id} className={`px-4 py-3 transition-colors ${selected?.id === p.id ? 'bg-matcha-50' : ''}`}>
            <div className="flex items-center gap-3">
              <img src={p.imagenes?.[0] || ""} alt="" className="w-12 h-16 rounded-lg object-cover shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text-strong truncate">{p.titulo}</p>
                <p className="text-xs text-text-muted">{p.vendedor_nombre} · {p.vendedor_tipo === "oficial" ? "Tienda Oficial" : "Feria"}</p>
                <div className="flex items-center gap-3 mt-1.5">
                  <p className="text-sm font-bold text-price">${p.precio.toLocaleString("es-AR")}</p>
                  {p.status === "pending" ? <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-warning-50 text-warning-600">Pendiente</span> : p.status === "approved" ? <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-success-50 text-success-600">Aprobada</span> : <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-error-50 text-error-500">Rechazada</span>}
                </div>
              </div>
              <div className="flex gap-1.5 shrink-0">
                {p.status === "pending" && (
                  <>
                    <button onClick={() => approveProduct(p.id)} className="w-8 h-8 rounded-full bg-success-50 text-success-600 flex items-center justify-center hover:bg-success-500 hover:text-white transition-colors"><Check className="w-4 h-4" /></button>
                    <button onClick={() => rejectProduct(p.id)} className="w-8 h-8 rounded-full bg-error-50 text-error-500 flex items-center justify-center hover:bg-error-500 hover:text-white transition-colors"><X className="w-4 h-4" /></button>
                  </>
                )}
                <button onClick={() => setShowDelete(p.id)} className="w-8 h-8 rounded-full bg-surface-sunken flex items-center justify-center hover:bg-error-50 hover:text-error-500 transition-colors"><Trash2 className="w-3.5 h-3.5 text-text-muted" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center">
          <div className="absolute inset-0 bg-carob-900/40 backdrop-blur-sm" onClick={() => setShowDelete(null)} />
          <div className="relative bg-surface-card rounded-t-2xl lg:rounded-2xl p-6 w-full lg:max-w-sm">
            <p className="font-semibold text-text-strong mb-2">¿Eliminar publicación?</p>
            <p className="text-sm text-text-muted mb-5">Esta acción no se puede deshacer. También se eliminarán las imágenes del producto.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDelete(null)} className="flex-1 h-10 rounded-full border border-border-default text-sm font-semibold">Cancelar</button>
              <button onClick={() => { removeStoreProduct(showDelete); setShowDelete(null) }} className="flex-1 h-10 rounded-full bg-error-500 text-white text-sm font-semibold">Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

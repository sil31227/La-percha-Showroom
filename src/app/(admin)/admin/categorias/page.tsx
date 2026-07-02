"use client"
import { useEffect, useState } from "react"
import { useAdminStore } from "@/store/useAdminStore"
import { ChevronDown, Pencil, Trash2, Plus, X, Check } from "lucide-react"

export default function CategoriasPage() {
  const { categories, loaded, loadFromSupabase, addSubcategory, renameSubcategory, deleteSubcategory, renameCategory, addCategory } = useAdminStore()
  const [openCat, setOpenCat] = useState<string | null>(null)
  const [editing, setEditing] = useState<{ catId: string; subId?: string; nombre: string } | null>(null)
  const [adding, setAdding] = useState<{ catId: string; nombre: string } | null>(null)
  const [deleting, setDeleting] = useState<{ catId: string; subId: string; nombre: string } | null>(null)
  const [newCat, setNewCat] = useState({ nombre: "", tipo: "ropa" as "ropa" | "tienda", open: false })

  useEffect(() => { loadFromSupabase() }, [])

  if (!loaded) return <div className="p-5 pt-20 lg:pt-7 text-sm text-text-muted">Cargando...</div>

  return (
    <div className="p-5 lg:p-7 pt-20 lg:pt-7 space-y-5 max-w-2xl mx-auto">
      <div><h1 className="font-display text-2xl text-text-strong">Categorías</h1><p className="text-sm text-text-muted mt-1">Gestioná categorías y subcategorías</p></div>
      <div className="space-y-3">
        {categories.map(cat => (
          <div key={cat.id} className="bg-surface-card rounded-xl border border-border-subtle overflow-hidden">
            <button onClick={() => setOpenCat(openCat === cat.id ? null : cat.id)} className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-surface-sunken transition-colors">
              <span className="flex-1">
                {editing && editing.catId === cat.id && !editing.subId ? <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}><input value={editing.nombre} onChange={e => setEditing({ ...editing, nombre: e.target.value })} onKeyDown={e => { if (e.key === "Enter") { renameCategory(editing.catId, editing.nombre); setEditing(null) } }} autoFocus className="flex-1 h-8 px-2 rounded-lg bg-surface-sunken text-sm border border-brand outline-none" /><button onClick={() => { renameCategory(editing.catId, editing.nombre); setEditing(null) }} className="w-7 h-7 rounded-full bg-matcha-100 flex items-center justify-center"><Check className="w-3.5 h-3.5 text-matcha-600" /></button><button onClick={() => setEditing(null)} className="w-7 h-7 rounded-full bg-surface-sunken flex items-center justify-center"><X className="w-3.5 h-3.5 text-text-muted" /></button></div> : <><p className="font-semibold text-text-strong">{cat.nombre}</p><p className="text-xs text-text-muted mt-0.5">{cat.subcategorias?.length || 0} subcategorías</p></>}
              </span>
              {editing?.catId !== cat.id || editing.subId ? <button onClick={(e) => { e.stopPropagation(); setEditing({ catId: cat.id, nombre: cat.nombre }) }} className="w-7 h-7 rounded-full bg-surface-sunken flex items-center justify-center hover:bg-matcha-100 transition-colors"><Pencil className="w-3.5 h-3.5 text-text-muted" /></button> : null}
              <ChevronDown className={`w-4 h-4 text-text-muted transition-transform ${openCat === cat.id ? 'rotate-180' : ''}`} />
            </button>
            {openCat === cat.id && (
              <div className="border-t border-border-subtle px-4 py-2 space-y-1">
                {cat.subcategorias?.map(sub => (
                  <div key={sub.id} className="flex items-center gap-2 py-1.5">
                    {editing?.catId === cat.id && editing.subId === sub.id ? <><input value={editing.nombre} onChange={e => setEditing({ ...editing, nombre: e.target.value })} onKeyDown={e => { if (e.key === "Enter") { renameSubcategory(cat.id, sub.id, editing.nombre); setEditing(null) } }} autoFocus className="flex-1 h-8 px-2 rounded-lg bg-surface-sunken text-sm border border-brand outline-none" /><button onClick={() => { renameSubcategory(cat.id, sub.id, editing.nombre); setEditing(null) }} className="w-7 h-7 rounded-full bg-matcha-100 flex items-center justify-center"><Check className="w-3.5 h-3.5 text-matcha-600" /></button><button onClick={() => setEditing(null)} className="w-7 h-7 rounded-full bg-surface-sunken flex items-center justify-center"><X className="w-3.5 h-3.5 text-text-muted" /></button></> : <><span className="flex-1 text-sm text-text-body">{sub.nombre}</span><button onClick={() => setEditing({ catId: cat.id, subId: sub.id, nombre: sub.nombre })} className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-surface-sunken transition-colors"><Pencil className="w-3 h-3 text-text-muted" /></button><button onClick={() => setDeleting({ catId: cat.id, subId: sub.id, nombre: sub.nombre })} className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-error-50 hover:text-error-500 transition-colors"><Trash2 className="w-3 h-3 text-text-muted" /></button></>}
                  </div>
                ))}
                {adding?.catId === cat.id ? <div className="flex items-center gap-2 py-1.5"><input value={adding.nombre} onChange={e => setAdding({ ...adding, nombre: e.target.value })} onKeyDown={e => { if (e.key === "Enter") { addSubcategory(cat.id, adding.nombre); setAdding(null) } }} autoFocus placeholder="Nombre" className="flex-1 h-8 px-2 rounded-lg bg-surface-sunken text-sm border border-brand outline-none" /><button onClick={() => { addSubcategory(cat.id, adding.nombre); setAdding(null) }} className="w-7 h-7 rounded-full bg-matcha-100 flex items-center justify-center"><Check className="w-3.5 h-3.5 text-matcha-600" /></button><button onClick={() => setAdding(null)} className="w-7 h-7 rounded-full bg-surface-sunken flex items-center justify-center"><X className="w-3.5 h-3.5 text-text-muted" /></button></div> : <button onClick={() => setAdding({ catId: cat.id, nombre: "" })} className="w-full flex items-center gap-2 py-2 text-sm text-matcha-600 font-medium hover:bg-matcha-50 rounded-lg px-2 transition-colors"><Plus className="w-3.5 h-3.5" /> Agregar subcategoría</button>}
              </div>
            )}
          </div>
        ))}
      </div>
      {deleting && <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center"><div className="absolute inset-0 bg-carob-900/40 backdrop-blur-sm" onClick={() => setDeleting(null)} /><div className="relative bg-surface-card rounded-t-2xl lg:rounded-2xl p-6 w-full lg:max-w-sm"><p className="font-semibold text-text-strong mb-2">¿Eliminar "{deleting.nombre}"?</p><p className="text-sm text-text-muted mb-5">Los productos quedarán sin subcategoría.</p><div className="flex gap-3"><button onClick={() => setDeleting(null)} className="flex-1 h-10 rounded-full border border-border-default text-sm font-semibold">Cancelar</button><button onClick={() => { deleteSubcategory(deleting.catId, deleting.subId); setDeleting(null) }} className="flex-1 h-10 rounded-full bg-error-500 text-white text-sm font-semibold">Eliminar</button></div></div></div>}
      <div className="bg-surface-card rounded-xl border border-border-subtle p-4">
        {newCat.open ? (
          <div className="space-y-3">
            <p className="text-sm font-semibold text-text-strong">Nueva categoría</p>
            <input value={newCat.nombre} onChange={e => setNewCat(s => ({ ...s, nombre: e.target.value }))} placeholder="Nombre de la categoría" className="w-full h-10 px-3 rounded-lg bg-surface-sunken text-sm border border-transparent focus:border-brand outline-none" />
            <div className="flex gap-2">
              {(["ropa", "tienda"] as const).map(t => (
                <button key={t} type="button" onClick={() => setNewCat(s => ({ ...s, tipo: t }))} className={`px-3.5 py-1.5 rounded-full text-[11px] font-semibold border transition-colors ${newCat.tipo === t ? 'bg-brand text-white border-brand' : 'bg-surface-sunken text-text-body border-transparent'}`}>{t === "ropa" ? "Ropa" : "Tienda"}</button>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => { if (newCat.nombre.trim()) { addCategory(newCat.nombre.trim(), newCat.tipo); setNewCat({ nombre: "", tipo: "ropa", open: false }) } }} className="flex-1 h-10 rounded-full bg-brand text-white text-sm font-semibold">Crear</button>
              <button onClick={() => setNewCat(s => ({ ...s, open: false }))} className="px-4 h-10 rounded-full border border-border-default text-sm font-semibold">Cancelar</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setNewCat(s => ({ ...s, open: true }))} className="w-full flex items-center gap-2 py-2 text-sm text-matcha-600 font-medium justify-center hover:bg-matcha-50 rounded-lg transition-colors"><Plus className="w-4 h-4" /> Nueva categoría</button>
        )}
      </div>
    </div>
  )
}

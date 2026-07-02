"use client"
import { useEffect, useRef, useState, useCallback } from "react"
import { useAdminStore, type StoreProductForm, type AdminProduct } from "@/store/useAdminStore"
import { Plus, X, Pencil, Trash2, ChevronLeft, Star, Truck, Upload, AlertCircle, Shirt, Store, GripVertical } from "lucide-react"
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core"
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

const CONDITIONS = [{ v: "new_tag", l: "Nuevo con etiqueta" }, { v: "new", l: "Nuevo" }, { v: "like_new", l: "Como nuevo" }, { v: "used", l: "Usado" }]
const SIZES = ["XS","S","M","L","XL","Único"]
const COLORES = ["Negro","Blanco","Beige","Gris","Verde","Azul","Rojo","Rosa","Amarillo","Marrón"]

function SortableProductRow({ p, onEdit, onDelete }: { p: AdminProduct; onEdit: () => void; onDelete: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: p.id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }
  return (
    <div ref={setNodeRef} style={style} className="bg-surface-card rounded-xl border border-border-subtle p-3 flex items-center gap-3">
      <button {...attributes} {...listeners} className="shrink-0 cursor-grab active:cursor-grabbing touch-none"><GripVertical className="w-4 h-4 text-text-muted" /></button>
      <img src={p.imagenes?.[0] || ""} alt="" className="w-14 h-18 rounded-lg object-cover shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap"><p className="text-sm font-semibold text-text-strong truncate">{p.titulo}</p>{p.destacado && <Star className="w-3 h-3 text-chai-500 fill-chai-500" />}{p.envio_gratis && <Truck className="w-3 h-3 text-success-500" />}</div>
        <p className="text-xs text-text-muted">{p.categoria_id}{p.subcategoria_id ? ` · ${p.subcategoria_id}` : ""}{p.marca ? ` · ${p.marca}` : ""}</p>
        <div className="flex items-center gap-2 mt-0.5"><p className="text-sm font-bold text-price">${p.precio.toLocaleString("es-AR")}</p>{p.precio_anterior && <p className="text-[11px] text-text-muted line-through">${p.precio_anterior.toLocaleString("es-AR")}</p>}</div>
        {p.talles && p.talles.length > 0 && <div className="flex gap-1 mt-1">{p.talles.map(s => <span key={s} className="px-1.5 py-0.5 rounded text-[9px] bg-surface-sunken text-text-muted">{s}</span>)}</div>}
      </div>
      <div className="flex gap-1 shrink-0"><button onClick={onEdit} className="w-7 h-7 rounded-full bg-surface-sunken flex items-center justify-center hover:bg-matcha-100 transition-colors"><Pencil className="w-3.5 h-3.5 text-text-muted" /></button><button onClick={onDelete} className="w-7 h-7 rounded-full bg-surface-sunken flex items-center justify-center hover:bg-error-50 hover:text-error-500 transition-colors"><Trash2 className="w-3.5 h-3.5 text-text-muted" /></button></div>
    </div>
  )
}

const EMPTY: StoreProductForm = { titulo: "", precio: 0, descripcion: "", categoria_id: "", subcategoria_id: "", estado: "new_tag", talles: [], colores: [], imagenes: [], variantGroups: [], variantes: [], envio_gratis: false, destacado: false, tipo: "ropa" }

export default function TiendaPage() {
  const { products, loaded, categories, loadFromSupabase, addStoreProduct, updateStoreProduct, removeStoreProduct, reorderProducts } = useAdminStore()
  const [view, setView] = useState<"list" | "type" | "form">("list")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<StoreProductForm>(EMPTY)
  const [showPrevPrice, setShowPrevPrice] = useState(false)
  const [newImage, setNewImage] = useState("")
  const [newColor, setNewColor] = useState("")
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [deletedImages, setDeletedImages] = useState<string[]>([])
  const [showDelete, setShowDelete] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<"all" | "ropa" | "tienda">("all")
  const [newGroupName, setNewGroupName] = useState("")
  const [groupValueInputs, setGroupValueInputs] = useState<Record<string, string>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { loadFromSupabase() }, [])

  const storeProducts = products.filter(p => {
    if (p.vendedor_tipo !== "oficial") return false
    if (filterType !== "all" && p.tipo !== filterType) return false
    return true
  })

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = storeProducts.findIndex(p => p.id === active.id)
    const newIndex = storeProducts.findIndex(p => p.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return
    const items = storeProducts.map((p, i) => ({ id: p.id, orden: i }))
    const [moved] = items.splice(oldIndex, 1)
    items.splice(newIndex, 0, moved)
    const reordered = items.map((p, i) => ({ id: p.id, orden: i }))
    reorderProducts(reordered)
  }, [storeProducts, reorderProducts])

  function openNew() { setForm(EMPTY); setShowPrevPrice(false); setEditingId(null); setError(""); setView("type") }
  function selectType(t: "ropa" | "tienda") {
    const matching = categories.filter(c => c.tipo === t)
    const firstCat = matching[0]
    const firstSub = firstCat?.subcategorias?.[0]
    setForm(f => ({ ...f, tipo: t, categoria_id: firstCat?.id || "", subcategoria_id: firstSub?.id || "", estado: t === "ropa" ? "new_tag" : "", talles: [], marca: "", colores: [], variantGroups: [], variantes: [] }))
    setView("form")
  }
  function openEdit(p: AdminProduct) {
    const rawVariants = (p.variantes as unknown as Record<string, unknown>[]) || []
    const variantes: typeof EMPTY.variantes = rawVariants.map((v) => ({
      nombre: (v.nombre as string) || "",
      atributos: (v.atributos as Record<string, string>) || ((v.talle as string) !== undefined ? { Talle: v.talle as string, Color: (v.color as string) || "" } : {}),
      precio: (v.precio as number) ?? p.precio,
      stock: (v.stock as number) ?? 0,
      imagen: (v.imagen as string) || p.imagenes?.[0] || "",
    }))
    const groups = deriveGroups(variantes, p.tipo)
    setForm({ titulo: p.titulo, precio: p.precio, precio_anterior: p.precio_anterior, descripcion: p.descripcion || "", marca: p.marca, categoria_id: p.categoria_id, subcategoria_id: p.subcategoria_id || "", estado: p.estado || "", talles: p.talles || [], colores: p.colores || [], imagenes: p.imagenes || [], variantGroups: groups, variantes, envio_gratis: p.envio_gratis || false, destacado: p.destacado || false, tipo: p.tipo }); setShowPrevPrice(!!p.precio_anterior); setEditingId(p.id); setError(""); setView("form") }
  function addImage() { if (!newImage.trim()) return; setForm(f => ({ ...f, imagenes: [...f.imagenes, newImage.trim()] })); setNewImage("") }
  function removeImage(index: number) {
    const url = form.imagenes[index]
    setForm(f => ({ ...f, imagenes: f.imagenes.filter((_, j) => j !== index) }))
    if (url && url.includes("hvmctiqzjbqsghuwhquk.supabase.co")) {
      setDeletedImages(prev => [...prev, url])
    }
  }
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files; if (!files?.length) return
    setUploading(true)
    for (const file of Array.from(files)) {
      const fd = new FormData(); fd.append("file", file)
      try {
        const res = await fetch("/api/upload", { method: "POST", body: fd })
        const data = await res.json()
        if (data.url) setForm(f => ({ ...f, imagenes: [...f.imagenes, data.url] }))
      } catch { setError("Error al subir imagen") }
    }
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }
  function toggleSize(s: string) { setForm(f => ({ ...f, talles: f.talles.includes(s) ? f.talles.filter(z => z !== s) : [...f.talles, s] })) }
  function addColor() { if (!newColor.trim()) return; setForm(f => ({ ...f, colores: [...f.colores, newColor.trim()] })); setNewColor("") }

  function deriveGroups(variantes: typeof form.variantes, tipo: string) {
    if (tipo === "ropa") return []
    if (!variantes.length) return []
    const groupMap = new Map<string, Set<string>>()
    for (const v of variantes) {
      for (const [key, val] of Object.entries(v.atributos)) {
        if (!groupMap.has(key)) groupMap.set(key, new Set())
        groupMap.get(key)!.add(val)
      }
    }
    return Array.from(groupMap.entries()).map(([name, values], i) => ({
      id: `g-${Date.now()}-${i}`,
      name,
      values: Array.from(values),
    }))
  }

  function addGroup() {
    const name = newGroupName.trim()
    if (!name) return
    if (form.variantGroups.some(g => g.name.toLowerCase() === name.toLowerCase())) {
      setError("Ya existe un grupo con ese nombre"); return
    }
    const id = `g-${Date.now()}`
    setForm(f => ({ ...f, variantGroups: [...f.variantGroups, { id, name, values: [] }] }))
    setNewGroupName("")
    setError("")
  }

  function removeGroup(id: string) {
    setForm(f => ({
      ...f,
      variantGroups: f.variantGroups.filter(g => g.id !== id),
      variantes: f.variantes.map(v => {
        const remaining = f.variantGroups.filter(g => g.id !== id)
        const newAtributos: Record<string, string> = {}
        for (const g of remaining) {
          if (v.atributos[g.name]) newAtributos[g.name] = v.atributos[g.name]
        }
        return { ...v, atributos: newAtributos, nombre: genVariantName(newAtributos) }
      }),
    }))
  }

  function updateGroupName(id: string, name: string) {
    const oldGroup = form.variantGroups.find(g => g.id === id)
    if (!oldGroup) return
    setForm(f => ({
      ...f,
      variantGroups: f.variantGroups.map(g => g.id === id ? { ...g, name } : g),
      variantes: f.variantes.map(v => {
        const newAtributos: Record<string, string> = { ...v.atributos }
        if (oldGroup.name && newAtributos[oldGroup.name] !== undefined) {
          const val = newAtributos[oldGroup.name]
          delete newAtributos[oldGroup.name]
          if (name) newAtributos[name] = val
        }
        return { ...v, atributos: newAtributos, nombre: genVariantName(newAtributos) }
      }),
    }))
  }

  function addGroupValue(groupId: string) {
    const val = (groupValueInputs[groupId] || "").trim()
    if (!val) return
    const group = form.variantGroups.find(g => g.id === groupId)
    if (group && group.values.includes(val)) return
    setForm(f => ({
      ...f,
      variantGroups: f.variantGroups.map(g => g.id === groupId ? { ...g, values: [...g.values, val] } : g),
    }))
    setGroupValueInputs(prev => ({ ...prev, [groupId]: "" }))
  }

  function removeGroupValue(groupId: string, value: string) {
    setForm(f => ({
      ...f,
      variantGroups: f.variantGroups.map(g => g.id === groupId ? { ...g, values: g.values.filter(v => v !== value) } : g),
    }))
  }

  function genVariantName(atributos: Record<string, string>) {
    return Object.entries(atributos).map(([k, v]) => `${k}: ${v}`).join(" / ")
  }

  function addVariant() {
    if (!isRopa && form.variantGroups.length === 0) {
      setError("Agregá al menos un grupo de atributos antes de crear variantes"); return
    }
    setError("")
    const firstImage = form.imagenes[0] || ""
    if (isRopa) {
      setForm(f => ({
        ...f,
        variantes: [...f.variantes, {
          nombre: `${f.talles[0] || ""} / ${f.colores[0] || ""}`,
          atributos: { Talle: f.talles[0] || "", Color: f.colores[0] || "" },
          precio: f.precio,
          stock: 1,
          imagen: firstImage,
        }],
      }))
    } else {
      const atributos: Record<string, string> = {}
      for (const g of form.variantGroups) {
        atributos[g.name] = g.values[0] || ""
      }
      setForm(f => ({
        ...f,
        variantes: [...f.variantes, {
          nombre: genVariantName(atributos),
          atributos,
          precio: f.precio,
          stock: 1,
          imagen: firstImage,
        }],
      }))
    }
  }

  function removeVariant(i: number) {
    setForm(f => ({ ...f, variantes: f.variantes.filter((_, j) => j !== i) }))
  }

  function updateVariantAttr(i: number, attrName: string, value: string) {
    setForm(f => ({
      ...f,
      variantes: f.variantes.map((v, j) => {
        if (j !== i) return v
        const newAtributos = { ...v.atributos, [attrName]: value }
        return { ...v, atributos: newAtributos, nombre: genVariantName(newAtributos) }
      }),
    }))
  }

  function validate(): boolean { if (!form.titulo.trim()) { setError("El título es obligatorio"); return false }; if (!form.precio || form.precio <= 0) { setError("El precio debe ser mayor a 0"); return false }; if (form.imagenes.length === 0) { setError("Agregá al menos una imagen"); return false }; if (form.tipo === "ropa" && form.talles.length === 0) { setError("Seleccioná al menos un talle"); return false }; return true }
  async function handleSubmit(e: React.FormEvent) { e.preventDefault(); if (!validate()) return; setSaving(true); try { const data = { ...form, precio_anterior: showPrevPrice ? form.precio_anterior : undefined }; if (editingId) await updateStoreProduct(editingId, data); else await addStoreProduct(data); if (deletedImages.length > 0) { const paths = deletedImages.map(url => { const parts = url.split("/productos/"); return parts[1]?.split("?")[0] }).filter(Boolean) as string[]; if (paths.length > 0) { fetch("/api/imagenes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ paths }) }).catch(() => {}) } } setDeletedImages([]); setView("list") } catch (err: unknown) { setError(err instanceof Error ? err.message : "Error al guardar el producto") } finally { setSaving(false) } }

  if (!loaded) return <div className="p-5 lg:pt-7 text-sm text-text-muted">Cargando...</div>

  if (view === "list") return (
    <div className="p-5 lg:p-7 lg:pt-7 space-y-5 max-w-4xl">
      <div className="flex items-center justify-between"><div><h1 className="font-display text-2xl text-text-strong">Tienda La Percha</h1><p className="text-sm text-text-muted mt-1">{storeProducts.length} productos</p></div><button onClick={openNew} className="flex items-center gap-1.5 bg-brand text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-brand-hover transition-colors"><Plus className="w-4 h-4" /> Nuevo</button></div>
      <div className="flex gap-2 overflow-x-auto pb-1">{[{ v: "all" as const, l: "Todos" }, { v: "ropa" as const, l: "Ropa" }, { v: "tienda" as const, l: "Tienda" }].map(f => <button key={f.v} onClick={() => setFilterType(f.v)} className={`shrink-0 px-3.5 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition-colors ${filterType === f.v ? 'bg-brand text-white' : 'bg-surface-sunken text-text-body'}`}>{f.l}</button>)}</div>
       {storeProducts.length === 0 ? <div className="bg-surface-card rounded-xl border border-border-subtle px-4 py-16 text-center text-sm text-text-muted">No hay productos. Tocá &ldquo;Nuevo&rdquo; para agregar el primero.</div> : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={storeProducts.map(p => p.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {storeProducts.map(p => <SortableProductRow key={p.id} p={p} onEdit={() => openEdit(p)} onDelete={() => setShowDelete(p.id)} />)}
            </div>
          </SortableContext>
        </DndContext>
      )}
      {showDelete && <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center"><div className="absolute inset-0 bg-carob-900/40 backdrop-blur-sm" onClick={() => setShowDelete(null)} /><div className="relative bg-surface-card rounded-t-2xl lg:rounded-2xl p-6 w-full lg:max-w-sm"><p className="font-semibold text-text-strong mb-2">¿Eliminar producto?</p><p className="text-sm text-text-muted mb-5">Esta acción no se puede deshacer.</p><div className="flex gap-3"><button onClick={() => setShowDelete(null)} className="flex-1 h-10 rounded-full border border-border-default text-sm font-semibold">Cancelar</button><button onClick={() => { removeStoreProduct(showDelete); setShowDelete(null) }} className="flex-1 h-10 rounded-full bg-error-500 text-white text-sm font-semibold">Eliminar</button></div></div></div>}
    </div>
  )

  if (view === "type") return (
    <div className="p-5 lg:p-7 lg:pt-7 space-y-6 max-w-lg mx-auto">
      <button onClick={() => setView("list")} className="flex items-center gap-1 text-sm text-text-muted hover:text-text-strong transition-colors"><ChevronLeft className="w-4 h-4" /> Volver</button>
      <div><h1 className="font-display text-2xl text-text-strong">Nuevo producto</h1><p className="text-sm text-text-muted mt-1">¿Qué tipo de producto vas a publicar?</p></div>
      <div className="grid grid-cols-1 gap-4">
        <button onClick={() => selectType("ropa")} className="flex items-center gap-4 p-5 rounded-2xl border-2 border-border-subtle hover:border-matcha-500 bg-surface-card text-left transition-all"><div className="w-14 h-14 rounded-xl bg-matcha-100 flex items-center justify-center shrink-0"><Shirt className="w-7 h-7 text-matcha-600" /></div><div><p className="font-semibold text-text-strong text-lg">Prenda de ropa</p><p className="text-xs text-text-muted mt-0.5">Camisas, pantalones, vestidos, calzado, accesorios, kids</p></div></button>
        <button onClick={() => selectType("tienda")} className="flex items-center gap-4 p-5 rounded-2xl border-2 border-border-subtle hover:border-chai-400 bg-surface-card text-left transition-all"><div className="w-14 h-14 rounded-xl bg-chai-100 flex items-center justify-center shrink-0"><Store className="w-7 h-7 text-chai-600" /></div><div><p className="font-semibold text-text-strong text-lg">Tienda</p><p className="text-xs text-text-muted mt-0.5">Bazar, regalería, decoración, velas, tazas y más</p></div></button>
      </div>
    </div>
  )

  const isRopa = form.tipo === "ropa"
  const catOpts = categories.filter(c => !c.tipo || c.tipo === form.tipo)
  const subs = categories.find(c => c.id === form.categoria_id)?.subcategorias || []

  return (
    <div className="p-5 lg:p-7 lg:pt-7 space-y-5 max-w-2xl mx-auto">
      <div className="flex items-center gap-3"><button onClick={() => setView("list")} className="w-8 h-8 rounded-full bg-surface-sunken flex items-center justify-center shrink-0"><ChevronLeft className="w-4 h-4 text-text-muted" /></button><div><h1 className="font-display text-xl text-text-strong">{editingId ? "Editar producto" : "Nuevo producto"}</h1><p className="text-xs text-text-muted">{isRopa ? "Prenda de ropa" : "Tienda"}</p></div></div>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div><label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wide mb-1">Título *</label><input required value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} placeholder="ej: Vestido lino sage" className="w-full h-11 px-4 rounded-xl bg-surface-sunken text-sm border border-transparent focus:border-brand outline-none" /></div>
        <div><label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wide mb-1">Precio *</label><input required type="number" value={form.precio || ""} onChange={e => setForm(f => ({ ...f, precio: Number(e.target.value) }))} className="w-full h-11 px-4 rounded-xl bg-surface-sunken text-sm border border-transparent focus:border-brand outline-none" /></div>
        <div><button type="button" onClick={() => setShowPrevPrice(!showPrevPrice)} className={`flex items-center gap-2 text-xs font-semibold transition-colors ${showPrevPrice ? 'text-text-strong' : 'text-text-muted'}`}><div className={`w-9 h-5 rounded-full transition-colors ${showPrevPrice ? 'bg-matcha-500' : 'bg-border-default'}`}><div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform mt-0.5 ${showPrevPrice ? 'ml-4' : 'ml-0.5'}`} /></div>Mostrar precio tachado</button>{showPrevPrice && <input type="number" value={form.precio_anterior || ""} onChange={e => setForm(f => ({ ...f, precio_anterior: Number(e.target.value) }))} placeholder="Precio anterior" className="w-full h-11 px-4 mt-3 rounded-xl bg-surface-sunken text-sm border border-transparent focus:border-brand outline-none" />}</div>
        {isRopa && <div><label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wide mb-1">Marca</label><input value={form.marca || ""} onChange={e => setForm(f => ({ ...f, marca: e.target.value }))} placeholder="ej: Zara, COS, Adidas" className="w-full h-11 px-4 rounded-xl bg-surface-sunken text-sm border border-transparent focus:border-brand outline-none" /></div>}
        {isRopa && <div><label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wide mb-1">Material</label><input value={form.material || ""} onChange={e => setForm(f => ({ ...f, material: e.target.value }))} placeholder="ej: Algodón, Lino, Seda, Cuero" className="w-full h-11 px-4 rounded-xl bg-surface-sunken text-sm border border-transparent focus:border-brand outline-none" /></div>}
        <div className="grid grid-cols-2 gap-3">
          <div><label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wide mb-1">Categoría</label><select value={form.categoria_id} onChange={e => { const v = e.target.value; const foundCat = categories.find(c => c.id === v); setForm(f => ({ ...f, categoria_id: v, subcategoria_id: foundCat?.subcategorias?.[0]?.id || "" })) }} className="w-full h-11 px-3 rounded-xl bg-surface-sunken text-sm border border-transparent focus:border-brand outline-none"><option value="">Sin categoría</option>{catOpts.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}</select></div>
          <div><label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wide mb-1">Subcategoría</label><select value={form.subcategoria_id} onChange={e => setForm(f => ({ ...f, subcategoria_id: e.target.value }))} className="w-full h-11 px-3 rounded-xl bg-surface-sunken text-sm border border-transparent focus:border-brand outline-none"><option value="">Sin subcategoría</option>{subs.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}</select></div>
        </div>
        {isRopa && <div><label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wide mb-1.5">Estado *</label><div className="flex flex-wrap gap-2">{CONDITIONS.map(c => <button key={c.v} type="button" onClick={() => setForm(f => ({ ...f, estado: c.v }))} className={`px-3.5 py-1.5 rounded-full text-[11px] font-semibold border transition-colors ${form.estado === c.v ? 'bg-brand text-white border-brand' : 'bg-surface-sunken text-text-body border-transparent'}`}>{c.l}</button>)}</div></div>}
        {isRopa && <div><label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wide mb-1.5">Talles *</label><div className="flex flex-wrap gap-2">{SIZES.map(s => <button key={s} type="button" onClick={() => toggleSize(s)} className={`px-3.5 py-1.5 rounded-full text-[11px] font-semibold border transition-colors ${form.talles.includes(s) ? 'bg-brand text-white border-brand' : 'bg-surface-sunken text-text-body border-transparent'}`}>{s}</button>)}</div></div>}
        <div><label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wide mb-1.5">Colores</label><div className="flex flex-wrap gap-2 mb-3">{COLORES.map(c => <button key={c} type="button" onClick={() => setForm(f => ({ ...f, colores: f.colores.includes(c) ? f.colores.filter(x => x !== c) : [...f.colores, c] }))} className={`px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-colors ${form.colores.includes(c) ? 'bg-surface-inverse text-white border-surface-inverse' : 'bg-surface-sunken text-text-body border-transparent'}`}>{c}</button>)}</div><div className="flex gap-2"><input value={newColor} onChange={e => setNewColor(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addColor() } }} placeholder="Agregar color..." className="flex-1 h-9 px-3 rounded-lg bg-surface-sunken text-xs border border-transparent focus:border-brand outline-none" /><button type="button" onClick={addColor} className="px-3 h-9 rounded-full bg-surface-sunken text-xs font-semibold hover:bg-matcha-100 transition-colors">+</button></div></div>
        <div>
          <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wide mb-1.5">Imágenes *</label>
          {form.imagenes.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2 mb-3">
              {form.imagenes.map((url, i) => (
                <div key={i} className="relative shrink-0">
                  <img src={url} alt="" className="w-20 h-26 rounded-lg object-cover" />
                  <button type="button" onClick={() => removeImage(i)} className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-error-500 text-white flex items-center justify-center"><X className="w-3 h-3" /></button>
                </div>
              ))}
            </div>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileUpload} className="hidden" />
          <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="w-full h-24 rounded-xl border-2 border-dashed border-border-default bg-surface-sunken flex flex-col items-center justify-center gap-1.5 text-text-muted hover:border-brand hover:text-brand transition-colors disabled:opacity-50">
            {uploading ? (
              <span className="text-sm">Subiendo...</span>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                <span className="text-xs font-semibold">Subir imágenes</span>
                <span className="text-[10px]">JPG, PNG, WebP hasta 10MB</span>
              </>
            )}
          </button>
          <p className="text-[10px] text-text-muted mt-2 text-center">o pegá una URL</p>
          <div className="flex gap-2 mt-2">
            <input value={newImage} onChange={e => setNewImage(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addImage() } }} placeholder="URL de la imagen..." className="flex-1 h-11 px-4 rounded-xl bg-surface-sunken text-sm border border-transparent focus:border-brand outline-none" />
            <button type="button" onClick={addImage} className="h-11 px-4 rounded-full bg-surface-sunken flex items-center gap-1.5 text-sm font-semibold hover:bg-matcha-100 transition-colors"><Upload className="w-4 h-4" /> +</button>
          </div>
        </div>
        {/* ── Atributos del producto (solo tienda) ── */}
        {!isRopa && (
          <div>
            <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wide mb-2">Atributos del producto</label>
            {form.variantGroups.map(group => (
              <div key={group.id} className="mb-3 bg-surface-sunken rounded-xl p-3">
                <div className="flex items-center gap-2 mb-2">
                  <input
                    value={group.name}
                    onChange={e => updateGroupName(group.id, e.target.value)}
                    placeholder="Nombre del atributo (ej: Color)"
                    className="flex-1 h-8 px-3 rounded-lg bg-white text-xs border border-transparent focus:border-brand outline-none"
                  />
                  <button type="button" onClick={() => removeGroup(group.id)} className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-error-50 shrink-0"><X className="w-3 h-3 text-error-500" /></button>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {group.values.map(val => (
                    <span key={val} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white text-[11px] font-medium border border-border-subtle">
                      {val}
                      <button type="button" onClick={() => removeGroupValue(group.id, val)} className="hover:text-error-500">&times;</button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    value={groupValueInputs[group.id] || ""}
                    onChange={e => setGroupValueInputs(prev => ({ ...prev, [group.id]: e.target.value }))}
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addGroupValue(group.id) } }}
                    placeholder="Agregar valor..."
                    className="flex-1 h-8 px-3 rounded-lg bg-white text-[11px] border border-transparent focus:border-brand outline-none"
                  />
                  <button type="button" onClick={() => addGroupValue(group.id)} className="px-3 h-8 rounded-full bg-white text-[11px] font-semibold hover:bg-matcha-100 transition-colors">+</button>
                </div>
              </div>
            ))}
            <div className="flex gap-2">
              <input
                value={newGroupName}
                onChange={e => setNewGroupName(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addGroup() } }}
                placeholder="Nombre del nuevo atributo (ej: Olor)..."
                className="flex-1 h-9 px-3 rounded-lg bg-surface-sunken text-xs border border-transparent focus:border-brand outline-none"
              />
              <button type="button" onClick={addGroup} className="px-4 h-9 rounded-full bg-surface-sunken text-xs font-semibold hover:bg-matcha-100 transition-colors">+ Agregar</button>
            </div>
          </div>
        )}

        {/* ── Variantes ── */}
        {(isRopa || form.variantGroups.length > 0) && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-semibold text-text-muted uppercase tracking-wide">
                {isRopa ? 'Variantes (talle × color)' : 'Variantes'}
              </label>
              <button type="button" onClick={addVariant} className="text-[11px] font-semibold text-matcha-600 hover:text-matcha-700">+ Agregar</button>
            </div>
            {form.variantes.length > 0 && (
              <div className="space-y-2 mb-3">
                {form.variantes.map((v, i) => (
                  <div key={i} className="flex items-center gap-2 bg-surface-sunken rounded-lg p-2 flex-wrap">
                    {isRopa ? (
                      <>
                        <select
                          value={v.atributos.Talle || ""}
                          onChange={e => updateVariantAttr(i, "Talle", e.target.value)}
                          className="h-8 px-2 rounded-lg bg-white text-[11px] border border-transparent outline-none"
                        >
                          <option value="">Talle</option>
                          {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <select
                          value={v.atributos.Color || ""}
                          onChange={e => updateVariantAttr(i, "Color", e.target.value)}
                          className="h-8 px-2 rounded-lg bg-white text-[11px] border border-transparent outline-none"
                        >
                          <option value="">Color</option>
                          {[...COLORES, ...form.colores.filter(c => !COLORES.includes(c))].map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </>
                    ) : (
                      form.variantGroups.map(group => (
                        <select
                          key={group.id}
                          value={v.atributos[group.name] || ""}
                          onChange={e => updateVariantAttr(i, group.name, e.target.value)}
                          className={`h-8 px-2 rounded-lg bg-white text-[11px] border border-transparent outline-none ${group.name.length > 8 ? 'w-24' : 'w-auto'}`}
                        >
                          <option value="">{group.name}</option>
                          {group.values.map(val => <option key={val} value={val}>{val}</option>)}
                        </select>
                      ))
                    )}
                    <input type="number" value={v.precio || ""} onChange={e => setForm(f => ({ ...f, variantes: f.variantes.map((x, j) => j === i ? { ...x, precio: Number(e.target.value) } : x) }))} placeholder="$" className="w-16 h-8 px-2 rounded-lg bg-white text-[11px] border border-transparent outline-none" />
                    <input type="number" value={v.stock || ""} onChange={e => setForm(f => ({ ...f, variantes: f.variantes.map((x, j) => j === i ? { ...x, stock: Number(e.target.value) } : x) }))} placeholder="Stock" className="w-14 h-8 px-2 rounded-lg bg-white text-[11px] border border-transparent outline-none" />
                    <button type="button" onClick={() => removeVariant(i)} className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-error-50"><X className="w-3 h-3 text-error-500" /></button>
                  </div>
                ))}
              </div>
            )}
            {form.variantes.length > 0 && <p className="text-[10px] text-text-muted">Si usás variantes, el precio y stock de cada una reemplaza al precio y stock general del producto.</p>}
          </div>
        )}
        <div><label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wide mb-1">Descripción</label><textarea value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} rows={3} placeholder="Describí el producto..." className="w-full px-4 py-3 rounded-xl bg-surface-sunken text-sm border border-transparent focus:border-brand outline-none resize-none" /></div>
        <div className="space-y-3"><label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={form.envio_gratis} onChange={e => setForm(f => ({ ...f, envio_gratis: e.target.checked }))} className="accent-brand w-4 h-4 rounded" /><span className="flex items-center gap-1.5 text-sm text-text-body"><Truck className="w-4 h-4 text-success-500" /> Envío gratis</span></label><label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={form.destacado} onChange={e => setForm(f => ({ ...f, destacado: e.target.checked }))} className="accent-brand w-4 h-4 rounded" /><span className="flex items-center gap-1.5 text-sm text-text-body"><Star className="w-4 h-4 text-chai-500 fill-chai-500" /> Producto destacado</span></label></div>
        {error && <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-error-50 text-error-600 text-sm"><AlertCircle className="w-4 h-4 shrink-0" />{error}</div>}
        <button type="submit" disabled={saving} className="w-full h-12 bg-brand text-white font-semibold rounded-full text-sm hover:bg-brand-hover transition-colors disabled:opacity-50">{saving ? "Guardando..." : editingId ? "Guardar cambios" : "Publicar producto"}</button>
      </form>
    </div>
  )
}

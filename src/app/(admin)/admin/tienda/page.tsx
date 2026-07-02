"use client"
import { useEffect, useRef, useState, useCallback } from "react"
import { useAdminStore, type StoreProductForm, type AdminProduct } from "@/store/useAdminStore"
import type { ProductType, Variante } from "@/lib/types"
import { Plus, X, Pencil, Trash2, ChevronLeft, ChevronDown, ChevronUp, Star, Truck, Upload, AlertCircle, Shirt, Gift, Utensils, Sofa, GripVertical } from "lucide-react"
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core"
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

const TIPOS: { v: ProductType; l: string; d: string; icon: React.ReactNode; colorClass: string }[] = [
  { v: "ropa", l: "Ropa", d: "Camisas, pantalones, vestidos, calzado, accesorios, kids", icon: <Shirt className="w-7 h-7 text-matcha-600" />, colorClass: "border-matcha-500 bg-matcha-100" },
  { v: "regaleria", l: "Regalería", d: "Velas, tazas, sets de regalo, agendas, mates", icon: <Gift className="w-7 h-7 text-chai-600" />, colorClass: "border-chai-400 bg-chai-100" },
  { v: "bazar", l: "Bazar", d: "Vajilla, utensilios, vasos, sets de cocina", icon: <Utensils className="w-7 h-7 text-lavender-600" />, colorClass: "border-lavender-400 bg-lavender-100" },
  { v: "decoracion", l: "Decoración", d: "Espejos, cuadros, macetas, portavelas, adornos", icon: <Sofa className="w-7 h-7 text-rose-600" />, colorClass: "border-rose-400 bg-rose-100" },
]

const CONDITIONS = [
  { v: "new_tag", l: "Nuevo con etiqueta" },
  { v: "new", l: "Nuevo" },
  { v: "like_new", l: "Como nuevo" },
  { v: "used", l: "Usado" },
]

const SIZES = ["XS", "S", "M", "L", "XL", "Único"]
const COLORES = ["Negro", "Blanco", "Beige", "Gris", "Verde", "Azul", "Rojo", "Rosa", "Amarillo", "Marrón"]

function shortId() { return Math.random().toString(36).slice(2, 8) }

const EMPTY: StoreProductForm = {
  titulo: "", precio: 0, descripcion: "", marca: "", material: "",
  categoria_id: "", subcategoria_id: "", estado: "",
  talles: [], colores: [], imagenes: [], variantes: [],
  envio_gratis: false, destacado: false, tipo: "ropa",
}

function SortableProductRow({ p, onEdit, onDelete }: { p: AdminProduct; onEdit: () => void; onDelete: () => void }) {
  const totalStock = p.variantes && p.variantes.length > 0
    ? p.variantes.reduce((s, v) => s + (v.stock || 0), 0)
    : (p.stock ?? 0)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: p.id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }
  return (
    <div ref={setNodeRef} style={style} className="bg-surface-card rounded-xl border border-border-subtle p-3 flex items-center gap-3">
      <button {...attributes} {...listeners} className="shrink-0 cursor-grab active:cursor-grabbing touch-none"><GripVertical className="w-4 h-4 text-text-muted" /></button>
      <img src={p.imagenes?.[0] || ""} alt="" className="w-14 h-18 rounded-lg object-cover shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className="text-sm font-semibold text-text-strong truncate">{p.titulo}</p>
          {p.destacado && <Star className="w-3 h-3 text-chai-500 fill-chai-500" />}
          {p.envio_gratis && <Truck className="w-3 h-3 text-success-500" />}
        </div>
        <p className="text-xs text-text-muted">
          {p.categoria_id}{p.subcategoria_id ? ` · ${p.subcategoria_id}` : ""}
          {p.marca ? ` · ${p.marca}` : ""}
          <span className="ml-1 px-1 py-0.5 rounded text-[9px] bg-surface-sunken">{p.tipo}</span>
        </p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <p className="text-sm font-bold text-price">${p.precio.toLocaleString("es-AR")}</p>
          {p.precio_anterior && <p className="text-[11px] text-text-muted line-through">${p.precio_anterior.toLocaleString("es-AR")}</p>}
          <span className={`text-[10px] font-semibold ${totalStock > 0 ? 'text-success-600' : 'text-error-500'}`}>
            {totalStock > 0 ? `Stock: ${totalStock}` : "Sin stock"}
          </span>
        </div>
        {p.talles && p.talles.length > 0 && (
          <div className="flex gap-1 mt-1">{p.talles.map(s => <span key={s} className="px-1.5 py-0.5 rounded text-[9px] bg-surface-sunken text-text-muted">{s}</span>)}</div>
        )}
      </div>
      <div className="flex gap-1 shrink-0">
        <button onClick={onEdit} className="w-7 h-7 rounded-full bg-surface-sunken flex items-center justify-center hover:bg-matcha-100 transition-colors"><Pencil className="w-3.5 h-3.5 text-text-muted" /></button>
        <button onClick={onDelete} className="w-7 h-7 rounded-full bg-surface-sunken flex items-center justify-center hover:bg-error-50 hover:text-error-500 transition-colors"><Trash2 className="w-3.5 h-3.5 text-text-muted" /></button>
      </div>
    </div>
  )
}

export default function TiendaPage() {
  const { products, loaded, categories, loadFromSupabase, addStoreProduct, updateStoreProduct, removeStoreProduct, reorderProducts, addSubcategory } = useAdminStore()
  const [view, setView] = useState<"list" | "type" | "form">("list")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<StoreProductForm>(EMPTY)
  const [showPrevPrice, setShowPrevPrice] = useState(false)
  const [newImage, setNewImage] = useState("")
  const [newColor, setNewColor] = useState("")
  const [customTalle, setCustomTalle] = useState("")
  const [customSizeVal, setCustomSizeVal] = useState("")
  const [hasVariants, setHasVariants] = useState(false)
  const [variantsOpen, setVariantsOpen] = useState(false)
  const [newSubName, setNewSubName] = useState("")
  const [addingSub, setAddingSub] = useState(false)
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [deletedImages, setDeletedImages] = useState<string[]>([])
  const [showDelete, setShowDelete] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<"all" | ProductType>("all")
  const [typeChangeWarning, setTypeChangeWarning] = useState<ProductType | null>(null)
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

  const isRopa = form.tipo === "ropa"
  const tallesLabel = isRopa ? "Talles" : "Tamaño/Set"
  const defaultColoresLabel = isRopa ? "Colores" : form.tipo === "regaleria" ? "Sabores / Aroma" : "Colores"
  const [coloresLabel, setColoresLabel] = useState(defaultColoresLabel)
  const [editingColoresLabel, setEditingColoresLabel] = useState(false)
  const catOpts = categories.filter(c => !c.tipo || c.tipo === form.tipo)
  const selectedCat = categories.find(c => c.id === form.categoria_id)
  const subs = selectedCat?.subcategorias || []
  const totalVariantStock = form.variantes.reduce((s, v) => s + (v.stock || 0), 0)

  function openNew() {
    setForm(EMPTY); setShowPrevPrice(false); setEditingId(null); setError("")
    setHasVariants(false); setVariantsOpen(false); setDeletedImages([]); setNewImage("")
    setNewColor(""); setCustomTalle(""); setCustomSizeVal(""); setNewSubName(""); setAddingSub(false)
    setView("type")
  }

  function selectType(t: ProductType) {
    const matching = categories.filter(c => c.tipo === t)
    const firstCat = matching[0]
    const firstSub = firstCat?.subcategorias?.[0]
    setForm(_f => ({
      ...EMPTY,
      tipo: t,
      categoria_id: firstCat?.id || "",
      subcategoria_id: firstSub?.id || "",
      estado: t === "ropa" ? "new_tag" : "",
    }))
    setHasVariants(false)
    setVariantsOpen(false)
    setShowPrevPrice(false)
    setColoresLabel(t === "ropa" ? "Colores" : t === "regaleria" ? "Sabores / Aroma" : "Colores")
    setView("form")
  }

  function openEdit(p: AdminProduct) {
    const rawVariants = (p.variantes as unknown as Record<string, unknown>[]) || []
    const variantes: Variante[] = rawVariants.map((v) => ({
      id: (v.id as string) || shortId(),
      talle: (v.talle as string) || "",
      color: (v.color as string) || "",
      precio: (v.precio as number) ?? p.precio,
      stock: (v.stock as number) ?? 0,
      imagen: (v.imagen as string) || p.imagenes?.[0] || "",
    }))
    const hasVars = variantes.length > 0
    setForm({
      titulo: p.titulo, precio: p.precio, precio_anterior: p.precio_anterior,
      descripcion: p.descripcion || "", marca: p.marca, material: p.material,
      categoria_id: p.categoria_id, subcategoria_id: p.subcategoria_id || "",
      estado: p.estado || "", talles: p.talles || [], colores: p.colores || [],
      imagenes: p.imagenes || [], variantes,
      envio_gratis: p.envio_gratis || false, destacado: p.destacado || false,
      tipo: p.tipo,
    })
    setShowPrevPrice(!!p.precio_anterior)
    setHasVariants(hasVars)
    setVariantsOpen(hasVars)
    setColoresLabel(p.tipo === "ropa" ? "Colores" : p.tipo === "regaleria" ? "Sabores / Aroma" : "Colores")
    setEditingId(p.id)
    setError("")
    setDeletedImages([])
    setView("form")
  }

  function handleTypeChange(t: ProductType) {
    if (editingId && t !== form.tipo && (form.talles.length > 0 || form.estado || form.variantes.length > 0)) {
      setTypeChangeWarning(t)
      return
    }
    const matching = categories.filter(c => c.tipo === t)
    const firstCat = matching[0]
    const firstSub = firstCat?.subcategorias?.[0]
    setForm(f => ({
      ...f,
      tipo: t,
      categoria_id: firstCat?.id || "",
      subcategoria_id: firstSub?.id || "",
      estado: t === "ropa" ? f.estado || "new_tag" : "",
      talles: t === "ropa" ? f.talles : [],
      variantes: [],
    }))
    setHasVariants(false)
    setVariantsOpen(false)
    setColoresLabel(t === "ropa" ? "Colores" : t === "regaleria" ? "Sabores / Aroma" : "Colores")
  }

  function confirmTypeChange() {
    if (!typeChangeWarning) return
    handleTypeChange(typeChangeWarning)
    setTypeChangeWarning(null)
  }

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

  function toggleSize(s: string) {
    setForm(f => ({
      ...f,
      talles: f.talles.includes(s) ? f.talles.filter(z => z !== s) : [...f.talles, s],
      variantes: f.talles.includes(s) ? f.variantes.filter(v => v.talle !== s) : f.variantes,
    }))
  }
  function addCustomTalle() { if (!customTalle.trim()) return; setForm(f => ({ ...f, talles: [...f.talles, customTalle.trim()] })); setCustomTalle("") }
  function addCustomSize() { if (!customSizeVal.trim()) return; setForm(f => ({ ...f, talles: [...f.talles, customSizeVal.trim()] })); setCustomSizeVal("") }
  function removeSize(s: string) {
    setForm(f => ({
      ...f,
      talles: f.talles.filter(t => t !== s),
      variantes: f.variantes.filter(v => v.talle !== s),
    }))
  }

  function toggleColor(c: string) {
    setForm(f => ({ ...f, colores: f.colores.includes(c) ? f.colores.filter(x => x !== c) : [...f.colores, c] }))
  }
  function addColor() { if (!newColor.trim()) return; setForm(f => ({ ...f, colores: [...f.colores, newColor.trim()] })); setNewColor("") }
  function removeColor(c: string) {
    setForm(f => ({
      ...f,
      colores: f.colores.filter(x => x !== c),
      variantes: f.variantes.filter(v => v.color !== c),
    }))
  }

  function addVariant() {
    setForm(f => ({
      ...f,
      variantes: [
        ...f.variantes,
        {
          id: shortId(),
          talle: f.talles[0] || "",
          color: f.colores[0] || "",
          precio: f.precio,
          stock: 1,
          imagen: f.imagenes[0] || "",
        },
      ],
    }))
  }

  function generateAllVariants() {
    const talleList = form.talles.length > 0 ? form.talles : [""]
    const colorList = form.colores.length > 0 ? form.colores : [""]
    const existingKeys = new Set(form.variantes.map(v => `${v.talle}||${v.color}`))
    const newVariants = [...form.variantes]
    for (const talle of talleList) {
      for (const color of colorList) {
        const key = `${talle}||${color}`
        if (!existingKeys.has(key)) {
          newVariants.push({
            id: shortId(),
            talle,
            color,
            precio: form.precio,
            stock: 1,
            imagen: form.imagenes[0] || "",
          })
          existingKeys.add(key)
        }
      }
    }
    setForm(f => ({ ...f, variantes: newVariants }))
  }

  function updateVariantField(i: number, field: keyof Variante, value: string | number) {
    setForm(f => ({
      ...f,
      variantes: f.variantes.map((v, j) => j === i ? { ...v, [field]: value } : v),
    }))
  }

  function removeVariant(i: number) {
    setForm(f => ({ ...f, variantes: f.variantes.filter((_, j) => j !== i) }))
  }

  function validate(): boolean {
    if (!form.titulo.trim()) { setError("El título es obligatorio"); return false }
    if (!form.precio || form.precio <= 0) { setError("El precio debe ser mayor a 0"); return false }
    if (form.imagenes.length === 0) { setError("Agregá al menos una imagen"); return false }
    if (!form.categoria_id) { setError("Seleccioná una categoría"); return false }
    if (isRopa && !form.estado) { setError("Seleccioná el estado de la prenda"); return false }
    if (isRopa && !hasVariants && form.talles.length === 0) { setError("Seleccioná al menos un talle"); return false }
    if (hasVariants) {
      if (form.variantes.length === 0) { setError("Agregá al menos una variante"); return false }
      if (!form.variantes.some(v => (v.stock || 0) > 0)) { setError("Al menos una variante debe tener stock > 0"); return false }
      const keys = new Set<string>()
      for (const v of form.variantes) {
        const k = `${v.talle}||${v.color}`
        if (keys.has(k)) { setError("Hay variantes duplicadas (mismo talle + color)"); return false }
        keys.add(k)
      }
    } else {
      const stock = form.variantes.length > 0 ? totalVariantStock : form.talles.length > 0 ? 0 : 1
      if (stock < 0) { setError("El stock no puede ser negativo"); return false }
    }
    return true
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); if (!validate()) return; setSaving(true)
    try {
      const data: StoreProductForm = {
        ...form,
        precio_anterior: showPrevPrice ? form.precio_anterior : undefined,
        variantes: hasVariants ? form.variantes : [],
      }
      if (editingId) await updateStoreProduct(editingId, data)
      else await addStoreProduct(data)
      if (deletedImages.length > 0) {
        const paths = deletedImages.map(url => {
          const parts = url.split("/productos/")
          return parts[1]?.split("?")[0]
        }).filter(Boolean) as string[]
        if (paths.length > 0) {
          fetch("/api/imagenes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ paths }) }).catch(() => {})
        }
      }
      setDeletedImages([])
      setView("list")
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al guardar el producto")
    } finally { setSaving(false) }
  }

  async function handleAddSubcategory() {
    if (!newSubName.trim() || !form.categoria_id) return
    setAddingSub(true)
    try {
      await addSubcategory(form.categoria_id, newSubName.trim())
      setNewSubName("")
      setAddingSub(false)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al crear subcategoría")
      setAddingSub(false)
    }
  }

  if (!loaded) return <div className="p-5 lg:pt-7 text-sm text-text-muted">Cargando...</div>

  if (view === "list") return (
    <div className="p-5 lg:p-7 lg:pt-7 space-y-5 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-text-strong">Tienda La Percha</h1>
          <p className="text-sm text-text-muted mt-1">{storeProducts.length} productos</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-1.5 bg-brand text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-brand-hover transition-colors">
          <Plus className="w-4 h-4" /> Nuevo
        </button>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {[
          { v: "all" as const, l: "Todos" },
          { v: "ropa" as const, l: "Ropa" },
          { v: "regaleria" as const, l: "Regalería" },
          { v: "bazar" as const, l: "Bazar" },
          { v: "decoracion" as const, l: "Decoración" },
        ].map(f => (
          <button
            key={f.v}
            onClick={() => setFilterType(f.v)}
            className={`shrink-0 px-3.5 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition-colors ${filterType === f.v ? 'bg-brand text-white' : 'bg-surface-sunken text-text-body'}`}
          >
            {f.l}
          </button>
        ))}
      </div>
      {storeProducts.length === 0 ? (
        <div className="bg-surface-card rounded-xl border border-border-subtle px-4 py-16 text-center text-sm text-text-muted">
          No hay productos. Tocá &ldquo;Nuevo&rdquo; para agregar el primero.
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={storeProducts.map(p => p.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {storeProducts.map(p => (
                <SortableProductRow key={p.id} p={p} onEdit={() => openEdit(p)} onDelete={() => setShowDelete(p.id)} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center">
          <div className="absolute inset-0 bg-carob-900/40 backdrop-blur-sm" onClick={() => setShowDelete(null)} />
          <div className="relative bg-surface-card rounded-t-2xl lg:rounded-2xl p-6 w-full lg:max-w-sm">
            <p className="font-semibold text-text-strong mb-2">¿Eliminar producto?</p>
            <p className="text-sm text-text-muted mb-5">Esta acción no se puede deshacer.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDelete(null)} className="flex-1 h-10 rounded-full border border-border-default text-sm font-semibold">Cancelar</button>
              <button onClick={() => { removeStoreProduct(showDelete); setShowDelete(null) }} className="flex-1 h-10 rounded-full bg-error-500 text-white text-sm font-semibold">Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  if (view === "type") return (
    <div className="p-5 lg:p-7 lg:pt-7 space-y-6 max-w-lg mx-auto">
      <button onClick={() => setView("list")} className="flex items-center gap-1 text-sm text-text-muted hover:text-text-strong transition-colors">
        <ChevronLeft className="w-4 h-4" /> Volver
      </button>
      <div>
        <h1 className="font-display text-2xl text-text-strong">Nuevo producto</h1>
        <p className="text-sm text-text-muted mt-1">¿Qué tipo de producto vas a publicar?</p>
      </div>
      <div className="grid grid-cols-1 gap-4">
        {TIPOS.map(t => (
          <button
            key={t.v}
            onClick={() => selectType(t.v)}
            className="flex items-center gap-4 p-5 rounded-2xl border-2 border-border-subtle hover:border-brand bg-surface-card text-left transition-all"
          >
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 ${t.colorClass}`}>
              {t.icon}
            </div>
            <div>
              <p className="font-semibold text-text-strong text-lg">{t.l}</p>
              <p className="text-xs text-text-muted mt-0.5">{t.d}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )

  return (
    <div className="p-5 lg:p-7 lg:pt-7 space-y-5 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <button onClick={() => setView("list")} className="w-8 h-8 rounded-full bg-surface-sunken flex items-center justify-center shrink-0">
          <ChevronLeft className="w-4 h-4 text-text-muted" />
        </button>
        <div>
          <h1 className="font-display text-xl text-text-strong">{editingId ? "Editar producto" : "Nuevo producto"}</h1>
          <p className="text-xs text-text-muted">{TIPOS.find(t => t.v === form.tipo)?.l || form.tipo}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Tipo selector (editable siempre) */}
        <div>
          <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wide mb-2">Tipo</label>
          <div className="grid grid-cols-2 gap-2">
            {TIPOS.map(t => (
              <button
                key={t.v}
                type="button"
                onClick={() => { if (t.v !== form.tipo) handleTypeChange(t.v) }}
                className={`px-3 py-2 rounded-xl text-xs font-semibold border text-left transition-all flex items-center gap-2 ${form.tipo === t.v ? 'border-brand bg-brand text-white' : 'bg-surface-sunken text-text-body border-transparent hover:border-brand'}`}
              >
                <span className="shrink-0">{t.icon}</span>
                {t.l}
              </button>
            ))}
          </div>
        </div>

        {/* Título */}
        <div>
          <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wide mb-1">Título *</label>
          <input required value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} placeholder="ej: Vestido lino sage" className="w-full h-11 px-4 rounded-xl bg-surface-sunken text-sm border border-transparent focus:border-brand outline-none" />
        </div>

        {/* Precio */}
        <div>
          <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wide mb-1">Precio *</label>
          <input required type="number" value={form.precio || ""} onChange={e => setForm(f => ({ ...f, precio: Number(e.target.value) }))} className="w-full h-11 px-4 rounded-xl bg-surface-sunken text-sm border border-transparent focus:border-brand outline-none" />
        </div>

        {/* Precio tachado */}
        <div>
          <button type="button" onClick={() => setShowPrevPrice(!showPrevPrice)} className={`flex items-center gap-2 text-xs font-semibold transition-colors ${showPrevPrice ? 'text-text-strong' : 'text-text-muted'}`}>
            <div className={`w-9 h-5 rounded-full transition-colors ${showPrevPrice ? 'bg-matcha-500' : 'bg-border-default'}`}>
              <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform mt-0.5 ${showPrevPrice ? 'ml-4' : 'ml-0.5'}`} />
            </div>
            Mostrar precio anterior
          </button>
          {showPrevPrice && (
            <input type="number" value={form.precio_anterior || ""} onChange={e => setForm(f => ({ ...f, precio_anterior: Number(e.target.value) }))} placeholder="Precio anterior" className="w-full h-11 px-4 mt-3 rounded-xl bg-surface-sunken text-sm border border-transparent focus:border-brand outline-none" />
          )}
        </div>

        {/* Categoría + Subcategoría */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wide mb-1">Categoría *</label>
            {catOpts.length === 0 ? (
              <p className="text-xs text-text-muted py-2">No hay categorías de {TIPOS.find(t => t.v === form.tipo)?.l} creadas todavía — creá una desde Categorías</p>
            ) : (
              <select
                value={form.categoria_id}
                onChange={e => {
                  const v = e.target.value
                  const foundCat = categories.find(c => c.id === v)
                  setForm(f => ({
                    ...f,
                    categoria_id: v,
                    subcategoria_id: foundCat?.subcategorias?.[0]?.id || "",
                  }))
                }}
                className="w-full h-11 px-3 rounded-xl bg-surface-sunken text-sm border border-transparent focus:border-brand outline-none"
              >
                <option value="">Sin categoría</option>
                {catOpts.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            )}
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wide mb-1">Subcategoría</label>
            {subs.length === 0 ? (
              <div className="space-y-1">
                <p className="text-[10px] text-text-muted">Sin subcategorías</p>
                {addingSub ? (
                  <div className="flex gap-1">
                    <input value={newSubName} onChange={e => setNewSubName(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleAddSubcategory() } }} placeholder="Nombre" autoFocus className="flex-1 h-8 px-2 rounded-lg bg-surface-sunken text-xs border border-brand outline-none" />
                    <button type="button" onClick={handleAddSubcategory} className="px-2 h-8 rounded-full bg-matcha-100 text-matcha-700 text-xs font-semibold">+</button>
                    <button type="button" onClick={() => setAddingSub(false)} className="px-2 h-8 rounded-full bg-surface-sunken text-xs"><X className="w-3 h-3" /></button>
                  </div>
                ) : (
                  <button type="button" onClick={() => setAddingSub(true)} className="text-[10px] text-matcha-600 font-semibold hover:text-matcha-700">+ Nueva subcategoría</button>
                )}
              </div>
            ) : (
              <select value={form.subcategoria_id} onChange={e => setForm(f => ({ ...f, subcategoria_id: e.target.value }))} className="w-full h-11 px-3 rounded-xl bg-surface-sunken text-sm border border-transparent focus:border-brand outline-none">
                <option value="">Sin subcategoría</option>
                {subs.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                <option value="__new__">+ Nueva subcategoría</option>
              </select>
            )}
            {subs.length > 0 && form.subcategoria_id === "__new__" && (
              <div className="flex gap-1 mt-1">
                <input value={newSubName} onChange={e => setNewSubName(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleAddSubcategory() } }} placeholder="Nombre" autoFocus className="flex-1 h-8 px-2 rounded-lg bg-surface-sunken text-xs border border-brand outline-none" />
                <button type="button" onClick={handleAddSubcategory} className="px-2 h-8 rounded-full bg-matcha-100 text-matcha-700 text-xs font-semibold">+</button>
                <button type="button" onClick={() => setForm(f => ({ ...f, subcategoria_id: selectedCat?.subcategorias?.[0]?.id || "" }))} className="px-2 h-8 rounded-full bg-surface-sunken text-xs"><X className="w-3 h-3" /></button>
              </div>
            )}
          </div>
        </div>

        {/* Condición (solo ropa) */}
        {isRopa && (
          <div>
            <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wide mb-1.5">Estado *</label>
            <div className="flex flex-wrap gap-2">
              {CONDITIONS.map(c => (
                <button
                  key={c.v}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, estado: c.v }))}
                  className={`px-3.5 py-1.5 rounded-full text-[11px] font-semibold border transition-colors ${form.estado === c.v ? 'bg-brand text-white border-brand' : 'bg-surface-sunken text-text-body border-transparent'}`}
                >
                  {c.l}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Marca */}
        <div>
          <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wide mb-1">Marca</label>
          <input value={form.marca || ""} onChange={e => setForm(f => ({ ...f, marca: e.target.value }))} placeholder="ej: Zara, COS, Adidas" className="w-full h-11 px-4 rounded-xl bg-surface-sunken text-sm border border-transparent focus:border-brand outline-none" />
        </div>

        {/* Material */}
        <div>
          <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wide mb-1">Material</label>
          <input value={form.material || ""} onChange={e => setForm(f => ({ ...f, material: e.target.value }))} placeholder={isRopa ? "ej: Algodón, Lino, Seda" : "ej: Cerámica, Madera, Vidrio"} className="w-full h-11 px-4 rounded-xl bg-surface-sunken text-sm border border-transparent focus:border-brand outline-none" />
        </div>

        {/* Talles / Tamaño-Set */}
        {isRopa ? (
          <div>
            <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wide mb-1.5">Talles *</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {SIZES.map(s => (
                <button key={s} type="button" onClick={() => toggleSize(s)} className={`px-3.5 py-1.5 rounded-full text-[11px] font-semibold border transition-colors ${form.talles.includes(s) ? 'bg-brand text-white border-brand' : 'bg-surface-sunken text-text-body border-transparent'}`}>{s}</button>
              ))}
              {form.talles.filter(t => !SIZES.includes(t)).map(t => (
                <span key={t} className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full text-[11px] font-semibold bg-brand text-white border-brand">
                  {t}
                  <button type="button" onClick={() => removeSize(t)} className="hover:text-error-200"><X className="w-3 h-3" /></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={customTalle} onChange={e => setCustomTalle(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addCustomTalle() } }} placeholder="Agregar talle personalizado..." className="flex-1 h-9 px-3 rounded-lg bg-surface-sunken text-xs border border-transparent focus:border-brand outline-none" />
              <button type="button" onClick={addCustomTalle} className="px-3 h-9 rounded-full bg-surface-sunken text-xs font-semibold hover:bg-matcha-100 transition-colors">+</button>
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wide mb-1.5">Tamaño/Set</label>
            {form.talles.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {form.talles.map(t => (
                  <span key={t} className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full text-[11px] font-semibold bg-brand text-white border-brand">
                    {t}
                    <button type="button" onClick={() => removeSize(t)} className="hover:text-error-200"><X className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input value={customSizeVal} onChange={e => setCustomSizeVal(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addCustomSize() } }} placeholder="ej: Chico, Grande, Set x4..." className="flex-1 h-9 px-3 rounded-lg bg-surface-sunken text-xs border border-transparent focus:border-brand outline-none" />
              <button type="button" onClick={addCustomSize} className="px-3 h-9 rounded-full bg-surface-sunken text-xs font-semibold hover:bg-matcha-100 transition-colors">+</button>
            </div>
          </div>
        )}

        {/* Colores / Sabores / Atributo editable */}
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            {editingColoresLabel ? (
              <input
                value={coloresLabel}
                onChange={e => setColoresLabel(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); setEditingColoresLabel(false) } }}
                onBlur={() => setEditingColoresLabel(false)}
                autoFocus
                className="text-[11px] font-semibold text-text-muted uppercase tracking-wide bg-surface-sunken px-2 py-0.5 rounded outline-none border border-brand w-48"
              />
            ) : (
              <button
                type="button"
                onClick={() => setEditingColoresLabel(true)}
                className="text-[11px] font-semibold text-text-muted uppercase tracking-wide hover:text-brand transition-colors flex items-center gap-1"
                title="Click para renombrar"
              >
                {coloresLabel}
                <Pencil className="w-2.5 h-2.5 opacity-40" />
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2 mb-3">
            {COLORES.map(c => (
              <button key={c} type="button" onClick={() => toggleColor(c)} className={`px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-colors ${form.colores.includes(c) ? 'bg-surface-inverse text-white border-surface-inverse' : 'bg-surface-sunken text-text-body border-transparent'}`}>{c}</button>
            ))}
            {form.colores.filter(c => !COLORES.includes(c)).map(c => (
              <span key={c} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-semibold bg-surface-inverse text-white">
                {c}
                <button type="button" onClick={() => removeColor(c)} className="hover:text-error-200"><X className="w-3 h-3" /></button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input value={newColor} onChange={e => setNewColor(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addColor() } }} placeholder={`Agregar ${coloresLabel.toLowerCase().replace(" / ", "/")}...`} className="flex-1 h-9 px-3 rounded-lg bg-surface-sunken text-xs border border-transparent focus:border-brand outline-none" />
            <button type="button" onClick={addColor} className="px-3 h-9 rounded-full bg-surface-sunken text-xs font-semibold hover:bg-matcha-100 transition-colors">+</button>
          </div>
        </div>

        {/* Imágenes */}
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

        {/* Variantes section */}
        <div className="bg-surface-card border border-border-subtle rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => setVariantsOpen(!variantsOpen)}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface-sunken transition-colors"
          >
            <div className="flex items-center gap-2">
              <label className="text-[11px] font-semibold text-text-muted uppercase tracking-wide cursor-pointer">
                Variantes
              </label>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-text-muted">
                {hasVariants ? `${form.variantes.length} combinación${form.variantes.length !== 1 ? 'es' : ''}` : "Desactivado"}
              </span>
              {variantsOpen ? <ChevronUp className="w-4 h-4 text-text-muted" /> : <ChevronDown className="w-4 h-4 text-text-muted" />}
            </div>
          </button>
          {variantsOpen && (
            <div className="border-t border-border-subtle px-4 py-4 space-y-4">
              <button
                type="button"
                onClick={() => setHasVariants(!hasVariants)}
                className={`flex items-center gap-2 text-xs font-semibold transition-colors ${hasVariants ? 'text-text-strong' : 'text-text-muted'}`}
              >
                <div className={`w-9 h-5 rounded-full transition-colors ${hasVariants ? 'bg-matcha-500' : 'bg-border-default'}`}>
                  <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform mt-0.5 ${hasVariants ? 'ml-4' : 'ml-0.5'}`} />
                </div>
                ¿Este producto tiene variantes con stock o precio distinto?
              </button>

              {hasVariants && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-text-muted">
                      Stock total: <strong className="text-text-strong">{totalVariantStock}</strong>
                    </span>
                    <div className="flex gap-2">
                      {(form.talles.length > 0 || form.colores.length > 0) && (
                        <button type="button" onClick={generateAllVariants} className="text-[10px] font-semibold text-brand hover:text-brand-hover">
                          Generar todas las combinaciones
                        </button>
                      )}
                      <button type="button" onClick={addVariant} className="text-[11px] font-semibold text-matcha-600 hover:text-matcha-700">
                        + Agregar variante
                      </button>
                    </div>
                  </div>

                  {form.variantes.length > 0 && (
                    <div className="space-y-2">
                      {form.variantes.map((v, i) => (
                        <div key={v.id || i} className="flex items-center gap-2 bg-surface-sunken rounded-lg p-2 flex-wrap">
                          {(isRopa || form.talles.length > 0) && (
                            form.talles.length > 0 ? (
                              <select value={v.talle} onChange={e => updateVariantField(i, "talle", e.target.value)} className="h-8 px-2 rounded-lg bg-white text-[11px] border border-transparent outline-none">
                                <option value="">{tallesLabel}</option>
                                {form.talles.map(s => <option key={s} value={s}>{s}</option>)}
                              </select>
                            ) : (
                              <input value={v.talle} onChange={e => updateVariantField(i, "talle", e.target.value)} placeholder={tallesLabel} className="w-20 h-8 px-2 rounded-lg bg-white text-[11px] border border-transparent outline-none" />
                            )
                          )}
                          {(isRopa || form.colores.length > 0) && (
                            form.colores.length > 0 ? (
                              <select value={v.color} onChange={e => updateVariantField(i, "color", e.target.value)} className="h-8 px-2 rounded-lg bg-white text-[11px] border border-transparent outline-none">
                                <option value="">{coloresLabel.replace(" / ", "/")}</option>
                                {form.colores.map(c => <option key={c} value={c}>{c}</option>)}
                              </select>
                            ) : (
                              <input value={v.color} onChange={e => updateVariantField(i, "color", e.target.value)} placeholder={coloresLabel.replace(" / ", "/")} className="w-16 h-8 px-2 rounded-lg bg-white text-[11px] border border-transparent outline-none" />
                            )
                          )}
                          {!isRopa && form.talles.length === 0 && form.colores.length === 0 && (
                            <input value={v.talle} onChange={e => updateVariantField(i, "talle", e.target.value)} placeholder="ej: Jazmín, Vainilla..." className="w-28 h-8 px-2 rounded-lg bg-white text-[11px] border border-transparent outline-none" />
                          )}
                          <input type="number" value={v.precio || ""} onChange={e => updateVariantField(i, "precio", Number(e.target.value))} placeholder="$" className="w-16 h-8 px-2 rounded-lg bg-white text-[11px] border border-transparent outline-none" />
                          <input type="number" value={v.stock || ""} onChange={e => updateVariantField(i, "stock", Number(e.target.value))} placeholder="Stock" className="w-14 h-8 px-2 rounded-lg bg-white text-[11px] border border-transparent outline-none" />
                          <input value={v.imagen || ""} onChange={e => updateVariantField(i, "imagen", e.target.value)} placeholder="URL img" className="w-24 h-8 px-2 rounded-lg bg-white text-[10px] border border-transparent outline-none" />
                          <button type="button" onClick={() => removeVariant(i)} className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-error-50"><X className="w-3 h-3 text-error-500" /></button>
                        </div>
                      ))}
                    </div>
                  )}
                  {form.variantes.length > 0 && (
                    <p className="text-[10px] text-text-muted">El precio de cada variante opcional hereda el precio general si se deja vacío. La imagen opcional hereda la primera imagen del producto.</p>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Stock general (si no usa variantes) */}
        {!hasVariants && (
          <div>
            <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wide mb-1">Stock general *</label>
            <input type="number" value={form.talles?.length ? (form.variantes.length > 0 ? totalVariantStock : 1) : 1} readOnly className="w-full h-11 px-4 rounded-xl bg-surface-sunken text-sm border border-transparent outline-none opacity-60" />
            <p className="text-[10px] text-text-muted mt-1">El stock se calcula automáticamente. Activá variantes para gestionar stock por talle/color.</p>
          </div>
        )}

        {/* Descripción */}
        <div>
          <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wide mb-1">Descripción</label>
          <textarea value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} rows={3} placeholder="Describí el producto..." className="w-full px-4 py-3 rounded-xl bg-surface-sunken text-sm border border-transparent focus:border-brand outline-none resize-none" />
        </div>

        {/* Envío gratis + Destacado */}
        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.envio_gratis} onChange={e => setForm(f => ({ ...f, envio_gratis: e.target.checked }))} className="accent-brand w-4 h-4 rounded" />
            <span className="flex items-center gap-1.5 text-sm text-text-body"><Truck className="w-4 h-4 text-success-500" /> Envío gratis</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.destacado} onChange={e => setForm(f => ({ ...f, destacado: e.target.checked }))} className="accent-brand w-4 h-4 rounded" />
            <span className="flex items-center gap-1.5 text-sm text-text-body"><Star className="w-4 h-4 text-chai-500 fill-chai-500" /> Producto destacado</span>
          </label>
        </div>

        {error && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-error-50 text-error-600 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />{error}
          </div>
        )}

        <button type="submit" disabled={saving || uploading} className="w-full h-12 bg-brand text-white font-semibold rounded-full text-sm hover:bg-brand-hover transition-colors disabled:opacity-50">
          {saving ? "Guardando..." : editingId ? "Guardar cambios" : "Publicar producto"}
        </button>
      </form>

      {/* Type change warning modal */}
      {typeChangeWarning && (
        <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center">
          <div className="absolute inset-0 bg-carob-900/40 backdrop-blur-sm" onClick={() => setTypeChangeWarning(null)} />
          <div className="relative bg-surface-card rounded-t-2xl lg:rounded-2xl p-6 w-full lg:max-w-sm">
            <p className="font-semibold text-text-strong mb-2">¿Cambiar tipo de producto?</p>
            <p className="text-sm text-text-muted mb-5">
              {form.tipo === "ropa"
                ? "Al pasar de Ropa a otro tipo se perderán los talles, estado y variantes actuales."
                : "Al cambiar de tipo se reiniciarán los talles y variantes cargados."}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setTypeChangeWarning(null)} className="flex-1 h-10 rounded-full border border-border-default text-sm font-semibold">Cancelar</button>
              <button onClick={confirmTypeChange} className="flex-1 h-10 rounded-full bg-brand text-white text-sm font-semibold">Cambiar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

import { create } from "zustand"
import { supabase } from "@/lib/supabase"
import type { Variante, ProductType, ShippingConfig, NotificationType, ModerationNote } from "@/lib/types"

export type ProductStatus = "pending" | "approved" | "rejected" | "changes_requested"
export type VendorStatus = "pending" | "approved" | "rejected"

export interface AdminProduct {
  id: string; titulo: string; precio: number; precio_anterior?: number
  descripcion?: string; marca?: string; material?: string; categoria_id: string; subcategoria_id?: string
  estado?: string; talles?: string[]; colores?: string[]; imagenes: string[]
  stock?: number; variantes?: Variante[]
  envio_gratis?: boolean; destacado?: boolean; tipo: ProductType; retiro_local?: boolean
  vendedor_nombre: string; vendedor_id?: string; vendedor_tipo: "oficial" | "feria"
  status: ProductStatus; vendido?: boolean; orden?: number; created_at?: string
}

export interface VendorRequest {
  id: string; nombre: string; email?: string; avatar?: string
  cbu?: string; banco?: string; tipo_cuenta?: string; alias?: string; titular?: string
  productos_count?: number; status: VendorStatus; created_at?: string
}
export type VentaStatus = "pendiente" | "liberado" | "cancelada"
export interface AdminVenta {
  id: string; pedido_id: string; vendedor_id: string; producto_titulo: string
  monto_bruto: number; comision: number; monto_neto: number
  status: VentaStatus; created_at?: string; liberado_at?: string
}
export type RetiroStatus = "solicitado" | "pagado" | "rechazado"
export interface AdminRetiro {
  id: string
  vendedor_id: string
  monto: number
  cbu: string
  status: RetiroStatus
  created_at: string
  pagado_at: string | null
  vendedores: {
    nombre: string
    email: string
    avatar: string
    cbu: string
    banco: string | null
    tipo_cuenta: string | null
    alias: string | null
    titular: string | null
  } | null
}
export type OrderStatus = "pending_shipment" | "shipped" | "delivered" | "cancelled"
export interface AdminOrder {
  id: string; producto_titulo: string; producto_imagen?: string; producto_id?: string; precio: number
  comprador_nombre?: string; comprador_email?: string; vendedor_nombre?: string; vendedor_email?: string
  vendedor_id?: string; vendedor_tipo?: string
  talle?: string; direccion?: string; status: OrderStatus; created_at?: string
  metodo_envio?: string; costo_envio?: number; seguimiento?: string
}
export interface FAQItem { id: string; pregunta: string; respuesta: string; orden?: number }
export interface AdminCategory { id: string; nombre: string; tipo?: ProductType; destacada?: boolean; orden?: number; subcategorias: AdminSubcategory[] }
export interface AdminSubcategory { id: string; categoria_id: string; nombre: string; orden?: number }

export interface StoreProductForm {
  titulo: string; precio: number; precio_anterior?: number; descripcion: string
  marca?: string; material?: string; categoria_id: string; subcategoria_id: string; estado: string
  talles: string[]; colores: string[]; imagenes: string[]
  variantes: Variante[]
  envio_gratis: boolean; destacado: boolean; tipo: ProductType; retiro_local: boolean
}

interface AdminState {
  products: AdminProduct[]; vendors: VendorRequest[]; orders: AdminOrder[]
  ventas: AdminVenta[]
  retiros: AdminRetiro[]; retirosLoaded: boolean
  categories: AdminCategory[]; faq: FAQItem[];   terms: string
  shippingConfig: ShippingConfig | null
  shippingConfigLoaded: boolean
  loaded: boolean
  moderationNotes: Record<string, ModerationNote[]>
  loadFromSupabase: () => Promise<void>
  loadOrders: () => Promise<void>
  loadRetiros: () => Promise<void>
  loadShippingConfig: () => Promise<void>
  updateShippingConfig: (config: ShippingConfig) => Promise<void>
  updateProductStatus: (id: string, status: ProductStatus, texto?: string) => Promise<void>
  approveVendor: (id: string) => Promise<void>
  rejectVendor: (id: string) => Promise<void>
  addStoreProduct: (p: StoreProductForm) => Promise<void>
  updateStoreProduct: (id: string, p: Partial<StoreProductForm>) => Promise<void>
  removeStoreProduct: (id: string) => Promise<void>
  updateProductStock: (id: string, stock?: number, variantes?: Variante[]) => Promise<void>
  reorderProducts: (items: { id: string; orden: number }[]) => Promise<void>
  markOrderShipped: (id: string, seguimiento?: string) => Promise<void>
  markOrderDelivered: (id: string) => Promise<void>
  deleteOrder: (id: string) => Promise<void>
  addSubcategory: (catId: string, nombre: string) => Promise<void>
  renameSubcategory: (catId: string, subId: string, nombre: string) => Promise<void>
  deleteSubcategory: (catId: string, subId: string) => Promise<void>
  renameCategory: (catId: string, nombre: string) => Promise<void>
  addCategory: (nombre: string, tipo: string) => Promise<void>
  addFAQ: (pregunta: string, respuesta: string) => Promise<void>
  updateFAQ: (id: string, pregunta: string, respuesta: string) => Promise<void>
  deleteFAQ: (id: string) => Promise<void>
  updateTerms: (contenido: string) => Promise<void>
  toggleProductSold: (id: string, vendido: boolean) => Promise<void>
  updateFeriaProduct: (id: string, updates: Partial<AdminProduct>) => Promise<void>
  deleteFeriaProduct: (id: string) => Promise<void>
  markRetiroPagado: (id: string) => Promise<void>
  rejectRetiro: (id: string) => Promise<void>
}

async function createNotification(userId: string | undefined, type: NotificationType, title: string, body: string, link: string | null) {
  if (!userId) return
  const id = `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
  await supabase.from("notifications").insert({ id, user_id: userId, type, title, body, link, read: false }).then(
    () => {},
    () => {}
  )
}

export const useAdminStore = create<AdminState>((set, get) => ({
  products: [], vendors: [], orders: [], ventas: [], retiros: [], retirosLoaded: false,
  categories: [], faq: [], terms: "", shippingConfig: null, shippingConfigLoaded: false, loaded: false, moderationNotes: {},

  loadFromSupabase: async () => {
    const [pRes, vRes, oRes, vtRes, cRes, fRes, tRes] = await Promise.all([
      supabase.from("productos").select("*").order("created_at", { ascending: false }),
      supabase.from("vendedores").select("*").order("created_at", { ascending: false }),
      supabase.from("pedidos").select("*").order("created_at", { ascending: false }),
      supabase.from("ventas").select("*").order("created_at", { ascending: false }),
      supabase.from("categorias").select("*, subcategorias(*)").order("orden"),
      supabase.from("faq").select("*").order("orden"),
      supabase.from("terminos").select("*").single(),
    ])
    const moderationNotes: Record<string, ModerationNote[]> = {}
    const productIds = (pRes.data || []).map((p: { id: string }) => p.id)
    if (productIds.length > 0) {
      const { data: notes } = await supabase
        .from("comentarios_moderacion")
        .select("*")
        .in("producto_id", productIds)
        .order("created_at", { ascending: false })
      if (notes) {
        for (const note of notes) {
          const pid = note.producto_id
          if (!moderationNotes[pid]) moderationNotes[pid] = []
          moderationNotes[pid].push(note as ModerationNote)
        }
      }
    }
    set({
      products: (pRes.data || []) as AdminProduct[],
      vendors: (vRes.data || []) as VendorRequest[],
      orders: (oRes.data || []) as AdminOrder[],
      ventas: (vtRes.data || []) as AdminVenta[],
      categories: (cRes.data || []) as unknown as AdminCategory[],
      faq: (fRes.data || []) as FAQItem[],
      terms: tRes.data?.contenido || "",
      moderationNotes,
      loaded: true,
    })
  },

  loadOrders: async () => {
    const { data } = await supabase.from("pedidos").select("*").order("created_at", { ascending: false })
    if (data) set({ orders: data as AdminOrder[] })
  },

  updateProductStatus: async (id, status, texto) => {
    const product = get().products.find(p => p.id === id)

    const { data: note, error: insertError } = await supabase
      .from("comentarios_moderacion")
      .insert({
        producto_id: id,
        admin_id: "00000000-0000-0000-0000-000000000000",
        tipo_accion: status,
        texto: texto || null,
      })
      .select()
      .single()
    if (insertError) {
      console.error("[updateProductStatus] error insertando nota:", insertError)
    }

    const { error: updateError } = await supabase.from("productos").update({ status }).eq("id", id)
    if (updateError) {
      console.error("[updateProductStatus] error actualizando status:", updateError)
      return
    }

    if (status !== "approved" && product?.vendedor_id) {
      const title =
        status === "rejected"
          ? "Tu prenda no fue aprobada"
          : "Tu prenda necesita cambios"
      const body =
        status === "rejected"
          ? `"${product.titulo}" no paso la moderacion.${texto ? " Motivo: " + texto : ""} Podes revisarla y volver a publicarla.`
          : `"${product.titulo}" necesita algunos cambios antes de publicarse.${texto ? " Motivo: " + texto : ""}`

      createNotification(
        product.vendedor_id,
        status === "rejected" ? "product_rejected" : "product_changes_requested",
        title,
        body,
        null
      )

      fetch("/api/push/notify-seller", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: product.vendedor_id,
          title,
          body,
          url: "/perfil/publicaciones",
        }),
      }).catch(() => {})
    }

    if (status === "approved" && product?.vendedor_id) {
      createNotification(
        product.vendedor_id,
        "product_approved",
        "¡Tu prenda fue publicada!",
        `"${product.titulo}" ya está publicada y a la venta en La Percha.`,
        `/producto/${id}`
      )
      fetch("/api/push/notify-seller", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: product.vendedor_id,
          title: "¡Tu prenda fue publicada!",
          body: `"${product.titulo}" ya está publicada y a la venta.`,
          url: "/perfil/publicaciones",
        }),
      }).catch(() => {})
    }

    if (note) {
      set(s => ({
        products: s.products.map(p => p.id === id ? { ...p, status: status as ProductStatus } : p),
        moderationNotes: {
          ...s.moderationNotes,
          [id]: [note as ModerationNote, ...(s.moderationNotes[id] || [])],
        },
      }))
    } else {
      set(s => ({
        products: s.products.map(p => p.id === id ? { ...p, status: status as ProductStatus } : p),
      }))
    }
  },
  approveVendor: async (id) => {
    const res = await fetch("/api/admin/vendedores", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "approved" }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      console.error("[approveVendor] error:", data.error || res.status)
      throw new Error(data.error || "No se pudo aprobar la vendedora")
    }
    createNotification(
      id,
      "seller_approved",
      "¡Ya podés vender en La Percha!",
      "Tu solicitud fue aprobada. Publicá tus prendas y empezá a vender.",
      "/vender"
    )
    set(s => ({ vendors: s.vendors.map(v => v.id === id ? { ...v, status: "approved" as const } : v) }))
  },
  rejectVendor: async (id) => {
    const res = await fetch("/api/admin/vendedores", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "rejected" }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      console.error("[rejectVendor] error:", data.error || res.status)
      throw new Error(data.error || "No se pudo rechazar la vendedora")
    }
    createNotification(
      id,
      "seller_rejected",
      "Actualización de tu solicitud",
      "Tu solicitud para vender no fue aprobada en esta ocasión.",
      null
    )
    set(s => ({ vendors: s.vendors.map(v => v.id === id ? { ...v, status: "rejected" as const } : v) }))
  },

  addStoreProduct: async (form) => {
    const id = `store-${Date.now()}`
    const payload: Record<string, unknown> = {
      id, titulo: form.titulo, precio: form.precio, precio_anterior: form.precio_anterior,
      descripcion: form.descripcion, marca: form.marca, material: form.material,
      talles: form.talles, colores: form.colores, imagenes: form.imagenes,
      stock: form.variantes.length > 0 ? form.variantes.reduce((s, v) => s + (v.stock || 0), 0) : 1,
      variantes: JSON.parse(JSON.stringify(form.variantes || [])),
      envio_gratis: form.envio_gratis, destacado: form.destacado, retiro_local: form.retiro_local,
      tipo: form.tipo, vendedor_nombre: "Tienda Oficial", vendedor_tipo: "oficial",
      status: "approved",
    }
    console.log("[addStoreProduct] payload.variantes:", payload.variantes)
    if (form.estado) payload.estado = form.estado
    if (form.categoria_id) payload.categoria_id = form.categoria_id
    if (form.subcategoria_id) payload.subcategoria_id = form.subcategoria_id
    const { data, error } = await supabase.from("productos").insert(payload).select().single()
    if (error) throw new Error(error.message)
    if (data) set(s => ({ products: [data as AdminProduct, ...s.products] }))
  },
  updateStoreProduct: async (id, form) => {
    const payload: Record<string, unknown> = { ...form, updated_at: new Date().toISOString() }
    if (form.variantes !== undefined) {
      payload.variantes = JSON.parse(JSON.stringify(form.variantes))
    }
    console.log("[updateStoreProduct] payload.variantes:", payload.variantes)
    if (!form.estado) delete payload.estado
    if (!form.categoria_id) delete payload.categoria_id
    if (!form.subcategoria_id) delete payload.subcategoria_id
    const { error } = await supabase.from("productos").update(payload).eq("id", id)
    if (error) { console.error("[updateStoreProduct] error:", error); throw new Error(error.message) }
    set(s => ({ products: s.products.map(p => p.id === id ? { ...p, ...form } : p) }))
  },
  removeStoreProduct: async (id) => {
    const product = get().products.find(p => p.id === id)
    const imagePaths = (product?.imagenes || [])
      .filter((url: string) => url.includes("hvmctiqzjbqsghuwhquk.supabase.co"))
      .map((url: string) => {
        const parts = url.split("/productos/")
        return parts[1]?.split("?")[0]
      })
      .filter(Boolean) as string[]

    await supabase.from("productos").delete().eq("id", id)

    if (imagePaths.length > 0) {
      fetch("/api/imagenes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paths: imagePaths }),
      }).catch(() => {})
    }

    set(s => ({ products: s.products.filter(p => p.id !== id) }))
  },
  updateProductStock: async (id, stock, variantes) => {
    const payload: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (stock !== undefined) payload.stock = stock
    if (variantes !== undefined) payload.variantes = JSON.parse(JSON.stringify(variantes))
    const { error } = await supabase.from("productos").update(payload).eq("id", id)
    if (error) throw new Error(error.message)
    set(s => ({
      products: s.products.map(p => {
        if (p.id !== id) return p
        const updates: Partial<AdminProduct> = {}
        if (stock !== undefined) updates.stock = stock
        if (variantes !== undefined) updates.variantes = variantes
        return { ...p, ...updates }
      })
    }))
  },
  reorderProducts: async (items) => {
    set(s => {
      const updated = [...s.products]
      for (const item of items) {
        const idx = updated.findIndex(p => p.id === item.id)
        if (idx !== -1) updated[idx] = { ...updated[idx], orden: item.orden }
      }
      return { products: updated.sort((a, b) => (a.orden || 0) - (b.orden || 0)) }
    })
    await fetch("/api/productos/reordenar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    })
  },

  markOrderShipped: async (id, seguimiento) => {
    const res = await fetch("/api/admin/pedidos", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "shipped", seguimiento }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.error || "Error al actualizar el pedido")
    }
    const order = get().orders.find(o => o.id === id)
    set(s => ({ orders: s.orders.map(o => o.id === id ? { ...o, status: "shipped" as const, seguimiento } : o) }))
    if (order?.comprador_email) {
      fetch("/api/email/pedido-enviado", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: order.comprador_email,
          orderId: order.id,
          producto_titulo: order.producto_titulo,
          metodo_envio: order.metodo_envio,
          seguimiento: seguimiento || "",
        }),
      }).catch(() => {})
    }
  },
  markOrderDelivered: async (id) => {
    const res = await fetch("/api/admin/pedidos", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "delivered" }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.error || "Error al actualizar el pedido")
    }
    set(s => ({ orders: s.orders.map(o => o.id === id ? { ...o, status: "delivered" as const } : o) }))
  },
  deleteOrder: async (id) => {
    const res = await fetch("/api/admin/pedidos", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.error || "Error al eliminar el pedido")
    }
    set(s => ({ orders: s.orders.filter(o => o.id !== id) }))
  },

  addSubcategory: async (catId, nombre) => {
    const id = `sub-${Date.now()}`
    await supabase.from("subcategorias").insert({ id, categoria_id: catId, nombre })
    await get().loadFromSupabase()
  },
  renameSubcategory: async (catId, subId, nombre) => {
    await supabase.from("subcategorias").update({ nombre }).eq("id", subId)
    set(s => ({
      categories: s.categories.map(c => c.id === catId ? {
        ...c, subcategorias: c.subcategorias.map(su => su.id === subId ? { ...su, nombre } : su)
      } : c)
    }))
  },
  deleteSubcategory: async (catId, subId) => {
    await supabase.from("subcategorias").delete().eq("id", subId)
    set(s => ({ categories: s.categories.map(c => c.id === catId ? { ...c, subcategorias: c.subcategorias.filter(su => su.id !== subId) } : c) }))
  },
  renameCategory: async (catId, nombre) => {
    await supabase.from("categorias").update({ nombre }).eq("id", catId)
    set(s => ({ categories: s.categories.map(c => c.id === catId ? { ...c, nombre } : c) }))
  },
  addCategory: async (nombre, tipo) => {
    const id = `cat-${Date.now()}`
    await supabase.from("categorias").insert({ id, nombre, tipo, orden: 0 })
    set(s => ({ categories: [...s.categories, { id, nombre, tipo: tipo as ProductType, subcategorias: [] }] }))
  },

  addFAQ: async (pregunta, respuesta) => {
    const id = `f-${Date.now()}`
    await supabase.from("faq").insert({ id, pregunta, respuesta })
    set(s => ({ faq: [...s.faq, { id, pregunta, respuesta }] }))
  },
  updateFAQ: async (id, pregunta, respuesta) => {
    await supabase.from("faq").update({ pregunta, respuesta }).eq("id", id)
    set(s => ({ faq: s.faq.map(f => f.id === id ? { ...f, pregunta, respuesta } : f) }))
  },
  deleteFAQ: async (id) => {
    await supabase.from("faq").delete().eq("id", id)
    set(s => ({ faq: s.faq.filter(f => f.id !== id) }))
  },
  updateTerms: async (contenido) => {
    await supabase.from("terminos").upsert({ id: 1, contenido })
    set({ terms: contenido })
  },

  toggleProductSold: async (id, vendido) => {
    const { error } = await supabase.from("productos").update({ vendido }).eq("id", id)
    if (error) throw new Error(error.message)
    set(s => ({
      products: s.products.map(p => p.id === id ? { ...p, vendido } : p)
    }))
  },
  updateFeriaProduct: async (id, updates) => {
    const payload = { ...updates, updated_at: new Date().toISOString() }
    delete payload.id
    delete payload.vendedor_nombre
    delete payload.vendedor_tipo
    const { error } = await supabase.from("productos").update(payload).eq("id", id)
    if (error) throw new Error(error.message)
    set(s => ({
      products: s.products.map(p => p.id === id ? { ...p, ...updates } : p)
    }))
  },
  deleteFeriaProduct: async (id) => {
    const product = get().products.find(p => p.id === id)
    const imagePaths = (product?.imagenes || [])
      .filter((url: string) => url.includes("hvmctiqzjbqsghuwhquk.supabase.co"))
      .map((url: string) => {
        const parts = url.split("/productos/")
        return parts[1]?.split("?")[0]
      })
      .filter(Boolean) as string[]

    await supabase.from("productos").delete().eq("id", id)

    if (imagePaths.length > 0) {
      fetch("/api/imagenes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paths: imagePaths }),
      }).catch(() => {})
    }

    set(s => ({ products: s.products.filter(p => p.id !== id) }))
  },

  loadRetiros: async () => {
    try {
      const res = await fetch("/api/admin/retiros")
      if (!res.ok) throw new Error("Error al cargar retiros")
      const data = await res.json()
      set({ retiros: data.retiros as AdminRetiro[], retirosLoaded: true })
    } catch {
      set({ retirosLoaded: true })
    }
  },

  markRetiroPagado: async (id) => {
    const res = await fetch("/api/admin/retiros", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "pagar", retiroId: id }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.error || "Error al marcar retiro como pagado")
    }
    set(s => ({
      retiros: s.retiros.map(r => r.id === id ? { ...r, status: "pagado" as const, pagado_at: new Date().toISOString() } : r),
    }))
  },

  rejectRetiro: async (id) => {
    const res = await fetch("/api/admin/retiros", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "rechazar", retiroId: id }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.error || "Error al rechazar retiro")
    }
    set(s => ({
      retiros: s.retiros.map(r => r.id === id ? { ...r, status: "rechazado" as const } : r),
    }))
  },

  loadShippingConfig: async () => {
    const { data } = await supabase.from("configuracion_envio").select("*").maybeSingle()
    if (data) set({ shippingConfig: data as ShippingConfig })
    set({ shippingConfigLoaded: true })
  },
  updateShippingConfig: async (config) => {
    await supabase.from("configuracion_envio").upsert({ id: 1, ...config, updated_at: new Date().toISOString() })
    set({ shippingConfig: config, shippingConfigLoaded: true })
  },
}))

import { create } from "zustand"
import { supabase } from "@/lib/supabase"
import type { Variante } from "@/lib/types"

export type ProductStatus = "pending" | "approved" | "rejected"
export type VendorStatus = "pending" | "approved" | "rejected"

export interface AdminProduct {
  id: string; titulo: string; precio: number; precio_anterior?: number
  descripcion?: string; marca?: string; material?: string; categoria_id: string; subcategoria_id?: string
  estado?: string; talles?: string[]; colores?: string[]; imagenes: string[]
  stock?: number; variantes?: Variante[]
  envio_gratis?: boolean; destacado?: boolean; tipo: "ropa" | "tienda"
  vendedor_nombre: string; vendedor_tipo: "oficial" | "feria"
  status: ProductStatus; orden?: number; created_at?: string
}

export interface VendorRequest {
  id: string; nombre: string; email?: string; avatar?: string
  cbu?: string; productos_count?: number; status: VendorStatus; created_at?: string
}
export type OrderStatus = "pending_shipment" | "shipped" | "delivered" | "cancelled"
export interface AdminOrder {
  id: string; producto_titulo: string; producto_imagen?: string; precio: number
  comprador_nombre?: string; comprador_email?: string; vendedor_nombre?: string; vendedor_email?: string
  talle?: string; direccion?: string; status: OrderStatus; created_at?: string
}
export interface FAQItem { id: string; pregunta: string; respuesta: string; orden?: number }
export interface AdminCategory { id: string; nombre: string; tipo?: string; destacada?: boolean; orden?: number; subcategorias: AdminSubcategory[] }
export interface AdminSubcategory { id: string; categoria_id: string; nombre: string; orden?: number }

export interface StoreProductForm {
  titulo: string; precio: number; precio_anterior?: number; descripcion: string
  marca?: string; material?: string; categoria_id: string; subcategoria_id: string; estado: string
  talles: string[]; colores: string[]; imagenes: string[]
  variantGroups: { id: string; name: string; values: string[] }[]
  variantes: { nombre: string; atributos: Record<string, string>; precio: number; stock: number; imagen: string }[]
  envio_gratis: boolean; destacado: boolean; tipo: "ropa" | "tienda"
}

interface AdminState {
  products: AdminProduct[]; vendors: VendorRequest[]; orders: AdminOrder[]
  categories: AdminCategory[]; faq: FAQItem[]; terms: string
  loaded: boolean
  loadFromSupabase: () => Promise<void>
  approveProduct: (id: string) => Promise<void>
  rejectProduct: (id: string) => Promise<void>
  approveVendor: (id: string) => Promise<void>
  rejectVendor: (id: string) => Promise<void>
  addStoreProduct: (p: StoreProductForm) => Promise<void>
  updateStoreProduct: (id: string, p: Partial<StoreProductForm>) => Promise<void>
  removeStoreProduct: (id: string) => Promise<void>
  reorderProducts: (items: { id: string; orden: number }[]) => Promise<void>
  markOrderShipped: (id: string) => Promise<void>
  markOrderDelivered: (id: string) => Promise<void>
  addSubcategory: (catId: string, nombre: string) => Promise<void>
  renameSubcategory: (catId: string, subId: string, nombre: string) => Promise<void>
  deleteSubcategory: (catId: string, subId: string) => Promise<void>
  renameCategory: (catId: string, nombre: string) => Promise<void>
  addCategory: (nombre: string, tipo: string) => Promise<void>
  addFAQ: (pregunta: string, respuesta: string) => Promise<void>
  updateFAQ: (id: string, pregunta: string, respuesta: string) => Promise<void>
  deleteFAQ: (id: string) => Promise<void>
  updateTerms: (contenido: string) => Promise<void>
}

export const useAdminStore = create<AdminState>((set, get) => ({
  products: [], vendors: [], orders: [], categories: [], faq: [], terms: "", loaded: false,

  loadFromSupabase: async () => {
    const [pRes, vRes, oRes, cRes, fRes, tRes] = await Promise.all([
      supabase.from("productos").select("*").order("created_at", { ascending: false }),
      supabase.from("vendedores").select("*").order("created_at", { ascending: false }),
      supabase.from("pedidos").select("*").order("created_at", { ascending: false }),
      supabase.from("categorias").select("*, subcategorias(*)").order("orden"),
      supabase.from("faq").select("*").order("orden"),
      supabase.from("terminos").select("*").single(),
    ])
    set({
      products: (pRes.data || []) as AdminProduct[],
      vendors: (vRes.data || []) as VendorRequest[],
      orders: (oRes.data || []) as AdminOrder[],
      categories: (cRes.data || []) as unknown as AdminCategory[],
      faq: (fRes.data || []) as FAQItem[],
      terms: tRes.data?.contenido || "",
      loaded: true,
    })
  },

  approveProduct: async (id) => {
    await supabase.from("productos").update({ status: "approved" }).eq("id", id)
    set(s => ({ products: s.products.map(p => p.id === id ? { ...p, status: "approved" as const } : p) }))
  },
  rejectProduct: async (id) => {
    await supabase.from("productos").update({ status: "rejected" }).eq("id", id)
    set(s => ({ products: s.products.map(p => p.id === id ? { ...p, status: "rejected" as const } : p) }))
  },
  approveVendor: async (id) => {
    const vendor = get().vendors.find(v => v.id === id)
    await Promise.all([
      supabase.from("vendedores").update({ status: "approved" }).eq("id", id),
      supabase.from("profiles").update({ seller_status: "approved", is_seller: true }).eq("id", id),
    ])
    if (vendor?.email) {
      fetch("/api/email/vendor-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: vendor.email, name: vendor.nombre, status: "approved" }),
      }).catch(() => {})
    }
    set(s => ({ vendors: s.vendors.map(v => v.id === id ? { ...v, status: "approved" as const } : v) }))
  },
  rejectVendor: async (id) => {
    const vendor = get().vendors.find(v => v.id === id)
    await Promise.all([
      supabase.from("vendedores").update({ status: "rejected" }).eq("id", id),
      supabase.from("profiles").update({ seller_status: "rejected", is_seller: false }).eq("id", id),
    ])
    if (vendor?.email) {
      fetch("/api/email/vendor-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: vendor.email, name: vendor.nombre, status: "rejected" }),
      }).catch(() => {})
    }
    set(s => ({ vendors: s.vendors.map(v => v.id === id ? { ...v, status: "rejected" as const } : v) }))
  },

  addStoreProduct: async (form) => {
    const id = `store-${Date.now()}`
    const payload: Record<string, unknown> = {
      id, titulo: form.titulo, precio: form.precio, precio_anterior: form.precio_anterior,
      descripcion: form.descripcion, marca: form.marca, material: form.material,
      talles: form.talles, colores: form.colores, imagenes: form.imagenes,
      variantes: form.variantes,
      envio_gratis: form.envio_gratis, destacado: form.destacado,
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
    const { variantGroups: _vg, ...rest } = form as Record<string, unknown>
    const payload: Record<string, unknown> = { ...rest, updated_at: new Date().toISOString() } as Record<string, unknown>
    console.log("[updateStoreProduct] rest.variantes:", (rest as any).variantes, "payload.variantes:", payload.variantes)
    if (!form.estado) delete payload.estado
    if (!form.categoria_id) delete payload.categoria_id
    if (!form.subcategoria_id) delete payload.subcategoria_id
    const { error } = await supabase.from("productos").update(payload).eq("id", id)
    if (error) throw new Error(error.message)
    set(s => ({ products: s.products.map(p => p.id === id ? { ...p, ...rest } : p) }))
  },
  removeStoreProduct: async (id) => {
    await supabase.from("productos").delete().eq("id", id)
    set(s => ({ products: s.products.filter(p => p.id !== id) }))
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

  markOrderShipped: async (id) => {
    await supabase.from("pedidos").update({ status: "shipped" }).eq("id", id)
    set(s => ({ orders: s.orders.map(o => o.id === id ? { ...o, status: "shipped" as const } : o) }))
  },
  markOrderDelivered: async (id) => {
    await supabase.from("pedidos").update({ status: "delivered" }).eq("id", id)
    set(s => ({ orders: s.orders.map(o => o.id === id ? { ...o, status: "delivered" as const } : o) }))
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
    set(s => ({ categories: [...s.categories, { id, nombre, tipo, subcategorias: [] }] }))
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
}))

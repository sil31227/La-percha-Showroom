"use client"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import type { Product } from "@/lib/types"

function mapProducto(row: Record<string, unknown>): Product {
  const rawSizes = (row.talles as string[]) || []
  const sizes = rawSizes.length > 0 ? rawSizes : ["Único"]
  const images = (row.imagenes as string[]) || []

  let rawVariants: any[] = []
  try {
    const vRaw = row.variantes
    if (Array.isArray(vRaw)) {
      rawVariants = vRaw
    } else if (typeof vRaw === "string") {
      rawVariants = JSON.parse(vRaw)
    }
  } catch {
    rawVariants = []
  }

  console.log("[mapProducto]", row.id, "variantes raw:", row.variantes, "parsed:", rawVariants.length)

  const variantes = rawVariants.map((v: any) => {
    const hasAtributos = v.atributos && typeof v.atributos === "object" && Object.keys(v.atributos).length > 0
    const hasNewFormat = v.talle !== undefined || v.color !== undefined
    const talle = (v.talle as string) || (hasAtributos ? v.atributos.Talle || v.atributos.Tamaño || "" : "")
    const color = (v.color as string) || (hasAtributos ? v.atributos.Color || "" : "")
    return {
      id: (v.id as string) || Math.random().toString(36).slice(2, 8),
      talle,
      color,
      precio: v.precio ?? (Number(row.precio) || 0),
      stock: v.stock ?? 0,
      imagen: v.imagen || images[0] || "",
    }
  })

  return {
    id: row.id as string,
    title: row.titulo as string,
    description: (row.descripcion as string) || "",
    brand: (row.marca as string) || "",
    price: Number(row.precio) || 0,
    images,
    sizes,
    variantes,
    condition: ((row.estado as string) || "") as Product["condition"],
    store_type: (row.vendedor_tipo === "oficial" ? "oficial" : "feria") as Product["store_type"],
    category: (row.categoria_id as Product["category"]) || "mujer",
    subcategory: (row.subcategoria_id as Product["subcategory"]),
    seller: {
      id: (row.vendedor_nombre as string) || "Tienda Oficial",
      name: (row.vendedor_nombre as string) || "Tienda Oficial",
      avatar: "https://i.pravatar.cc/40?img=10",
      rating: 5.0,
      sales_count: 0,
    },
    tipo: (row.tipo as Product["tipo"]) || "ropa",
    accepts_offers: false,
    free_shipping: (row.envio_gratis as boolean) || false,
    created_at: (row.created_at as string) || new Date().toISOString(),
  }
}

export function useApprovedProductos() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from("productos")
      .select("*")
      .eq("status", "approved")
      .gt("stock", 0)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          console.error("Error fetching productos:", error)
          setLoading(false)
          return
        }
        setProducts((data || []).map(mapProducto))
        setLoading(false)
      })
  }, [])

  return { products, loading }
}

export function useProductoById(id: string) {
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from("productos")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          setLoading(false)
          return
        }
        setProduct(mapProducto(data as unknown as Record<string, unknown>))
        setLoading(false)
      })
  }, [id])

  return { product, loading }
}

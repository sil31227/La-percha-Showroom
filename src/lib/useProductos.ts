"use client"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import type { Product } from "@/lib/types"

function mapProducto(row: Record<string, unknown>): Product {
  const rawSizes = (row.talles as string[]) || []
  const sizes = rawSizes.length > 0 ? rawSizes : ["Único"]
  const images = (row.imagenes as string[]) || []
  const rawVariants = (row.variantes as any[]) || []
  const variantes = rawVariants.map((v: any) => ({
    nombre: v.nombre || "",
    atributos: v.atributos || (v.talle !== undefined ? { Talle: v.talle, Color: v.color || "" } : {}),
    precio: v.precio ?? (Number(row.precio) || 0),
    stock: v.stock ?? 0,
    imagen: v.imagen || images[0] || "",
  }))

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

"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Heart, ArrowLeft, Loader2 } from "lucide-react"
import { useShopStore } from "@/store/useShopStore"
import { supabase } from "@/lib/supabase"
import type { Product } from "@/lib/types"
import { ProductCard } from "@/components/ProductCard"

function mapProducto(row: Record<string, unknown>): Product {
  const sizes = (row.talles as string[]) || []
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

export default function FavoritosPage() {
  const favorites = useShopStore(s => s.favorites)
  const [favProducts, setFavProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (favorites.length === 0) {
      setFavProducts([])
      setLoading(false)
      return
    }
    supabase
      .from("productos")
      .select("*")
      .in("id", favorites)
      .eq("status", "approved")
      .then(({ data }) => {
        setFavProducts((data || []).map(mapProducto))
        setLoading(false)
      })
  }, [favorites])

  return (
    <div className="flex flex-col min-h-screen">
      <header className="h-16 flex items-center gap-3 px-5 bg-bg-page border-b border-border-subtle sticky top-0 z-10 lg:top-16">
        <Link href="/home" className="w-9 h-9 rounded-full bg-surface-sunken flex items-center justify-center shrink-0">
          <ArrowLeft className="w-4 h-4 text-text-muted" />
        </Link>
        <h1 className="font-display text-xl text-text-strong">Favoritos</h1>
        <span className="text-xs text-text-muted ml-1">
          {favorites.length} prenda{favorites.length !== 1 ? 's' : ''}
        </span>
      </header>

      {loading ? (
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-8 h-8 text-brand animate-spin" />
        </div>
      ) : favProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 gap-3">
          <p className="text-5xl">♡</p>
          <p className="text-text-muted text-sm">Todavía no guardaste prendas favoritas</p>
          <Link href="/home"
            className="mt-2 px-5 py-2 rounded-full bg-brand text-text-on-brand font-semibold text-sm hover:bg-brand-hover transition-colors">
            Descubrir prendas
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 p-4 lg:p-6 pb-24 lg:pb-10">
          {favProducts.map(p => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  )
}

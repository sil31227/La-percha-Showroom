"use client"
import Link from "next/link"
import { Heart } from "lucide-react"
import { useShopStore } from "@/store/useShopStore"
import type { Product } from "@/lib/types"

const CONDITION_LABEL: Record<string, string> = {
  new_tag: 'Nuevo c/etiqueta',
  new: 'Nuevo',
  like_new: 'Como nuevo',
  used: 'Usado',
}

export function ProductCard({ product }: { product: Product }) {
  const toggleFavorite = useShopStore(s => s.toggleFavorite)
  const isFav = useShopStore(s => s.isFavorite(product.id))

  return (
    <div className="relative group">
      <Link href={`/producto/${product.id}`} className="block">
        <div className="relative aspect-[3/4] rounded-lg bg-surface-sunken overflow-hidden">
          <img
            src={product.images[0]}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {product.condition && (
            <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-surface-card text-text-muted">
              {CONDITION_LABEL[product.condition] ?? product.condition}
            </span>
          )}
        </div>
        <div className="mt-1.5 px-0.5 pr-7">
          <p className="text-xs text-text-muted uppercase tracking-wide">
            {product.store_type === 'oficial' ? 'Tienda Oficial' : 'Feria'}
          </p>
          <h3 className="text-sm font-semibold text-text-strong truncate mt-0.5">{product.title}</h3>
          <p className="text-sm font-bold text-price mt-0.5">
            $ {product.price.toLocaleString('es-AR')}
          </p>
        </div>
      </Link>

      <button
        onClick={(e) => { e.preventDefault(); toggleFavorite(product.id) }}
        aria-label={isFav ? 'Quitar de favoritos' : 'Agregar a favoritos'}
        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-surface-card/80
          backdrop-blur-sm flex items-center justify-center transition-transform
          active:scale-90"
      >
        <Heart
          className={`w-4 h-4 transition-colors ${isFav ? 'fill-error-500 text-error-500' : 'text-text-muted'}`}
        />
      </button>
    </div>
  )
}

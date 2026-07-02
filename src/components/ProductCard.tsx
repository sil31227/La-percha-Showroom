"use client"
import { useState, useCallback } from "react"
import Link from "next/link"
import { Heart, ShoppingBag, Truck, Plus, ChevronLeft, ChevronRight } from "lucide-react"
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
  const addToCart = useShopStore(s => s.addToCart)
  const cartItems = useShopStore(s => s.cart)
  const isInCart = cartItems.some(i => i.productId === product.id)

  const [imgIdx, setImgIdx] = useState(0)
  const [imgError, setImgError] = useState<Record<number, boolean>>({})
  const images = product.images?.length ? product.images : []
  const hasMultiple = images.length > 1

  const prevImage = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setImgIdx(i => (i === 0 ? images.length - 1 : i - 1))
  }, [images.length])

  const nextImage = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setImgIdx(i => (i === images.length - 1 ? 0 : i + 1))
  }, [images.length])

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (isInCart) return
    const firstSize = product.sizes?.[0] || 'Único'
    addToCart({
      productId: product.id,
      title: product.title,
      price: product.price,
      image: images[0] || '',
      size: firstSize,
      quantity: 1,
      store_type: product.store_type,
    })
  }

  const fallbackSrc = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='533' fill='%23f2efe8'%3E%3Crect width='400' height='533'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23c4baac' font-size='14' font-family='sans-serif'%3ESin imagen%3C/text%3E%3C/svg%3E"

  return (
    <div className="relative group">
      <Link href={`/producto/${product.id}`} className="block">
        <div className="relative aspect-[3/4] rounded-lg bg-surface-sunken overflow-hidden">
          <img
            src={imgError[imgIdx] ? fallbackSrc : (images[imgIdx] || fallbackSrc)}
            alt={product.title}
            loading="lazy"
            onError={() => setImgError(prev => ({ ...prev, [imgIdx]: true }))}
            className="w-full h-full object-contain bg-surface-sunken
              group-hover:scale-105 transition-transform duration-300"
          />

          {/* Carousel navigation arrows — visible on hover (desktop) or always (mobile) */}
          {hasMultiple && images.length > 1 && (
            <>
              <button
                onClick={prevImage}
                aria-label="Imagen anterior"
                className="absolute left-1 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full
                  bg-surface-card/70 backdrop-blur-sm flex items-center justify-center
                  text-text-strong opacity-0 group-hover:opacity-100
                  transition-opacity duration-200 shadow-sm
                  hover:bg-surface-card active:scale-90"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={nextImage}
                aria-label="Imagen siguiente"
                className="absolute right-1 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full
                  bg-surface-card/70 backdrop-blur-sm flex items-center justify-center
                  text-text-strong opacity-0 group-hover:opacity-100
                  transition-opacity duration-200 shadow-sm
                  hover:bg-surface-card active:scale-90"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              {/* Dots indicator */}
              <div className="absolute bottom-2 inset-x-0 flex justify-center gap-1
                opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                {images.map((_, i) => (
                  <span key={i}
                    className={`w-1.5 h-1.5 rounded-full transition-colors
                      ${i === imgIdx ? 'bg-white' : 'bg-white/50'}`} />
                ))}
              </div>
            </>
          )}

          {/* Touch tap zones for mobile — left/right halves */}
          {hasMultiple && (
            <>
              <button
                onClick={prevImage}
                aria-label="Anterior"
                className="absolute inset-y-0 left-0 w-1/3 z-10 opacity-0"
              />
              <button
                onClick={nextImage}
                aria-label="Siguiente"
                className="absolute inset-y-0 right-0 w-1/3 z-10 opacity-0"
              />
            </>
          )}

          <div className="absolute top-2 left-2 flex flex-col gap-1 pointer-events-none">
            {product.condition && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-surface-card text-text-muted w-fit">
                {CONDITION_LABEL[product.condition] ?? product.condition}
              </span>
            )}
            {product.free_shipping && (
              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold
                bg-success-500 text-white flex items-center gap-0.5 shadow-sm w-fit">
                <Truck className="w-2.5 h-2.5" />
                Envío gratis
              </span>
            )}
          </div>

          {/* Quick add to cart button */}
          <button onClick={handleAddToCart}
            className={`absolute bottom-2 right-2 w-8 h-8 rounded-full flex items-center justify-center
              transition-all duration-200 shadow-md z-20
              lg:opacity-0 lg:group-hover:opacity-100 lg:translate-y-2 lg:group-hover:translate-y-0
              ${isInCart
                ? 'bg-success-500 text-white'
                : 'bg-surface-card text-text-strong hover:bg-brand hover:text-white active:scale-90'}`}>
            {isInCart ? (
              <ShoppingBag className="w-3.5 h-3.5 fill-white" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
          </button>
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
          active:scale-90 z-20"
      >
        <Heart
          className={`w-4 h-4 transition-colors ${isFav ? 'fill-error-500 text-error-500' : 'text-text-muted'}`}
        />
      </button>
    </div>
  )
}

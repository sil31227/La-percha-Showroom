"use client"
import { useState, useMemo } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, ShoppingBag, Heart, Loader2, Minus, Plus } from "lucide-react"
import { useProductoById } from "@/lib/useProductos"
import { useShopStore } from "@/store/useShopStore"
import { ProductGallery } from "@/components/ProductGallery"
import { CommentSection } from "@/components/CommentSection"
import { SizeSelector } from "@/components/SizeSelector"
import { SellerCard } from "@/components/SellerCard"
import { Toast } from "@/components/Toast"

const CONDITION_LABEL: Record<string, string> = {
  new_tag: 'Nuevo con etiqueta',
  new: 'Nuevo',
  like_new: 'Como nuevo',
  used: 'Usado',
}

function variantLabel(v: { talle: string; color: string }): string {
  return [v.talle, v.color].filter(Boolean).join(" / ") || "Único"
}

export default function ProductoPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [selectedSize, setSelectedSize] = useState('')
  const [selectedVariantIdx, setSelectedVariantIdx] = useState<number[]>([])
  const [sizeError, setSizeError] = useState(false)
  const [toast, setToast] = useState(false)
  const [quantity, setQuantity] = useState(1)

  const addToCart = useShopStore(s => s.addToCart)
  const toggleFavorite = useShopStore(s => s.toggleFavorite)
  const isFav = useShopStore(s => s.isFavorite(id))

  const { product, loading, error } = useProductoById(id)

  const sizes = useMemo(
    () => product?.sizes?.length ? product.sizes : ["Único"],
    [product?.sizes],
  )
  const showSizeSelector = useMemo(
    () => (product?.tipo === "ropa") || sizes.length > 1 || sizes[0] !== "Único",
    [product?.tipo, sizes],
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-brand animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <p className="text-text-muted">No se pudo cargar el producto</p>
        <button
          onClick={() => window.location.reload()}
          className="text-brand font-semibold text-sm hover:underline">
          Reintentar
        </button>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <p className="text-4xl">🕵️</p>
        <p className="text-text-muted">Prenda no encontrada</p>
        <Link href="/home" className="text-brand font-semibold text-sm hover:underline">
          Volver al catálogo
        </Link>
      </div>
    )
  }

  console.log("[producto page]", product.id, "tipo:", product.tipo, "variantes:", product.variantes?.length, product.variantes)

  const isMultiVariant = product.store_type === "oficial" && product.tipo !== "ropa" && (product.variantes?.length || 0) > 0
  const hasVariants = (product.variantes?.length || 0) > 0
  const showQuantity = product.store_type === "oficial" && product.tipo !== "ropa"
  const selectedVariants = hasVariants ? selectedVariantIdx.filter(i => product.variantes![i]) : []
  const activeVariant = selectedVariants.length === 1 ? product.variantes![selectedVariants[0]] : null
  const displayPrice = activeVariant ? activeVariant.precio : product.price
  const maxStock = activeVariant ? (activeVariant.stock || 0) : (product.stock || 0)

  function toggleVariant(i: number) {
    setSelectedVariantIdx(prev => {
      if (prev.includes(i)) return prev.filter(x => x !== i)
      if (isMultiVariant) return [...prev, i]
      return [i]
    })
  }

  const handleAddToCart = () => {
    const size = selectedSize || (sizes.length === 1 ? sizes[0] : "")
    if (!size) { setSizeError(true); return }
    setSizeError(false)
    if (hasVariants && selectedVariants.length === 0) return
    const targets = hasVariants ? selectedVariants.map(i => product.variantes![i]) : [null]
    for (const v of targets) {
      addToCart({
        productId: product.id,
        title: product.title,
        price: v ? v.precio : product.price,
        image: v?.imagen || product.images[0],
        size,
        quantity: quantity,
        store_type: product.store_type,
        variantLabel: v ? variantLabel(v) : undefined,
        variantPrice: v ? v.precio : undefined,
        variantAttributes: v ? { Talle: v.talle, Color: v.color } : undefined,
        variantStock: v ? v.stock : undefined,
      })
    }
    setToast(true)
    setTimeout(() => router.push('/home'), 2100)
  }

  return (
    <>
      {/* Header mobile */}
      <div className="flex items-center gap-2 h-14 px-4 lg:hidden">
        <button onClick={() => router.back()}
          className="w-9 h-9 rounded-full bg-surface-sunken flex items-center justify-center">
          <ArrowLeft className="w-4.5 h-4.5 text-text-strong" />
        </button>
        <div className="flex-1" />
        <button
          onClick={() => toggleFavorite(product.id)}
          data-testid="detail-fav"
          className="w-9 h-9 rounded-full bg-surface-sunken flex items-center justify-center">
          <Heart className={`w-4.5 h-4.5 ${isFav ? 'fill-error-500 text-error-500' : 'text-text-muted'}`} />
        </button>
        <Link href="/carrito"
          className="w-9 h-9 rounded-full bg-surface-sunken flex items-center justify-center">
          <ShoppingBag className="w-4.5 h-4.5 text-text-strong" />
        </Link>
      </div>

      {/* Back desktop */}
      <div className="hidden lg:flex items-center gap-2 px-6 py-4">
        <button onClick={() => router.back()}
          className="flex items-center gap-1.5 text-text-muted text-sm
            hover:text-text-strong transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Volver al catálogo
        </button>
      </div>

      {/* Two-column layout */}
      <div className="lg:flex lg:gap-10 lg:px-6 lg:pb-10 lg:items-start">

        {/* Galería */}
        <div className="lg:w-[45%] lg:shrink-0">
          <ProductGallery images={product.images} title={product.title} />
        </div>

        {/* Info */}
        <div className="flex flex-col gap-4 px-4 lg:px-0 lg:flex-1 pt-4 lg:pt-0">

          {/* Tipo + título + heart */}
          <div>
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold
                  bg-surface-sunken text-text-muted mb-1">
                  {product.store_type === 'oficial' ? 'Tienda Oficial' : 'Feria de Ropa'}
                </span>
                <h1 className="font-display text-2xl text-text-strong leading-tight">
                  {product.title}
                </h1>
              </div>
              <button
                onClick={() => toggleFavorite(product.id)}
                className="hidden lg:flex w-10 h-10 rounded-full bg-surface-sunken
                  items-center justify-center shrink-0 mt-1">
                <Heart className={`w-5 h-5 ${isFav ? 'fill-error-500 text-error-500' : 'text-text-muted'}`} />
              </button>
            </div>
            <p className="text-2xl font-bold text-price mt-1">
              $ {displayPrice.toLocaleString('es-AR')}
            </p>
          </div>

          {/* Vendedor */}
          <SellerCard seller={product.seller} />

          {/* Metadata */}
          <div className="flex gap-4">
            {product.condition && (
              <div>
                <p className="text-xs text-text-muted">Estado</p>
                <p className="text-sm font-semibold text-text-strong">
                  {CONDITION_LABEL[product.condition]}
                </p>
              </div>
            )}
            <div>
              <p className="text-xs text-text-muted">Marca</p>
              <p className="text-sm font-semibold text-text-strong">{product.brand}</p>
            </div>
          </div>

          {/* Descripción */}
          <p className="text-sm text-text-muted leading-relaxed">{product.description}</p>

          {/* Comentarios */}
          <CommentSection productoId={product.id} />

          {/* Selector de talle */}
          {showSizeSelector && (
            <SizeSelector
              sizes={sizes}
              selected={selectedSize}
              onChange={(s) => { setSelectedSize(s); setSizeError(false) }}
              error={sizeError}
            />
          )}

          {/* Selector de variante */}
          {hasVariants && (
            <div>
              <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wide mb-1.5">
                {isMultiVariant ? "Sabores / Variantes (elegí uno o más)" : "Variante"}
              </label>
              <div className="flex flex-wrap gap-2" data-testid="variant-selector">
                {product.variantes!.map((v, i) => (
                  <button
                    key={i}
                    onClick={() => toggleVariant(i)}
                    className={`px-3.5 py-2 rounded-full text-[11px] font-semibold border transition-colors text-left
                      ${selectedVariantIdx.includes(i)
                        ? 'bg-brand text-white border-brand'
                        : 'bg-surface-sunken text-text-body border-transparent hover:border-brand'}`}
                  >
                    <span>{variantLabel(v)}</span>
                    {v.precio !== product.price && (
                      <span className="ml-1 opacity-80">($ {v.precio.toLocaleString('es-AR')})</span>
                    )}
                    {v.stock > 0 && (
                      <span className="ml-1 text-[9px] opacity-60">· {v.stock}u</span>
                    )}
                  </button>
                ))}
              </div>
              {isMultiVariant && selectedVariants.length > 0 && (
                <p className="text-[10px] text-text-muted mt-1.5">
                  {selectedVariants.length} seleccionado{selectedVariants.length !== 1 ? 's' : ''}
                </p>
              )}
              {activeVariant && activeVariant.stock > 0 && (
                <p className="text-[10px] text-text-muted mt-1.5">
                  Stock: {activeVariant.stock} unid.
                </p>
              )}
            </div>
          )}

          {/* Quantity selector (solo tienda oficial no-ropa) */}
          {showQuantity && (
            <div className="flex items-center gap-3 py-1">
              <span className="text-xs font-semibold text-text-muted uppercase tracking-wide">Cantidad</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="w-8 h-8 rounded-full bg-surface-sunken flex items-center justify-center hover:bg-surface-inverse/10 transition-colors disabled:opacity-30"
                  disabled={quantity <= 1}
                >
                  <Minus className="w-3.5 h-3.5 text-text-strong" />
                </button>
                <span className="w-10 text-center text-sm font-semibold text-text-strong">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity(q => maxStock > 0 ? Math.min(maxStock, q + 1) : q + 1)}
                  className="w-8 h-8 rounded-full bg-surface-sunken flex items-center justify-center hover:bg-surface-inverse/10 transition-colors disabled:opacity-30"
                  disabled={maxStock > 0 && quantity >= maxStock}
                >
                  <Plus className="w-3.5 h-3.5 text-text-strong" />
                </button>
              </div>
              {maxStock > 0 && (
                <span className="text-[10px] text-text-muted">{maxStock} disponible{maxStock !== 1 ? 's' : ''}</span>
              )}
            </div>
          )}

          {/* CTA — fixed bottom mobile → inline desktop */}
          <div className="fixed bottom-20 inset-x-0 mx-auto w-full max-w-107.5
            bg-bg-page border-t border-border-subtle px-4 pt-3 pb-4
            lg:static lg:bottom-auto lg:border-t-0 lg:pt-2 lg:pb-0
            lg:px-0 lg:max-w-full z-10">
            <button
              onClick={handleAddToCart}
              disabled={showSizeSelector && !selectedSize}
              data-testid="add-to-cart"
              className={`flex items-center justify-center gap-2.5 w-full h-13
                font-semibold rounded-lg transition-colors
                ${(showSizeSelector && !selectedSize)
                  ? 'bg-brand/40 text-text-on-brand cursor-not-allowed'
                  : 'bg-brand hover:bg-brand-hover text-text-on-brand cursor-pointer'}`}>
              <ShoppingBag className="w-5 h-5" />
              Agregar al carrito
            </button>
          </div>

          {/* Spacer mobile para el CTA fixed */}
          <div className="h-20 lg:hidden" />
        </div>
      </div>

      {toast && (
        <Toast
          message="¡Agregado al carrito!"
          onClose={() => setToast(false)}
          duration={2000}
        />
      )}
    </>
  )
}

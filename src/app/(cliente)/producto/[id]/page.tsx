"use client"
import { use, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, ShoppingBag, Heart, Loader2 } from "lucide-react"
import { useProductoById } from "@/lib/useProductos"
import { useShopStore } from "@/store/useShopStore"
import { ProductGallery } from "@/components/ProductGallery"
import { SizeSelector } from "@/components/SizeSelector"
import { SellerCard } from "@/components/SellerCard"
import { Toast } from "@/components/Toast"

const CONDITION_LABEL: Record<string, string> = {
  new_tag: 'Nuevo con etiqueta',
  new: 'Nuevo',
  like_new: 'Como nuevo',
  used: 'Usado',
}

export default function ProductoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [selectedSize, setSelectedSize] = useState('')
  const [selectedVariant, setSelectedVariant] = useState(-1)
  const [sizeError, setSizeError] = useState(false)
  const [toast, setToast] = useState(false)

  const addToCart = useShopStore(s => s.addToCart)
  const toggleFavorite = useShopStore(s => s.toggleFavorite)
  const isFav = useShopStore(s => s.isFavorite(id))

  const { product, loading } = useProductoById(id)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-brand animate-spin" />
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

  const sizes = product.sizes?.length ? product.sizes : ["Único"]
  const showSizeSelector = product.tipo !== "tienda" || sizes.length > 1 || sizes[0] !== "Único"

  const activeVariant = product.variantes?.[selectedVariant] || null
  const displayPrice = activeVariant ? activeVariant.precio : product.price

  const handleAddToCart = () => {
    const size = selectedSize || (sizes.length === 1 ? sizes[0] : "")
    if (!size) { setSizeError(true); return }
    setSizeError(false)
    addToCart({
      productId: product.id,
      title: product.title,
      price: displayPrice,
      image: product.images[0],
      size,
      store_type: product.store_type,
      variantLabel: activeVariant ? activeVariant.nombre : undefined,
      variantPrice: activeVariant ? activeVariant.precio : undefined,
    })
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
          {product.variantes && product.variantes.length > 0 && (
            <div>
              <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wide mb-1.5">
                Variante
              </label>
              <div className="flex flex-wrap gap-2">
                {product.variantes.map((v, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedVariant(i)}
                    className={`px-3.5 py-2 rounded-full text-[11px] font-semibold border transition-colors text-left
                      ${selectedVariant === i
                        ? 'bg-brand text-white border-brand'
                        : 'bg-surface-sunken text-text-body border-transparent hover:border-brand'}`}
                  >
                    <span>{v.nombre}</span>
                    {v.precio !== product.price && (
                      <span className="ml-1 opacity-80">($ {v.precio.toLocaleString('es-AR')})</span>
                    )}
                  </button>
                ))}
              </div>
              {activeVariant && activeVariant.stock > 0 && (
                <p className="text-[10px] text-text-muted mt-1.5">
                  Stock disponible: {activeVariant.stock} unidad{activeVariant.stock !== 1 ? 'es' : ''}
                </p>
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

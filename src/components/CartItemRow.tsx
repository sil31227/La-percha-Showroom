import { X, Minus, Plus } from "lucide-react"
import type { CartItem } from "@/lib/types"
import { useShopStore } from "@/store/useShopStore"

interface Props {
  item: CartItem
  onRemove: (productId: string) => void
}

export function CartItemRow({ item, onRemove }: Props) {
  const updateQuantity = useShopStore(s => s.updateQuantity)
  const qty = item.quantity || 1
  const showQuantity = item.store_type === "oficial"

  return (
    <div className="flex items-center gap-3 bg-surface-card px-4 py-3.5
      border-b border-border-subtle last:border-b-0
      lg:rounded-lg lg:border lg:border-border-subtle lg:mb-2"
      data-testid="cart-row" data-product-id={item.productId}>
      <div className="w-16 h-16 rounded-md bg-surface-sunken shrink-0 overflow-hidden">
        <img src={item.image} alt={item.title}
          className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-text-strong truncate">{item.title}</p>
        <p className="text-xs text-text-muted mt-0.5">
          {item.variantLabel && <span className="block">{item.variantLabel}</span>}
          Talle {item.size} · {item.store_type === 'oficial' ? 'Tienda Oficial' : 'Feria'}
        </p>
        <p className="text-sm font-bold text-price mt-1">
          $ {item.price.toLocaleString('es-AR')}
        </p>
      </div>
      {showQuantity && (
        <div className="flex items-center gap-1 shrink-0 mr-1">
          <button
            onClick={() => updateQuantity(item.productId, qty - 1)}
            data-testid="cart-qty-dec"
            className="w-7 h-7 rounded-full bg-surface-sunken flex items-center justify-center hover:bg-surface-inverse/10 transition-colors"
          >
            <Minus className="w-3 h-3 text-text-muted" />
          </button>
          <span className="w-7 text-center text-xs font-semibold text-text-strong" data-testid="cart-qty">{qty}</span>
          <button
            onClick={() => updateQuantity(item.productId, qty + 1)}
            data-testid="cart-qty-inc"
            disabled={(item.variantStock ?? Infinity) > 0 && qty >= (item.variantStock ?? Infinity)}
            className="w-7 h-7 rounded-full bg-surface-sunken flex items-center justify-center hover:bg-surface-inverse/10 transition-colors disabled:opacity-30"
          >
            <Plus className="w-3 h-3 text-text-muted" />
          </button>
        </div>
      )}
      <button
        onClick={() => onRemove(item.productId)}
        aria-label="Eliminar del carrito"
        className="w-8 h-8 rounded-full bg-surface-sunken flex items-center justify-center
          hover:bg-error-50 hover:text-error-500 transition-colors shrink-0">
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

import { X } from "lucide-react"
import type { CartItem } from "@/lib/types"

interface Props {
  item: CartItem
  onRemove: (productId: string) => void
}

export function CartItemRow({ item, onRemove }: Props) {
  return (
    <div className="flex items-center gap-3 bg-surface-card px-4 py-3.5
      border-b border-border-subtle last:border-b-0
      lg:rounded-lg lg:border lg:border-border-subtle lg:mb-2">
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

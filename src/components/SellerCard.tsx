import { Star } from "lucide-react"
import type { Seller } from "@/lib/types"

export function SellerCard({ seller }: { seller: Seller }) {
  return (
    <div className="flex items-center gap-3 py-3 border-y border-border-subtle">
      <img
        src={seller.avatar}
        alt={seller.name}
        className="w-10 h-10 rounded-full object-cover bg-surface-sunken"
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-text-strong truncate">{seller.name}</p>
        <div className="flex items-center gap-1 mt-0.5">
          <Star className="w-3 h-3 fill-rating-star text-rating-star" />
          <span className="text-xs text-text-muted">
            {seller.rating} · {seller.sales_count} ventas
          </span>
        </div>
      </div>
    </div>
  )
}

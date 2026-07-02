"use client"
import Link from "next/link"
import { ShoppingBag } from "lucide-react"
import { useShopStore } from "@/store/useShopStore"
import { CartItemRow } from "@/components/CartItemRow"
import { CartSummary } from "@/components/CartSummary"

export default function CarritoPage() {
  const cart = useShopStore(s => s.cart)
  const removeFromCart = useShopStore(s => s.removeFromCart)
  const total = useShopStore(s => s.cartTotal())
  const itemCount = useShopStore(s => s.cartCount())

  return (
    <>
      <div className="flex items-center h-14 px-4 lg:px-6">
        <h1 className="font-display text-xl text-text-strong">
          Carrito {itemCount > 0 && `(${itemCount})`}
        </h1>
      </div>

      {cart.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 px-6">
          <div className="w-20 h-20 rounded-full bg-surface-sunken flex items-center justify-center">
            <ShoppingBag className="w-9 h-9 text-text-muted" />
          </div>
          <div className="text-center">
            <p className="font-display text-xl text-text-strong">Tu carrito está vacío</p>
            <p className="text-text-muted text-sm mt-1">Explorá las prendas y empezá a elegir</p>
          </div>
          <Link href="/home"
            className="px-6 py-2.5 rounded-lg bg-brand text-text-on-brand
              font-semibold text-sm hover:bg-brand-hover transition-colors">
            Explorar prendas
          </Link>
        </div>
      ) : (
        <div className="lg:flex lg:gap-8 lg:px-6 lg:pb-10 lg:items-start">
          {/* Items */}
          <div className="flex flex-col pb-56 lg:pb-0 lg:flex-1">
            {cart.map(item => (
              <CartItemRow
                key={item.productId}
                item={item}
                onRemove={removeFromCart}
              />
            ))}
          </div>

          {/* Resumen */}
          <CartSummary total={total} itemCount={itemCount} />
        </div>
      )}
    </>
  )
}

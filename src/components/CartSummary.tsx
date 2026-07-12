import Link from "next/link"

interface Props {
  total: number
  itemCount: number
}

export function CartSummary({ total, itemCount }: Props) {
  return (
    <div className="fixed bottom-20 inset-x-0 mx-auto w-full max-w-107.5
      bg-surface-card border-t border-border-subtle
      lg:static lg:bottom-auto lg:w-80 lg:shrink-0
      lg:rounded-xl lg:border lg:border-border-subtle
      lg:sticky lg:top-[calc(var(--nav-h)+1.5rem)]"
      data-testid="cart-summary">
      <div className="px-4 py-3 space-y-2 lg:px-5 lg:py-4">
        <div className="flex justify-between text-sm">
          <span className="text-text-muted">Subtotal ({itemCount} producto{itemCount !== 1 ? 's' : ''})</span>
          <span className="font-semibold text-text-strong">
            $ {total.toLocaleString('es-AR')}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-text-muted">Envío</span>
          <span className="text-text-muted italic">A calcular</span>
        </div>
        <div className="h-px bg-border-subtle" />
        <div className="flex justify-between text-base">
          <span className="font-semibold text-text-strong">Total</span>
          <span className="font-bold text-price text-lg">
            $ {total.toLocaleString('es-AR')}
          </span>
        </div>
      </div>
      <div className="px-4 pb-4 lg:px-5 lg:pb-5">
        <Link href="/checkout/paso-1"
          className={`flex items-center justify-center w-full h-13
            font-semibold rounded-lg transition-colors
            ${itemCount === 0
              ? 'bg-border-subtle text-text-muted cursor-not-allowed pointer-events-none'
              : 'bg-brand hover:bg-brand-hover text-text-on-brand'}`}>
          Iniciar checkout
        </Link>
      </div>
    </div>
  )
}

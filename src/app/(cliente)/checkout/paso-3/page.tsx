"use client"
import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { CheckCircle, Loader2, AlertCircle, Clock } from "lucide-react"
import { useShopStore } from "@/store/useShopStore"
import { CheckoutStepper } from "@/components/CheckoutStepper"

interface CartItem {
  productId: string
  title: string
  price: number
  image: string
  size: string
  store_type: string
}

function Paso3Content() {
  const searchParams = useSearchParams()
  const cart = useShopStore(s => s.cart)
  const total = useShopStore(s => s.cartTotal())
  const clearCart = useShopStore(s => s.clearCart)
  const [orderNumber, setOrderNumber] = useState("")
  const [email, setEmail] = useState("")
  const [items, setItems] = useState<CartItem[]>([])
  const [orderTotal, setOrderTotal] = useState(total)
  const [status, setStatus] = useState<"loading" | "success" | "pending" | "error">("loading")
  const [errorMsg, setErrorMsg] = useState("")

  const mpStatus = searchParams.get("status")
  const mpOrderId = searchParams.get("order_id")
  const isFromMP = !!mpStatus

  useEffect(() => {
    if (isFromMP) {
      if (mpStatus === "approved" || mpStatus === "pending") {
        const capturedItems = [...cart]
        if (capturedItems.length > 0) {
          setItems(capturedItems)
          setOrderTotal(total)
          setOrderNumber(mpOrderId || "")
          setStatus(mpStatus as "success" | "pending")
          try {
            const addrRaw = sessionStorage.getItem("checkout_address")
            if (addrRaw) setEmail(JSON.parse(addrRaw).email || "")
          } catch {}
          clearCart()
          sessionStorage.removeItem("checkout_order_id")
          sessionStorage.removeItem("checkout_address")
          sessionStorage.removeItem("checkout_payment")
        } else {
          setOrderNumber(mpOrderId || "")
          setStatus("success")
          setItems([])
          setOrderTotal(0)
        }
        return
      }

      if (mpStatus === "rejected") {
        setStatus("error")
        setErrorMsg("El pago fue rechazado. Intentá con otro método.")
        return
      }
    }

    const capturedItems = [...cart]
    const capturedTotal = total
    setItems(capturedItems)
    setOrderTotal(capturedTotal)

    let checkoutEmail = ""
    let address: unknown = null
    let paymentMethod = ""

    try {
      const addrRaw = sessionStorage.getItem("checkout_address")
      if (addrRaw) {
        address = JSON.parse(addrRaw)
        checkoutEmail = (address as Record<string, string>).email || ""
      }
      paymentMethod = sessionStorage.getItem("checkout_payment") || ""
    } catch {}

    setEmail(checkoutEmail)

    fetch("/api/checkout/crear-pedido", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: capturedItems,
        direccion: address,
        email: checkoutEmail,
        paymentMethod,
      }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.ok) {
          setOrderNumber(data.orderId)
          setStatus("success")
          clearCart()
          sessionStorage.removeItem("checkout_address")
          sessionStorage.removeItem("checkout_payment")
        } else {
          setStatus("error")
          setErrorMsg(data.error || "Error al crear el pedido")
        }
      })
      .catch(() => {
        setStatus("error")
        setErrorMsg("Error de conexión. Intentá de nuevo.")
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (status === "loading") {
    return (
      <div className="w-full lg:max-w-lg lg:mx-auto">
        <CheckoutStepper currentStep={3} />
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <Loader2 className="w-10 h-10 text-brand animate-spin" />
          <p className="text-text-muted text-sm">
            {isFromMP ? "Verificando tu pago..." : "Creando tu pedido..."}
          </p>
        </div>
      </div>
    )
  }

  if (status === "error") {
    return (
      <div className="w-full lg:max-w-lg lg:mx-auto">
        <CheckoutStepper currentStep={3} />
        <div className="px-4 lg:px-0 py-8 flex flex-col items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-error-50 flex items-center justify-center">
            <AlertCircle className="w-10 h-10 text-error-500" />
          </div>
          <div className="text-center">
            <h1 className="font-display text-2xl text-text-strong">Algo salió mal</h1>
            <p className="text-text-muted text-sm mt-1">{errorMsg}</p>
          </div>
          <Link href="/checkout/paso-2"
            className="w-full max-w-xs h-13 flex items-center justify-center
              bg-brand hover:bg-brand-hover text-text-on-brand
              font-semibold rounded-lg transition-colors">
            Intentar de nuevo
          </Link>
        </div>
      </div>
    )
  }

  if (status === "pending") {
    return (
      <div className="w-full lg:max-w-lg lg:mx-auto">
        <CheckoutStepper currentStep={3} />
        <div className="px-4 lg:px-0 py-8 flex flex-col items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-warning-50 flex items-center justify-center">
            <Clock className="w-10 h-10 text-warning-500" />
          </div>
          <div className="text-center">
            <h1 className="font-display text-2xl text-text-strong">Pago en proceso</h1>
            <p className="text-text-muted text-sm mt-1">
              Tu pago está siendo procesado. Te avisaremos cuando se confirme.
            </p>
            {orderNumber && (
              <p className="text-text-muted text-sm mt-1">
                Orden <span className="font-mono font-semibold text-text-strong">#{orderNumber}</span>
              </p>
            )}
          </div>
          <Link href="/home"
            className="w-full h-13 flex items-center justify-center
              bg-brand hover:bg-brand-hover text-text-on-brand
              font-semibold rounded-lg transition-colors">
            Volver al inicio
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full lg:max-w-lg lg:mx-auto">
      <CheckoutStepper currentStep={3} />

      <div className="px-4 lg:px-0 py-8 flex flex-col items-center gap-6">
        <div className="w-20 h-20 rounded-full bg-success-50 flex items-center justify-center">
          <CheckCircle className="w-10 h-10 text-success-500" />
        </div>

        <div className="text-center">
          <h1 className="font-display text-2xl text-text-strong">
            {isFromMP ? "¡Pago confirmado!" : "¡Pedido confirmado!"}
          </h1>
          <p className="text-text-muted text-sm mt-1">
            Orden <span className="font-mono font-semibold text-text-strong">#{orderNumber}</span>
          </p>
          {email && (
            <p className="text-text-muted text-sm mt-1">
              Te enviamos los detalles a <strong>{email}</strong>
            </p>
          )}
        </div>

        {items.length > 0 && (
          <div className="w-full bg-surface-card rounded-xl border border-border-subtle overflow-hidden">
            <div className="px-4 py-3 border-b border-border-subtle">
              <p className="text-sm font-semibold text-text-strong">Tu pedido</p>
            </div>
            <div className="divide-y divide-border-subtle">
              {items.map(item => (
                <div key={item.productId} className="flex items-center gap-3 px-4 py-3">
                  <img src={item.image} alt={item.title}
                    className="w-12 h-12 rounded-md object-cover bg-surface-sunken shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text-strong truncate">{item.title}</p>
                    <p className="text-xs text-text-muted">Talle {item.size}</p>
                  </div>
                  <p className="text-sm font-bold text-price shrink-0">
                    $ {item.price.toLocaleString("es-AR")}
                  </p>
                </div>
              ))}
            </div>
            <div className="px-4 py-3 border-t border-border-subtle flex justify-between">
              <span className="font-semibold text-text-strong">Total</span>
              <span className="font-bold text-price">
                $ {orderTotal.toLocaleString("es-AR")}
              </span>
            </div>
          </div>
        )}

        <Link href="/home"
          className="w-full h-13 flex items-center justify-center
            bg-brand hover:bg-brand-hover text-text-on-brand
            font-semibold rounded-lg transition-colors">
          Seguir comprando
        </Link>
      </div>
    </div>
  )
}

export default function CheckoutPaso3() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-brand animate-spin" />
      </div>
    }>
      <Paso3Content />
    </Suspense>
  )
}

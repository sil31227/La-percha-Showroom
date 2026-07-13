"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useShopStore } from "@/store/useShopStore"
import { useAuthStore } from "@/store/useAuthStore"
import { CheckoutStepper } from "@/components/CheckoutStepper"
import { PaymentMethodCard } from "@/components/PaymentMethodCard"

export default function CheckoutPaso2() {
  const router = useRouter()
  const [method, setMethod] = useState("")
  const [error, setError] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [apiError, setApiError] = useState("")
  const total = useShopStore(s => s.cartTotal())
  const cart = useShopStore(s => s.cart)
  const user = useAuthStore(s => s.user)
  const shippingCost = useShopStore(s => s.shippingCost)
  const shippingMethod = useShopStore(s => s.shippingMethod)
  const totalConEnvio = total + shippingCost

  const handleConfirmar = async () => {
    if (!method) { setError(true); return }
    setError(false)
    setApiError("")

    let address = null
    try {
      const addrRaw = sessionStorage.getItem("checkout_address")
      if (addrRaw) address = JSON.parse(addrRaw)
    } catch {}

    if (method === "mercadopago") {
      setSubmitting(true)
      try {
        const res = await fetch("/api/mercadopago/crear-preferencia", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: cart,
            direccion: address,
            email: user?.email || (address as Record<string, string>)?.email,
            payerName: user?.name || (address as Record<string, string>)?.name,
            metodo_envio: shippingMethod,
            costo_envio: shippingCost,
          }),
        })
        const data = await res.json()
        if (data.ok && data.initPoint) {
          sessionStorage.setItem("checkout_order_id", data.orderId)
          sessionStorage.removeItem("checkout_address")
          sessionStorage.removeItem("checkout_payment")
          window.location.href = data.initPoint
        } else {
          setApiError(data.error || "Error al crear el pago")
        }
      } catch {
        setApiError("Error de conexión. Intentá de nuevo.")
      }
      setSubmitting(false)
    } else {
      sessionStorage.setItem("checkout_payment", method)
      router.push("/checkout/paso-3")
    }
  }

  return (
    <div className="w-full lg:max-w-lg lg:mx-auto">
      <CheckoutStepper currentStep={2} />

      <div className="px-4 lg:px-0 pb-32 lg:pb-10 space-y-4 mt-2">
        <h2 className="font-display text-xl text-text-strong">Método de pago</h2>

        <div className="space-y-3">
          <PaymentMethodCard
            id="mp"
            value="mercadopago"
            selected={method}
            onChange={(v) => { setMethod(v); setError(false); setApiError("") }}
            label="Mercado Pago"
            description="Pagá con tarjeta, débito o saldo MP">
            <div className="flex items-center gap-3 bg-surface-sunken rounded-lg p-3">
              <div className="w-10 h-10 rounded-lg bg-[#009EE3] flex items-center justify-center shrink-0">
                <span className="text-white font-bold text-xs">MP</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-text-strong">
                  Total: $ {totalConEnvio.toLocaleString("es-AR")}
                </p>
                <p className="text-xs text-text-muted">
                  Serás redirigido a Mercado Pago para completar el pago
                </p>
              </div>
            </div>
          </PaymentMethodCard>

          <PaymentMethodCard
            id="transfer"
            value="transferencia"
            selected={method}
            onChange={(v) => { setMethod(v); setError(false); setApiError("") }}
            label="Transferencia bancaria"
            description="CBU / Alias · Acreditación en 24-48hs">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-1 border-b border-border-subtle">
                <span className="text-text-muted">CBU</span>
                <span className="font-mono text-text-strong text-xs">0000003100012345678901</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border-subtle">
                <span className="text-text-muted">Alias</span>
                <span className="font-semibold text-text-strong">LAPERCHA.SHOWROOM</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border-subtle">
                <span className="text-text-muted">Banco</span>
                <span className="text-text-strong">Banco Galicia</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border-subtle">
                <span className="text-text-muted">Subtotal</span>
                <span className="text-text-strong">$ {total.toLocaleString("es-AR")}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border-subtle">
                <span className="text-text-muted">Envío</span>
                <span className="text-text-strong">{shippingCost === 0 ? "Gratis" : `$ ${shippingCost.toLocaleString("es-AR")}`}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-text-muted font-semibold">Monto</span>
                <span className="font-bold text-price">$ {totalConEnvio.toLocaleString("es-AR")}</span>
              </div>
              <p className="text-xs text-text-muted bg-warning-50 rounded-lg p-2.5 mt-1">
                Envianos el comprobante a <strong>sil31227@gmail.com</strong> con el número de orden
              </p>
            </div>
          </PaymentMethodCard>

          {shippingMethod === "retiro_local" && (
            <PaymentMethodCard
              id="efectivo"
              value="efectivo"
              selected={method}
              onChange={(v) => { setMethod(v); setError(false); setApiError("") }}
              label="Pago en efectivo"
              description="Coordinás el pago al retirar en el local">
              <p className="text-xs text-text-muted bg-matcha-50 rounded-lg p-2.5">
                Total a pagar: <strong>$ {totalConEnvio.toLocaleString("es-AR")}</strong>. Coordinás la cita previa por WhatsApp para retirar y pagar en efectivo.
              </p>
            </PaymentMethodCard>
          )}
        </div>

        {error && (
          <p className="text-xs text-error-500">Seleccioná un método de pago</p>
        )}
        {apiError && (
          <p className="text-xs text-error-500 bg-error-50 rounded-lg p-2.5">{apiError}</p>
        )}
      </div>

      <div className="fixed bottom-20 inset-x-0 mx-auto w-full max-w-107.5
        bg-bg-page border-t border-border-subtle px-4 pt-3 pb-4
        lg:static lg:bottom-auto lg:border-t-0 lg:pt-4 lg:pb-0
        lg:px-0 lg:max-w-full z-10">
        <button onClick={handleConfirmar} disabled={submitting || !method}
          className={`w-full h-13 font-semibold rounded-lg transition-colors
            ${method && !submitting
              ? "bg-brand hover:bg-brand-hover text-text-on-brand"
              : "bg-brand/40 text-text-on-brand cursor-not-allowed"}`}>
          {submitting ? "Conectando con Mercado Pago..." : "Confirmar pago →"}
        </button>
      </div>
    </div>
  )
}

"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Package, Loader2, CheckCircle, AlertCircle, MessageCircle } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuthStore } from "@/store/useAuthStore"
import { EnableBuyerPush } from "./EnableBuyerPush"
import { ChatWindow } from "@/components/ChatWindow"

interface Pedido {
  id: string
  producto_titulo: string
  producto_imagen: string
  precio: number
  status: string
  talle: string
  created_at: string
  metodo_envio: string | null
  seguimiento: string | null
}

const STATUS_LABEL: Record<string, string> = {
  pending_shipment: "Preparando",
  shipped: "En camino",
  delivered: "Entregado",
  cancelled: "Cancelado",
}

const STATUS_STYLE: Record<string, string> = {
  pending_shipment: "bg-warning-50 text-warning-500",
  shipped: "bg-info-50 text-info-600",
  delivered: "bg-success-50 text-success-600",
  cancelled: "bg-error-50 text-error-500",
}

const TRACKING_URL = "https://www.correoargentino.com.ar/formularios/e-commerce"

function esCorreoArgentino(metodo: string | null) {
  return metodo === "correo_sucursal" || metodo === "correo_domicilio"
}

export default function ComprasPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const user = useAuthStore(s => s.user)
  const session = useAuthStore(s => s.session)
  const initialized = useAuthStore(s => s.initialized)
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [loading, setLoading] = useState(true)
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const [confirmError, setConfirmError] = useState<string | null>(null)
  const [chatPedidoId, setChatPedidoId] = useState<string | null>(null)

  const pedidoParam = searchParams.get("pedido")

  useEffect(() => {
    if (!initialized) return
    if (!user?.email) {
      router.replace("/ingresar?redirect=/perfil/compras")
      return
    }
    fetchPedidos()
  }, [user, initialized])

  useEffect(() => {
    if (pedidoParam && pedidos.length > 0) {
      const match = pedidos.find(p => p.id === pedidoParam)
      if (match) setChatPedidoId(match.id)
    }
  }, [pedidoParam, pedidos])

  function fetchPedidos() {
    if (!user?.email) return
    setLoading(true)
    supabase
      .from("pedidos")
      .select("id, producto_titulo, producto_imagen, precio, status, talle, created_at, metodo_envio, seguimiento")
      .eq("comprador_email", user.email)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setPedidos((data || []) as Pedido[])
        setLoading(false)
      })
  }

  async function confirmarRecepcion(pedidoId: string) {
    if (!session?.access_token) return
    setConfirmingId(pedidoId)
    setConfirmError(null)
    try {
      const res = await fetch("/api/pedidos/confirmar-entrega", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ pedidoId }),
      })
      const data = await res.json().catch(() => ({ error: "Error de conexión" }))
      if (!res.ok) {
        setConfirmError(data.error || "No se pudo confirmar la entrega")
        setConfirmingId(null)
        return
      }
      fetchPedidos()
      setConfirmingId(null)
    } catch {
      setConfirmError("Error de conexión")
      setConfirmingId(null)
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="h-16 flex items-center gap-3 px-5 bg-bg-page border-b border-border-subtle sticky top-0 z-10 lg:top-16">
        <Link href="/perfil" className="w-9 h-9 rounded-full bg-surface-sunken flex items-center justify-center shrink-0">
          <ArrowLeft className="w-4 h-4 text-text-muted" />
        </Link>
        <h1 className="font-display text-xl text-text-strong">Mis compras</h1>
      </header>

      <div className="px-4 lg:px-6 pt-3 max-w-lg mx-auto w-full">
        <EnableBuyerPush />
      </div>

      <div className="flex-1 px-4 lg:px-6 py-4 space-y-4 pb-24 lg:pb-10 max-w-lg mx-auto w-full">
        {confirmError && (
          <div className="bg-danger-50 border border-danger-200 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-danger-500 shrink-0 mt-0.5" />
            <p className="text-xs text-danger-600">{confirmError}</p>
          </div>
        )}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-brand animate-spin" />
          </div>
        ) : pedidos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Package className="w-12 h-12 text-text-subtle" />
            <p className="text-text-muted text-sm">Todavía no hiciste ninguna compra</p>
            <Link href="/home"
              className="mt-2 px-5 py-2 rounded-full bg-brand text-white font-semibold text-sm hover:bg-brand-hover transition-colors">
              Descubrir prendas
            </Link>
          </div>
        ) : (
          pedidos.map(pedido => (
            <div key={pedido.id}
              className="bg-surface-card rounded-xl border border-border-subtle overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-text-muted" />
                  <span className="text-xs text-text-muted">
                    {new Date(pedido.created_at).toLocaleDateString("es-AR")}
                  </span>
                </div>
                <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLE[pedido.status] || ""}`}>
                  {STATUS_LABEL[pedido.status] || pedido.status}
                </span>
              </div>

              <div className="flex items-center gap-3 px-4 py-3">
                <img src={pedido.producto_imagen} alt={pedido.producto_titulo}
                  className="w-14 h-18 rounded-lg object-cover bg-surface-sunken shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-strong truncate">{pedido.producto_titulo}</p>
                  {pedido.talle && <p className="text-xs text-text-muted">Talle {pedido.talle}</p>}
                  <p className="text-sm font-bold text-price mt-0.5">
                    $ {pedido.precio.toLocaleString("es-AR")}
                  </p>
                </div>
              </div>

              <div className="px-4 py-2.5 bg-surface-sunken space-y-1">
                <span className="block text-[10px] text-text-muted">Orden #{pedido.id}</span>
                {pedido.status === "shipped" && esCorreoArgentino(pedido.metodo_envio) && (
                  <div className="text-[11px] text-info-600">
                    <span className="font-semibold">Enviado por Correo Argentino</span>
                    {pedido.seguimiento && (
                      <>
                        {" · "}Seguimiento: <span className="font-mono">{pedido.seguimiento}</span>
                        {" · "}<a href={TRACKING_URL} target="_blank" rel="noopener noreferrer" className="underline">Rastrear</a>
                      </>
                    )}
                  </div>
                )}
                {pedido.status === "shipped" && (
                  <button
                    onClick={() => confirmarRecepcion(pedido.id)}
                    disabled={confirmingId === pedido.id}
                    className="mt-2 w-full h-9 bg-brand hover:bg-brand-hover text-white font-semibold rounded-full text-xs
                      transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {confirmingId === pedido.id ? (
                      <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Confirmando...</>
                    ) : (
                      <><CheckCircle className="w-3.5 h-3.5" /> Ya recibí mi pedido</>
                    )}
                  </button>
                )}
                {pedido.metodo_envio === "arreglar_vendedor" && pedido.status !== "cancelled" && (
                  <>
                    {chatPedidoId === pedido.id ? (
                      <ChatWindow pedidoId={pedido.id} />
                    ) : (
                      <button
                        onClick={() => setChatPedidoId(pedido.id)}
                        className="mt-1 w-full h-9 bg-surface-sunken hover:bg-surface-inverse/10 text-text-body font-semibold rounded-full text-xs
                          transition-colors flex items-center justify-center gap-2 border border-border-default"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        Coordinar envío
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

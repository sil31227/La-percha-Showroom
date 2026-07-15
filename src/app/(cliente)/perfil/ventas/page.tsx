"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Package, Loader2, Truck, CheckCircle, XCircle, ClipboardList } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuthStore } from "@/store/useAuthStore"

interface PedidoVenta {
  id: string
  producto_titulo: string
  producto_imagen: string
  precio: number
  talle: string
  comprador_nombre: string
  comprador_email: string
  direccion: string | null
  status: string
  metodo_envio: string | null
  seguimiento: string | null
  created_at: string
}

const STATUS_LABEL: Record<string, string> = {
  pending_shipment: "Pendiente de envío",
  shipped: "En camino",
  delivered: "Entregado",
  cancelled: "Cancelado",
}

type ParsedAddress = { nombre?: string; email?: string; provincia?: string; ciudad?: string; cp?: string; direccion?: string }

function formatDireccion(raw?: string | null): string {
  if (!raw) return ""
  try {
    const d = JSON.parse(raw)
    if (d && typeof d === "object") {
      return [d.direccion, d.ciudad, d.provincia, d.cp && `CP ${d.cp}`].filter(Boolean).join(", ")
    }
  } catch {}
  return raw
}

const STATUS_STYLE: Record<string, string> = {
  pending_shipment: "bg-warning-50 text-warning-500",
  shipped: "bg-info-50 text-info-600",
  delivered: "bg-success-50 text-success-600",
  cancelled: "bg-error-50 text-error-500",
}

export default function VentasPage() {
  const user = useAuthStore(s => s.user)
  const session = useAuthStore(s => s.session)
  const [pedidos, setPedidos] = useState<PedidoVenta[]>([])
  const [loading, setLoading] = useState(true)
  const [despachandoId, setDespachandoId] = useState<string | null>(null)
  const [seguimiento, setSeguimiento] = useState("")
  const [errorMsg, setErrorMsg] = useState("")
  const [successMsg, setSuccessMsg] = useState("")

  useEffect(() => {
    if (!user?.id) { setLoading(false); return }
    fetchPedidos()
  }, [user])

  function fetchPedidos() {
    if (!user?.id) return
    setLoading(true)
    supabase
      .from("pedidos")
      .select("id, producto_titulo, producto_imagen, precio, talle, comprador_nombre, comprador_email, direccion, status, metodo_envio, seguimiento, created_at")
      .eq("vendedor_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setPedidos((data || []) as PedidoVenta[])
        setLoading(false)
      })
  }

  async function despachar(pedidoId: string) {
    if (!session?.access_token) {
      setErrorMsg("Sesión expirada, volvé a ingresar")
      return
    }
    setDespachandoId(pedidoId)
    setErrorMsg("")
    try {
      const res = await fetch("/api/pedidos/despachar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ pedidoId, seguimiento }),
      })
      const data = await res.json().catch(() => ({ error: "Error de conexión" }))
      if (!res.ok) {
        setErrorMsg(data.error || "No se pudo despachar el pedido")
        setDespachandoId(null)
        return
      }
      setSeguimiento("")
      setDespachandoId(null)
      setSuccessMsg("Pedido despachado. La compradora recibirá una notificación.")
      fetchPedidos()
      setTimeout(() => setSuccessMsg(""), 4000)
    } catch {
      setErrorMsg("Error de conexión")
      setDespachandoId(null)
    }
  }

  if (!user) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center gap-4 px-5 text-center">
        <p className="text-text-muted text-sm">Ingresá para ver tus ventas</p>
        <Link href="/ingresar"
          className="px-6 py-2.5 rounded-full bg-brand text-white font-semibold text-sm">
          Ingresar
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="h-16 flex items-center gap-3 px-5 bg-bg-page border-b border-border-subtle sticky top-0 z-10 lg:top-16">
        <Link href="/perfil" className="w-9 h-9 rounded-full bg-surface-sunken flex items-center justify-center shrink-0">
          <ArrowLeft className="w-4 h-4 text-text-muted" />
        </Link>
        <h1 className="font-display text-xl text-text-strong">Mis ventas</h1>
      </header>

      <div className="flex-1 px-4 lg:px-6 py-4 space-y-4 pb-24 lg:pb-10 max-w-lg mx-auto w-full">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-brand animate-spin" />
          </div>
        ) : pedidos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <ClipboardList className="w-12 h-12 text-text-subtle" />
            <p className="text-text-muted text-sm">Todavía no vendiste nada</p>
            <Link href="/vender"
              className="mt-2 px-5 py-2 rounded-full bg-brand text-white font-semibold text-sm hover:bg-brand-hover transition-colors">
              Publicar una prenda
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
                  <div className="flex items-center gap-2 mt-0.5">
                    {pedido.talle && <span className="text-xs text-text-muted">Talle {pedido.talle}</span>}
                    <span className="text-xs text-text-muted">· {pedido.comprador_nombre}</span>
                  </div>
                  <p className="text-sm font-bold text-price mt-0.5">
                    $ {pedido.precio.toLocaleString("es-AR")}
                  </p>
                </div>
              </div>

              <div className="px-4 py-2.5 bg-surface-sunken space-y-1">
                <span className="block text-[10px] text-text-muted">Orden #{pedido.id}</span>
                <p className="text-[11px] text-text-muted">
                  Compradora: {pedido.comprador_nombre || "—"}
                  {pedido.comprador_email && <span className="ml-1">· {pedido.comprador_email}</span>}
                </p>
                {pedido.direccion && (
                  <p className="text-[11px] text-text-muted">
                    Envío: {formatDireccion(pedido.direccion)}
                  </p>
                )}

                {pedido.status === "shipped" && (
                  <div className="text-[11px] text-info-600">
                    <span className="font-semibold">Enviado</span>
                    {pedido.seguimiento && (
                      <span> · Seguimiento: <span className="font-mono">{pedido.seguimiento}</span></span>
                    )}
                  </div>
                )}

                {pedido.status === "delivered" && (
                  <div className="flex items-center gap-1.5 text-[11px] text-success-600">
                    <CheckCircle className="w-3 h-3" />
                    <span>Entregado — tu saldo fue acreditado</span>
                  </div>
                )}

                {pedido.status === "pending_shipment" && (
                  <div className="mt-2 space-y-2">
                    {despachandoId === pedido.id ? (
                      <>
                        <div>
                          <label className="text-[10px] font-semibold text-text-muted uppercase tracking-wide">
                            Número de seguimiento (opcional)
                          </label>
                          <input
                            type="text"
                            value={seguimiento}
                            onChange={e => setSeguimiento(e.target.value)}
                            placeholder="Ej: AB123456789AR"
                            className="w-full h-9 mt-1 px-3 rounded-lg bg-surface-card text-xs text-text-body
                              border border-border-default focus:border-brand focus:outline-none transition-colors"
                          />
                        </div>
                        {errorMsg && (
                          <p className="text-[10px] text-danger-500">{errorMsg}</p>
                        )}
                        <div className="flex gap-2">
                          <button
                            onClick={() => { setDespachandoId(null); setSeguimiento(""); setErrorMsg("") }}
                            className="flex-1 h-9 rounded-full border border-border-default text-xs font-semibold text-text-muted
                              hover:border-text-subtle transition-colors">
                            Cancelar
                          </button>
                          <button
                            onClick={() => despachar(pedido.id)}
                            disabled={despachandoId !== null}
                            className="flex-1 h-9 rounded-full bg-brand hover:bg-brand-hover text-white text-xs font-semibold
                              transition-colors flex items-center justify-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed">
                            {despachandoId === pedido.id ? (
                              <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Despachando...</>
                            ) : (
                              <><Truck className="w-3.5 h-3.5" /> Confirmar despacho</>
                            )}
                          </button>
                        </div>
                      </>
                    ) : (
                      <button
                        onClick={() => setDespachandoId(pedido.id)}
                        className="w-full h-9 bg-brand hover:bg-brand-hover text-white font-semibold rounded-full text-xs
                          transition-colors flex items-center justify-center gap-2">
                        <Truck className="w-3.5 h-3.5" />
                        Despachar pedido
                      </button>
                    )}
                    {successMsg && (
                      <p className="text-[10px] text-success-600 font-medium">{successMsg}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

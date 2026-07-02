"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Package, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuthStore } from "@/store/useAuthStore"

interface Pedido {
  id: string
  producto_titulo: string
  producto_imagen: string
  precio: number
  status: string
  talle: string
  created_at: string
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

export default function ComprasPage() {
  const user = useAuthStore(s => s.user)
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.email) { setLoading(false); return }
    supabase
      .from("pedidos")
      .select("id, producto_titulo, producto_imagen, precio, status, talle, created_at")
      .eq("comprador_email", user.email)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setPedidos((data || []) as Pedido[])
        setLoading(false)
      })
  }, [user])

  return (
    <div className="flex flex-col min-h-screen">
      <header className="h-16 flex items-center gap-3 px-5 bg-bg-page border-b border-border-subtle sticky top-0 z-10 lg:top-16">
        <Link href="/perfil" className="w-9 h-9 rounded-full bg-surface-sunken flex items-center justify-center shrink-0">
          <ArrowLeft className="w-4 h-4 text-text-muted" />
        </Link>
        <h1 className="font-display text-xl text-text-strong">Mis compras</h1>
      </header>

      <div className="flex-1 px-4 lg:px-6 py-4 space-y-4 pb-24 lg:pb-10 max-w-lg mx-auto w-full">
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

              <div className="px-4 py-2.5 bg-surface-sunken">
                <span className="text-[10px] text-text-muted">Orden #{pedido.id}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

"use client"
import { useEffect, useState } from "react"
import { useAdminStore } from "@/store/useAdminStore"
import { Truck, PackageCheck, Mail, MapPin } from "lucide-react"

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  pending_shipment: { label: "Pendiente de envío", className: "bg-warning-50 text-warning-600" },
  shipped: { label: "Enviado", className: "bg-info-50 text-info-600" },
  delivered: { label: "Entregado", className: "bg-success-50 text-success-600" },
  cancelled: { label: "Cancelado", className: "bg-error-50 text-error-500" },
}

const METODO_LABEL: Record<string, string> = {
  correo_sucursal: "Correo Argentino (sucursal)",
  correo_domicilio: "Correo Argentino (domicilio)",
  arreglar_vendedor: "Arreglar con el vendedor",
}

type ParsedAddress = { nombre?: string; email?: string; provincia?: string; ciudad?: string; cp?: string; direccion?: string }

function parseDireccion(raw?: string | null): ParsedAddress {
  if (!raw) return {}
  try {
    const d = JSON.parse(raw)
    if (d && typeof d === "object") return d as ParsedAddress
  } catch {}
  return { direccion: raw }
}

function formatDireccion(a: ParsedAddress): string {
  return [a.direccion, a.ciudad, a.provincia, a.cp && `CP ${a.cp}`].filter(Boolean).join(", ")
}

export default function PedidosPage() {
  const { orders, loaded, loadFromSupabase, markOrderShipped, markOrderDelivered } = useAdminStore()
  const [filter, setFilter] = useState<"all" | "pending_shipment" | "shipped" | "delivered">("pending_shipment")
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => { loadFromSupabase() }, [])

  if (!loaded) return <div className="p-5 lg:pt-7 text-sm text-text-muted">Cargando...</div>

  const filtered = orders.filter(o => filter === "all" ? true : o.status === filter)
  const counts = { all: orders.length, pending_shipment: orders.filter(o => o.status === "pending_shipment").length, shipped: orders.filter(o => o.status === "shipped").length, delivered: orders.filter(o => o.status === "delivered").length }
  const FILTERS = [{ v: "pending_shipment" as const, l: "Pendientes", c: counts.pending_shipment }, { v: "shipped" as const, l: "Enviados", c: counts.shipped }, { v: "delivered" as const, l: "Entregados", c: counts.delivered }, { v: "all" as const, l: "Todos", c: counts.all }]
  const totalSales = orders.reduce((sum, o) => sum + o.precio, 0)

  return (
    <div className="p-5 lg:p-7 lg:pt-7 space-y-5 max-w-4xl">
      <div><h1 className="font-display text-2xl text-text-strong">Pedidos</h1><p className="text-sm text-text-muted mt-1">{orders.length} pedidos · ${totalSales.toLocaleString("es-AR")} total</p></div>
      <div className="flex gap-2 overflow-x-auto pb-1">{FILTERS.map(f => <button key={f.v} onClick={() => setFilter(f.v)} className={`shrink-0 px-3.5 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition-colors ${filter === f.v ? 'bg-brand text-white' : 'bg-surface-sunken text-text-body'}`}>{f.l}<span className="ml-1.5 opacity-70">{f.c}</span></button>)}</div>
      <div className="space-y-3">
        {filtered.length === 0 ? <div className="bg-surface-card rounded-xl border border-border-subtle px-4 py-12 text-center text-sm text-text-muted">No hay pedidos</div> : filtered.map(o => {
          const isOpen = expanded === o.id; const st = STATUS_LABEL[o.status]
          const addr = parseDireccion(o.direccion)
          const compradorNombre = addr.nombre || o.comprador_nombre
          const compradorEmail = addr.email || o.comprador_email
          return (
            <div key={o.id} className="bg-surface-card rounded-xl border border-border-subtle overflow-hidden">
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <img src={o.producto_imagen || ""} alt="" className="w-14 h-18 rounded-lg object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5"><p className="text-sm font-semibold text-text-strong truncate">{o.producto_titulo}</p><span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold shrink-0 ${st.className}`}>{st.label}</span></div>
                    <p className="text-xs text-text-muted">Comprador: {compradorNombre} · {compradorEmail}</p>
                    <p className="text-xs text-text-muted">Vendedor: {o.vendedor_nombre} · Talle {o.talle}</p>
                    <div className="flex items-center gap-3 mt-1.5"><p className="text-sm font-bold text-price">${o.precio.toLocaleString("es-AR")}</p></div>
                  </div>
                  <div className="flex flex-col gap-1.5 shrink-0">
                    {o.status === "pending_shipment" && <button onClick={() => markOrderShipped(o.id)} className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-semibold bg-info-50 text-info-600 hover:bg-info-500 hover:text-white transition-colors"><Truck className="w-3 h-3" /> Enviar</button>}
                    {o.status === "shipped" && <button onClick={() => markOrderDelivered(o.id)} className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-semibold bg-success-50 text-success-600 hover:bg-success-500 hover:text-white transition-colors"><PackageCheck className="w-3 h-3" /> Entregado</button>}
                    <button onClick={() => setExpanded(isOpen ? null : o.id)} className="px-3 py-1.5 rounded-full text-[11px] font-medium text-text-muted hover:bg-surface-sunken transition-colors">{isOpen ? "Menos" : "Detalles"}</button>
                  </div>
                </div>
                {isOpen && <div className="mt-4 pt-4 border-t border-border-subtle space-y-2"><div className="flex items-center gap-2 text-xs text-text-muted"><MapPin className="w-3.5 h-3.5" />{formatDireccion(addr)}</div>{o.metodo_envio && <div className="flex items-center gap-2 text-xs text-text-muted"><Truck className="w-3.5 h-3.5" />{METODO_LABEL[o.metodo_envio] || o.metodo_envio}{o.costo_envio != null && <span className="ml-1 font-semibold text-price">· ${o.costo_envio.toLocaleString("es-AR")}</span>}</div>}<div className="flex items-center gap-2 text-xs text-text-muted"><Mail className="w-3.5 h-3.5" />Comprador: {compradorEmail} · Vendedor: {o.vendedor_email}</div></div>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

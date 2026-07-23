"use client"
import { useEffect, useState } from "react"
import { useAdminStore } from "@/store/useAdminStore"
import { DollarSign, AlertCircle, LinkIcon } from "lucide-react"
import Link from "next/link"

export default function VentasPage() {
  const { ventasPendientes, ventasPendientesLoaded, loadVentasPendientes, liberarFondos } = useAdminStore()
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [error, setError] = useState("")

  useEffect(() => { loadVentasPendientes() }, [])

  async function handleLiberar(ventaId: string) {
    setActionLoading(ventaId)
    setError("")
    try {
      await liberarFondos(ventaId)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al liberar fondos")
    } finally {
      setActionLoading(null)
    }
  }

  if (!ventasPendientesLoaded) {
    return <div className="p-5 lg:p-7 lg:pt-7 text-sm text-text-muted">Cargando...</div>
  }

  return (
    <div className="p-5 lg:p-7 lg:pt-7 space-y-5 max-w-4xl">
      <div>
        <h1 className="font-display text-2xl text-text-strong">Ventas pendientes de liberación</h1>
        <p className="text-sm text-text-muted mt-1">
          {ventasPendientes.length} venta{ventasPendientes.length !== 1 ? "s" : ""} con entrega confirmada · Fondos pendientes de liberar
        </p>
      </div>

      {error && (
        <div className="bg-danger-50 border border-danger-200 rounded-lg p-3 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-danger-500 shrink-0 mt-0.5" />
          <p className="text-xs text-danger-600">{error}</p>
        </div>
      )}

      {ventasPendientes.length === 0 ? (
        <div className="bg-surface-card rounded-xl border border-border-subtle px-4 py-12 text-center text-sm text-text-muted">
          No hay ventas pendientes de liberación
        </div>
      ) : (
        <div className="space-y-3">
          {ventasPendientes.map(v => {
            const loading = actionLoading === v.venta_id
            return (
              <div key={v.venta_id} className="bg-surface-card rounded-xl border border-border-subtle p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="w-9 h-9 rounded-lg bg-matcha-50 flex items-center justify-center shrink-0">
                        <DollarSign className="w-4 h-4 text-matcha-600" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-text-strong truncate">{v.producto_titulo}</p>
                        <Link
                          href={`/admin/vendedores?tab=publicaciones&vendedor=${v.vendedor_id}&pedido=${v.pedido_id}`}
                          className="flex items-center gap-1 text-xs text-brand hover:underline"
                        >
                          <LinkIcon className="w-3 h-3" />
                          {v.vendedor_nombre}
                        </Link>
                      </div>
                    </div>

                    <div className="ml-11 grid grid-cols-3 gap-x-4 gap-y-0.5 text-xs">
                      <div>
                        <span className="text-text-muted">Bruto</span>
                        <p className="font-medium text-text-body">$ {v.monto_bruto.toLocaleString("es-AR")}</p>
                      </div>
                      <div>
                        <span className="text-text-muted">Comisión (20%)</span>
                        <p className="font-medium text-text-body">$ {v.comision.toLocaleString("es-AR")}</p>
                      </div>
                      <div>
                        <span className="text-text-muted">A liberar (80%)</span>
                        <p className="font-semibold text-matcha-700">$ {v.monto_neto.toLocaleString("es-AR")}</p>
                      </div>
                    </div>

                    <p className="ml-11 text-[10px] text-text-subtle mt-1.5">
                      Pedido del {new Date(v.created_at).toLocaleDateString("es-AR")}
                    </p>
                  </div>

                  <button
                    onClick={() => handleLiberar(v.venta_id)}
                    disabled={loading}
                    className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-brand text-white hover:bg-matcha-600 transition-colors disabled:opacity-50"
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    {loading ? "Liberando..." : "Liberar"}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

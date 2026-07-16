"use client"
import { useEffect, useState } from "react"
import { useAdminStore, type AdminRetiro } from "@/store/useAdminStore"
import { Clock, CheckCircle, XCircle, User, Building, AlertCircle } from "lucide-react"

const STATUS_CONFIG: Record<string, { label: string; className: string; icon: typeof Clock }> = {
  solicitado: { label: "Pendiente", className: "bg-warning-50 text-warning-600", icon: Clock },
  pagado: { label: "Pagado", className: "bg-success-50 text-success-600", icon: CheckCircle },
  rechazado: { label: "Rechazado", className: "bg-error-50 text-error-500", icon: XCircle },
}

export default function RetirosPage() {
  const { retiros, retirosLoaded, loadRetiros, markRetiroPagado, rejectRetiro } = useAdminStore()
  const [filter, setFilter] = useState<"solicitado" | "pagado" | "rechazado">("solicitado")
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [error, setError] = useState("")

  useEffect(() => { loadRetiros() }, [])

  if (!retirosLoaded) {
    return <div className="p-5 lg:p-7 lg:pt-7 text-sm text-text-muted">Cargando...</div>
  }

  const filtered = retiros.filter(r => r.status === filter)
  const counts = {
    solicitado: retiros.filter(r => r.status === "solicitado").length,
    pagado: retiros.filter(r => r.status === "pagado").length,
    rechazado: retiros.filter(r => r.status === "rechazado").length,
  }

  const FILTERS = [
    { v: "solicitado" as const, l: "Pendientes", c: counts.solicitado },
    { v: "pagado" as const, l: "Pagados", c: counts.pagado },
    { v: "rechazado" as const, l: "Rechazados", c: counts.rechazado },
  ]

  async function handleAction(id: string, action: "pagar" | "rechazar") {
    setActionLoading(id)
    setError("")
    try {
      if (action === "pagar") await markRetiroPagado(id)
      else await rejectRetiro(id)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al procesar")
    } finally {
      setActionLoading(null)
    }
  }

  function formatBankInfo(r: AdminRetiro): string {
    const v = r.vendedores
    if (!v) return r.cbu ? `CBU: ${r.cbu}` : "Sin datos"
    const parts = [
      v.titular && `Titular: ${v.titular}`,
      v.cbu && `CBU: ${v.cbu}`,
      v.alias && `Alias: ${v.alias}`,
      v.banco && `Banco: ${v.banco}`,
      v.tipo_cuenta && `Cuenta: ${v.tipo_cuenta}`,
    ].filter(Boolean)
    return parts.length > 0 ? parts.join(" · ") : "Sin datos bancarios"
  }

  return (
    <div className="p-5 lg:p-7 lg:pt-7 space-y-5 max-w-4xl">
      <div>
        <h1 className="font-display text-2xl text-text-strong">Retiros</h1>
        <p className="text-sm text-text-muted mt-1">
          {retiros.length} retiros · {counts.solicitado} pendientes
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map(f => (
          <button
            key={f.v}
            onClick={() => setFilter(f.v)}
            className={`shrink-0 px-3.5 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition-colors ${filter === f.v ? "bg-brand text-white" : "bg-surface-sunken text-text-body"}`}
          >
            {f.l}
            <span className="ml-1.5 opacity-70">{f.c}</span>
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-danger-50 border border-danger-200 rounded-lg p-3 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-danger-500 shrink-0 mt-0.5" />
          <p className="text-xs text-danger-600">{error}</p>
        </div>
      )}

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-surface-card rounded-xl border border-border-subtle px-4 py-12 text-center text-sm text-text-muted">
            No hay retiros {STATUS_CONFIG[filter].label.toLowerCase()}s
          </div>
        ) : (
          filtered.map(r => {
            const sc = STATUS_CONFIG[r.status]
            const loading = actionLoading === r.id
            const v = r.vendedores
            const vendedorNombre = v?.nombre || "Vendedora"
            const vendedorEmail = v?.email || ""

            return (
              <div key={r.id} className="bg-surface-card rounded-xl border border-border-subtle p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <span className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${sc.className}`}>
                      <sc.icon className="w-4 h-4" />
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-semibold text-text-strong">
                          $ {r.monto.toLocaleString("es-AR")}
                        </p>
                        <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${sc.className}`}>
                          {sc.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-text-muted">
                        <User className="w-3 h-3" />
                        <span>{vendedorNombre}</span>
                        {vendedorEmail && <span>· {vendedorEmail}</span>}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-text-muted mt-0.5">
                        <Building className="w-3 h-3" />
                        <span className="truncate">{formatBankInfo(r)}</span>
                      </div>
                      <p className="text-[10px] text-text-subtle mt-1">
                        {new Date(r.created_at).toLocaleString("es-AR")}
                        {r.pagado_at && ` · Pagado: ${new Date(r.pagado_at).toLocaleString("es-AR")}`}
                      </p>
                    </div>
                  </div>

                  {r.status === "solicitado" && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleAction(r.id, "pagar")}
                        disabled={loading}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-semibold bg-success-50 text-success-600 hover:bg-success-500 hover:text-white transition-colors disabled:opacity-50"
                      >
                        <CheckCircle className="w-3 h-3" />
                        Pagado
                      </button>
                      <button
                        onClick={() => handleAction(r.id, "rechazar")}
                        disabled={loading}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-semibold bg-error-50 text-error-500 hover:bg-error-500 hover:text-white transition-colors disabled:opacity-50"
                      >
                        <XCircle className="w-3 h-3" />
                        Rechazar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

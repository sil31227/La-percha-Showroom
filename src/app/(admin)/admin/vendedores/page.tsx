"use client"
import { useEffect, useState } from "react"
import { useAdminStore } from "@/store/useAdminStore"
import { Check, X, Copy, CheckCheck } from "lucide-react"

export default function VendedoresPage() {
  const { vendors, loaded, loadFromSupabase, approveVendor, rejectVendor } = useAdminStore()
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending")
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => { loadFromSupabase() }, [])

  const filtered = vendors.filter(v => filter === "all" ? true : v.status === filter)
  const counts = { all: vendors.length, pending: vendors.filter(v => v.status === "pending").length, approved: vendors.filter(v => v.status === "approved").length, rejected: vendors.filter(v => v.status === "rejected").length }
  const FILTERS = [{ v: "pending" as const, l: "Pendientes", c: counts.pending }, { v: "approved" as const, l: "Aprobadas", c: counts.approved }, { v: "rejected" as const, l: "Rechazadas", c: counts.rejected }, { v: "all" as const, l: "Todas", c: counts.all }]

  async function copyCBU(cbu: string, id: string) { await navigator.clipboard.writeText(cbu); setCopied(id); setTimeout(() => setCopied(null), 1500) }

  async function handleVendor(action: (id: string) => Promise<void>, id: string) {
    try { await action(id) } catch (e) { alert(e instanceof Error ? e.message : "Error al actualizar la vendedora") }
  }

  if (!loaded) return <div className="p-5 lg:pt-7 text-sm text-text-muted">Cargando...</div>

  return (
    <div className="p-5 lg:p-7 lg:pt-7 space-y-5 max-w-4xl">
      <div><h1 className="font-display text-2xl text-text-strong">Vendedores</h1><p className="text-sm text-text-muted mt-1">Gestioná las solicitudes de vendedores</p></div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map(f => <button key={f.v} onClick={() => setFilter(f.v)} className={`shrink-0 px-3.5 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition-colors ${filter === f.v ? 'bg-brand text-white' : 'bg-surface-sunken text-text-body'}`}>{f.l}<span className="ml-1.5 opacity-70">{f.c}</span></button>)}
      </div>
      <div className="space-y-3">
        {filtered.length === 0 ? <div className="bg-surface-card rounded-xl border border-border-subtle px-4 py-12 text-center text-sm text-text-muted">No hay solicitudes</div> : filtered.map(v => (
          <div key={v.id} className="bg-surface-card rounded-xl border border-border-subtle p-4">
            <div className="flex items-start gap-3">
              <img src={v.avatar || ""} alt="" className="w-12 h-12 rounded-full object-cover ring-2 ring-matcha-100 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2"><p className="text-sm font-semibold text-text-strong">{v.nombre}</p>{v.status === "pending" ? <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-warning-50 text-warning-600">Pendiente</span> : v.status === "approved" ? <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-success-50 text-success-600">Aprobada</span> : <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-error-50 text-error-500">Rechazada</span>}</div>
                <p className="text-xs text-text-muted mt-0.5">{v.email}</p>
                <div className="flex flex-wrap items-center gap-3 mt-2">
                  <span className="text-xs text-text-muted">{v.productos_count || 0} productos</span>
                  {v.cbu && <button onClick={() => copyCBU(v.cbu!, v.id)} className="inline-flex items-center gap-1 text-[11px] text-matcha-600 font-medium hover:text-matcha-700">{copied === v.id ? <CheckCheck className="w-3 h-3" /> : <Copy className="w-3 h-3" />}{copied === v.id ? "¡Copiado!" : `CBU: ...${v.cbu.slice(-4)}`}</button>}
                </div>
              </div>
              {v.status === "pending" && <div className="flex gap-1.5 shrink-0"><button onClick={() => handleVendor(approveVendor, v.id)} className="w-8 h-8 rounded-full bg-success-50 text-success-600 flex items-center justify-center hover:bg-success-500 hover:text-white transition-colors"><Check className="w-4 h-4" /></button><button onClick={() => handleVendor(rejectVendor, v.id)} className="w-8 h-8 rounded-full bg-error-50 text-error-500 flex items-center justify-center hover:bg-error-500 hover:text-white transition-colors"><X className="w-4 h-4" /></button></div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

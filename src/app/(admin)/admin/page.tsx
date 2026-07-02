"use client"
import { useEffect, useState } from "react"
import { useAdminStore } from "@/store/useAdminStore"
import { supabase } from "@/lib/supabase"
import { ShieldCheck, Users, PackageCheck, Banknote, ChevronRight, UserPlus } from "lucide-react"
import Link from "next/link"

const SUBS_MAP: Record<string, string[]> = {
  mujer: ["Ropa", "Calzado", "Accesorios", "Belleza"],
  hombre: ["Ropa", "Calzado", "Accesorios"],
  kids: ["Bebés", "Niñas", "Niños"],
  tienda: ["Regalería", "Bazar", "Decoración"],
}

function subName(catId: string | undefined, subCatId: string | undefined): string {
  if (!catId || !subCatId) return ""
  const subs = SUBS_MAP[catId]
  if (!subs) return subCatId
  const idx = ["ropa","calzado","accesorios","belleza","bebes","ninas","ninos","regaleria","bazar","decoracion"].indexOf(subCatId)
  return idx >= 0 ? subs[idx] || subCatId : subCatId
}

export default function AdminDashboard() {
  const { products, vendors, loaded, loadFromSupabase } = useAdminStore()
  const [regCount, setRegCount] = useState(0)

  useEffect(() => { loadFromSupabase() }, [])
  useEffect(() => {
    supabase.from("verification_tokens").select("id", { count: "exact", head: true }).eq("verified", false).then(({ count }) => setRegCount(count || 0))
  }, [loaded])

  const total = products.length
  const pending = products.filter(p => p.status === "pending").length
  const approved = products.filter(p => p.status === "approved").length
  const vendorPending = vendors.filter(v => v.status === "pending").length
  const vendorTotal = vendors.filter(v => v.status === "approved").length
  const lastPending = products.filter(p => p.status === "pending").slice(0, 5)

  if (!loaded) return <div className="p-5 lg:pt-7 text-sm text-text-muted">Cargando...</div>

  return (
    <div className="p-5 lg:p-7 lg:pt-7 space-y-6 max-w-4xl">
      <div>
        <h1 className="font-display text-2xl text-text-strong">Dashboard</h1>
        <p className="text-sm text-text-muted mt-1">Panel de administración</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="bg-surface-card rounded-xl p-4 border border-border-subtle">
          <div className="w-8 h-8 rounded-lg bg-matcha-100 flex items-center justify-center mb-2"><PackageCheck className="w-4 h-4 text-matcha-600" /></div>
          <p className="text-[11px] text-text-muted uppercase tracking-wide">Publicaciones</p>
          <p className="font-display text-3xl text-text-strong mt-0.5">{total}</p>
        </div>
        <Link href="/admin/moderacion" className="bg-surface-card rounded-xl p-4 border border-warning-500/20 hover:border-warning-500/40 transition-colors block">
          <div className="w-8 h-8 rounded-lg bg-warning-50 flex items-center justify-center mb-2"><ShieldCheck className="w-4 h-4 text-warning-500" /></div>
          <p className="text-[11px] text-text-muted uppercase tracking-wide">Pendientes</p>
          <p className="font-display text-3xl text-text-strong mt-0.5">{pending}</p>
        </Link>
        <Link href="/admin/registros" className="bg-surface-card rounded-xl p-4 border border-border-subtle hover:border-matcha-300 transition-colors block">
          <div className="w-8 h-8 rounded-lg bg-matcha-100 flex items-center justify-center mb-2"><UserPlus className="w-4 h-4 text-matcha-600" /></div>
          <p className="text-[11px] text-text-muted uppercase tracking-wide">
            Registros{regCount > 0 && <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-warning-50 text-[9px] font-bold text-warning-600">{regCount} nuevos</span>}
          </p>
          <p className="font-display text-3xl text-text-strong mt-0.5">{regCount}</p>
        </Link>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-2 gap-3">
        <Link href="/admin/vendedores" className="bg-surface-card rounded-xl p-4 border border-border-subtle hover:border-border-strong transition-colors block">
          <div className="w-8 h-8 rounded-lg bg-matcha-100 flex items-center justify-center mb-2"><Users className="w-4 h-4 text-matcha-600" /></div>
          <p className="text-[11px] text-text-muted uppercase tracking-wide">Vendedores{vendorPending > 0 && <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-warning-50 text-[9px] font-bold text-warning-600">{vendorPending} nuevos</span>}</p>
          <p className="font-display text-3xl text-text-strong mt-0.5">{vendorTotal}</p>
        </Link>
        <div className="bg-surface-card rounded-xl p-4 border border-border-subtle">
          <div className="w-8 h-8 rounded-lg bg-chai-100 flex items-center justify-center mb-2"><Banknote className="w-4 h-4 text-chai-600" /></div>
          <p className="text-[11px] text-text-muted uppercase tracking-wide">Aprobadas</p>
          <p className="font-display text-3xl text-text-strong mt-0.5">{approved}</p>
        </div>
      </div>
      <div className="bg-surface-card rounded-xl border border-border-subtle overflow-hidden">
        <div className="px-4 py-3 border-b border-border-subtle flex items-center justify-between">
          <h2 className="font-display text-base text-text-strong">Últimas pendientes</h2>
          <Link href="/admin/moderacion" className="text-xs text-matcha-600 font-semibold hover:text-matcha-700 flex items-center gap-0.5">Ver todas <ChevronRight className="w-3 h-3" /></Link>
        </div>
        <div className="divide-y divide-border-subtle">
          {lastPending.length === 0 ? <div className="px-4 py-10 text-center text-sm text-text-muted">No hay publicaciones pendientes</div> : lastPending.map(p => (
            <div key={p.id} className="px-4 py-3 flex items-center gap-3">
              <img src={p.imagenes?.[0] || ""} alt="" className="w-10 h-12 rounded-md object-cover" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text-strong truncate">{p.titulo}</p>
                <p className="text-xs text-text-muted">{p.vendedor_nombre} · {p.vendedor_tipo === "oficial" ? "Tienda Oficial" : "Feria"}</p>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-warning-50 text-warning-600 shrink-0">Pendiente</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

"use client"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Check, X, User, Mail, Clock } from "lucide-react"

interface Registro {
  id: string
  email: string
  name: string
  verified: boolean
  created_at: string
}

export default function RegistrosPage() {
  const [registros, setRegistros] = useState<Registro[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "pending" | "verified">("pending")

  function load() {
    setLoading(true)
    supabase.from("verification_tokens").select("*").order("created_at", { ascending: false }).then(({ data }) => {
      setRegistros((data || []) as Registro[])
      setLoading(false)
    })
  }

  useEffect(() => { load() }, [])

  async function verify(id: string) {
    await supabase.from("verification_tokens").update({ verified: true }).eq("id", id)
    load()
  }

  async function remove(id: string) {
    await supabase.from("verification_tokens").delete().eq("id", id)
    load()
  }

  const filtered = registros.filter(r => filter === "all" ? true : filter === "pending" ? !r.verified : r.verified)
  const pendientes = registros.filter(r => !r.verified).length

  return (
    <div className="p-5 lg:p-7 lg:pt-7 space-y-5 max-w-4xl">
      <div>
        <h1 className="font-display text-2xl text-text-strong">Registros</h1>
        <p className="text-sm text-text-muted mt-1">
          {registros.length} registros · {pendientes} pendientes
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {[{ v: "pending" as const, l: "Pendientes", c: pendientes }, { v: "verified" as const, l: "Verificados", c: registros.filter(r => r.verified).length }, { v: "all" as const, l: "Todos", c: registros.length }].map(f => (
          <button key={f.v} onClick={() => setFilter(f.v)} className={`shrink-0 px-3.5 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition-colors ${filter === f.v ? 'bg-brand text-white' : 'bg-surface-sunken text-text-body'}`}>{f.l}<span className="ml-1.5 opacity-70">{f.c}</span></button>
        ))}
      </div>

      {loading ? (
        <div className="text-sm text-text-muted py-10 text-center">Cargando...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-surface-card rounded-xl border border-border-subtle px-4 py-12 text-center text-sm text-text-muted">
          No hay registros {filter === "pending" ? "pendientes" : filter === "verified" ? "verificados" : ""}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(r => (
            <div key={r.id} className="bg-surface-card rounded-xl border border-border-subtle p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-surface-sunken flex items-center justify-center shrink-0">
                <User className="w-5 h-5 text-text-muted" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text-strong">{r.name || r.email}</p>
                <div className="flex items-center gap-2 text-xs text-text-muted mt-0.5">
                  <Mail className="w-3 h-3" /> {r.email}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="w-3 h-3 text-text-muted" />
                  <span className="text-[10px] text-text-muted">{new Date(r.created_at).toLocaleDateString("es-AR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                  {!r.verified ? (
                    <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-warning-50 text-warning-600">Pendiente</span>
                  ) : (
                    <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-success-50 text-success-600">Verificado</span>
                  )}
                </div>
              </div>
              <div className="flex gap-1.5 shrink-0">
                {!r.verified && (
                  <button onClick={() => verify(r.id)} className="w-8 h-8 rounded-full bg-success-50 text-success-600 flex items-center justify-center hover:bg-success-500 hover:text-white transition-colors">
                    <Check className="w-4 h-4" />
                  </button>
                )}
                <button onClick={() => remove(r.id)} className="w-8 h-8 rounded-full bg-error-50 text-error-500 flex items-center justify-center hover:bg-error-500 hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

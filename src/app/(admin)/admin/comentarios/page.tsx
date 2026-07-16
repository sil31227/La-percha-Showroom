"use client"
import { useEffect, useMemo, useState } from "react"
import { Loader2, Trash2, ExternalLink, MessageSquareText } from "lucide-react"
import Link from "next/link"
import { useAuthStore } from "@/store/useAuthStore"
import { supabase } from "@/lib/supabase"

interface ComentarioConProducto {
  id: string
  producto_id: string
  user_id: string
  texto: string
  deleted: boolean
  created_at: string
  producto_titulo: string
  producto_imagen: string | null
  user_name: string
  user_avatar: string | null
}

function relativeTime(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const seconds = Math.floor((now - then) / 1000)
  if (seconds < 60) return "Ahora"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `Hace ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `Hace ${hours} h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `Hace ${days} d`
  const weeks = Math.floor(days / 7)
  if (weeks < 4) return `Hace ${weeks} sem`
  return new Date(dateStr).toLocaleDateString("es-AR")
}

export default function AdminComentariosPage() {
  const token = useAuthStore(s => s.session?.access_token)
  const [comentarios, setComentarios] = useState<ComentarioConProducto[]>([])
  const [loading, setLoading] = useState(true)
  const [filterDeleted, setFilterDeleted] = useState(false)

  function fetchComentarios() {
    setLoading(true)
    supabase
      .from("comentarios_producto")
      .select("id, producto_id, user_id, texto, deleted, created_at, productos!inner(titulo, imagenes)")
      .order("created_at", { ascending: false })
      .limit(200)
      .then(({ data }) => {
        if (data) {
          const userIds = [...new Set((data as any[]).map(c => c.user_id))]
          supabase
            .from("profiles")
            .select("id, full_name, avatar_url")
            .in("id", userIds.length ? userIds : ["none"])
            .then(({ data: profiles }) => {
              const profileMap = new Map((profiles || []).map(p => [p.id, p]))
              const enriched: ComentarioConProducto[] = (data as any[]).map(c => {
                const prod = c.productos as any
                const imgArr = prod?.imagenes as string[] | undefined
                return {
                  id: c.id,
                  producto_id: c.producto_id,
                  user_id: c.user_id,
                  texto: c.texto,
                  deleted: c.deleted,
                  created_at: c.created_at,
                  producto_titulo: prod?.titulo || "—",
                  producto_imagen: imgArr?.[0] || null,
                  user_name: profileMap.get(c.user_id)?.full_name || "Usuario",
                  user_avatar: profileMap.get(c.user_id)?.avatar_url || null,
                }
              })
              setComentarios(enriched)
              setLoading(false)
            })
        } else {
          setLoading(false)
        }
      })
  }

  useEffect(() => {
    fetchComentarios()
  }, [])

  async function handleDelete(id: string) {
    if (!token) return
    const res = await fetch(`/api/admin/comentarios/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) fetchComentarios()
  }

  const filtered = useMemo(
    () => (filterDeleted ? comentarios.filter(c => c.deleted) : comentarios),
    [comentarios, filterDeleted],
  )

  const deletedCount = useMemo(() => comentarios.filter(c => c.deleted).length, [comentarios])

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-text-strong">Comentarios</h1>
          <p className="text-sm text-text-muted mt-0.5">Moderaci\u00f3n de comentarios en productos</p>
        </div>
      </header>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setFilterDeleted(false)}
          className={`shrink-0 px-3.5 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition-colors ${
            !filterDeleted ? "bg-brand text-white" : "bg-surface-sunken text-text-body"
          }`}
        >
          Todos
        </button>
        <button
          onClick={() => setFilterDeleted(true)}
          className={`shrink-0 px-3.5 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition-colors ${
            filterDeleted ? "bg-brand text-white" : "bg-surface-sunken text-text-body"
          }`}
        >
          Eliminados
          {deletedCount > 0 && (
            <span className="ml-1.5 opacity-70">{deletedCount}</span>
          )}
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-brand animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-surface-card rounded-xl border border-border-subtle px-4 py-12 text-center text-sm text-text-muted">
          <MessageSquareText className="w-8 h-8 mx-auto mb-3 text-text-muted opacity-50" />
          <p>{filterDeleted ? "No hay comentarios eliminados" : "No hay comentarios a\u00fan"}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(c => (
            <div
              key={c.id}
              className={`bg-surface-card rounded-xl border border-border-subtle overflow-hidden ${
                c.deleted ? "opacity-50" : ""
              }`}
            >
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <Link href={`/producto/${c.producto_id}`} className="shrink-0">
                    {c.producto_imagen ? (
                      <img
                        src={c.producto_imagen}
                        alt={c.producto_titulo}
                        className="w-12 h-16 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-12 h-16 rounded-lg bg-surface-sunken flex items-center justify-center">
                        <MessageSquareText className="w-4 h-4 text-text-muted" />
                      </div>
                    )}
                  </Link>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-surface-sunken shrink-0 overflow-hidden flex items-center justify-center">
                        {c.user_avatar ? (
                          <img src={c.user_avatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[10px] font-semibold text-text-muted">
                            {c.user_name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-semibold text-text-strong">{c.user_name}</span>
                      <span className="text-xs text-text-muted">{relativeTime(c.created_at)}</span>
                      {c.deleted && (
                        <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-error-50 text-error-500">
                          Eliminado
                        </span>
                      )}
                    </div>

                    <Link
                      href={`/producto/${c.producto_id}`}
                      className="text-xs text-text-muted hover:text-brand transition-colors mt-0.5 inline-flex items-center gap-1"
                    >
                      en {c.producto_titulo}
                      <ExternalLink className="w-3 h-3" />
                    </Link>

                    <p className="text-sm text-text-body mt-1.5 leading-relaxed">{c.texto}</p>
                  </div>

                  <div className="flex flex-col gap-1.5 shrink-0">
                    <Link
                      href={`/producto/${c.producto_id}#comentario-${c.id}`}
                      className="w-8 h-8 rounded-full bg-surface-sunken hover:bg-brand/10 flex items-center justify-center transition-colors"
                      title="Ver en producto"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-text-muted" />
                    </Link>
                    {!c.deleted && (
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="w-8 h-8 rounded-full bg-surface-sunken hover:bg-error-50 flex items-center justify-center transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-error-500" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

"use client"
import { useEffect, useState } from "react"
import { Loader2, Trash2, ExternalLink } from "lucide-react"
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
  user_name: string
}

export default function AdminComentariosPage() {
  const token = useAuthStore(s => s.session?.access_token)
  const [comentarios, setComentarios] = useState<ComentarioConProducto[]>([])
  const [loading, setLoading] = useState(true)

  function fetchComentarios() {
    setLoading(true)
    supabase
      .from("comentarios_producto")
      .select("id, producto_id, user_id, texto, deleted, created_at, productos!inner(titulo)")
      .order("created_at", { ascending: false })
      .limit(200)
      .then(({ data }) => {
        if (data) {
          const userIds = [...new Set((data as any[]).map(c => c.user_id))]
          supabase
            .from("profiles")
            .select("id, full_name")
            .in("id", userIds.length ? userIds : ["none"])
            .then(({ data: profiles }) => {
              const nameMap = new Map((profiles || []).map(p => [p.id, p.full_name || "Usuario"]))
              const enriched: ComentarioConProducto[] = (data as any[]).map(c => ({
                id: c.id,
                producto_id: c.producto_id,
                user_id: c.user_id,
                texto: c.texto,
                deleted: c.deleted,
                created_at: c.created_at,
                producto_titulo: (c.productos as any)?.titulo || "—",
                user_name: nameMap.get(c.user_id) || "Usuario",
              }))
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

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-text-strong">Comentarios</h1>
          <p className="text-sm text-text-muted mt-0.5">Moderación de comentarios en productos</p>
        </div>
      </header>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-brand animate-spin" />
        </div>
      ) : (
        <div className="rounded-xl border border-border-subtle overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-surface-sunken">
              <tr>
                <th className="text-left px-4 py-3 text-text-muted font-semibold">Producto</th>
                <th className="text-left px-4 py-3 text-text-muted font-semibold">Usuario</th>
                <th className="text-left px-4 py-3 text-text-muted font-semibold">Comentario</th>
                <th className="text-left px-4 py-3 text-text-muted font-semibold">Fecha</th>
                <th className="text-center px-4 py-3 text-text-muted font-semibold">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {comentarios.map(c => (
                <tr key={c.id} className={c.deleted ? "opacity-40 line-through" : "hover:bg-surface-sunken/50"}>
                  <td className="px-4 py-3">
                    <Link href={`/producto/${c.producto_id}`} className="text-brand hover:underline flex items-center gap-1">
                      {c.producto_titulo} <ExternalLink className="w-3 h-3" />
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-text-strong">{c.user_name}</td>
                  <td className="px-4 py-3 text-text-body max-w-80 truncate">{c.texto}</td>
                  <td className="px-4 py-3 text-text-muted whitespace-nowrap">
                    {new Date(c.created_at).toLocaleDateString("es-AR")}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {!c.deleted && (
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="w-7 h-7 rounded-full inline-flex items-center justify-center hover:bg-error-50 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-error-500" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {comentarios.length === 0 && (
            <p className="text-center py-10 text-text-muted text-sm">No hay comentarios aún</p>
          )}
        </div>
      )}
    </div>
  )
}

"use client"
import { useEffect, useState } from "react"
import { Send, Loader2, Trash2 } from "lucide-react"
import { useCommentsStore, type Comentario } from "@/store/useCommentsStore"
import { useAuthStore } from "@/store/useAuthStore"
import Link from "next/link"

export function CommentSection({ productoId, isAdmin }: { productoId: string; isAdmin?: boolean }) {
  const user = useAuthStore(s => s.user)
  const session = useAuthStore(s => s.session)
  const token = session?.access_token || ""

  const comentarios = useCommentsStore(s => s.items[productoId] || [])
  const loading = useCommentsStore(s => s.loading)
  const fetchComentarios = useCommentsStore(s => s.fetchComentarios)
  const addComentario = useCommentsStore(s => s.addComentario)

  const [texto, setTexto] = useState("")
  const [sending, setSending] = useState(false)

  useEffect(() => {
    fetchComentarios(productoId)
  }, [productoId])

  async function handleSubmit() {
    if (!texto.trim() || !token) return
    setSending(true)
    await addComentario(productoId, texto.trim(), token)
    setTexto("")
    setSending(false)
  }

  async function handleDelete(comentarioId: string) {
    if (!token) return
    const res = await fetch(`/api/admin/comentarios/${comentarioId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) {
      fetchComentarios(productoId)
    }
  }

  return (
    <div className="border-t border-border-subtle pt-4 space-y-4">
      <h3 className="text-sm font-semibold text-text-strong">Comentarios ({comentarios.length})</h3>

      {/* Comment form */}
      {user ? (
        <div className="flex items-start gap-2">
          <div className="w-8 h-8 rounded-full bg-surface-sunken shrink-0 overflow-hidden flex items-center justify-center">
            {user.avatar ? (
              <img src={user.avatar} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs font-semibold text-text-muted">{user.name?.charAt(0)?.toUpperCase() || "U"}</span>
            )}
          </div>
          <div className="flex-1 flex items-center gap-2">
            <input
              type="text"
              value={texto}
              onChange={e => setTexto(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") handleSubmit() }}
              placeholder="Escribí un comentario..."
              className="flex-1 h-9 px-3 rounded-full bg-surface-sunken text-xs text-text-body
                border border-transparent focus:border-brand focus:outline-none focus:bg-surface-card transition-colors"
            />
            <button
              onClick={handleSubmit}
              disabled={!texto.trim() || sending}
              className="w-9 h-9 rounded-full bg-brand hover:bg-brand-hover text-white flex items-center justify-center
                transition-colors disabled:opacity-40 shrink-0"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>
      ) : (
        <p className="text-xs text-text-muted">
          <Link href="/ingresar" className="text-brand font-semibold hover:underline">Iniciá sesión</Link> para dejar un comentario
        </p>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 text-brand animate-spin" />
        </div>
      )}

      {/* Comments list */}
      {!loading && comentarios.length === 0 && (
        <p className="text-xs text-text-muted py-4 text-center">No hay comentarios aún. ¡Sé el primero en comentar!</p>
      )}

      <div className="space-y-3">
        {comentarios.map(c => (
          <div key={c.id} className="flex items-start gap-2">
            <div className="w-7 h-7 rounded-full bg-surface-sunken shrink-0 overflow-hidden flex items-center justify-center">
              {c.user_avatar ? (
                <img src={c.user_avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-[10px] font-semibold text-text-muted">{c.user_name.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-text-strong">{c.user_name}</span>
                <span className="text-[10px] text-text-muted">
                  {new Date(c.created_at).toLocaleDateString("es-AR")}
                </span>
              </div>
              <p className="text-xs text-text-body mt-0.5 leading-relaxed">{c.texto}</p>
            </div>
            {isAdmin && (
              <button
                onClick={() => handleDelete(c.id)}
                className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-error-50 transition-colors shrink-0"
              >
                <Trash2 className="w-3 h-3 text-error-500" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

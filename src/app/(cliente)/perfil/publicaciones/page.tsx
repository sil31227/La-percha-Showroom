"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Clock, CheckCircle, XCircle, Eye, Loader2, Trash2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuthStore } from "@/store/useAuthStore"
import { Toast } from "@/components/Toast"

interface MiPublicacion {
  id: string
  titulo: string
  precio: number
  status: string
  imagenes: string[]
  created_at: string
}

const STATUS_CONFIG: Record<string, { icon: typeof Clock; label: string; className: string }> = {
  pending: { icon: Clock, label: "Pendiente", className: "bg-warning-50 text-warning-500" },
  approved: { icon: CheckCircle, label: "Aprobada", className: "bg-success-50 text-success-600" },
  rejected: { icon: XCircle, label: "Rechazada", className: "bg-error-50 text-error-500" },
}

export default function PublicacionesPage() {
  const user = useAuthStore(s => s.user)
  const [publicaciones, setPublicaciones] = useState<MiPublicacion[]>([])
  const [loading, setLoading] = useState(true)
  const [showDelete, setShowDelete] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    if (!user?.name) { setLoading(false); return }
    supabase
      .from("productos")
      .select("id, titulo, precio, status, imagenes, created_at")
      .eq("vendedor_nombre", user.name)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setPublicaciones((data || []) as MiPublicacion[])
        setLoading(false)
      })
  }, [user])

  const handleDelete = async () => {
    if (!showDelete) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/productos/${showDelete}`, { method: "DELETE" })
      if (!res.ok) {
        const { error } = await res.json()
        setToast(error || "Error al eliminar")
        return
      }
      setPublicaciones(prev => prev.filter(p => p.id !== showDelete))
      setToast("Publicación eliminada")
    } catch {
      setToast("Error al eliminar")
    } finally {
      setDeleting(false)
      setShowDelete(null)
    }
  }

  const pendientes = publicaciones.filter(p => p.status === "pending")
  const aprobadas = publicaciones.filter(p => p.status === "approved")
  const rechazadas = publicaciones.filter(p => p.status === "rejected")

  const DeleteButton = ({ id }: { id: string }) => (
    <button
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowDelete(id) }}
      className="w-8 h-8 rounded-full bg-surface-sunken flex items-center justify-center hover:bg-error-50 hover:text-error-500 transition-colors shrink-0"
    >
      <Trash2 className="w-4 h-4 text-text-muted" />
    </button>
  )

  return (
    <div className="flex flex-col min-h-screen">
      <header className="h-16 flex items-center gap-3 px-5 bg-bg-page border-b border-border-subtle sticky top-0 z-10 lg:top-16">
        <Link href="/perfil" className="w-9 h-9 rounded-full bg-surface-sunken flex items-center justify-center shrink-0">
          <ArrowLeft className="w-4 h-4 text-text-muted" />
        </Link>
        <h1 className="font-display text-xl text-text-strong">Mis publicaciones</h1>
      </header>

      <div className="flex-1 px-4 lg:px-6 py-4 space-y-6 pb-24 lg:pb-10 max-w-lg mx-auto w-full">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-brand animate-spin" />
          </div>
        ) : publicaciones.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <p className="text-4xl">📦</p>
            <p className="text-text-muted text-sm">Todavía no publicaste ninguna prenda</p>
            <Link href="/vender"
              className="mt-2 px-5 py-2 rounded-full bg-brand text-white font-semibold text-sm hover:bg-brand-hover transition-colors">
              Publicar mi primera prenda
            </Link>
          </div>
        ) : (
          <>
            {pendientes.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-4 h-4 text-warning-500" />
                  <h2 className="text-sm font-semibold text-text-strong">Pendientes de aprobación</h2>
                  <span className="text-xs text-text-muted">({pendientes.length})</span>
                </div>
                <div className="space-y-3">
                  {pendientes.map(p => (
                    <div key={p.id}
                      className="bg-surface-card rounded-xl border border-warning-200 overflow-hidden">
                      <div className="flex gap-3 p-3">
                        <img src={(p.imagenes as string[])?.[0] || ""} alt={p.titulo}
                          className="w-20 h-26 rounded-lg object-cover bg-surface-sunken shrink-0" />
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-semibold text-text-strong leading-snug">{p.titulo}</p>
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-warning-50 text-warning-500 shrink-0">
                                Pendiente
                              </span>
                            </div>
                            <p className="text-sm font-bold text-price mt-1">
                              $ {p.precio.toLocaleString("es-AR")}
                            </p>
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <p className="text-[10px] text-text-subtle">
                              Publicada el {new Date(p.created_at).toLocaleDateString("es-AR")}
                            </p>
                            <DeleteButton id={p.id} />
                          </div>
                        </div>
                      </div>
                      <div className="px-3 py-2.5 bg-warning-50/50 border-t border-warning-100">
                        <p className="text-[10px] text-warning-600 leading-relaxed">
                          Tu prenda está siendo revisada. Suele tardar menos de 24 horas.
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {aprobadas.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="w-4 h-4 text-success-500" />
                  <h2 className="text-sm font-semibold text-text-strong">Publicadas</h2>
                  <span className="text-xs text-text-muted">({aprobadas.length})</span>
                </div>
                <div className="space-y-3">
                  {aprobadas.map(p => (
                    <div key={p.id}
                      className="bg-surface-card rounded-xl border border-border-subtle overflow-hidden">
                      <div className="flex gap-3 p-3">
                        <img src={(p.imagenes as string[])?.[0] || ""} alt={p.titulo}
                          className="w-20 h-26 rounded-lg object-cover bg-surface-sunken shrink-0" />
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-semibold text-text-strong leading-snug">{p.titulo}</p>
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-success-50 text-success-600 shrink-0">
                                Activa
                              </span>
                            </div>
                            <p className="text-sm font-bold text-price mt-1">
                              $ {p.precio.toLocaleString("es-AR")}
                            </p>
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            <p className="text-[10px] text-text-subtle">
                              {new Date(p.created_at).toLocaleDateString("es-AR")}
                            </p>
                            <Link href={`/producto/${p.id}`}
                              className="flex items-center gap-1 text-[10px] font-semibold text-brand hover:underline">
                              <Eye className="w-3 h-3" />
                              Ver publicación
                            </Link>
                            <div className="flex-1" />
                            <DeleteButton id={p.id} />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {rechazadas.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <XCircle className="w-4 h-4 text-error-500" />
                  <h2 className="text-sm font-semibold text-text-strong">Rechazadas</h2>
                  <span className="text-xs text-text-muted">({rechazadas.length})</span>
                </div>
                <div className="space-y-3">
                  {rechazadas.map(p => (
                    <div key={p.id}
                      className="bg-surface-card rounded-xl border border-error-200 overflow-hidden">
                      <div className="flex gap-3 p-3">
                        <img src={(p.imagenes as string[])?.[0] || ""} alt={p.titulo}
                          className="w-20 h-26 rounded-lg object-cover bg-surface-sunken shrink-0" />
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-semibold text-text-strong leading-snug">{p.titulo}</p>
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-error-50 text-error-500 shrink-0">
                                Rechazada
                              </span>
                            </div>
                            <p className="text-sm font-bold text-price mt-1">
                              $ {p.precio.toLocaleString("es-AR")}
                            </p>
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <p className="text-[10px] text-text-subtle">
                              {new Date(p.created_at).toLocaleDateString("es-AR")}
                            </p>
                            <DeleteButton id={p.id} />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        <Link href="/vender"
          className="flex items-center justify-center gap-2 w-full h-12 bg-brand hover:bg-brand-hover
            text-white font-semibold rounded-full transition-colors text-sm">
          + Publicar otra prenda
        </Link>
      </div>

      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center">
          <div className="absolute inset-0 bg-carob-900/40 backdrop-blur-sm" onClick={() => setShowDelete(null)} />
          <div className="relative bg-surface-card rounded-t-2xl lg:rounded-2xl p-6 w-full lg:max-w-sm">
            <p className="font-semibold text-text-strong mb-2">¿Eliminar publicación?</p>
            <p className="text-sm text-text-muted mb-5">Esta acción no se puede deshacer. También se eliminarán las imágenes del producto.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDelete(null)}
                disabled={deleting}
                className="flex-1 h-10 rounded-full border border-border-default text-sm font-semibold disabled:opacity-50">
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 h-10 rounded-full bg-error-500 text-white text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2">
                {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  )
}

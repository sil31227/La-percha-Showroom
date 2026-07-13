"use client"
import { useEffect, useState } from "react"
import { useAdminStore, type AdminProduct } from "@/store/useAdminStore"
import { Check, X, Trash2, Package, Tag, Ruler, Palette, Layers, Truck, Store } from "lucide-react"
import { ProductGallery } from "@/components/ProductGallery"

const CONDITION_LABEL: Record<string, string> = {
  new_tag: 'Nuevo con etiqueta',
  new: 'Nuevo',
  like_new: 'Como nuevo',
  used: 'Usado',
}

function ProductDetailModal({ product, onClose, onApprove, onReject, onDelete }: {
  product: AdminProduct
  onClose: () => void
  onApprove: (id: string) => void
  onReject: (id: string) => void
  onDelete: (id: string) => void
}) {
  const [showDelete, setShowDelete] = useState(false)

  return (
    <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center">
      <div className="absolute inset-0 bg-carob-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface-card rounded-t-2xl lg:rounded-2xl w-full lg:max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border-subtle shrink-0">
          <h2 className="font-display text-lg text-text-strong">Detalle de publicación</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-surface-sunken flex items-center justify-center hover:bg-surface-inverse/10 transition-colors">
            <X className="w-4 h-4 text-text-strong" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          <div className="lg:flex lg:gap-6 p-5">
            <div className="lg:w-[45%] lg:shrink-0 mb-4 lg:mb-0">
              <ProductGallery images={product.imagenes} title={product.titulo} />
            </div>

            <div className="lg:flex-1 space-y-4">
              <div>
                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold mb-1.5 ${product.vendedor_tipo === "oficial" ? 'bg-brand/10 text-brand' : 'bg-surface-sunken text-text-muted'}`}>
                  {product.vendedor_tipo === "oficial" ? "Tienda Oficial" : "Feria de Ropa"}
                </span>
                <h3 className="font-display text-xl text-text-strong leading-tight">{product.titulo}</h3>
                <p className="text-xl font-bold text-price mt-1">${product.precio.toLocaleString("es-AR")}</p>
              </div>

              <div className="flex items-center gap-2 text-sm text-text-muted">
                <Store className="w-4 h-4" />
                <span>{product.vendedor_nombre}</span>
              </div>

              {product.descripcion && (
                <div>
                  <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-1">Descripción</p>
                  <p className="text-sm text-text-body leading-relaxed">{product.descripcion}</p>
                </div>
              )}

              <div className="flex flex-wrap gap-4">
                {product.marca && (
                  <div className="flex items-center gap-1.5">
                    <Tag className="w-4 h-4 text-text-muted" />
                    <div>
                      <p className="text-[10px] text-text-muted uppercase">Marca</p>
                      <p className="text-sm font-semibold text-text-strong">{product.marca}</p>
                    </div>
                  </div>
                )}
                {product.estado && (
                  <div className="flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-text-muted" />
                    <div>
                      <p className="text-[10px] text-text-muted uppercase">Estado</p>
                      <p className="text-sm font-semibold text-text-strong">{CONDITION_LABEL[product.estado] || product.estado}</p>
                    </div>
                  </div>
                )}
                {product.material && (
                  <div className="flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-text-muted" />
                    <div>
                      <p className="text-[10px] text-text-muted uppercase">Material</p>
                      <p className="text-sm font-semibold text-text-strong">{product.material}</p>
                    </div>
                  </div>
                )}
              </div>

              {(product.talles?.length || 0) > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Ruler className="w-4 h-4 text-text-muted" />
                    <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">Talles</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {product.talles!.map((t) => (
                      <span key={t} className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-surface-sunken text-text-body">{t}</span>
                    ))}
                  </div>
                </div>
              )}

              {(product.colores?.length || 0) > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Palette className="w-4 h-4 text-text-muted" />
                    <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">Colores</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {product.colores!.map((c) => (
                      <span key={c} className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-surface-sunken text-text-body">{c}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                {product.envio_gratis && (
                  <div className="flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-success-500" />
                    <span className="text-xs font-semibold text-success-600">Envío gratis</span>
                  </div>
                )}
                {product.retiro_local && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-surface-sunken text-text-muted">Retiro local</span>
                )}
              </div>

              <div className="flex gap-2 text-xs text-text-muted">
                <span className="px-2 py-0.5 rounded-full bg-surface-sunken">Categoría: {product.categoria_id}</span>
                {product.subcategoria_id && <span className="px-2 py-0.5 rounded-full bg-surface-sunken">Sub: {product.subcategoria_id}</span>}
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 px-5 py-4 border-t border-border-subtle shrink-0">
          {product.status === "pending" ? (
            <>
              <button
                onClick={() => { onApprove(product.id); onClose() }}
                className="flex-1 h-11 rounded-full bg-success-500 text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-success-600 transition-colors"
              >
                <Check className="w-4.5 h-4.5" />
                Aprobar
              </button>
              <button
                onClick={() => { onReject(product.id); onClose() }}
                className="flex-1 h-11 rounded-full bg-error-500 text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-error-600 transition-colors"
              >
                <X className="w-4.5 h-4.5" />
                Rechazar
              </button>
            </>
          ) : (
            <p className="flex-1 text-center text-sm text-text-muted py-2">
              Esta publicación ya fue {product.status === "approved" ? "aprobada" : "rechazada"}
            </p>
          )}
          <button
            onClick={() => setShowDelete(true)}
            className="w-11 h-11 shrink-0 rounded-full border border-border-default flex items-center justify-center hover:bg-error-50 hover:text-error-500 hover:border-error-200 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {showDelete && (
          <div className="absolute inset-0 z-10 flex items-end lg:items-center justify-center">
            <div className="absolute inset-0 bg-carob-900/40 backdrop-blur-sm" onClick={() => setShowDelete(false)} />
            <div className="relative bg-surface-card rounded-t-2xl lg:rounded-2xl p-6 w-full lg:max-w-sm">
              <p className="font-semibold text-text-strong mb-2">¿Eliminar publicación?</p>
              <p className="text-sm text-text-muted mb-5">Esta acción no se puede deshacer. También se eliminarán las imágenes del producto.</p>
              <div className="flex gap-3">
                <button onClick={() => setShowDelete(false)} className="flex-1 h-10 rounded-full border border-border-default text-sm font-semibold">Cancelar</button>
                <button onClick={() => { onDelete(product.id); setShowDelete(false); onClose() }} className="flex-1 h-10 rounded-full bg-error-500 text-white text-sm font-semibold">Eliminar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ModeracionPage() {
  const { products, loaded, loadFromSupabase, approveProduct, rejectProduct, removeStoreProduct } = useAdminStore()
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending")
  const [detailProduct, setDetailProduct] = useState<AdminProduct | null>(null)
  const [showDelete, setShowDelete] = useState<string | null>(null)

  useEffect(() => { loadFromSupabase() }, [])

  if (!loaded) return <div className="p-5 lg:pt-7 text-sm text-text-muted">Cargando...</div>

  const filtered = products.filter(p => filter === "all" ? true : p.status === filter)
  const counts = { all: products.length, pending: products.filter(p => p.status === "pending").length, approved: products.filter(p => p.status === "approved").length, rejected: products.filter(p => p.status === "rejected").length }
  const FILTERS = [{ v: "pending" as const, l: "Pendientes", c: counts.pending }, { v: "approved" as const, l: "Aprobadas", c: counts.approved }, { v: "rejected" as const, l: "Rechazadas", c: counts.rejected }, { v: "all" as const, l: "Todas", c: counts.all }]

  return (
    <div className="p-5 lg:p-7 lg:pt-7 space-y-5 max-w-4xl">
      <div><h1 className="font-display text-2xl text-text-strong">Moderación</h1><p className="text-sm text-text-muted mt-1">Aprobá o rechazá publicaciones</p></div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map(f => (
          <button key={f.v} onClick={() => setFilter(f.v)} className={`shrink-0 px-3.5 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition-colors ${filter === f.v ? 'bg-brand text-white' : 'bg-surface-sunken text-text-body'}`}>{f.l}<span className="ml-1.5 opacity-70">{f.c}</span></button>
        ))}
      </div>
      <div className="bg-surface-card rounded-xl border border-border-subtle divide-y divide-border-subtle">
        {filtered.length === 0 ? <div className="px-4 py-12 text-center text-sm text-text-muted">No hay publicaciones {filter === "pending" ? "pendientes" : filter === "approved" ? "aprobadas" : filter === "rejected" ? "rechazadas" : ""}</div> : filtered.map(p => (
          <div
            key={p.id}
            onClick={() => setDetailProduct(p)}
            className="px-4 py-3 transition-colors hover:bg-surface-sunken cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <img src={p.imagenes?.[0] || ""} alt="" className="w-12 h-16 rounded-lg object-cover shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text-strong truncate">{p.titulo}</p>
                <p className="text-xs text-text-muted">{p.vendedor_nombre} · {p.vendedor_tipo === "oficial" ? "Tienda Oficial" : "Feria"}</p>
                <div className="flex items-center gap-3 mt-1.5">
                  <p className="text-sm font-bold text-price">${p.precio.toLocaleString("es-AR")}</p>
                  {p.status === "pending" ? <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-warning-50 text-warning-600">Pendiente</span> : p.status === "approved" ? <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-success-50 text-success-600">Aprobada</span> : <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-error-50 text-error-500">Rechazada</span>}
                </div>
              </div>
              <div className="flex gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
                {p.status === "pending" && (
                  <>
                    <button onClick={() => approveProduct(p.id)} className="w-8 h-8 rounded-full bg-success-50 text-success-600 flex items-center justify-center hover:bg-success-500 hover:text-white transition-colors"><Check className="w-4 h-4" /></button>
                    <button onClick={() => rejectProduct(p.id)} className="w-8 h-8 rounded-full bg-error-50 text-error-500 flex items-center justify-center hover:bg-error-500 hover:text-white transition-colors"><X className="w-4 h-4" /></button>
                  </>
                )}
                <button onClick={() => setShowDelete(p.id)} className="w-8 h-8 rounded-full bg-surface-sunken flex items-center justify-center hover:bg-error-50 hover:text-error-500 transition-colors"><Trash2 className="w-3.5 h-3.5 text-text-muted" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {detailProduct && (
        <ProductDetailModal
          product={detailProduct}
          onClose={() => setDetailProduct(null)}
          onApprove={approveProduct}
          onReject={rejectProduct}
          onDelete={removeStoreProduct}
        />
      )}

      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center">
          <div className="absolute inset-0 bg-carob-900/40 backdrop-blur-sm" onClick={() => setShowDelete(null)} />
          <div className="relative bg-surface-card rounded-t-2xl lg:rounded-2xl p-6 w-full lg:max-w-sm">
            <p className="font-semibold text-text-strong mb-2">¿Eliminar publicación?</p>
            <p className="text-sm text-text-muted mb-5">Esta acción no se puede deshacer. También se eliminarán las imágenes del producto.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDelete(null)} className="flex-1 h-10 rounded-full border border-border-default text-sm font-semibold">Cancelar</button>
              <button onClick={() => { removeStoreProduct(showDelete); setShowDelete(null) }} className="flex-1 h-10 rounded-full bg-error-500 text-white text-sm font-semibold">Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

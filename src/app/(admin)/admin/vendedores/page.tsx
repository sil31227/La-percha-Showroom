"use client"
import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { useAdminStore } from "@/store/useAdminStore"
import { Check, X, Copy, CheckCheck, ChevronDown, ChevronUp, Pencil, Trash2, Eye, Package, ShoppingBag, User, Banknote } from "lucide-react"
import type { AdminOrder } from "@/store/useAdminStore"

type Tab = "pending" | "approved" | "rejected" | "publicaciones"

export default function VendedoresPage() {
  const {
    vendors, products, orders, loaded, loadFromSupabase,
    approveVendor, rejectVendor,
    toggleProductSold, updateFeriaProduct, deleteFeriaProduct, updateProductStatus,
  } = useAdminStore()
  const searchParams = useSearchParams()
  const [tab, setTab] = useState<Tab>("pending")
  const [copied, setCopied] = useState<string | null>(null)
  const [expandedVendor, setExpandedVendor] = useState<string | null>(null)
  const [editingProduct, setEditingProduct] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [viewingOrder, setViewingOrder] = useState<string | null>(null)
  const [viewingProfile, setViewingProfile] = useState<string | null>(null)

  useEffect(() => {
    loadFromSupabase().then(() => {
      const vendorParam = searchParams.get("vendedor")
      const pedidoParam = searchParams.get("pedido")
      if (vendorParam) {
        setTab("publicaciones")
        setExpandedVendor(vendorParam)
        if (pedidoParam) setViewingOrder(pedidoParam)
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const counts = {
    all: vendors.length,
    pending: vendors.filter(v => v.status === "pending").length,
    approved: vendors.filter(v => v.status === "approved").length,
    rejected: vendors.filter(v => v.status === "rejected").length,
  }

  const TABS: { key: Tab; label: string; count: number }[] = [
    { key: "pending", label: "Pendientes", count: counts.pending },
    { key: "approved", label: "Aprobadas", count: counts.approved },
    { key: "rejected", label: "Rechazadas", count: counts.rejected },
    { key: "publicaciones", label: "Publicaciones", count: counts.approved },
  ]

  const filteredVendors = tab === "publicaciones"
    ? vendors.filter(v => v.status === "approved")
    : vendors.filter(v => v.status === tab)

  const approvedVendors = tab === "publicaciones" ? filteredVendors : []

  function getVendorProducts(vendorId: string) {
    return products.filter(p => p.vendedor_tipo === "feria" && p.vendedor_id === vendorId)
  }

  function getProductOrder(productId: string): AdminOrder | undefined {
    return orders.find(o => o.producto_id === productId && o.status !== "cancelled")
  }

  async function copyCBU(cbu: string, id: string) {
    await navigator.clipboard.writeText(cbu)
    setCopied(id)
    setTimeout(() => setCopied(null), 1500)
  }

  async function handleVendor(action: (id: string) => Promise<void>, id: string) {
    try { await action(id) } catch (e) { alert(e instanceof Error ? e.message : "Error al actualizar la vendedora") }
  }

  if (!loaded) return <div className="p-5 lg:pt-7 text-sm text-text-muted">Cargando...</div>

  return (
    <div className="p-5 lg:p-7 lg:pt-7 space-y-5 max-w-4xl">
      <div>
        <h1 className="font-display text-2xl text-text-strong">Vendedores</h1>
        <p className="text-sm text-text-muted mt-1">Gestioná las solicitudes y publicaciones de vendedores</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setExpandedVendor(null); setEditingProduct(null) }}
            className={`shrink-0 px-3.5 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition-colors ${tab === t.key ? 'bg-brand text-white' : 'bg-surface-sunken text-text-body'}`}
          >
            {t.label}
            <span className="ml-1.5 opacity-70">{t.count}</span>
          </button>
        ))}
      </div>

      {/* === SOLICITUDES (pendientes, aprobadas, rechazadas) === */}
      {tab !== "publicaciones" && (
        <div className="space-y-3">
          {filteredVendors.length === 0 ? (
            <div className="bg-surface-card rounded-xl border border-border-subtle px-4 py-12 text-center text-sm text-text-muted">
              No hay solicitudes
            </div>
          ) : (
            filteredVendors.map(v => (
              <div key={v.id} className="bg-surface-card rounded-xl border border-border-subtle p-4">
                <div className="flex items-start gap-3">
                  <img src={v.avatar || ""} alt="" className="w-12 h-12 rounded-full object-cover ring-2 ring-matcha-100 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-text-strong">{v.nombre}</p>
                      {v.status === "pending" ? <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-warning-50 text-warning-600">Pendiente</span>
                        : v.status === "approved" ? <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-success-50 text-success-600">Aprobada</span>
                        : <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-error-50 text-error-500">Rechazada</span>}
                    </div>
                    <p className="text-xs text-text-muted mt-0.5">{v.email}</p>
                    <div className="flex flex-wrap items-center gap-3 mt-2">
                      <span className="text-xs text-text-muted">{v.productos_count || 0} productos</span>
                      {v.cbu && (
                        <button onClick={() => copyCBU(v.cbu!, v.id)} className="inline-flex items-center gap-1 text-[11px] text-matcha-600 font-medium hover:text-matcha-700">
                          {copied === v.id ? <CheckCheck className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          {copied === v.id ? "¡Copiado!" : `CBU: ...${v.cbu.slice(-4)}`}
                        </button>
                      )}
                    </div>
                  </div>
                  {v.status === "pending" && (
                    <div className="flex gap-1.5 shrink-0">
                      <button onClick={() => handleVendor(approveVendor, v.id)} className="w-8 h-8 rounded-full bg-success-50 text-success-600 flex items-center justify-center hover:bg-success-500 hover:text-white transition-colors"><Check className="w-4 h-4" /></button>
                      <button onClick={() => handleVendor(rejectVendor, v.id)} className="w-8 h-8 rounded-full bg-error-50 text-error-500 flex items-center justify-center hover:bg-error-500 hover:text-white transition-colors"><X className="w-4 h-4" /></button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* === PUBLICACIONES === */}
      {tab === "publicaciones" && (
        <div className="space-y-3">
          {approvedVendors.length === 0 ? (
            <div className="bg-surface-card rounded-xl border border-border-subtle px-4 py-12 text-center text-sm text-text-muted">
              No hay vendedores aprobados
            </div>
          ) : (
            approvedVendors.map(v => {
              const vendorProducts = getVendorProducts(v.id)
              const isExpanded = expandedVendor === v.id
              const soldCount = vendorProducts.filter(p => p.vendido).length
              const activeCount = vendorProducts.filter(p => !p.vendido && p.status === "approved").length
              const pendingCount = vendorProducts.filter(p => p.status === "pending").length

              return (
                <div key={v.id} className="bg-surface-card rounded-xl border border-border-subtle overflow-hidden">
                  <button
                    onClick={() => {
                      setExpandedVendor(isExpanded ? null : v.id)
                      setEditingProduct(null)
                      setViewingOrder(null)
                    }}
                    className="w-full p-4 flex items-start gap-3 text-left hover:bg-surface-sunken/50 transition-colors"
                  >
                    <img src={v.avatar || ""} alt="" className="w-12 h-12 rounded-full object-cover ring-2 ring-matcha-100 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-text-strong">{v.nombre}</p>
                        <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-success-50 text-success-600">Aprobada</span>
                      </div>
                      <p className="text-xs text-text-muted mt-0.5">{v.email}</p>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-text-muted">
                        <span className="inline-flex items-center gap-1"><ShoppingBag className="w-3 h-3" />{vendorProducts.length} prendas</span>
                        {soldCount > 0 && <span className="text-success-600">{soldCount} vendidas</span>}
                        {activeCount > 0 && <span>{activeCount} activas</span>}
                        {pendingCount > 0 && <span className="text-warning-600">{pendingCount} pendientes</span>}
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center gap-1 pt-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); setViewingProfile(viewingProfile === v.id ? null : v.id) }}
                        className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${viewingProfile === v.id ? 'bg-brand text-white' : 'bg-surface-sunken text-text-muted hover:bg-matcha-100 hover:text-matcha-600'}`}
                        title="Perfil del vendedor"
                      >
                        <User className="w-3.5 h-3.5" />
                      </button>
                      {isExpanded ? <ChevronUp className="w-5 h-5 text-text-muted" /> : <ChevronDown className="w-5 h-5 text-text-muted" />}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-border-subtle">
                      {viewingProfile === v.id && (
                        <VendorProfile vendor={v} products={vendorProducts} orders={orders} />
                      )}
                      {vendorProducts.length === 0 ? (
                        <div className="px-4 py-10 text-center text-sm text-text-muted">Esta vendedora no tiene prendas publicadas</div>
                      ) : (
                        <div className="divide-y divide-border-subtle">
                          {vendorProducts.map(product => {
                            const order = getProductOrder(product.id)
                            const isEditing = editingProduct === product.id
                            const isViewingOrder = viewingOrder === order?.id

                            return (
                              <div key={product.id}>
                                <div className="p-4">
                                  <div className="flex items-start gap-3">
                                    <img
                                      src={product.imagenes?.[0] || ""}
                                      alt={product.titulo}
                                      className="w-16 h-20 object-cover rounded-lg shrink-0 bg-surface-sunken"
                                    />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-text-strong line-clamp-2">{product.titulo}</p>
                                      <p className="text-sm font-semibold text-brand mt-0.5">${product.precio?.toLocaleString("es-AR")}</p>
                                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                                        {product.status === "approved" && (
                                          <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-success-50 text-success-600">Aprobada</span>
                                        )}
                                        {product.status === "pending" && (
                                          <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-warning-50 text-warning-600">Pendiente</span>
                                        )}
                                        {product.status === "rejected" && (
                                          <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-error-50 text-error-500">Rechazada</span>
                                        )}
                                        {product.status === "changes_requested" && (
                                          <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-purple-50 text-purple-600">Cambios</span>
                                        )}
                                        {product.vendido ? (
                                          <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-carob-100 text-carob-700">Vendida</span>
                                        ) : (
                                          <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-blue-50 text-blue-600">Disponible</span>
                                        )}
                                        {product.stock != null && product.stock > 0 && (
                                          <span className="text-[10px] text-text-muted">Stock: {product.stock}</span>
                                        )}
                                      </div>
                                    </div>

                                    <div className="flex gap-1.5 shrink-0">
                                      <button
                                        onClick={() => setEditingProduct(isEditing ? null : product.id)}
                                        className="flex flex-col items-center gap-0.5 px-1.5 py-1 rounded-lg bg-surface-sunken hover:bg-brand hover:text-white transition-colors text-text-muted group"
                                        title="Editar producto"
                                      >
                                        <Pencil className="w-3.5 h-3.5" />
                                        <span className="text-[8px] font-medium leading-none">Editar</span>
                                      </button>
                                      <button
                                        onClick={async () => {
                                          try { await toggleProductSold(product.id, !product.vendido) } catch {}
                                        }}
                                        className={`flex flex-col items-center gap-0.5 px-1.5 py-1 rounded-lg transition-colors ${product.vendido ? 'bg-blue-50 text-blue-600 hover:bg-blue-500 hover:text-white' : 'bg-carob-50 text-carob-600 hover:bg-carob-500 hover:text-white'}`}
                                        title={product.vendido ? "Marcar como no vendida" : "Marcar como vendida"}
                                      >
                                        <Package className="w-3.5 h-3.5" />
                                        <span className="text-[8px] font-medium leading-none">Vendido</span>
                                      </button>
                                      {order && (
                                        <button
                                          onClick={() => setViewingOrder(isViewingOrder ? null : order.id)}
                                          className="flex flex-col items-center gap-0.5 px-1.5 py-1 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-500 hover:text-white transition-colors"
                                          title="Ver pedido"
                                        >
                                          <Eye className="w-3.5 h-3.5" />
                                          <span className="text-[8px] font-medium leading-none">Pedido</span>
                                        </button>
                                      )}
                                      <button
                                        onClick={() => setDeleteConfirm(deleteConfirm === product.id ? null : product.id)}
                                        className="flex flex-col items-center gap-0.5 px-1.5 py-1 rounded-lg bg-error-50 text-error-500 hover:bg-error-500 hover:text-white transition-colors"
                                        title="Eliminar producto"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        <span className="text-[8px] font-medium leading-none">Eliminar</span>
                                      </button>
                                    </div>
                                  </div>

                                  {/* Confirmación de eliminación */}
                                  {deleteConfirm === product.id && (
                                    <div className="mt-3 p-3 bg-error-50 border border-error-200 rounded-lg flex items-center gap-3">
                                      <span className="text-xs text-error-700 flex-1">¿Eliminar &quot;{product.titulo}&quot;? Esta acción no se puede deshacer.</span>
                                      <button
                                        onClick={async () => {
                                          try { await deleteFeriaProduct(product.id); setDeleteConfirm(null) } catch { alert("Error al eliminar") }
                                        }}
                                        className="px-3 py-1.5 rounded-lg bg-error-500 text-white text-xs font-semibold hover:bg-error-600"
                                      >
                                        Eliminar
                                      </button>
                                      <button onClick={() => setDeleteConfirm(null)} className="px-3 py-1.5 rounded-lg bg-surface-card border border-border-subtle text-xs hover:bg-surface-sunken">
                                        Cancelar
                                      </button>
                                    </div>
                                  )}

                                  {/* Edición inline */}
                                  {isEditing && (
                                    <ProductEditForm
                                      product={product}
                                      onSave={async (updates) => {
                                        try { await updateFeriaProduct(product.id, updates); setEditingProduct(null) } catch { alert("Error al guardar") }
                                      }}
                                      onCancel={() => setEditingProduct(null)}
                                      onUpdateStatus={async (status) => {
                                        try { await updateProductStatus(product.id, status); setEditingProduct(null) } catch {}
                                      }}
                                    />
                                  )}

                                  {/* Visor de pedido */}
                                  {order && isViewingOrder && (
                                    <OrderViewer order={order} onClose={() => setViewingOrder(null)} />
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}

/* ─── Vendor Profile ─── */
function VendorProfile({
  vendor,
  products,
  orders,
}: {
  vendor: ReturnType<typeof useAdminStore.getState>["vendors"][number]
  products: ReturnType<typeof useAdminStore.getState>["products"]
  orders: ReturnType<typeof useAdminStore.getState>["orders"]
}) {
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const soldProducts = products.filter(p => p.vendido)
  const totalSold = soldProducts.reduce((sum, p) => sum + (p.precio || 0), 0)
  const commission = Math.round(totalSold * 0.2)
  const toTransfer = totalSold - commission

  const deliveredOrders = orders.filter(
    o => o.vendedor_id === vendor.id && o.status === "delivered"
  )
  const pendingRelease = deliveredOrders.reduce((sum, o) => sum + (o.precio || 0), 0)

  async function copyField(value: string, field: string) {
    await navigator.clipboard.writeText(value)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 1500)
  }

  const tipoCuentaLabel =
    vendor.tipo_cuenta === "cuenta_corriente" ? "Cuenta corriente" : "Caja de ahorro"

  return (
    <div className="px-4 py-4 bg-matcha-50/30 border-b border-border-subtle space-y-4">
      <div className="flex items-center gap-2">
        <Banknote className="w-4 h-4 text-matcha-600" />
        <span className="text-xs font-semibold text-text-strong">Perfil del vendedor</span>
      </div>

      {(vendor.titular || vendor.banco || vendor.cbu) ? (
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
          {vendor.titular && (
            <div className="col-span-2">
              <span className="text-text-muted">Titular:</span>
              <p className="text-text-strong font-medium">{vendor.titular}</p>
            </div>
          )}
          {vendor.banco && (
            <div>
              <span className="text-text-muted">Banco:</span>
              <p className="text-text-strong font-medium">{vendor.banco}</p>
            </div>
          )}
          {vendor.tipo_cuenta && (
            <div>
              <span className="text-text-muted">Tipo de cuenta:</span>
              <p className="text-text-strong font-medium">{tipoCuentaLabel}</p>
            </div>
          )}
          {vendor.cbu && (
            <div className="col-span-2">
              <span className="text-text-muted">CBU:</span>
              <div className="flex items-center gap-2">
                <p className="text-text-strong font-mono font-medium text-xs">{vendor.cbu}</p>
                <button
                  onClick={() => copyField(vendor.cbu!, "cbu")}
                  className="inline-flex items-center gap-1 text-[10px] text-matcha-600 font-medium hover:text-matcha-700"
                >
                  {copiedField === "cbu" ? <CheckCheck className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copiedField === "cbu" ? "Copiado" : "Copiar"}
                </button>
              </div>
            </div>
          )}
          {vendor.alias && (
            <div className="col-span-2">
              <span className="text-text-muted">Alias:</span>
              <div className="flex items-center gap-2">
                <p className="text-text-strong font-medium">{vendor.alias}</p>
                <button
                  onClick={() => copyField(vendor.alias!, "alias")}
                  className="inline-flex items-center gap-1 text-[10px] text-matcha-600 font-medium hover:text-matcha-700"
                >
                  {copiedField === "alias" ? <CheckCheck className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copiedField === "alias" ? "Copiado" : "Copiar"}
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <p className="text-xs text-text-muted italic">No cargó sus datos bancarios todavía</p>
      )}

      <div className="border-t border-matcha-200 pt-3 space-y-1.5">
        <div className="flex justify-between text-xs">
          <span className="text-text-muted">Total vendido</span>
          <span className="text-text-strong font-semibold">${totalSold.toLocaleString("es-AR")}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-text-muted">Comisión (20%)</span>
          <span className="text-error-500 font-semibold">−${commission.toLocaleString("es-AR")}</span>
        </div>
        <div className="flex justify-between text-xs font-semibold border-t border-matcha-200 pt-1.5">
          <span className="text-text-strong">A transferir</span>
          <span className="text-success-600">${toTransfer.toLocaleString("es-AR")}</span>
        </div>
        {pendingRelease > 0 && (
          <p className="text-[10px] text-warning-600 mt-1">
            Hay ${pendingRelease.toLocaleString("es-AR")} en pedidos entregados pendientes de liberación
          </p>
        )}
      </div>
    </div>
  )
}

/* ─── Product Edit Form ─── */
function ProductEditForm({
  product,
  onSave,
  onCancel,
  onUpdateStatus,
}: {
  product: ReturnType<typeof useAdminStore.getState>["products"][number]
  onSave: (updates: Record<string, unknown>) => Promise<void>
  onCancel: () => void
  onUpdateStatus: (status: "approved" | "rejected" | "changes_requested") => Promise<void>
}) {
  const [titulo, setTitulo] = useState(product.titulo || "")
  const [precio, setPrecio] = useState(String(product.precio || ""))
  const [descripcion, setDescripcion] = useState(product.descripcion || "")
  const [marca, setMarca] = useState(product.marca || "")
  const [material, setMaterial] = useState(product.material || "")
  const [stock, setStock] = useState(String(product.stock ?? ""))
  const [saving, setSaving] = useState(false)
  const [modMenu, setModMenu] = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      await onSave({
        titulo,
        precio: Number(precio) || 0,
        descripcion,
        marca: marca || null,
        material: material || null,
        stock: stock ? Number(stock) : null,
      })
    } finally {
      setSaving(false)
    }
  }

  async function handleModAction(status: "approved" | "rejected" | "changes_requested") {
    setSaving(true)
    try {
      await onUpdateStatus(status)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mt-3 p-4 bg-surface-sunken rounded-lg space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-[10px] font-semibold text-text-muted uppercase">Título</span>
          <input value={titulo} onChange={e => setTitulo(e.target.value)} className="px-2.5 py-1.5 rounded-lg border border-border-subtle bg-surface-card text-xs text-text-strong focus:outline-none focus:ring-2 focus:ring-brand/30" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[10px] font-semibold text-text-muted uppercase">Precio</span>
          <input value={precio} onChange={e => setPrecio(e.target.value)} className="px-2.5 py-1.5 rounded-lg border border-border-subtle bg-surface-card text-xs text-text-strong focus:outline-none focus:ring-2 focus:ring-brand/30" />
        </label>
        <label className="flex flex-col gap-1 col-span-2">
          <span className="text-[10px] font-semibold text-text-muted uppercase">Descripción</span>
          <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)} rows={2} className="px-2.5 py-1.5 rounded-lg border border-border-subtle bg-surface-card text-xs text-text-strong focus:outline-none focus:ring-2 focus:ring-brand/30 resize-none" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[10px] font-semibold text-text-muted uppercase">Marca</span>
          <input value={marca} onChange={e => setMarca(e.target.value)} className="px-2.5 py-1.5 rounded-lg border border-border-subtle bg-surface-card text-xs text-text-strong focus:outline-none focus:ring-2 focus:ring-brand/30" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[10px] font-semibold text-text-muted uppercase">Material</span>
          <input value={material} onChange={e => setMaterial(e.target.value)} className="px-2.5 py-1.5 rounded-lg border border-border-subtle bg-surface-card text-xs text-text-strong focus:outline-none focus:ring-2 focus:ring-brand/30" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[10px] font-semibold text-text-muted uppercase">Stock</span>
          <input value={stock} onChange={e => setStock(e.target.value)} type="number" className="px-2.5 py-1.5 rounded-lg border border-border-subtle bg-surface-card text-xs text-text-strong focus:outline-none focus:ring-2 focus:ring-brand/30" />
        </label>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-1.5 rounded-lg bg-brand text-white text-xs font-semibold hover:bg-brand/90 disabled:opacity-50"
        >
          {saving ? "Guardando..." : "Guardar cambios"}
        </button>
        <div className="relative">
          <button
            onClick={() => setModMenu(!modMenu)}
            className="px-3 py-1.5 rounded-lg bg-surface-card border border-border-subtle text-xs font-medium hover:bg-surface-sunken"
          >
            Moderación ▾
          </button>
          {modMenu && (
            <div className="absolute bottom-full left-0 mb-1 bg-surface-card border border-border-subtle rounded-lg shadow-lg py-1 z-10 min-w-[160px]">
              {product.status !== "approved" && (
                <button onClick={() => handleModAction("approved")} className="w-full px-3 py-1.5 text-xs text-left text-success-600 hover:bg-success-50">
                  ✅ Aprobar
                </button>
              )}
              {product.status !== "rejected" && (
                <button onClick={() => handleModAction("rejected")} className="w-full px-3 py-1.5 text-xs text-left text-error-500 hover:bg-error-50">
                  ❌ Rechazar
                </button>
              )}
              {product.status !== "changes_requested" && (
                <button onClick={() => handleModAction("changes_requested")} className="w-full px-3 py-1.5 text-xs text-left text-purple-600 hover:bg-purple-50">
                  ✏️ Pedir cambios
                </button>
              )}
            </div>
          )}
        </div>
        <button onClick={onCancel} className="px-3 py-1.5 rounded-lg bg-surface-card border border-border-subtle text-xs hover:bg-surface-sunken">
          Cancelar
        </button>
      </div>
    </div>
  )
}

/* ─── Order Viewer ─── */
function OrderViewer({ order, onClose }: { order: AdminOrder; onClose: () => void }) {
  const statusLabels: Record<string, string> = {
    pending_shipment: "Pendiente de envío",
    shipped: "Enviado",
    delivered: "Entregado",
    cancelled: "Cancelado",
  }
  const statusColors: Record<string, string> = {
    pending_shipment: "bg-warning-50 text-warning-600",
    shipped: "bg-blue-50 text-blue-600",
    delivered: "bg-success-50 text-success-600",
    cancelled: "bg-error-50 text-error-500",
  }

  return (
    <div className="mt-3 p-4 bg-purple-50/40 border border-purple-200 rounded-lg space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-purple-700">Pedido #{order.id.slice(0, 8)}</span>
        <button onClick={onClose} className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center hover:bg-purple-200">
          <X className="w-3 h-3 text-purple-600" />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-text-muted">Comprador:</span>
          <p className="text-text-strong font-medium">{order.comprador_nombre || "—"}</p>
        </div>
        <div>
          <span className="text-text-muted">Email:</span>
          <p className="text-text-strong truncate">{order.comprador_email || "—"}</p>
        </div>
        <div>
          <span className="text-text-muted">Talle:</span>
          <p className="text-text-strong">{order.talle || "—"}</p>
        </div>
        <div>
          <span className="text-text-muted">Precio:</span>
          <p className="text-text-strong font-semibold">${order.precio?.toLocaleString("es-AR")}</p>
        </div>
        <div>
          <span className="text-text-muted">Envío:</span>
          <p className="text-text-strong">{order.metodo_envio || "—"}</p>
        </div>
        <div>
          <span className="text-text-muted">Costo envío:</span>
          <p className="text-text-strong">${order.costo_envio || 0}</p>
        </div>
        <div className="col-span-2">
          <span className="text-text-muted">Dirección:</span>
          <p className="text-text-strong">{order.direccion || "—"}</p>
        </div>
        {order.seguimiento && (
          <div className="col-span-2">
            <span className="text-text-muted">Seguimiento:</span>
            <p className="text-text-strong font-mono">{order.seguimiento}</p>
          </div>
        )}
        <div className="col-span-2">
          <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${statusColors[order.status] || 'bg-surface-sunken text-text-muted'}`}>
            {statusLabels[order.status] || order.status}
          </span>
        </div>
      </div>
    </div>
  )
}

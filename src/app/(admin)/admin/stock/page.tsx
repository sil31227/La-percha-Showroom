"use client"
import { useEffect } from "react"
import { useAdminStore } from "@/store/useAdminStore"
import { AlertTriangle } from "lucide-react"

export default function StockPage() {
  const { products, loaded, loadFromSupabase } = useAdminStore()

  useEffect(() => { loadFromSupabase() }, [])

  if (!loaded) return <div className="p-5 lg:pt-7 text-sm text-text-muted">Cargando...</div>

  const storeProducts = products.filter(p => p.vendedor_tipo === "oficial")
  const lowStockCount = storeProducts.filter(p => {
    const hasVariants = p.variantes && Array.isArray(p.variantes) && p.variantes.length > 0
    if (hasVariants) {
      return p.variantes!.some(v => (v.stock ?? 0) > 0 && (v.stock ?? 0) < 3)
    }
    return (p.stock ?? 0) > 0 && (p.stock ?? 0) < 3
  }).length

  return (
    <div className="p-5 lg:p-7 lg:pt-7 space-y-5 max-w-4xl">
      <div>
        <h1 className="font-display text-2xl text-text-strong">Stock</h1>
        <p className="text-sm text-text-muted mt-1">
          {storeProducts.length} productos{lowStockCount > 0 ? ` · ${lowStockCount} con stock bajo` : ""}
        </p>
      </div>

      {storeProducts.length === 0 ? (
        <div className="bg-surface-card rounded-xl border border-border-subtle px-4 py-16 text-center text-sm text-text-muted">
          No hay productos de tienda
        </div>
      ) : (
        <div className="space-y-3">
          {storeProducts.map(p => {
            const hasVariants = p.variantes && Array.isArray(p.variantes) && p.variantes.length > 0
            const generalStock = p.stock ?? 0
            const isLowStock = !hasVariants && generalStock > 0 && generalStock < 3

            return (
              <div key={p.id} className="bg-surface-card rounded-xl border border-border-subtle p-4">
                <div className="flex items-start gap-3">
                  <img
                    src={p.imagenes?.[0] || ""}
                    alt=""
                    className="w-14 h-18 rounded-lg object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text-strong truncate">
                      {p.titulo}
                    </p>
                    <p className="text-sm font-bold text-price">
                      ${p.precio.toLocaleString("es-AR")}
                    </p>

                    {hasVariants ? (
                      <div className="mt-2 space-y-1.5">
                        {p.variantes!.map((v, i) => {
                          const vStock = v.stock ?? 0
                          const vLow = vStock > 0 && vStock < 3
                          return (
                            <div
                              key={i}
                              className={`flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg text-xs ${
                                vStock === 0
                                  ? "bg-error-50 text-error-500"
                                  : vLow
                                  ? "bg-warning-50 text-warning-600"
                                  : "bg-surface-sunken text-text-body"
                              }`}
                            >
                              <span className="font-medium truncate">{v.nombre}</span>
                              <span className="shrink-0 flex items-center gap-1 font-semibold">
                                {vLow && <AlertTriangle className="w-3 h-3" />}
                                {vStock} unid.
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 mt-1.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                            generalStock === 0
                              ? "bg-error-50 text-error-500"
                              : isLowStock
                              ? "bg-warning-50 text-warning-600"
                              : "bg-success-50 text-success-600"
                          }`}
                        >
                          {generalStock === 0 && <AlertTriangle className="w-3 h-3" />}
                          {isLowStock && <AlertTriangle className="w-3 h-3" />}
                          Stock: {generalStock} unid.
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

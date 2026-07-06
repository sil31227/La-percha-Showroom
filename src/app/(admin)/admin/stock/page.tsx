"use client"
import { useEffect, useState, useCallback } from "react"
import { useAdminStore, type AdminProduct } from "@/store/useAdminStore"
import type { Variante } from "@/lib/types"
import { AlertTriangle, Minus, Plus, Save, Check } from "lucide-react"

type StockEdits = {
  stock?: number
  variantes?: Variante[]
}

export default function StockPage() {
  const { products, loaded, loadFromSupabase, updateProductStock } = useAdminStore()
  const [edits, setEdits] = useState<Record<string, StockEdits>>({})
  const [saving, setSaving] = useState<Record<string, boolean>>({})
  const [saved, setSaved] = useState<Record<string, boolean>>({})

  useEffect(() => { loadFromSupabase() }, [])

  const storeProducts = products.filter(p => p.vendedor_tipo === "oficial")

  const getEffectiveData = useCallback((p: AdminProduct) => {
    const edit = edits[p.id]
    return {
      stock: edit?.stock ?? p.stock ?? 0,
      variantes: edit?.variantes ?? (p.variantes || []),
    }
  }, [edits])

  const initEditsIfNeeded = useCallback((p: AdminProduct) => {
    if (!edits[p.id]) {
      setEdits(prev => ({
        ...prev,
        [p.id]: {
          stock: p.stock ?? 0,
          variantes: (p.variantes || []).map(v => ({ ...v })),
        },
      }))
    }
  }, [edits])

  function changeStock(productId: string, value: number) {
    setEdits(prev => {
      const current = prev[productId]
      return {
        ...prev,
        [productId]: {
          ...current,
          stock: value,
        },
      }
    })
    setSaved(prev => ({ ...prev, [productId]: false }))
  }

  function changeVariantStock(productId: string, variantIndex: number, value: number) {
    setEdits(prev => {
      const current = prev[productId] || { variantes: [] }
      const variantes = [...(current.variantes || [])]
      if (variantes[variantIndex]) {
        variantes[variantIndex] = { ...variantes[variantIndex], stock: value }
      }
      return { ...prev, [productId]: { ...current, variantes } }
    })
    setSaved(prev => ({ ...prev, [productId]: false }))
  }

  function isDirty(p: AdminProduct): boolean {
    const edit = edits[p.id]
    if (!edit) return false
    if (edit.stock !== undefined && edit.stock !== (p.stock ?? 0)) return true
    if (edit.variantes) {
      const orig = p.variantes || []
      if (edit.variantes.length !== orig.length) return true
      return edit.variantes.some((v, i) => (v.stock ?? 0) !== (orig[i]?.stock ?? 0))
    }
    return false
  }

  async function handleSave(productId: string) {
    const p = products.find(x => x.id === productId)
    if (!p) return
    const edit = edits[productId]
    if (!edit) return

    setSaving(prev => ({ ...prev, [productId]: true }))

    const hasVariants = (p.variantes || []).length > 0
    try {
      if (hasVariants && edit.variantes) {
        await updateProductStock(productId, undefined, edit.variantes)
      } else {
        await updateProductStock(productId, edit.stock ?? 0, undefined)
      }
      setSaved(prev => ({ ...prev, [productId]: true }))
      setTimeout(() => setSaved(prev => ({ ...prev, [productId]: false })), 2000)
    } catch {
      // error handling silently
    } finally {
      setSaving(prev => ({ ...prev, [productId]: false }))
    }
  }

  const lowStockCount = storeProducts.filter(p => {
    const { stock, variantes } = getEffectiveData(p)
    if (variantes.length > 0) {
      return variantes.some(v => (v.stock ?? 0) > 0 && (v.stock ?? 0) < 3)
    }
    return stock > 0 && stock < 3
  }).length

  if (!loaded) return <div className="p-5 lg:pt-7 text-sm text-text-muted">Cargando...</div>

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
            initEditsIfNeeded(p)
            const hasVariants = (p.variantes || []).length > 0
            const dirty = isDirty(p)
            const { stock, variantes } = getEffectiveData(p)

            return (
              <div key={p.id} className="bg-surface-card rounded-xl border border-border-subtle p-4">
                <div className="flex items-start gap-3">
                  <img
                    src={p.imagenes?.[0] || ""}
                    alt=""
                    className="w-14 h-18 rounded-lg object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-text-strong truncate">
                        {p.titulo}
                      </p>
                      {dirty && (
                        <button
                          onClick={() => handleSave(p.id)}
                          disabled={saving[p.id]}
                          className="flex items-center gap-1 shrink-0 px-3 py-1.5 rounded-full text-[11px] font-semibold bg-brand text-white hover:bg-brand-hover transition-colors disabled:opacity-50"
                        >
                          {saving[p.id] ? (
                            "Guardando..."
                          ) : (
                            <>
                              <Save className="w-3 h-3" />
                              Guardar
                            </>
                          )}
                        </button>
                      )}
                      {saved[p.id] && !dirty && (
                        <span className="flex items-center gap-1 shrink-0 text-[11px] font-semibold text-success-600">
                          <Check className="w-3 h-3" /> Guardado
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-bold text-price">
                      ${p.precio.toLocaleString("es-AR")}
                    </p>

                    {hasVariants ? (
                      <div className="mt-2 space-y-1.5">
                        {variantes.map((v, i) => {
                          const vStock = v.stock ?? 0
                          const vLow = vStock > 0 && vStock < 3
                          return (
                            <div
                              key={i}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs ${
                                vStock === 0
                                  ? "bg-error-50"
                                  : vLow
                                  ? "bg-warning-50"
                                  : "bg-surface-sunken"
                              }`}
                            >
                              <span className={`font-medium truncate flex-1 ${vStock === 0 ? "text-error-600" : vLow ? "text-warning-600" : "text-text-body"}`}>
                                {[v.talle, v.color].filter(Boolean).join(" / ") || "Único"}
                              </span>
                              <button
                                onClick={() => changeVariantStock(p.id, i, Math.max(0, vStock - 1))}
                                className="w-5 h-5 rounded-full bg-white/60 flex items-center justify-center hover:bg-white transition-colors shrink-0"
                              >
                                <Minus className="w-2.5 h-2.5" />
                              </button>
                              <input
                                type="number"
                                min={0}
                                value={vStock}
                                onChange={e => changeVariantStock(p.id, i, Math.max(0, Number(e.target.value) || 0))}
                                className={`w-12 h-6 text-center rounded-md text-[11px] font-semibold border outline-none [&::-webkit-inner-spin-button]:appearance-none ${
                                  vStock === 0
                                    ? "bg-white border-error-200 text-error-600"
                                    : vLow
                                    ? "bg-white border-warning-200 text-warning-600"
                                    : "bg-white border-transparent text-text-strong"
                                }`}
                              />
                              <button
                                onClick={() => changeVariantStock(p.id, i, vStock + 1)}
                                className="w-5 h-5 rounded-full bg-white/60 flex items-center justify-center hover:bg-white transition-colors shrink-0"
                              >
                                <Plus className="w-2.5 h-2.5" />
                              </button>
                              <span className="text-[10px] w-8 text-right shrink-0 font-medium text-text-muted">
                                unid.
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 mt-2">
                        <button
                          onClick={() => changeStock(p.id, Math.max(0, stock - 1))}
                          className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors shrink-0 ${
                            stock === 0
                              ? "bg-error-50 text-error-500 hover:bg-error-100"
                              : "bg-surface-sunken text-text-body hover:bg-surface-raised"
                          }`}
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <input
                          type="number"
                          min={0}
                          value={stock}
                          onChange={e => changeStock(p.id, Math.max(0, Number(e.target.value) || 0))}
                          className={`w-16 h-8 text-center rounded-lg text-sm font-semibold border outline-none [&::-webkit-inner-spin-button]:appearance-none ${
                            stock === 0
                              ? "bg-error-50 border-error-200 text-error-600"
                              : stock > 0 && stock < 3
                              ? "bg-warning-50 border-warning-200 text-warning-600"
                              : "bg-success-50 border-success-200 text-success-600"
                          }`}
                        />
                        <button
                          onClick={() => changeStock(p.id, stock + 1)}
                          className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors shrink-0 ${
                            stock === 0
                              ? "bg-error-50 text-error-500 hover:bg-error-100"
                              : "bg-surface-sunken text-text-body hover:bg-surface-raised"
                          }`}
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <span className="text-xs text-text-muted ml-1">unid.</span>
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

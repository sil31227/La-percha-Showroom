"use client"
import { useState, useCallback, useMemo } from "react"
import { Plus, X } from "lucide-react"

interface VariantGroup {
  id: string
  name: string
  values: string[]
}

interface Variant {
  nombre: string
  atributos: Record<string, string>
  precio: number
  stock: number
  imagen: string
}

const OPTION_TYPES = [
  { id: "Color", label: "Color" },
  { id: "Talle", label: "Talle" },
  { id: "Aroma", label: "Aroma" },
  { id: "Modelo", label: "Modelo" },
  { id: "Material", label: "Material" },
  { id: "__custom__", label: "Otro" },
]

function genName(atributos: Record<string, string>) {
  return Object.entries(atributos).map(([k, v]) => `${k}: ${v}`).join(" / ")
}

function generateCombos(groups: VariantGroup[]): Record<string, string>[] {
  if (groups.length === 0) return []

  function* walk(idx: number, current: Record<string, string>): Generator<Record<string, string>> {
    if (idx === groups.length) { yield { ...current }; return }
    for (const val of groups[idx].values) {
      current[groups[idx].name] = val
      yield* walk(idx + 1, current)
    }
  }
  return Array.from(walk(0, {}))
}

interface Props {
  groups: VariantGroup[]
  variants: Variant[]
  basePrice: number
  baseImage: string
  isRopa: boolean
  onChange: (groups: VariantGroup[], variants: Variant[]) => void
}

export function ProductOptions({ groups, variants, basePrice, baseImage, isRopa, onChange }: Props) {
  const [modalOpen, setModalOpen] = useState(false)
  const [modalStep, setModalStep] = useState<"type" | "values">("type")
  const [selectedType, setSelectedType] = useState("")
  const [customName, setCustomName] = useState("")
  const [valueInput, setValueInput] = useState("")
  const [tempValues, setTempValues] = useState<string[]>([])

  const openModal = () => {
    setModalStep("type")
    setSelectedType("")
    setCustomName("")
    setValueInput("")
    setTempValues([])
    setModalOpen(true)
  }

  const goToValues = () => {
    const name = selectedType === "__custom__" ? customName.trim() : selectedType
    if (!name) return
    if (groups.some(g => g.name.toLowerCase() === name.toLowerCase())) {
      return
    }
    setModalStep("values")
  }

  const addTempValue = () => {
    const v = valueInput.trim()
    if (!v || tempValues.includes(v)) return
    setTempValues(prev => [...prev, v])
    setValueInput("")
  }

  const removeTempValue = (v: string) => {
    setTempValues(prev => prev.filter(x => x !== v))
  }

  const confirmOption = () => {
    const name = selectedType === "__custom__" ? customName.trim() : selectedType
    if (!name || tempValues.length === 0) return

    const newGroup: VariantGroup = { id: `g-${Date.now()}`, name, values: tempValues }
    const newGroups = [...groups, newGroup]

    const combos = generateCombos(newGroups)
    const existingKeys = new Set(variants.map(v => JSON.stringify(v.atributos)))

    const newVariants = [...variants].filter(v => {
      const keys = Object.keys(v.atributos)
      return keys.every(k => newGroups.some(g => g.name === k))
    })

    for (const atributos of combos) {
      const key = JSON.stringify(atributos)
      if (!existingKeys.has(key)) {
        const match = newVariants.find(v =>
          Object.keys(atributos).every(k => v.atributos[k] === atributos[k])
        )
        newVariants.push({
          nombre: genName(atributos),
          atributos,
          precio: match?.precio ?? basePrice,
          stock: match?.stock ?? 0,
          imagen: baseImage,
        })
      }
    }

    onChange(newGroups, newVariants)
    setModalOpen(false)
  }

  const removeGroup = (groupId: string) => {
    const newGroups = groups.filter(g => g.id !== groupId)
    const remainingNames = new Set(newGroups.map(g => g.name))

    const newVariants = variants
      .map(v => {
        const newAtributos: Record<string, string> = {}
        for (const name of remainingNames) {
          if (v.atributos[name]) newAtributos[name] = v.atributos[name]
        }
        return { ...v, atributos: newAtributos, nombre: genName(newAtributos) }
      })

    if (newGroups.length === 0) {
      onChange([], [])
    } else {
      const deduped = new Map<string, typeof newVariants[0]>()
      for (const v of newVariants) {
        const key = JSON.stringify(v.atributos)
        if (!deduped.has(key)) deduped.set(key, v)
      }
      onChange(newGroups, Array.from(deduped.values()))
    }
  }

  const updateVariant = (idx: number, field: "precio" | "stock", value: number) => {
    const next = variants.map((v, i) => i === idx ? { ...v, [field]: value } : v)
    onChange(groups, next)
  }

  const combos = useMemo(() => generateCombos(groups), [groups])

  const isMultiple = groups.length > 1

  if (isRopa) return null

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <label className="text-[11px] font-semibold text-text-muted uppercase tracking-wide">
          Opciones del producto
        </label>
        <span className="text-[10px] text-text-muted">
          {groups.length === 0 ? "Sin opciones" : `${groups.length} opción${groups.length > 1 ? 'es' : ''} · ${variants.length} combinación${variants.length !== 1 ? 'es' : ''}`}
        </span>
      </div>

      {groups.map(group => (
        <div key={group.id} className="mb-4 bg-surface-card border border-border-subtle rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-text-strong">{group.name}</span>
              <span className="text-[10px] text-text-muted bg-surface-sunken px-1.5 py-0.5 rounded-full">{group.values.length} valor{group.values.length !== 1 ? 'es' : ''}</span>
            </div>
            <button
              type="button"
              onClick={() => removeGroup(group.id)}
              className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-error-50 text-text-muted hover:text-error-500 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="px-4 py-3">
            <div className="flex flex-wrap gap-1.5 mb-3">
              {group.values.map(val => (
                <span key={val} className="inline-flex items-center px-2.5 py-1 rounded-full bg-surface-sunken text-xs font-medium text-text-body">
                  {val}
                </span>
              ))}
            </div>

            {isMultiple && groups.indexOf(group) === groups.length - 1 ? (
              <div>
                <p className="text-[10px] text-text-muted mb-2">Combinaciones ({groups.map(g => g.name).join(" × ")})</p>
                <div className="overflow-x-auto -mx-4 px-4">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-border-subtle">
                        {groups.map(g => (
                          <th key={g.id} className="pb-2 text-[10px] font-semibold text-text-muted uppercase tracking-wide pr-3 whitespace-nowrap">{g.name}</th>
                        ))}
                        <th className="pb-2 text-[10px] font-semibold text-text-muted uppercase tracking-wide pr-3 whitespace-nowrap">Precio</th>
                        <th className="pb-2 text-[10px] font-semibold text-text-muted uppercase tracking-wide whitespace-nowrap">Stock</th>
                      </tr>
                    </thead>
                    <tbody>
                      {variants.map((v, i) => (
                        <tr key={i} className="border-b border-border-subtle last:border-b-0">
                          {groups.map(g => (
                            <td key={g.id} className="py-2 pr-3 text-xs text-text-body whitespace-nowrap">{v.atributos[g.name] || "-"}</td>
                          ))}
                          <td className="py-2 pr-3">
                            <input
                              type="number"
                              value={v.precio || ""}
                              onChange={e => updateVariant(i, "precio", Number(e.target.value))}
                              className="w-20 h-7 px-2 rounded-lg bg-surface-sunken text-xs border border-transparent focus:border-brand outline-none"
                              placeholder="$"
                            />
                          </td>
                          <td className="py-2">
                            <input
                              type="number"
                              value={v.stock || ""}
                              onChange={e => updateVariant(i, "stock", Number(e.target.value))}
                              className="w-16 h-7 px-2 rounded-lg bg-surface-sunken text-xs border border-transparent focus:border-brand outline-none"
                              placeholder="0"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : !isMultiple ? (
              <div>
                {variants.map((v, i) => (
                  <div key={i} className="flex items-center gap-2 py-1.5">
                    <span className="text-xs text-text-body w-20 truncate">{v.atributos[group.name] || "-"}</span>
                    <input
                      type="number"
                      value={v.precio || ""}
                      onChange={e => updateVariant(i, "precio", Number(e.target.value))}
                      className="w-20 h-7 px-2 rounded-lg bg-surface-sunken text-xs border border-transparent focus:border-brand outline-none"
                      placeholder="$"
                    />
                    <input
                      type="number"
                      value={v.stock || ""}
                      onChange={e => updateVariant(i, "stock", Number(e.target.value))}
                      className="w-16 h-7 px-2 rounded-lg bg-surface-sunken text-xs border border-transparent focus:border-brand outline-none"
                      placeholder="Stock"
                    />
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={openModal}
        className="w-full h-11 rounded-xl border-2 border-dashed border-border-default text-text-muted
          hover:border-brand hover:text-brand transition-colors flex items-center justify-center gap-2 text-sm font-medium"
      >
        <Plus className="w-4 h-4" />
        Agregar opción de compra
      </button>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center">
          <div className="absolute inset-0 bg-carob-900/40 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative bg-surface-card rounded-t-2xl lg:rounded-2xl p-6 w-full lg:max-w-md max-h-[85vh] overflow-y-auto">
            {modalStep === "type" ? (
              <>
                <h2 className="font-display text-lg text-text-strong mb-1">Agregar opción de compra</h2>
                <p className="text-xs text-text-muted mb-5">¿Qué puede elegir el cliente?</p>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {OPTION_TYPES.map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSelectedType(opt.id)}
                      className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-colors text-left
                        ${selectedType === opt.id
                          ? 'bg-brand text-white border-brand'
                          : 'bg-surface-sunken text-text-body border-transparent hover:border-brand'}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                {selectedType === "__custom__" && (
                  <input
                    value={customName}
                    onChange={e => setCustomName(e.target.value)}
                    placeholder="Nombre de la opción..."
                    className="w-full h-10 px-4 rounded-xl bg-surface-sunken text-sm border border-transparent focus:border-brand outline-none mb-4"
                    autoFocus
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); goToValues() } }}
                  />
                )}
                <div className="flex gap-3 mt-2">
                  <button type="button" onClick={() => setModalOpen(false)} className="flex-1 h-10 rounded-full border border-border-default text-sm font-semibold text-text-muted hover:bg-surface-sunken transition-colors">Cancelar</button>
                  <button type="button" onClick={goToValues} disabled={!selectedType || (selectedType === "__custom__" && !customName.trim())} className="flex-1 h-10 rounded-full bg-brand text-white text-sm font-semibold hover:bg-brand-hover transition-colors disabled:opacity-50">Continuar</button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-4">
                  <button type="button" onClick={() => setModalStep("type")} className="w-6 h-6 rounded-full bg-surface-sunken flex items-center justify-center shrink-0">
                    <span className="text-xs">←</span>
                  </button>
                  <h2 className="font-display text-lg text-text-strong">
                    {selectedType === "__custom__" ? customName : selectedType}
                  </h2>
                </div>
                <p className="text-xs text-text-muted mb-3">
                  Escribí {selectedType === "__custom__" ? "las opciones" : `los ${(selectedType === "Aroma" ? "aromas" : selectedType === "Talle" ? "talles" : selectedType === "Color" ? "colores" : selectedType === "Modelo" ? "modelos" : selectedType === "Material" ? "materiales" : "valores")}`} disponibles
                </p>
                <div className="flex gap-2 mb-3">
                  <input
                    value={valueInput}
                    onChange={e => setValueInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addTempValue() } }}
                    placeholder={`Agregar ${selectedType === "__custom__" ? "valor" : selectedType.toLowerCase()}...`}
                    className="flex-1 h-10 px-4 rounded-xl bg-surface-sunken text-sm border border-transparent focus:border-brand outline-none"
                    autoFocus
                  />
                  <button type="button" onClick={addTempValue} className="w-10 h-10 rounded-full bg-surface-sunken flex items-center justify-center hover:bg-matcha-100 transition-colors shrink-0">
                    <Plus className="w-4 h-4 text-text-muted" />
                  </button>
                </div>
                {tempValues.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {tempValues.map(v => (
                      <span key={v} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-matcha-100 text-xs font-medium text-matcha-800">
                        {v}
                        <button type="button" onClick={() => removeTempValue(v)} className="hover:text-error-500">&times;</button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex gap-3">
                  <button type="button" onClick={() => setModalOpen(false)} className="flex-1 h-10 rounded-full border border-border-default text-sm font-semibold text-text-muted hover:bg-surface-sunken transition-colors">Cancelar</button>
                  <button type="button" onClick={confirmOption} disabled={tempValues.length === 0} className="flex-1 h-10 rounded-full bg-brand text-white text-sm font-semibold hover:bg-brand-hover transition-colors disabled:opacity-50">
                    Agregar {tempValues.length > 0 ? `(${tempValues.length})` : ""}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

"use client"
import { useState } from "react"
import { Search, SlidersHorizontal } from "lucide-react"
import { PRODUCTS } from "@/lib/placeholder-products"
import { filterProducts } from "@/lib/filterProducts"
import { useShopStore } from "@/store/useShopStore"
import { ProductCard } from "@/components/ProductCard"
import { FilterSidebar } from "@/components/FilterSidebar"
import { FilterBottomSheet } from "@/components/FilterBottomSheet"
import { SortDropdown } from "@/components/SortDropdown"

const CAT_CHIPS = [
  { value: 'all', label: 'Todo' },
  { value: 'oficial', label: 'Tienda Oficial' },
  { value: 'feria', label: 'Feria de Ropa' },
]

export default function HomePage() {
  const [sheetOpen, setSheetOpen] = useState(false)
  const { filters, setFilter } = useShopStore()
  const products = filterProducts(PRODUCTS, filters)

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header mobile */}
      <header className="lg:hidden h-16 flex items-center justify-between px-5
        bg-bg-page border-b border-border-subtle sticky top-0 z-10">
        <h1 className="font-display text-xl text-text-strong">La Percha</h1>
        <button className="w-9 h-9 rounded-full bg-surface-sunken
          flex items-center justify-center">
          <Search className="w-4.5 h-4.5 text-text-muted" />
        </button>
      </header>

      <div className="flex flex-1 min-h-0">
        <FilterSidebar />

        <div className="flex-1 flex flex-col min-w-0">
          {/* Chips categoría — mobile */}
          <div className="lg:hidden px-4 pt-3 pb-2">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {CAT_CHIPS.map(c => (
                <button key={c.value}
                  onClick={() => setFilter('category', c.value)}
                  className={`shrink-0 px-3.5 py-1.5 rounded-full text-[11px] font-semibold
                    whitespace-nowrap transition-colors
                    ${filters.category === c.value
                      ? 'bg-brand text-text-on-brand'
                      : 'bg-surface-sunken text-text-body'}`}>
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Barra filtros/ordenar */}
          <div className="flex items-center justify-between px-4 lg:px-6 py-2 gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSheetOpen(true)}
                className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                  border border-border-default text-sm text-text-body
                  hover:border-brand transition-colors bg-surface-card">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Filtros
              </button>
              <p className="text-xs text-text-muted">
                {products.length} prenda{products.length !== 1 ? 's' : ''}
              </p>
            </div>
            <SortDropdown />
          </div>

          <div className="mx-4 lg:mx-6 h-px bg-border-subtle" />

          {/* Grid */}
          {products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <p className="text-4xl">🪣</p>
              <p className="text-text-muted text-sm">No hay prendas con esos filtros</p>
              <button
                onClick={() => useShopStore.getState().resetFilters()}
                className="text-brand text-sm font-semibold hover:underline">
                Limpiar filtros
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4
              gap-3 p-4 lg:p-6 pb-24 lg:pb-10">
              {products.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>

      <FilterBottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </div>
  )
}

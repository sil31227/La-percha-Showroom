"use client"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { ShoppingBag, Home, User, Heart, Search, ChevronDown, Plus } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useShopStore } from "@/store/useShopStore"
import { useAuthStore } from "@/store/useAuthStore"
import { useNotificationsStore } from "@/store/useNotificationsStore"

const NAV_CATS = [
  { value: 'mujer', label: 'Mujer' },
  { value: 'hombre', label: 'Hombre' },
  { value: 'kids', label: 'Kids' },
  { value: 'promos', label: 'Promos' },
]

const MUJER_SUBS = [
  { value: 'ropa', label: 'Ropa' },
  { value: 'calzado', label: 'Calzado' },
  { value: 'accesorios', label: 'Accesorios' },
  { value: 'belleza', label: 'Belleza' },
  { value: '', label: 'Ver todo' },
]

const HOMBRE_SUBS = [
  { value: 'ropa', label: 'Ropa' },
  { value: 'calzado', label: 'Calzado' },
  { value: 'accesorios', label: 'Accesorios' },
  { value: '', label: 'Ver todo' },
]

const KIDS_SUBS = [
  { value: 'bebes', label: 'Bebés' },
  { value: 'ninas', label: 'Niñas' },
  { value: 'ninos', label: 'Niños' },
  { value: '', label: 'Ver todo' },
]

const TIENDA_SUBS = [
  { value: 'regaleria', label: 'Regalería' },
  { value: 'bazar', label: 'Bazar' },
  { value: 'decoracion', label: 'Decoración' },
]

const SUBS_MAP: Record<string, { value: string; label: string }[]> = {
  mujer: MUJER_SUBS,
  hombre: HOMBRE_SUBS,
  kids: KIDS_SUBS,
  tienda_percha: TIENDA_SUBS,
}

export default function ClienteNavbar() {
  const [hidratado, setHidratado] = useState(false)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const navRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()
  const router = useRouter()
  const cartCount = useShopStore(s => s.cartCount())
  const { filters, setFilter, resetFilters } = useShopStore()
  const user = useAuthStore(s => s.user)
  const isHome = pathname === '/' || pathname === '/home'
  const isCart = pathname === '/carrito'
  const isFav = pathname === '/favoritos'
  const isVender = pathname === '/vender'
  const isPerfil = pathname === '/perfil'
  const favCount = useShopStore(s => s.favorites.length)
  const unread = useNotificationsStore(s => s.unreadCount())

  useEffect(() => { setHidratado(true) }, [])

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenDropdown(null)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  function goCategory(value: string) {
    setFilter('category', value)
    setFilter('subcategory', '')
    setOpenDropdown(null)
    if (!isHome) router.push('/home')
  }

  function goSubCategory(cat: string, sub: string) {
    setFilter('category', cat)
    setFilter('subcategory', sub)
    setOpenDropdown(null)
    if (!isHome) router.push('/home')
  }

  const isTienda = ['tienda_percha', 'regaleria', 'bazar', 'decoracion'].includes(filters.category)

  function toggleDropdown(value: string) {
    setOpenDropdown(o => o === value ? null : value)
  }

  return (
    <>
      {/* ── Desktop nav — two rows ── */}
      <nav className="hidden lg:block fixed top-0 left-0 right-0 z-50
        bg-bg-page border-b border-border-subtle">

        {/* Row 1 — logo + search + CTAs + cart */}
        <div className="h-16 flex items-center gap-4 px-8">
          <Link href="/home"
            onClick={() => { resetFilters(); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
            className="font-display text-xl text-text-strong shrink-0 flex items-center gap-2">
            <img src="/logo.jpg" alt="" className="w-7 h-7 rounded-lg object-cover" />
            La Percha
          </Link>

          <div className="flex-1 max-w-md relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4
              text-text-muted pointer-events-none" />
            <input
              type="search"
              value={filters.search}
              onChange={e => setFilter('search', e.target.value)}
              placeholder="Buscar marca o prenda..."
              className="w-full h-9 pl-9 pr-3 rounded-lg bg-surface-sunken text-sm
                text-text-body placeholder:text-text-muted
                border border-transparent focus:border-brand focus:outline-none transition-colors" />
          </div>

          <div className="flex items-center gap-3 ml-auto shrink-0">
            <Link href="/vender"
              className="px-4 py-1.5 rounded-full text-sm font-semibold
                bg-brand text-text-on-brand hover:bg-brand-hover transition-colors">
              Vender
            </Link>
            {user ? (
              <Link href="/perfil"
                className="relative flex items-center gap-2 px-2 py-1 rounded-full hover:bg-surface-sunken transition-colors">
                <img src={user.avatar} alt={user.name}
                  className="w-7 h-7 rounded-full object-cover ring-2 ring-matcha-100" />
                {hidratado && unread > 0 && (
                  <span className="absolute -top-0.5 left-6 w-3 h-3 rounded-full bg-error-500 ring-2 ring-bg-page" />
                )}
                <span className="text-sm font-semibold text-text-body hidden xl:inline">{user.name}</span>
              </Link>
            ) : (
              <Link href="/ingresar"
                className="px-4 py-1.5 rounded-full text-sm font-semibold
                  border border-border-default text-text-body
                  hover:border-brand hover:text-brand transition-colors">
                Ingresar
              </Link>
            )}
            <Link href="/favoritos"
              className="relative flex items-center justify-center
                w-9 h-9 rounded-full hover:bg-surface-sunken transition-colors"
              aria-label="Favoritos">
              <Heart className="w-4.5 h-4.5 text-text-muted" />
              {hidratado && favCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4.5 h-4.5 rounded-full
                  bg-surface-inverse flex items-center justify-center
                  text-[9px] font-bold text-text-on-dark">
                  {favCount}
                </span>
              )}
            </Link>
            <Link href="/carrito" className="relative">
              <div className="w-9 h-9 rounded-full bg-brand flex items-center justify-center">
                <ShoppingBag className="w-4 h-4 text-text-on-brand" />
              </div>
              {hidratado && cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4.5 h-4.5 rounded-full
                  bg-surface-inverse flex items-center justify-center
                  text-[9px] font-bold text-text-on-dark">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Row 2 — categories (solo en inicio) */}
        {isHome && (
        <div className="h-10 flex items-center gap-7 px-8 border-t border-border-subtle" ref={navRef}>
          {NAV_CATS.map(cat => {
            const subs = SUBS_MAP[cat.value]
            const isActive = filters.category === cat.value
            const isOpen = openDropdown === cat.value

            if (subs) {
              return (
                <div key={cat.value} className="relative">
                  <button
                    onClick={() => {
                      if (!isActive) goCategory(cat.value)
                      toggleDropdown(cat.value)
                    }}
                    className={`flex items-center gap-1 text-sm font-semibold transition-colors
                      ${isActive
                        ? 'text-text-strong underline underline-offset-4 decoration-brand decoration-2'
                        : 'text-text-muted hover:text-text-strong'}`}>
                    {cat.label}
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-150
                      ${isOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isOpen && (
                    <div className="absolute top-full left-0 mt-1.5 w-40
                      bg-bg-page border border-border-subtle rounded-xl shadow-lg
                      flex flex-col py-1 z-50">
                      {subs.map(sub => (
                        <button key={sub.value || `${cat.value}_all`}
                          onClick={() => goSubCategory(cat.value, sub.value)}
                          className={`px-4 py-2 text-sm text-left transition-colors
                            ${!sub.value && !filters.subcategory
                              ? 'font-semibold text-text-strong bg-surface-sunken'
                              : filters.subcategory === sub.value
                                ? 'font-semibold text-text-strong bg-surface-sunken'
                                : 'text-text-body hover:bg-surface-sunken'}`}>
                          {sub.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            }

            return (
              <button key={cat.value}
                onClick={() => goCategory(cat.value)}
                className={`text-sm font-semibold transition-colors
                  ${isActive
                    ? 'text-text-strong underline underline-offset-4 decoration-brand decoration-2'
                    : 'text-text-muted hover:text-text-strong'}`}>
                {cat.label}
              </button>
            )
          })}

          {/* Tienda Percha + dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                if (!isTienda) goCategory('tienda_percha')
                toggleDropdown('tienda_percha')
              }}
              className={`flex items-center gap-1 text-sm font-semibold transition-colors
                ${isTienda
                  ? 'text-text-strong underline underline-offset-4 decoration-brand decoration-2'
                  : 'text-text-muted hover:text-text-strong'}`}>
              Tienda Percha
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-150
                ${openDropdown === 'tienda_percha' ? 'rotate-180' : ''}`} />
            </button>

            {openDropdown === 'tienda_percha' && (
              <div className="absolute top-full left-0 mt-1.5 w-44
                bg-bg-page border border-border-subtle rounded-xl shadow-lg
                flex flex-col py-1 z-50">
                {TIENDA_SUBS.map(sub => (
                  <button key={sub.value}
                    onClick={() => goCategory(sub.value)}
                    className={`px-4 py-2 text-sm text-left transition-colors
                      ${filters.category === sub.value
                        ? 'font-semibold text-text-strong bg-surface-sunken'
                        : 'text-text-body hover:bg-surface-sunken'}`}>
                    {sub.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        )}
      </nav>

      {/* ── Mobile bottom nav — 5 tabs ── */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 mx-auto
        w-full max-w-107.5 h-20 bg-bg-page border-t border-border-subtle
        flex items-center justify-between px-4 z-50">

        <Link href="/home"
          className="flex flex-col items-center gap-0.5 w-14 h-14 justify-center">
          <Home className={`w-5.5 h-5.5 ${isHome ? 'text-text-strong' : 'text-text-muted'}`} />
          <span className={`text-[10px] ${isHome ? 'text-text-strong font-semibold' : 'text-text-muted'}`}>
            Inicio
          </span>
        </Link>

        <Link href="/favoritos"
          className="flex flex-col items-center gap-0.5 w-14 h-14 justify-center relative">
          <Heart className={`w-5.5 h-5.5 ${isFav ? 'fill-error-500 text-error-500' : 'text-text-muted'}`} />
          {hidratado && favCount > 0 && (
            <span className="absolute -top-0.5 right-0 w-4 h-4 rounded-full
              bg-surface-inverse flex items-center justify-center
              text-[8px] font-bold text-text-on-dark">
              {favCount}
            </span>
          )}
          <span className={`text-[10px] ${isFav ? 'text-text-strong font-semibold' : 'text-text-muted'}`}>
            Favoritos
          </span>
        </Link>

        <Link href="/vender"
          className="flex flex-col items-center gap-0.5 -mt-5">
          <div className="w-13 h-13 rounded-full bg-brand flex items-center justify-center
            shadow-lg shadow-brand/30 ring-4 ring-bg-page">
            <Plus className="w-6 h-6 text-white" />
          </div>
          <span className={`text-[10px] mt-0.5 ${isVender ? 'text-text-strong font-semibold' : 'text-text-muted'}`}>
            Vender
          </span>
        </Link>

        <Link href="/carrito"
          className="flex flex-col items-center gap-0.5 w-14 h-14 justify-center relative">
          <ShoppingBag className={`w-5.5 h-5.5 ${isCart ? 'text-text-strong' : 'text-text-muted'}`} />
          {hidratado && cartCount > 0 && (
            <span className="absolute -top-0.5 right-0 w-4 h-4 rounded-full
              bg-surface-inverse flex items-center justify-center
              text-[8px] font-bold text-text-on-dark">
              {cartCount}
            </span>
          )}
          <span className={`text-[10px] ${isCart ? 'text-text-strong font-semibold' : 'text-text-muted'}`}>
            Carrito
          </span>
        </Link>

        <Link href="/perfil"
          className="relative flex flex-col items-center gap-0.5 w-14 h-14 justify-center">
          <User className={`w-5.5 h-5.5 ${isPerfil ? 'text-text-strong' : 'text-text-muted'}`} />
          {hidratado && unread > 0 && (
            <span className="absolute top-1.5 right-3 w-2.5 h-2.5 rounded-full bg-error-500" />
          )}
          <span className={`text-[10px] ${isPerfil ? 'text-text-strong font-semibold' : 'text-text-muted'}`}>
            Perfil
          </span>
        </Link>
      </nav>
    </>
  )
}

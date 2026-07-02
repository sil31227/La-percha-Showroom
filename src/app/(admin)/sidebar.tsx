"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { LayoutDashboard, ShieldCheck, Users, Store, Package, Tags, HelpCircle, UserPlus, Menu, X, LogOut } from "lucide-react"
import { useAdminStore } from "@/store/useAdminStore"

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/moderacion", label: "Moderación", icon: ShieldCheck },
  { href: "/admin/vendedores", label: "Vendedores", icon: Users },
  { href: "/admin/registros", label: "Registros", icon: UserPlus },
  { href: "/admin/tienda", label: "Tienda", icon: Store },
  { href: "/admin/pedidos", label: "Pedidos", icon: Package },
  { href: "/admin/categorias", label: "Categorías", icon: Tags },
  { href: "/admin/faq", label: "FAQ / Términos", icon: HelpCircle },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const { loadFromSupabase, products, vendors } = useAdminStore()
  const pendingProducts = products.filter(p => p.status === "pending").length
  const pendingVendors = vendors.filter(v => v.status === "pending").length

  useEffect(() => { loadFromSupabase() }, [])

  function badge(href: string) {
    if (href === "/admin/moderacion" && pendingProducts > 0) return pendingProducts
    if (href === "/admin/vendedores" && pendingVendors > 0) return pendingVendors
    return 0
  }

  return (
    <>
      <div className="lg:hidden fixed top-0 inset-x-0 h-14 bg-surface-card border-b border-border-subtle flex items-center gap-3 px-4 z-50">
        <Link href="/admin" className="w-7 h-7 rounded-lg overflow-hidden shrink-0">
          <img src="/logo.jpg" alt="" className="w-full h-full object-cover" />
        </Link>
        <Link href="/admin" className="font-display text-base text-text-strong">Panel Admin</Link>
        <button onClick={() => setOpen(true)} className="w-8 h-8 rounded-full bg-surface-sunken flex items-center justify-center ml-auto">
          <Menu className="w-4 h-4 text-text-muted" />
        </button>
      </div>

      {open && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-carob-900/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-surface-card border-r border-border-subtle p-5 animate-slide-in">
            <div className="flex items-center justify-between mb-8">
              <span className="font-display text-lg text-text-strong">Panel Admin</span>
              <button onClick={() => setOpen(false)} className="w-8 h-8 rounded-full bg-surface-sunken flex items-center justify-center">
                <X className="w-4 h-4 text-text-muted" />
              </button>
            </div>
            <nav className="space-y-1">
              {NAV.map(item => {
                const active = pathname === item.href
                return (
                  <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${active ? 'bg-matcha-50 text-matcha-700' : 'text-text-body hover:bg-surface-sunken'}`}>
                    <item.icon className={`w-4 h-4 ${active ? 'text-matcha-600' : 'text-text-muted'}`} />
                    {item.label}
                    {badge(item.href) > 0 && <span className="ml-auto px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-error-500 text-white">{badge(item.href)}</span>}
                  </Link>
                )
              })}
            </nav>
            <div className="absolute bottom-5 left-5 right-5">
              <Link href="/" className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs text-text-muted hover:bg-surface-sunken transition-colors">
                <LogOut className="w-3.5 h-3.5" />
                Salir del admin
              </Link>
            </div>
          </div>
        </div>
      )}

      <aside className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 w-56 bg-surface-card border-r border-border-subtle p-5">
        <Link href="/admin" className="flex items-center gap-2 mb-8">
          <img src="/logo.jpg" alt="" className="w-7 h-7 rounded-lg object-cover" />
          <span className="font-display text-lg text-text-strong">Panel Admin</span>
        </Link>
        <nav className="flex-1 space-y-1">
          {NAV.map(item => {
            const active = pathname === item.href
            return (
              <Link key={item.href} href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${active ? 'bg-matcha-50 text-matcha-700' : 'text-text-body hover:bg-surface-sunken'}`}>
                <item.icon className={`w-4 h-4 ${active ? 'text-matcha-600' : 'text-text-muted'}`} />
                {item.label}
                {badge(item.href) > 0 && <span className="ml-auto px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-error-500 text-white">{badge(item.href)}</span>}
              </Link>
            )
          })}
        </nav>
        <Link href="/" className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs text-text-muted hover:bg-surface-sunken transition-colors">
          <LogOut className="w-3.5 h-3.5" />
          Salir del admin
        </Link>
      </aside>
    </>
  )
}

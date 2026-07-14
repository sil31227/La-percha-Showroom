"use client"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Bell, User, Package, Heart, LogOut, ChevronRight, ShoppingBag, Archive, Banknote, Wallet, HelpCircle, Settings, Truck } from "lucide-react"
import { useEffect, useState } from "react"
import { useAuthStore } from "@/store/useAuthStore"
import { useNotificationsStore } from "@/store/useNotificationsStore"

export default function PerfilPage() {
  const router = useRouter()
  const { user, logout } = useAuthStore()
  const unread = useNotificationsStore(s => s.unreadCount())
  const [hidratado, setHidratado] = useState(false)
  useEffect(() => { setHidratado(true) }, [])

  if (user) {
    return (
      <div className="flex flex-col min-h-screen">
        <header className="h-16 flex items-center gap-3 px-5 bg-bg-page border-b border-border-subtle sticky top-0 z-10 lg:top-16">
          <Link href="/home" className="w-9 h-9 rounded-full bg-surface-sunken flex items-center justify-center shrink-0">
            <ArrowLeft className="w-4 h-4 text-text-muted" />
          </Link>
          <h1 className="font-display text-xl text-text-strong">Perfil</h1>
        </header>

        <div className="flex flex-col items-center pt-10 pb-6 gap-3">
          <img src={user.avatar} alt={user.name}
            className="w-20 h-20 rounded-full object-cover ring-4 ring-matcha-100" />
          <div className="text-center">
            <p className="font-semibold text-text-strong text-lg">{user.name}</p>
            <p className="text-xs text-text-muted">{user.email}</p>
          </div>
        </div>

        <div className="px-4 lg:px-6 space-y-1 pb-24 lg:pb-10 max-w-lg mx-auto w-full">
          <Link href="/perfil/compras"
            className="flex items-center justify-between px-4 py-3.5 rounded-lg hover:bg-surface-sunken transition-colors">
            <div className="flex items-center gap-3">
              <Package className="w-5 h-5 text-text-muted" />
              <span className="text-sm text-text-body">Mis compras</span>
            </div>
            <ChevronRight className="w-4 h-4 text-text-subtle" />
          </Link>

          <Link href="/perfil/notificaciones"
            className="flex items-center justify-between px-4 py-3.5 rounded-lg hover:bg-surface-sunken transition-colors">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-text-muted" />
              <span className="text-sm text-text-body">Notificaciones</span>
            </div>
            {hidratado && unread > 0 ? (
              <span className="min-w-5 h-5 px-1.5 rounded-full bg-brand text-white text-[10px] font-bold flex items-center justify-center">
                {unread}
              </span>
            ) : (
              <ChevronRight className="w-4 h-4 text-text-subtle" />
            )}
          </Link>

          <Link href="/perfil/editar"
            className="flex items-center justify-between px-4 py-3.5 rounded-lg hover:bg-surface-sunken transition-colors">
            <div className="flex items-center gap-3">
              <Settings className="w-5 h-5 text-text-muted" />
              <span className="text-sm text-text-body">Editar perfil</span>
            </div>
            <ChevronRight className="w-4 h-4 text-text-subtle" />
          </Link>

          {user.is_seller && (
            <>
              <Link href="/perfil/saldo"
                className="flex items-center justify-between px-4 py-3.5 rounded-lg hover:bg-surface-sunken transition-colors">
                <div className="flex items-center gap-3">
                  <Wallet className="w-5 h-5 text-text-muted" />
                  <span className="text-sm text-text-body">Saldo</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-text-strong">
                    $ {user.balance.toLocaleString('es-AR')}
                  </span>
                  <ChevronRight className="w-4 h-4 text-text-subtle" />
                </div>
              </Link>
              <Link href="/perfil/ventas"
                className="flex items-center justify-between px-4 py-3.5 rounded-lg hover:bg-surface-sunken transition-colors">
                <div className="flex items-center gap-3">
                  <Truck className="w-5 h-5 text-text-muted" />
                  <span className="text-sm text-text-body">Mis ventas</span>
                </div>
                <ChevronRight className="w-4 h-4 text-text-subtle" />
              </Link>
              <Link href="/perfil/publicaciones"
                className="flex items-center justify-between px-4 py-3.5 rounded-lg hover:bg-surface-sunken transition-colors">
                <div className="flex items-center gap-3">
                  <Archive className="w-5 h-5 text-text-muted" />
                  <span className="text-sm text-text-body">Mis publicaciones</span>
                </div>
                <ChevronRight className="w-4 h-4 text-text-subtle" />
              </Link>
              <Link href="/perfil/datos-vendedora"
                className="flex items-center justify-between px-4 py-3.5 rounded-lg hover:bg-surface-sunken transition-colors">
                <div className="flex items-center gap-3">
                  <Banknote className="w-5 h-5 text-text-muted" />
                  <span className="text-sm text-text-body">Datos de vendedora</span>
                </div>
                <ChevronRight className="w-4 h-4 text-text-subtle" />
              </Link>
            </>
          )}

          <Link href="/favoritos"
            className="flex items-center justify-between px-4 py-3.5 rounded-lg hover:bg-surface-sunken transition-colors">
            <div className="flex items-center gap-3">
              <Heart className="w-5 h-5 text-text-muted" />
              <span className="text-sm text-text-body">Favoritos</span>
            </div>
            <ChevronRight className="w-4 h-4 text-text-subtle" />
          </Link>

          <Link href="/vender"
            className="flex items-center justify-between px-4 py-3.5 rounded-lg hover:bg-surface-sunken transition-colors">
            <div className="flex items-center gap-3">
              <ShoppingBag className="w-5 h-5 text-text-muted" />
              <span className="text-sm text-text-body">Vender</span>
            </div>
            <ChevronRight className="w-4 h-4 text-text-subtle" />
          </Link>

          <Link href="/ayuda"
            className="flex items-center justify-between px-4 py-3.5 rounded-lg hover:bg-surface-sunken transition-colors">
            <div className="flex items-center gap-3">
              <HelpCircle className="w-5 h-5 text-text-muted" />
              <span className="text-sm text-text-body">Preguntas frecuentes</span>
            </div>
            <ChevronRight className="w-4 h-4 text-text-subtle" />
          </Link>

          <div className="pt-4">
            <button onClick={() => { logout(); router.push("/home") }}
              className="flex items-center gap-3 px-4 py-3.5 rounded-lg hover:bg-surface-sunken transition-colors w-full text-left">
              <LogOut className="w-5 h-5 text-text-muted" />
              <span className="text-sm text-text-muted">Cerrar sesión</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="h-16 flex items-center gap-3 px-5 bg-bg-page border-b border-border-subtle sticky top-0 z-10 lg:top-16">
        <Link href="/home" className="w-9 h-9 rounded-full bg-surface-sunken flex items-center justify-center shrink-0">
          <ArrowLeft className="w-4 h-4 text-text-muted" />
        </Link>
        <h1 className="font-display text-xl text-text-strong">Perfil</h1>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center gap-4 px-5 text-center">
        <div className="w-20 h-20 rounded-full bg-matcha-100 flex items-center justify-center">
          <User className="w-10 h-10 text-matcha-500" />
        </div>
        <p className="font-semibold text-text-strong">Invitada</p>
        <p className="text-xs text-text-muted max-w-xs">
          Ingresá para ver tus compras, favoritos y publicar tus prendas.
        </p>
        <Link href="/ingresar"
          className="mt-2 px-8 py-3 rounded-full bg-brand text-text-on-brand font-semibold text-sm hover:bg-brand-hover transition-colors">
          Ingresar o crear cuenta
        </Link>
      </div>
    </div>
  )
}

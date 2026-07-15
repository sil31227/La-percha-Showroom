"use client"
import { useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, CheckCircle, XCircle, Bell, Loader2, Edit3, Truck, PackageCheck, ShoppingBag } from "lucide-react"
import { useAuthStore } from "@/store/useAuthStore"
import { useNotificationsStore } from "@/store/useNotificationsStore"
import type { NotificationType } from "@/lib/types"

const ICONS: Record<NotificationType, { icon: typeof CheckCircle; className: string }> = {
  product_approved: { icon: CheckCircle, className: "bg-success-50 text-success-600" },
  seller_approved: { icon: CheckCircle, className: "bg-success-50 text-success-600" },
  product_rejected: { icon: XCircle, className: "bg-error-50 text-error-500" },
  seller_rejected: { icon: XCircle, className: "bg-error-50 text-error-500" },
  product_changes_requested: { icon: Edit3, className: "bg-warning-50 text-warning-600" },
  order_shipped: { icon: Truck, className: "bg-info-50 text-info-600" },
  order_delivered: { icon: PackageCheck, className: "bg-success-50 text-success-600" },
  product_sold: { icon: ShoppingBag, className: "bg-info-50 text-info-600" },
}

export default function NotificacionesPage() {
  const userId = useAuthStore(s => s.user?.id)
  const { items, loaded, load, markAllRead } = useNotificationsStore()

  useEffect(() => {
    if (!userId) return
    load(userId).then(() => markAllRead(userId))
  }, [userId, load, markAllRead])

  return (
    <div className="flex flex-col min-h-screen">
      <header className="h-16 flex items-center gap-3 px-5 bg-bg-page border-b border-border-subtle sticky top-0 z-10 lg:top-16">
        <Link href="/perfil" className="w-9 h-9 rounded-full bg-surface-sunken flex items-center justify-center shrink-0">
          <ArrowLeft className="w-4 h-4 text-text-muted" />
        </Link>
        <h1 className="font-display text-xl text-text-strong">Notificaciones</h1>
      </header>

      <div className="flex-1 px-4 lg:px-6 py-4 space-y-3 pb-24 lg:pb-10 max-w-lg mx-auto w-full">
        {!loaded ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-brand animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Bell className="w-10 h-10 text-text-subtle" />
            <p className="text-text-muted text-sm">No tenés notificaciones todavía</p>
          </div>
        ) : (
          items.map(n => {
            const cfg = ICONS[n.type]
            const Icon = cfg.icon
            const card = (
              <div className="bg-surface-card rounded-xl border border-border-subtle p-4 flex items-start gap-3">
                <span className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${cfg.className}`}>
                  <Icon className="w-4.5 h-4.5" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-strong">{n.title}</p>
                  {n.body && <p className="text-xs text-text-muted mt-0.5 leading-relaxed">{n.body}</p>}
                  {n.created_at && (
                    <p className="text-[10px] text-text-subtle mt-1.5">
                      {new Date(n.created_at).toLocaleDateString("es-AR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  )}
                </div>
              </div>
            )
            return n.link
              ? <Link key={n.id} href={n.link} className="block">{card}</Link>
              : <div key={n.id}>{card}</div>
          })
        )}
      </div>
    </div>
  )
}

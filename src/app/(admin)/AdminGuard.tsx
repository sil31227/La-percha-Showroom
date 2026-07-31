"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { LogOut } from "lucide-react"

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [allowed, setAllowed] = useState(false)
  const [checking, setChecking] = useState(true)
  const [unauthorized, setUnauthorized] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function check() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.access_token) {
          if (!cancelled) router.replace("/ingresar?redirect=/admin")
          return
        }
        const res = await fetch("/api/admin/check", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        })
        if (cancelled) return
        if (res.ok) {
          setAllowed(true)
        } else if (res.status === 403) {
          setUnauthorized(true)
        } else {
          router.replace("/ingresar?redirect=/admin")
        }
      } catch {
        if (!cancelled) router.replace("/ingresar")
      } finally {
        if (!cancelled) setChecking(false)
      }
    }
    check()
    return () => { cancelled = true }
  }, [router])

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg-page">
        <div className="w-8 h-8 border-2 border-matcha-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (unauthorized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg-page px-5">
        <div className="bg-surface-card rounded-2xl border border-border-subtle p-8 max-w-sm w-full text-center shadow-sm">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-error-50 flex items-center justify-center">
            <LogOut className="w-6 h-6 text-error-500" />
          </div>
          <h1 className="font-display text-xl text-text-strong mb-2">Acceso denegado</h1>
          <p className="text-sm text-text-muted mb-6">
            No tenes permisos de administrador. Cerrá sesión y volvé a ingresar con la cuenta de admin.
          </p>
          <Link
            href="/ingresar"
            className="inline-flex items-center gap-2 h-11 px-6 bg-brand hover:bg-brand-hover text-text-on-brand font-semibold rounded-lg transition-colors"
          >
            Ir al login
          </Link>
        </div>
      </div>
    )
  }

  if (!allowed) return null

  return <>{children}</>
}

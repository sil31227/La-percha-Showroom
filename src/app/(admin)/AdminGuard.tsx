"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [allowed, setAllowed] = useState(false)
  const [checking, setChecking] = useState(true)

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

  if (!allowed) return null

  return <>{children}</>
}

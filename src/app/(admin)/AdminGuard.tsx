"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Eye, EyeOff } from "lucide-react"

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const [allowed, setAllowed] = useState(false)
  const [checking, setChecking] = useState(true)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function check() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.access_token) {
          if (!cancelled) setChecking(false)
          return
        }
        const res = await fetch("/api/admin/check", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        })
        if (cancelled) return
        if (res.ok) setAllowed(true)
      } catch {}
      if (!cancelled) setChecking(false)
    }
    check()
    return () => { cancelled = true }
  }, [])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password })
    if (loginError) {
      setError(loginError.message.includes("Invalid login")
        ? "Email o contraseña incorrectos"
        : loginError.message)
      setLoading(false)
      return
    }
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) {
      setError("No se pudo iniciar sesión")
      setLoading(false)
      return
    }
    const res = await fetch("/api/admin/check", {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
    if (res.ok) {
      setAllowed(true)
    } else if (res.status === 403) {
      setError("Esta cuenta no tiene permisos de administrador")
      await supabase.auth.signOut()
    } else {
      setError("Error al verificar permisos")
    }
    setLoading(false)
  }

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg-page">
        <div className="w-8 h-8 border-2 border-matcha-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (allowed) return <>{children}</>

  return (
    <div className="flex items-center justify-center min-h-screen bg-bg-page px-5">
      <div className="bg-surface-card rounded-2xl border border-border-subtle p-8 max-w-sm w-full shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <img src="/logo.jpg" alt="" className="w-10 h-10 rounded-lg object-cover" />
          <div>
            <h1 className="font-display text-lg text-text-strong leading-tight">Panel Admin</h1>
            <p className="text-xs text-text-muted">La Percha Showroom</p>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wide mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@email.com"
              required
              className="w-full h-11 px-4 rounded-lg bg-surface-sunken text-sm text-text-body placeholder:text-text-muted border border-transparent focus:border-brand focus:outline-none transition-colors" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wide mb-1.5">Contraseña</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••"
                required
                className="w-full h-11 px-4 pr-10 rounded-lg bg-surface-sunken text-sm text-text-body placeholder:text-text-muted border border-transparent focus:border-brand focus:outline-none transition-colors" />
              <button type="button"
                onClick={() => setShowPassword(o => !o)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-body">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && <p className="text-xs text-error-500 bg-error-50 px-3 py-2 rounded-lg">{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full h-11 bg-brand hover:bg-brand-hover text-text-on-brand font-semibold rounded-lg transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
            {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>
      </div>
    </div>
  )
}

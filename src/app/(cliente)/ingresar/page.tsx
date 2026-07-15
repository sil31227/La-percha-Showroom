"use client"
import { Suspense, useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Eye, EyeOff } from "lucide-react"
import { useAuthStore } from "@/store/useAuthStore"

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get("redirect") || "/home"
  const { login, resendVerification, isLoading, user, initialized } = useAuthStore()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [needsConfirmation, setNeedsConfirmation] = useState(false)
  const [resending, setResending] = useState(false)
  const [resent, setResent] = useState(false)

  useEffect(() => {
    if (initialized && user) {
      router.replace(redirectTo)
    }
  }, [user, initialized, redirectTo, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setNeedsConfirmation(false)
    setResent(false)
    const result = await login(email, password)
    if (result.ok) {
      router.push(redirectTo)
    } else {
      setNeedsConfirmation(!!result.needsConfirmation)
      setError(result.error ?? "Error al ingresar")
    }
  }

  async function handleResend() {
    setResending(true)
    const result = await resendVerification(email)
    setResending(false)
    if (result.ok) {
      setResent(true)
      setError("")
    } else {
      setError(result.error ?? "No se pudo reenviar el email")
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="h-16 flex items-center gap-3 px-5 bg-bg-page border-b border-border-subtle sticky top-0 z-10 lg:top-16">
        <Link href="/home" className="w-9 h-9 rounded-full bg-surface-sunken flex items-center justify-center shrink-0">
          <ArrowLeft className="w-4 h-4 text-text-muted" />
        </Link>
        <h1 className="font-display text-xl text-text-strong">Ingresar</h1>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-5 py-10 max-w-md mx-auto w-full">
        <div className="w-full bg-surface-card rounded-2xl border border-border-subtle p-6 lg:p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-text-muted uppercase tracking-wide mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
                className="w-full h-11 px-4 rounded-lg bg-surface-sunken text-sm text-text-body
                  placeholder:text-text-muted border border-transparent
                  focus:border-brand focus:outline-none transition-colors" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-muted uppercase tracking-wide mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••"
                  required
                  className="w-full h-11 px-4 pr-10 rounded-lg bg-surface-sunken text-sm text-text-body
                    placeholder:text-text-muted border border-transparent
                    focus:border-brand focus:outline-none transition-colors" />
                <button type="button"
                  onClick={() => setShowPassword(o => !o)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-body">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-xs text-error-500 bg-error-50 px-3 py-2 rounded-lg">{error}</p>
            )}

            {resent && (
              <p className="text-xs text-success-500 bg-success-50 px-3 py-2 rounded-lg">
                Te reenviamos el email de verificación a {email}. Revisá tu casilla (y spam).
              </p>
            )}

            {needsConfirmation && !resent && (
              <button type="button" onClick={handleResend} disabled={resending}
                className="w-full h-11 border border-brand text-brand hover:bg-brand/5
                  font-semibold rounded-lg transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                {resending ? (
                  <span className="w-4.5 h-4.5 border-2 border-brand/30 border-t-brand rounded-full animate-spin" />
                ) : null}
                {resending ? "Reenviando..." : "Reenviar email de verificación"}
              </button>
            )}

            <button type="submit" disabled={isLoading}
              className="w-full h-11 bg-brand hover:bg-brand-hover text-text-on-brand
                font-semibold rounded-lg transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
              {isLoading ? (
                <span className="w-4.5 h-4.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : null}
              {isLoading ? "Ingresando..." : "Ingresar"}
            </button>
          </form>

          <p className="text-center text-xs text-text-muted mt-5">
            ¿No tenés cuenta?{" "}
            <Link href="/ingresar/registrarse" className="text-brand font-semibold hover:underline">
              Registrate
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function IngresarPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}

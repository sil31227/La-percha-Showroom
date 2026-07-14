"use client"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Eye, EyeOff, MailCheck } from "lucide-react"
import { useAuthStore } from "@/store/useAuthStore"

export default function RegistrarsePage() {
  const router = useRouter()
  const { register, resendVerification, isLoading } = useAuthStore()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [sent, setSent] = useState(false)
  const [alreadyExists, setAlreadyExists] = useState(false)
  const [resending, setResending] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setAlreadyExists(false)
    const result = await register(name, email, password)
    if (result.ok) {
      if (result.needsConfirmation) {
        setSent(true)
      } else {
        router.push("/home")
      }
    } else if (result.alreadyExists) {
      setAlreadyExists(true)
      setError(result.error ?? "Ya existe una cuenta con ese email")
    } else {
      setError(result.error ?? "Error al registrarse")
    }
  }

  async function handleResend() {
    setResending(true)
    setError("")
    const result = await resendVerification(email, name)
    setResending(false)
    if (result.ok) {
      setSent(true)
    } else {
      setError(result.error ?? "No se pudo reenviar el email")
    }
  }

  if (sent) {
    return (
      <div className="flex flex-col min-h-screen">
        <header className="h-16 flex items-center gap-3 px-5 bg-bg-page border-b border-border-subtle sticky top-0 z-10 lg:top-16">
          <Link href="/ingresar" className="w-9 h-9 rounded-full bg-surface-sunken flex items-center justify-center shrink-0">
            <ArrowLeft className="w-4 h-4 text-text-muted" />
          </Link>
          <h1 className="font-display text-xl text-text-strong">Confirmá tu email</h1>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center px-5 py-10 max-w-md mx-auto w-full text-center">
          <div className="w-16 h-16 rounded-full bg-success-50 flex items-center justify-center mb-5">
            <MailCheck className="w-8 h-8 text-success-500" />
          </div>
          <h2 className="font-display text-2xl text-text-strong mb-2">¡Casi listo!</h2>
          <p className="text-sm text-text-muted leading-relaxed mb-6">
            Te enviamos un email a <strong className="text-text-body">{email}</strong> con un link para
            confirmar tu cuenta. Revisá tu casilla (y la carpeta de spam) y después ingresá.
          </p>
          <Link href="/ingresar"
            className="w-full max-w-xs h-11 bg-brand hover:bg-brand-hover text-text-on-brand
              font-semibold rounded-lg transition-colors flex items-center justify-center">
            Ir a ingresar
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="h-16 flex items-center gap-3 px-5 bg-bg-page border-b border-border-subtle sticky top-0 z-10 lg:top-16">
        <Link href="/ingresar" className="w-9 h-9 rounded-full bg-surface-sunken flex items-center justify-center shrink-0">
          <ArrowLeft className="w-4 h-4 text-text-muted" />
        </Link>
        <h1 className="font-display text-xl text-text-strong">Crear cuenta</h1>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-5 py-10 max-w-md mx-auto w-full">
        <div className="w-full bg-surface-card rounded-2xl border border-border-subtle p-6 lg:p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-text-muted uppercase tracking-wide mb-1.5">
                Nombre
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="María García"
                required
                className="w-full h-11 px-4 rounded-lg bg-surface-sunken text-sm text-text-body
                  placeholder:text-text-muted border border-transparent
                  focus:border-brand focus:outline-none transition-colors" />
            </div>

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
                  placeholder="Mínimo 6 caracteres"
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

            {alreadyExists && (
              <div className="flex flex-col gap-2">
                <button type="button" onClick={handleResend} disabled={resending}
                  className="w-full h-11 border border-brand text-brand hover:bg-brand/5
                    font-semibold rounded-lg transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                  {resending ? (
                    <span className="w-4.5 h-4.5 border-2 border-brand/30 border-t-brand rounded-full animate-spin" />
                  ) : null}
                  {resending ? "Reenviando..." : "Reenviar email de verificación"}
                </button>
                <Link href="/ingresar"
                  className="text-center text-xs text-text-muted hover:text-text-body">
                  ¿Ya confirmaste tu cuenta? <span className="text-brand font-semibold">Ingresá</span>
                </Link>
              </div>
            )}

            <button type="submit" disabled={isLoading}
              className="w-full h-11 bg-brand hover:bg-brand-hover text-text-on-brand
                font-semibold rounded-lg transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
              {isLoading ? (
                <span className="w-4.5 h-4.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : null}
              {isLoading ? "Creando cuenta..." : "Crear cuenta"}
            </button>
          </form>

          <p className="text-center text-xs text-text-muted mt-5">
            ¿Ya tenés cuenta?{" "}
            <Link href="/ingresar" className="text-brand font-semibold hover:underline">
              Ingresá
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

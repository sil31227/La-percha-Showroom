"use client"
import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, MailCheck } from "lucide-react"
import { useAuthStore } from "@/store/useAuthStore"

export default function OlvideContrasenaPage() {
  const { forgotPassword } = useAuthStore()
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    const result = await forgotPassword(email)
    setLoading(false)
    if (result.ok) {
      setSent(true)
    } else {
      setError(result.error ?? "Error al enviar el email")
    }
  }

  if (sent) {
    return (
      <div className="flex flex-col min-h-screen">
        <header className="h-16 flex items-center gap-3 px-5 bg-bg-page border-b border-border-subtle sticky top-0 z-10 lg:top-16">
          <Link href="/ingresar" className="w-9 h-9 rounded-full bg-surface-sunken flex items-center justify-center shrink-0">
            <ArrowLeft className="w-4 h-4 text-text-muted" />
          </Link>
          <h1 className="font-display text-xl text-text-strong">Recuperar contraseña</h1>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center px-5 py-10 max-w-md mx-auto w-full text-center">
          <div className="w-16 h-16 rounded-full bg-success-50 flex items-center justify-center mb-5">
            <MailCheck className="w-8 h-8 text-success-500" />
          </div>
          <h2 className="font-display text-2xl text-text-strong mb-2">¡Email enviado!</h2>
          <p className="text-sm text-text-muted leading-relaxed mb-6">
            Si existe una cuenta con <strong className="text-text-body">{email}</strong>, te
            enviamos un link para restablecer tu contraseña. Revisá tu casilla (y spam).
          </p>
          <Link href="/ingresar"
            className="w-full max-w-xs h-11 bg-brand hover:bg-brand-hover text-text-on-brand
              font-semibold rounded-lg transition-colors flex items-center justify-center">
            Volver a ingresar
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
        <h1 className="font-display text-xl text-text-strong">Recuperar contraseña</h1>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-5 py-10 max-w-md mx-auto w-full">
        <div className="w-full bg-surface-card rounded-2xl border border-border-subtle p-6 lg:p-8 shadow-sm">
          <p className="text-sm text-text-muted leading-relaxed mb-6">
            Ingresá tu email y te enviaremos un link para restablecer tu contraseña.
          </p>
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

            {error && (
              <p className="text-xs text-error-500 bg-error-50 px-3 py-2 rounded-lg">{error}</p>
            )}

            <button type="submit" disabled={loading}
              className="w-full h-11 bg-brand hover:bg-brand-hover text-text-on-brand
                font-semibold rounded-lg transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
              {loading ? (
                <span className="w-4.5 h-4.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : null}
              {loading ? "Enviando..." : "Enviar link de recuperación"}
            </button>
          </form>

          <p className="text-center text-xs text-text-muted mt-5">
            <Link href="/ingresar" className="text-text-muted hover:text-brand transition-colors">
              Volver a ingresar
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

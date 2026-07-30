"use client"
import { Suspense, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Eye, EyeOff, CheckCircle2 } from "lucide-react"
import { useAuthStore } from "@/store/useAuthStore"

function ResetForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const { resetPassword } = useAuthStore()

  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  if (!token) {
    return (
      <div className="flex flex-col min-h-screen">
        <header className="h-16 flex items-center gap-3 px-5 bg-bg-page border-b border-border-subtle sticky top-0 z-10 lg:top-16">
          <Link href="/ingresar" className="w-9 h-9 rounded-full bg-surface-sunken flex items-center justify-center shrink-0">
            <ArrowLeft className="w-4 h-4 text-text-muted" />
          </Link>
          <h1 className="font-display text-xl text-text-strong">Restablecer contraseña</h1>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center px-5 py-10 max-w-md mx-auto w-full text-center">
          <p className="text-sm text-text-muted mb-4">Link inválido o expirado.</p>
          <Link href="/ingresar/olvide-contrasena"
            className="w-full max-w-xs h-11 bg-brand hover:bg-brand-hover text-text-on-brand
              font-semibold rounded-lg transition-colors flex items-center justify-center">
            Solicitar uno nuevo
          </Link>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="flex flex-col min-h-screen">
        <header className="h-16 flex items-center gap-3 px-5 bg-bg-page border-b border-border-subtle sticky top-0 z-10 lg:top-16">
          <Link href="/ingresar" className="w-9 h-9 rounded-full bg-surface-sunken flex items-center justify-center shrink-0">
            <ArrowLeft className="w-4 h-4 text-text-muted" />
          </Link>
          <h1 className="font-display text-xl text-text-strong">Restablecer contraseña</h1>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center px-5 py-10 max-w-md mx-auto w-full text-center">
          <div className="w-16 h-16 rounded-full bg-success-50 flex items-center justify-center mb-5">
            <CheckCircle2 className="w-8 h-8 text-success-500" />
          </div>
          <h2 className="font-display text-2xl text-text-strong mb-2">¡Contraseña actualizada!</h2>
          <p className="text-sm text-text-muted leading-relaxed mb-6">
            Tu contraseña fue cambiada con éxito. Ya podés iniciar sesión.
          </p>
          <Link href="/ingresar"
            className="w-full max-w-xs h-11 bg-brand hover:bg-brand-hover text-text-on-brand
              font-semibold rounded-lg transition-colors flex items-center justify-center">
            Iniciar sesión
          </Link>
        </div>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    const result = await resetPassword(token!, newPassword, confirmPassword)
    setLoading(false)
    if (result.ok) {
      setSuccess(true)
    } else {
      setError(result.error ?? "Error al restablecer la contraseña")
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="h-16 flex items-center gap-3 px-5 bg-bg-page border-b border-border-subtle sticky top-0 z-10 lg:top-16">
        <Link href="/ingresar" className="w-9 h-9 rounded-full bg-surface-sunken flex items-center justify-center shrink-0">
          <ArrowLeft className="w-4 h-4 text-text-muted" />
        </Link>
        <h1 className="font-display text-xl text-text-strong">Nueva contraseña</h1>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-5 py-10 max-w-md mx-auto w-full">
        <div className="w-full bg-surface-card rounded-2xl border border-border-subtle p-6 lg:p-8 shadow-sm">
          <p className="text-sm text-text-muted leading-relaxed mb-6">
            Elegí una nueva contraseña para tu cuenta.
          </p>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-text-muted uppercase tracking-wide mb-1.5">
                Nueva contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
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

            <div>
              <label className="block text-xs font-semibold text-text-muted uppercase tracking-wide mb-1.5">
                Confirmar contraseña
              </label>
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Repetí tu contraseña"
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
              {loading ? "Guardando..." : "Guardar nueva contraseña"}
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

export default function ReestablecerContrasenaPage() {
  return (
    <Suspense>
      <ResetForm />
    </Suspense>
  )
}

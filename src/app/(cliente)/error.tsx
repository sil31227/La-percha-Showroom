"use client"
import Link from "next/link"
import { AlertTriangle } from "lucide-react"

export default function ClienteError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center gap-4">
      <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center">
        <AlertTriangle className="w-7 h-7 text-amber-700" />
      </div>
      <h2 className="text-lg font-semibold text-text-strong">Algo salió mal</h2>
      <p className="text-sm text-text-muted max-w-sm">
        No se pudo cargar esta página. Podés intentar de nuevo o volver al inicio.
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="px-5 py-2.5 rounded-lg bg-brand text-text-on-brand text-sm font-semibold
            hover:bg-brand-hover transition-colors"
        >
          Reintentar
        </button>
        <Link
          href="/home"
          className="px-5 py-2.5 rounded-lg border border-border-default text-text-body text-sm font-semibold
            hover:border-brand hover:text-brand transition-colors"
        >
          Ir al inicio
        </Link>
      </div>
    </div>
  )
}

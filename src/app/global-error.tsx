"use client"
import { AlertTriangle } from "lucide-react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-bg-page font-ui">
        <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center gap-4">
          <div className="w-14 h-14 rounded-full bg-error-100 flex items-center justify-center">
            <AlertTriangle className="w-7 h-7 text-error-600" />
          </div>
          <h1 className="text-xl font-display font-semibold text-text-strong">
            Error inesperado
          </h1>
          <p className="text-sm text-text-muted max-w-sm">
            Ocurrió un error al cargar la aplicación. Por favor, intentá de nuevo.
          </p>
          <button
            onClick={reset}
            className="px-6 py-3 rounded-lg bg-brand text-text-on-brand text-sm font-semibold
              hover:bg-brand-hover transition-colors"
          >
            Reintentar
          </button>
        </div>
      </body>
    </html>
  )
}

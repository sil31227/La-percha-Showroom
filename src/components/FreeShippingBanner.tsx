"use client"
import { useEffect, useState } from "react"

export function FreeShippingBanner() {
  const [threshold, setThreshold] = useState<number | null>(null)

  useEffect(() => {
    fetch("/api/configuracion-envio")
      .then(r => r.json())
      .then(d => { if (!d.error) setThreshold(d.free_threshold) })
      .catch(() => {})
  }, [])

  if (!threshold) return null

  return (
    <div className="sticky top-0 z-30 bg-matcha-50 border-b border-matcha-200 text-center py-2 px-4">
      <p className="text-xs font-semibold text-matcha-800">
        Envío gratis a partir de $ {threshold.toLocaleString("es-AR")}
      </p>
    </div>
  )
}

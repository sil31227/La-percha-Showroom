"use client"
import { useEffect } from "react"
import { Check } from "lucide-react"

interface ToastProps {
  message: string
  onClose: () => void
  duration?: number
}

export function Toast({ message, onClose, duration = 2000 }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onClose, duration)
    return () => clearTimeout(t)
  }, [onClose, duration])

  return (
    <div className="fixed bottom-24 lg:bottom-6 left-1/2 -translate-x-1/2 z-50
      flex items-center gap-2 px-4 py-2.5 rounded-full
      bg-surface-inverse text-text-on-dark text-sm font-semibold
      shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-200"
      data-testid="toast">
      <Check className="w-4 h-4 text-success-500 shrink-0" />
      {message}
    </div>
  )
}

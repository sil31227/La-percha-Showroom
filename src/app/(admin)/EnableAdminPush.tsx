"use client"
import { useState } from "react"
import { Bell, BellOff, BellRing, Loader2 } from "lucide-react"

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) outputArray[i] = rawData.charCodeAt(i)
  return outputArray
}

type PushState = "loading" | "unsupported" | "default" | "granted" | "denied" | "subscribing"

export function EnableAdminPush() {
  const [state, setState] = useState<PushState>(() => {
    if (typeof window === "undefined") return "loading"
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
      return "unsupported"
    }
    return Notification.permission as PushState
  })

  async function enable() {
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    if (!vapidKey) {
      alert("Falta configurar NEXT_PUBLIC_VAPID_PUBLIC_KEY.")
      return
    }
    setState("subscribing")
    try {
      const reg = await navigator.serviceWorker.register("/sw.js")
      const permission = await Notification.requestPermission()
      if (permission !== "granted") {
        setState(permission as PushState)
        return
      }

      const existing = await reg.pushManager.getSubscription()
      const sub =
        existing ||
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey) as Uint8Array<ArrayBuffer>,
        }))

      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      })
      if (!res.ok) throw new Error("No se pudo guardar la suscripción")

      setState("granted")
    } catch (err) {
      console.error("[EnableAdminPush]", err)
      alert("No se pudieron activar las notificaciones. Reintentá.")
      setState(Notification.permission as PushState)
    }
  }

  if (state === "loading" || state === "unsupported") return null

  if (state === "granted") {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-matcha-700 bg-matcha-50">
        <BellRing className="w-3.5 h-3.5 text-matcha-600" />
        Notificaciones activadas
      </div>
    )
  }

  if (state === "denied") {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-text-muted bg-surface-sunken">
        <BellOff className="w-3.5 h-3.5" />
        Notificaciones bloqueadas. Activalas en los ajustes del navegador.
      </div>
    )
  }

  return (
    <button
      onClick={enable}
      disabled={state === "subscribing"}
      className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-white bg-brand hover:opacity-90 transition-opacity disabled:opacity-60"
    >
      {state === "subscribing" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Bell className="w-3.5 h-3.5" />}
      Activar notificaciones
    </button>
  )
}

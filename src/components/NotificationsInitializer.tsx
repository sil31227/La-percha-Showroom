"use client"
import { useEffect } from "react"
import { useAuthStore } from "@/store/useAuthStore"
import { useNotificationsStore } from "@/store/useNotificationsStore"

export function NotificationsInitializer() {
  const userId = useAuthStore(s => s.user?.id)
  const load = useNotificationsStore(s => s.load)
  const clear = useNotificationsStore(s => s.clear)

  useEffect(() => {
    if (!userId) { clear(); return }
    load(userId)
    const interval = setInterval(() => load(userId), 20000)
    return () => clearInterval(interval)
  }, [userId, load, clear])

  return null
}

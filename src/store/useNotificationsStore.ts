import { create } from "zustand"
import { supabase } from "@/lib/supabase"
import type { Notification } from "@/lib/types"

interface NotificationsState {
  items: Notification[]
  loaded: boolean
  unreadCount: () => number
  load: (userId: string) => Promise<void>
  markAllRead: (userId: string) => Promise<void>
  clear: () => void
}

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  items: [],
  loaded: false,

  unreadCount: () => get().items.filter(n => !n.read).length,

  load: async (userId) => {
    if (!userId) return
    const { data, error } = await supabase
      .from("notifications")
      .select("id, user_id, type, title, body, link, read, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
    if (!error) set({ items: (data || []) as Notification[], loaded: true })
    else set({ loaded: true })
  },

  markAllRead: async (userId) => {
    if (!userId) return
    const hasUnread = get().items.some(n => !n.read)
    if (!hasUnread) return
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", userId)
      .eq("read", false)
    if (!error) await get().load(userId)
  },

  clear: () => set({ items: [], loaded: false }),
}))

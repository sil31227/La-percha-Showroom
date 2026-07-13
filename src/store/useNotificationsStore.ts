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
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
    set({ items: (data || []) as Notification[], loaded: true })
  },

  markAllRead: async (userId) => {
    if (!userId) return
    const hasUnread = get().items.some(n => !n.read)
    set(s => ({ items: s.items.map(n => ({ ...n, read: true })) }))
    if (hasUnread) {
      await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", userId)
        .eq("read", false)
    }
  },

  clear: () => set({ items: [], loaded: false }),
}))

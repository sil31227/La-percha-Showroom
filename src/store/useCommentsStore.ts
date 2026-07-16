import { create } from "zustand"
import { supabase } from "@/lib/supabase"

export interface Comentario {
  id: string
  producto_id: string
  user_id: string
  texto: string
  deleted: boolean
  created_at: string
  user_name: string
  user_avatar: string | null
}

interface CommentsState {
  items: Record<string, Comentario[]>
  loading: boolean
  fetchComentarios: (productoId: string) => Promise<void>
  addComentario: (productoId: string, texto: string, token: string) => Promise<boolean>
}

export const useCommentsStore = create<CommentsState>((set, get) => ({
  items: {},
  loading: false,

  fetchComentarios: async (productoId) => {
    set({ loading: true })
    const res = await fetch(`/api/productos/${productoId}/comentarios`)
    if (res.ok) {
      const data = await res.json()
      set(s => ({ items: { ...s.items, [productoId]: data.comentarios || [] }, loading: false }))
    } else {
      set({ loading: false })
    }
  },

  addComentario: async (productoId, texto, token) => {
    const res = await fetch(`/api/productos/${productoId}/comentarios`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ texto }),
    })
    if (!res.ok) return false
    const data = await res.json()

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("id", data.comentario.user_id)
      .single()

    const enriched: Comentario = {
      ...data.comentario,
      user_name: profile?.full_name || "Usuario",
      user_avatar: profile?.avatar_url || null,
    }

    set(s => ({
      items: {
        ...s.items,
        [productoId]: [...(s.items[productoId] || []), enriched],
      },
    }))
    return true
  },
}))

import { create } from "zustand"
import { useAuthStore } from "@/store/useAuthStore"

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
  loading: Record<string, boolean>
  fetchComentarios: (productoId: string) => Promise<void>
  addComentario: (productoId: string, texto: string, token: string) => Promise<boolean>
}

export const useCommentsStore = create<CommentsState>((set) => ({
  items: {},
  loading: {},

  fetchComentarios: async (productoId) => {
    set(s => ({ loading: { ...s.loading, [productoId]: true } }))
    try {
      const res = await fetch(`/api/productos/${productoId}/comentarios`)
      if (res.ok) {
        const data = await res.json()
        set(s => ({
          items: { ...s.items, [productoId]: data.comentarios || [] },
          loading: { ...s.loading, [productoId]: false },
        }))
      } else {
        set(s => ({ loading: { ...s.loading, [productoId]: false } }))
      }
    } catch {
      set(s => ({ loading: { ...s.loading, [productoId]: false } }))
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
    const authUser = useAuthStore.getState().user
    const fromApi = data.comentario as Partial<Comentario> & {
      id: string
      producto_id: string
      user_id: string
      texto: string
      deleted: boolean
      created_at: string
    }

    const enriched: Comentario = {
      ...fromApi,
      user_name:
        fromApi.user_name ||
        (authUser && authUser.id === fromApi.user_id ? authUser.name : undefined) ||
        "Usuario",
      user_avatar:
        fromApi.user_avatar ??
        (authUser && authUser.id === fromApi.user_id ? authUser.avatar : null) ??
        null,
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

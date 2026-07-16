import { create } from "zustand"
import { supabase } from "@/lib/supabase"

export interface Mensaje {
  id: string
  conversacion_id: string
  sender_id: string
  texto: string
  created_at: string
}

export interface Conversacion {
  id: string
  pedido_id: string
  comprador_id: string
  vendedor_id: string
  created_at: string
}

interface ChatState {
  conversaciones: Record<string, Conversacion>
  mensajes: Record<string, Mensaje[]>
  pollingIntervals: Record<string, ReturnType<typeof setInterval>>

  fetchConversacion: (pedidoId: string, token: string) => Promise<Conversacion | null>
  fetchMensajes: (conversacionId: string, token: string) => Promise<void>
  sendMensaje: (conversacionId: string, texto: string, token: string) => Promise<boolean>
  startPolling: (conversacionId: string, token: string) => void
  stopPolling: (conversacionId: string) => void
  clear: () => void
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversaciones: {},
  mensajes: {},
  pollingIntervals: {},

  fetchConversacion: async (pedidoId, token) => {
    const res = await fetch(`/api/conversaciones?pedido_id=${encodeURIComponent(pedidoId)}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) return null
    const data = await res.json()
    const conv: Conversacion = data.conversacion
    set(s => ({ conversaciones: { ...s.conversaciones, [pedidoId]: conv } }))
    return conv
  },

  fetchMensajes: async (conversacionId, token) => {
    const res = await fetch(`/api/conversaciones/${conversacionId}/mensajes`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) return
    const data = await res.json()
    set(s => ({ mensajes: { ...s.mensajes, [conversacionId]: data.mensajes } }))
  },

  sendMensaje: async (conversacionId, texto, token) => {
    const res = await fetch(`/api/conversaciones/${conversacionId}/mensajes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ texto }),
    })
    if (!res.ok) return false
    const data = await res.json()
    set(s => ({
      mensajes: {
        ...s.mensajes,
        [conversacionId]: [...(s.mensajes[conversacionId] || []), data.mensaje],
      },
    }))
    return true
  },

  startPolling: (conversacionId, token) => {
    const existing = get().pollingIntervals[conversacionId]
    if (existing) return
    const interval = setInterval(() => {
      get().fetchMensajes(conversacionId, token)
    }, 20000)
    set(s => ({
      pollingIntervals: { ...s.pollingIntervals, [conversacionId]: interval },
    }))
  },

  stopPolling: (conversacionId) => {
    const interval = get().pollingIntervals[conversacionId]
    if (interval) {
      clearInterval(interval)
      const next = { ...get().pollingIntervals }
      delete next[conversacionId]
      set({ pollingIntervals: next })
    }
  },

  clear: () => {
    Object.values(get().pollingIntervals).forEach(clearInterval)
    set({ conversaciones: {}, mensajes: {}, pollingIntervals: {} })
  },
}))

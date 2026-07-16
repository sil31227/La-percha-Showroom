"use client"
import { useEffect, useRef, useState } from "react"
import { Send, Loader2, MessageCircle } from "lucide-react"
import { useChatStore, type Mensaje } from "@/store/useChatStore"
import { useAuthStore } from "@/store/useAuthStore"

export function ChatWindow({ pedidoId }: { pedidoId: string }) {
  const user = useAuthStore(s => s.user)
  const session = useAuthStore(s => s.session)
  const token = session?.access_token || ""

  const conversacion = useChatStore(s => s.conversaciones[pedidoId])
  const mensajes = useChatStore(s => (conversacion ? s.mensajes[conversacion.id] : []) || [])
  const fetchConversacion = useChatStore(s => s.fetchConversacion)
  const fetchMensajes = useChatStore(s => s.fetchMensajes)
  const sendMensaje = useChatStore(s => s.sendMensaje)
  const startPolling = useChatStore(s => s.startPolling)
  const stopPolling = useChatStore(s => s.stopPolling)

  const [texto, setTexto] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [shown, setShown] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const convIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (!token) return
    let cancelled = false
    setLoading(true)
    try {
      fetchConversacion(pedidoId, token).then(conv => {
        if (cancelled) return
        if (conv) {
          fetchMensajes(conv.id, token).then(() => {
            if (!cancelled) {
              convIdRef.current = conv.id
              startPolling(conv.id, token)
              setLoading(false)
            }
          }).catch(() => {
            if (!cancelled) setLoading(false)
          })
        } else {
          setLoading(false)
        }
      }).catch(() => {
        if (!cancelled) setLoading(false)
      })
    } catch {
      if (!cancelled) setLoading(false)
    }
    return () => {
      cancelled = true
      if (convIdRef.current !== null) stopPolling(convIdRef.current)
    }
  }, [pedidoId, token])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [mensajes])

  async function handleSend() {
    if (!texto.trim() || !conversacion || !token) return
    setSending(true)
    const ok = await sendMensaje(conversacion.id, texto.trim(), token)
    setSending(false)
    if (ok) setTexto("")
  }

  if (!shown) {
    return (
      <button
        onClick={() => setShown(true)}
        className="mt-2 w-full h-9 bg-surface-sunken hover:bg-surface-inverse/10 text-text-body font-semibold rounded-full text-xs
          transition-colors flex items-center justify-center gap-2"
      >
        <MessageCircle className="w-3.5 h-3.5" />
        {user?.id === conversacion?.vendedor_id
          ? "Chat con la compradora"
          : user?.id === conversacion?.comprador_id
            ? "Chat con la vendedora"
            : "Chat de envío"}
      </button>
    )
  }

  return (
    <div className="mt-2 border border-border-subtle rounded-xl overflow-hidden bg-surface-card">
      <div className="flex items-center justify-between px-3 py-2.5 bg-surface-sunken border-b border-border-subtle">
        <span className="text-xs font-semibold text-text-strong">Chat de envío</span>
        <button
          onClick={() => { setShown(false); if (conversacion) stopPolling(conversacion.id) }}
          className="text-xs text-text-muted hover:text-text-strong"
        >
          Ocultar
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-5 h-5 text-brand animate-spin" />
        </div>
      ) : conversacion ? (
        <>
          <div className="h-48 overflow-y-auto px-3 py-2 space-y-2">
            {mensajes.length === 0 && (
              <p className="text-xs text-text-muted text-center py-6">No hay mensajes aún. Escribí para coordinar el envío.</p>
            )}
            {mensajes.map(m => (
              <MessageBubble key={m.id} mensaje={m} isMine={m.sender_id === user?.id} />
            ))}
            <div ref={bottomRef} />
          </div>

          <div className="flex items-center gap-2 px-3 py-2.5 border-t border-border-subtle bg-surface-sunken">
            <input
              type="text"
              value={texto}
              onChange={e => setTexto(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleSend() } }}
              placeholder="Escribí un mensaje..."
              className="flex-1 h-9 px-3 rounded-full bg-surface-card text-xs text-text-body
                border border-border-default focus:border-brand focus:outline-none transition-colors"
            />
            <button
              onClick={handleSend}
              disabled={!texto.trim() || sending}
              className="w-9 h-9 rounded-full bg-brand hover:bg-brand-hover text-white flex items-center justify-center
                transition-colors disabled:opacity-40 shrink-0"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center py-10">
          <p className="text-xs text-text-muted">No se pudo cargar la conversación</p>
        </div>
      )}
    </div>
  )
}

function MessageBubble({ mensaje, isMine }: { mensaje: Mensaje; isMine: boolean }) {
  return (
    <div className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[80%] px-3 py-1.5 rounded-2xl text-xs ${
        isMine
          ? "bg-brand text-white rounded-br-sm"
          : "bg-surface-sunken text-text-body rounded-bl-sm"
      }`}>
        <p className="leading-relaxed">{mensaje.texto}</p>
        <p className={`text-[9px] mt-0.5 ${isMine ? "text-white/60" : "text-text-muted"}`}>
          {new Date(mensaje.created_at).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </div>
  )
}

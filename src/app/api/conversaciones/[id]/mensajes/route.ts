import { NextRequest, NextResponse } from "next/server"
import { bearerToken, getUserFromToken } from "@/lib/auth-server"
import { createAdminClient } from "@/lib/supabase-admin"
import { sendPushToUser } from "@/lib/push"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: conversacionId } = await params
  const user = await getUserFromToken(bearerToken(req))
  if (!user?.id) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  }

  let body: { texto?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Body JSON inválido" }, { status: 400 })
  }

  if (!body.texto?.trim()) {
    return NextResponse.json({ error: "El mensaje no puede estar vacío" }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { data: conv, error: convErr } = await supabase
    .from("conversaciones")
    .select("id, comprador_id, vendedor_id, pedido_id")
    .eq("id", conversacionId)
    .single()

  if (convErr || !conv) {
    return NextResponse.json({ error: "Conversación no encontrada" }, { status: 404 })
  }

  if (user.id !== conv.comprador_id && user.id !== conv.vendedor_id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  const mensajeId = crypto.randomUUID()
  const { error: insertErr } = await supabase
    .from("mensajes")
    .insert({
      id: mensajeId,
      conversacion_id: conversacionId,
      sender_id: user.id,
      texto: body.texto.trim(),
    })

  if (insertErr) {
    return NextResponse.json({ error: "Error al enviar mensaje" }, { status: 500 })
  }

  // Notify the other participant
  const otherUserId = user.id === conv.comprador_id ? conv.vendedor_id : conv.comprador_id
  const audience = user.id === conv.comprador_id ? "seller" : "buyer"

  const pushPayload = {
    title: "Nuevo mensaje",
    body: `Tenés un nuevo mensaje sobre tu pedido`,
    url: `/perfil/${audience === "buyer" ? "compras" : "ventas"}?pedido=${conv.pedido_id}`,
    tag: `chat-${conversacionId}`,
  }

  // In-app notification
  const notifId = crypto.randomUUID()
  await supabase.from("notifications").insert({
    id: notifId,
    user_id: otherUserId,
    type: "new_message",
    title: pushPayload.title,
    body: pushPayload.body,
    link: pushPayload.url,
  })

  // Push notification
  await sendPushToUser(otherUserId, audience, pushPayload)

  return NextResponse.json({
    ok: true,
    mensaje: { id: mensajeId, conversacion_id: conversacionId, sender_id: user.id, texto: body.texto.trim(), created_at: new Date().toISOString() },
  })
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: conversacionId } = await params
  const user = await getUserFromToken(bearerToken(req))
  if (!user?.id) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  }

  const supabase = createAdminClient()

  const { data: conv, error: convErr } = await supabase
    .from("conversaciones")
    .select("comprador_id, vendedor_id")
    .eq("id", conversacionId)
    .single()

  if (convErr || !conv) {
    return NextResponse.json({ error: "Conversación no encontrada" }, { status: 404 })
  }

  if (user.id !== conv.comprador_id && user.id !== conv.vendedor_id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  const { data: mensajes, error } = await supabase
    .from("mensajes")
    .select("*")
    .eq("conversacion_id", conversacionId)
    .order("created_at", { ascending: true })

  if (error) {
    return NextResponse.json({ error: "Error al cargar mensajes" }, { status: 500 })
  }

  return NextResponse.json({ mensajes: mensajes || [] })
}

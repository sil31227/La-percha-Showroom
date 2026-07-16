import { NextRequest, NextResponse } from "next/server"
import { bearerToken, getUserFromToken } from "@/lib/auth-server"
import { createAdminClient } from "@/lib/supabase-admin"

export async function POST(req: NextRequest) {
  const user = await getUserFromToken(bearerToken(req))
  if (!user?.id) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  }

  let body: { pedido_id?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Body JSON inválido" }, { status: 400 })
  }

  if (!body.pedido_id) {
    return NextResponse.json({ error: "Falta pedido_id" }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { data: pedido, error: pedidoErr } = await supabase
    .from("pedidos")
    .select("id, comprador_email, vendedor_id")
    .eq("id", body.pedido_id)
    .single()

  if (pedidoErr || !pedido) {
    return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 })
  }

  const existing = await supabase
    .from("conversaciones")
    .select("id")
    .eq("pedido_id", body.pedido_id)
    .maybeSingle()

  if (existing.data) {
    return NextResponse.json({ ok: true, conversacion: existing.data })
  }

  const conversacionId = crypto.randomUUID()

  const { error: insertErr } = await supabase
    .from("conversaciones")
    .insert({
      id: conversacionId,
      pedido_id: body.pedido_id,
      comprador_id: user.id,
      vendedor_id: pedido.vendedor_id,
    })

  if (insertErr) {
    return NextResponse.json({ error: "Error al crear conversación" }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    conversacion: { id: conversacionId, pedido_id: body.pedido_id },
  })
}

export async function GET(req: NextRequest) {
  const user = await getUserFromToken(bearerToken(req))
  if (!user?.id) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  }

  const pedidoId = req.nextUrl.searchParams.get("pedido_id")
  if (!pedidoId) {
    return NextResponse.json({ error: "Falta pedido_id" }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("conversaciones")
    .select("*")
    .eq("pedido_id", pedidoId)
    .maybeSingle()

  if (error || !data) {
    return NextResponse.json({ error: "Conversación no encontrada" }, { status: 404 })
  }

  if (data.comprador_id !== user.id && data.vendedor_id !== user.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  return NextResponse.json({ conversacion: data })
}

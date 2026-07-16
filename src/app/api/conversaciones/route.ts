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

  const { data: existing, error: existingErr } = await supabase
    .from("conversaciones")
    .select("*")
    .eq("pedido_id", pedidoId)
    .maybeSingle()

  if (existing && !existingErr) {
    if (existing.comprador_id !== user.id && existing.vendedor_id !== user.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }
    return NextResponse.json({ conversacion: existing })
  }

  const { data: pedido, error: pedidoErr } = await supabase
    .from("pedidos")
    .select("id, comprador_email, vendedor_id")
    .eq("id", pedidoId)
    .single()

  if (pedidoErr || !pedido) {
    return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 })
  }

  const isSeller = pedido.vendedor_id === user.id
  let compradorId = ""
  let vendedorId = ""

  if (isSeller) {
    vendedorId = user.id
    const { data: users } = await supabase.auth.admin.listUsers()
    const buyerUser = (users?.users || []).find(u => u.email === pedido.comprador_email)
    compradorId = buyerUser?.id || ""
  } else {
    compradorId = user.id
    vendedorId = pedido.vendedor_id || ""
  }

  if (!compradorId || !vendedorId) {
    return NextResponse.json({ error: "No se pudo identificar a los participantes" }, { status: 400 })
  }

  const conversacionId = crypto.randomUUID()
  const { error: insertErr } = await supabase
    .from("conversaciones")
    .insert({
      id: conversacionId,
      pedido_id: pedidoId,
      comprador_id: compradorId,
      vendedor_id: vendedorId,
    })

  if (insertErr) {
    return NextResponse.json({ error: "Error al crear conversación" }, { status: 500 })
  }

  return NextResponse.json({
    conversacion: {
      id: conversacionId,
      pedido_id: pedidoId,
      comprador_id: compradorId,
      vendedor_id: vendedorId,
    },
  })
}

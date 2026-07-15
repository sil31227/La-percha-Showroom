import { createAdminClient } from "@/lib/supabase-admin"
import { bearerToken, getUserFromToken } from "@/lib/auth-server"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const user = await getUserFromToken(bearerToken(req))
  if (!user?.email) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  }

  const { pedidoId } = await req.json().catch(() => ({ pedidoId: "" }))
  if (!pedidoId) {
    return NextResponse.json({ error: "Falta pedidoId" }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { data: pedido, error: pedidoError } = await supabase
    .from("pedidos")
    .select("id, comprador_email, status")
    .eq("id", pedidoId)
    .single()

  if (pedidoError) {
    console.error("[confirmar-entrega] Error consultando pedido:", JSON.stringify(pedidoError))
  }

  if (!pedido) {
    console.error("[confirmar-entrega] Pedido no encontrado para ID:", pedidoId, "email:", user.email, "error:", JSON.stringify(pedidoError))
    return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 })
  }
  if (pedido.comprador_email !== user.email) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }
  if (pedido.status !== "shipped") {
    return NextResponse.json({ error: "El pedido no está en camino" }, { status: 409 })
  }

  const { error } = await supabase.rpc("confirmar_entrega", { p_pedido_id: pedidoId })
  if (error) {
    return NextResponse.json({ error: "No se pudo confirmar la entrega" }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}

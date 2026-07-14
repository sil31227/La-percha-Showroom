import { createAdminClient } from "@/lib/supabase-admin"
import { bearerToken, getUserFromToken } from "@/lib/auth-server"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const user = await getUserFromToken(bearerToken(req))
  if (!user?.id) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  }

  const { pedidoId, seguimiento } = await req.json().catch(() => ({ pedidoId: "", seguimiento: "" }))
  if (!pedidoId) {
    return NextResponse.json({ error: "Falta pedidoId" }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { data: pedido } = await supabase
    .from("pedidos")
    .select("id, vendedor_id, vendedor_tipo, status, comprador_email, producto_titulo, metodo_envio")
    .eq("id", pedidoId)
    .single()

  if (!pedido) {
    return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 })
  }
  if (pedido.vendedor_id !== user.id) {
    return NextResponse.json({ error: "No sos la vendedora de este pedido" }, { status: 403 })
  }
  if (pedido.vendedor_tipo !== "feria") {
    return NextResponse.json({ error: "Solo se pueden despachar pedidos de Feria" }, { status: 400 })
  }
  if (pedido.status !== "pending_shipment") {
    return NextResponse.json({ error: "El pedido no está pendiente de envío" }, { status: 409 })
  }

  const { error } = await supabase
    .from("pedidos")
    .update({ status: "shipped", seguimiento: seguimiento || null })
    .eq("id", pedidoId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (pedido.comprador_email) {
    fetch(`${req.headers.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/email/pedido-enviado`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: pedido.comprador_email,
        orderId: pedido.id,
        producto_titulo: pedido.producto_titulo,
        metodo_envio: pedido.metodo_envio,
        seguimiento: seguimiento || "",
      }),
    }).catch(() => {})
  }

  return NextResponse.json({ ok: true })
}

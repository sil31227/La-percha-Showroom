import { createAdminClient } from "@/lib/supabase-admin"
import { bearerToken, getUserFromToken } from "@/lib/auth-server"
import { sendBuyerPush } from "@/lib/push"
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

  const { data: pedido, error: pedidoError } = await supabase
    .from("pedidos")
    .select("id, vendedor_id, producto_id, vendedor_tipo, status, comprador_email, producto_titulo, metodo_envio")
    .eq("id", pedidoId)
    .single()

  if (!pedido) {
    console.error("[despachar] Pedido no encontrado para ID:", pedidoId, "error:", JSON.stringify(pedidoError?.message || pedidoError))
    return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 })
  }
  if (pedido.vendedor_id !== user.id) {
    return NextResponse.json({ error: "No sos la vendedora de este pedido" }, { status: 403 })
  }

  let vendedorTipo: string | null = pedido.vendedor_tipo ?? null

  if (!vendedorTipo && pedido.producto_id) {
    const { data: prod } = await supabase
      .from("productos")
      .select("vendedor_tipo")
      .eq("id", pedido.producto_id)
      .single()

    vendedorTipo = prod?.vendedor_tipo ?? null

    if (vendedorTipo) {
      console.warn("[despachar] Auto-corrigiendo vendedor_tipo NULL →", vendedorTipo, "en pedido", pedidoId)
      supabase
        .from("pedidos")
        .update({ vendedor_tipo: vendedorTipo })
        .eq("id", pedidoId)
        .then(({ error }) => {
          if (error) console.error("[despachar] Error al auto-corregir:", error)
        })
    } else {
      console.warn("[despachar] Producto sin vendedor_tipo para pedido", pedidoId, "producto_id:", pedido.producto_id)
    }
  }

  if (!vendedorTipo) {
    return NextResponse.json({ error: "No se pudo determinar el tipo de vendedor del pedido" }, { status: 422 })
  }

  if (vendedorTipo !== "feria") {
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

  let buyerUserId: string | null = null

  if (pedido.comprador_email) {
    const { data: buyerIdData, error: rpcError } = await supabase
      .rpc("get_user_id_by_email", { p_email: pedido.comprador_email })

    if (rpcError) {
      console.error("[despachar] Error buscando comprador:", rpcError)
    }
    buyerUserId = (buyerIdData as string) || null
  }

  if (pedido.comprador_email) {
    const esCorreo = pedido.metodo_envio === "correo_sucursal" || pedido.metodo_envio === "correo_domicilio"

    const baseUrl = req.headers.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || "https://laperchashowroom.com.ar"

    fetch(`${baseUrl}/api/email/pedido-enviado`, {
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

    if (buyerUserId) {
      const body = esCorreo && seguimiento
        ? `Pedido #${pedido.id.slice(-8)} — ${pedido.producto_titulo}. Seguimiento: ${seguimiento}`
        : `Pedido #${pedido.id.slice(-8)} — ${pedido.producto_titulo}.`

      try {
        await supabase.from("notifications").insert({
          id: `order-shipped-${pedidoId}-${Date.now()}`,
          user_id: buyerUserId,
          type: "order_shipped",
          title: "Tu pedido está en camino",
          body,
          link: "/perfil/compras",
        })
      } catch (e) {
        console.error("[despachar] Error creando notificación:", e)
      }

      sendBuyerPush(buyerUserId, {
        title: "Tu pedido está en camino",
        body: body,
        url: "/perfil/compras",
        tag: `pedido-enviado-${pedidoId}`,
      }).catch(() => {})
    }
  }

  return NextResponse.json({ ok: true })
}

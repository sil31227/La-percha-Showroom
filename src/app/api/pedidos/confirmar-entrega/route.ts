import { createAdminClient } from "@/lib/supabase-admin"
import { bearerToken, getUserFromToken } from "@/lib/auth-server"
import { sendAdminPush, sendSellerPush } from "@/lib/push"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
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
      .select("id, comprador_email, comprador_nombre, status, producto_titulo, vendedor_id, vendedor_nombre, vendedor_email, vendedor_tipo, producto_id")
      .eq("id", pedidoId)
      .single()

    if (pedidoError) {
      console.error("[confirmar-entrega] Error consultando pedido:", JSON.stringify(pedidoError))
    }

    if (!pedido) {
      console.error("[confirmar-entrega] Pedido no encontrado para ID:", pedidoId, "email:", user.email, "error:", JSON.stringify(pedidoError))
      return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 })
    }
    if ((pedido.comprador_email || "").toLowerCase() !== (user.email || "").toLowerCase()) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }
    if (pedido.status !== "shipped") {
      return NextResponse.json({ error: "El pedido no está en camino" }, { status: 409 })
    }

    let vendedorTipo: string | null = pedido.vendedor_tipo ?? null
    if (!vendedorTipo && pedido.producto_id) {
      try {
        const { data: prod } = await supabase
          .from("productos")
          .select("vendedor_tipo")
          .eq("id", pedido.producto_id)
          .maybeSingle()
        vendedorTipo = prod?.vendedor_tipo ?? null
        if (vendedorTipo) {
          await supabase.from("pedidos").update({ vendedor_tipo: vendedorTipo }).eq("id", pedidoId)
        }
      } catch (e) {
        console.error("[confirmar-entrega] Error auto-corrigiendo vendedor_tipo:", e)
      }
    }

    const { error: rpcError } = await supabase.rpc("confirmar_entrega", { p_pedido_id: pedidoId })
    if (rpcError) {
      console.error("[confirmar-entrega] RPC error:", JSON.stringify(rpcError), "pedidoId:", pedidoId)
      return NextResponse.json({ error: "No se pudo confirmar la entrega", detail: rpcError.message }, { status: 500 })
    }

    const compradorNombre = pedido.comprador_nombre || user.email
    const productoTitulo = pedido.producto_titulo || "producto"
    const vendedorNombre = pedido.vendedor_nombre || "vendedora"
    const vendedorId = pedido.vendedor_id
    const notificationLink = vendedorId
      ? `/admin/vendedores?tab=publicaciones&vendedor=${vendedorId}&pedido=${pedidoId}`
      : "/admin/vendedores"

    sendAdminPush({
      title: "📦 Entrega confirmada",
      body: `${compradorNombre} confirmó la entrega de "${productoTitulo}". Vendedora: ${vendedorNombre}`,
      url: notificationLink,
      tag: `entrega-${pedidoId}`,
    }).catch(() => {})

    if (vendedorId) {
      const sellerNotifId = `order-delivered-seller-${pedidoId}-${Date.now()}`
      supabase.from("notifications").insert({
        id: sellerNotifId,
        user_id: vendedorId,
        type: "order_delivered",
        title: "📦 Compradora recibió el pedido",
        body: `${compradorNombre} confirmó la entrega de "${productoTitulo}". Tu saldo fue liberado.`,
        link: "/perfil/saldo",
        read: false,
      }).then(({ error: notifErr }) => {
        if (notifErr) console.error("[confirmar-entrega] Error insertando notificación vendedora:", notifErr)
      })

      sendSellerPush(vendedorId, {
        title: "📦 Entrega confirmada",
        body: `${compradorNombre} confirmó la entrega de "${productoTitulo}".`,
        url: "/perfil/saldo",
        tag: `entrega-seller-${pedidoId}`,
      }).catch(() => {})
    }

    const { data: adminSubs } = await supabase
      .from("push_subscriptions")
      .select("user_id")
      .eq("audience", "admin")

    if (adminSubs?.length) {
      const adminIds = [...new Set(adminSubs.map(s => s.user_id).filter(Boolean))]
      const notifId = `entrega-${pedidoId}-${Date.now()}`
      await Promise.all(
        adminIds.map(uid =>
          supabase.from("notifications").insert({
            id: `${notifId}-${uid.slice(0, 8)}`,
            user_id: uid,
            type: "order_delivered",
            title: "📦 Compradora recibió el pedido",
            body: `${compradorNombre} confirmó la entrega de "${productoTitulo}". Liberá el pago a ${vendedorNombre}.`,
            link: notificationLink,
            read: false,
          }).then(({ error: notifErr }) => {
            if (notifErr) console.error("[confirmar-entrega] Error insertando notificación admin:", notifErr)
          })
        )
      )
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("[confirmar-entrega] Error inesperado:", e)
    return NextResponse.json(
      { error: "No se pudo confirmar la entrega", detail: e instanceof Error ? e.message : "Error inesperado" },
      { status: 500 }
    )
  }
}

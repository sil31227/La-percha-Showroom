import { createAdminClient } from "@/lib/supabase-admin"
import { NextResponse } from "next/server"

interface VentaPendiente {
  venta_id: string
  pedido_id: string
  producto_titulo: string
  vendedor_id: string
  monto_bruto: number
  comision: number
  monto_neto: number
  created_at: string
}

export async function GET() {
  try {
    const supabase = createAdminClient()

    const { data: ventas, error } = await supabase
      .from("ventas")
      .select(`
        id,
        pedido_id,
        vendedor_id,
        producto_titulo,
        monto_bruto,
        comision,
        monto_neto,
        status,
        created_at,
        pedidos!inner(status)
      `)
      .eq("status", "pendiente")
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const pendientes: VentaPendiente[] = (ventas || [])
      .filter((v: Record<string, unknown>) => {
        const pedido = v.pedidos as { status?: string } | { status?: string }[] | null
        if (!pedido) return false
        if (Array.isArray(pedido)) return pedido.length > 0 && pedido[0].status === "delivered"
        return pedido.status === "delivered"
      })
      .map((v: Record<string, unknown>) => ({
        venta_id: v.id as string,
        pedido_id: v.pedido_id as string,
        producto_titulo: v.producto_titulo as string,
        vendedor_id: v.vendedor_id as string,
        monto_bruto: v.monto_bruto as number,
        comision: v.comision as number,
        monto_neto: v.monto_neto as number,
        created_at: v.created_at as string,
      }))

    const vendedorIds = [...new Set(pendientes.map((p) => p.vendedor_id).filter(Boolean))]
    const vendedoresMap: Record<string, { nombre: string }> = {}

    if (vendedorIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", vendedorIds)

      if (profiles) {
        for (const p of profiles) {
          vendedoresMap[p.id] = { nombre: p.full_name || "Vendedora" }
        }
      }
    }

    const enriched = pendientes.map((p) => ({
      ...p,
      vendedor_nombre: vendedoresMap[p.vendedor_id]?.nombre || "Vendedora",
    }))

    return NextResponse.json({ ventas: enriched })
  } catch (e) {
    console.error("[admin/ventas GET]", e)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { ventaId } = await req.json().catch(() => ({}))
    if (!ventaId) {
      return NextResponse.json({ error: "Falta ventaId" }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { data: venta, error: ventaError } = await supabase
      .from("ventas")
      .select("vendedor_id, producto_titulo, monto_neto")
      .eq("id", ventaId)
      .single()

    if (ventaError || !venta) {
      return NextResponse.json({ error: "Venta no encontrada" }, { status: 404 })
    }

    const { error: rpcError } = await supabase.rpc("liberar_fondos", { p_venta_id: ventaId })
    if (rpcError) {
      return NextResponse.json({ error: rpcError.message }, { status: 400 })
    }

    if (venta.vendedor_id) {
      const notifId = `pago-liberado-${ventaId}-${Date.now()}`
      supabase.from("notifications").insert({
        id: notifId,
        user_id: venta.vendedor_id,
        type: "order_delivered",
        title: "Pago liberado",
        body: `La administración liberó tu pago de $${(venta.monto_neto as number).toLocaleString("es-AR")} por "${venta.producto_titulo}".`,
        link: "/perfil/saldo",
        read: false,
      }).then(({ error: notifErr }) => {
        if (notifErr) console.error("[admin/ventas POST] Error insertando notificación vendedora:", notifErr)
      })

      fetch(`${new URL(req.url).origin}/api/push/notify-seller`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: venta.vendedor_id,
          title: "Pago liberado",
          body: `La administración liberó tu pago por "${venta.producto_titulo}". Ya está disponible en tu saldo.`,
          url: "/perfil/saldo",
        }),
      }).catch(() => {})
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("[admin/ventas POST]", e)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

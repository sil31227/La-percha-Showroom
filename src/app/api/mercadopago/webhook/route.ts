import { NextResponse } from "next/server"
import { MercadoPagoConfig, Payment } from "mercadopago"
import { createAdminClient } from "@/lib/supabase-admin"
import { sendAdminPush, sendSellerPush } from "@/lib/push"
import { registrarVentaFeria } from "@/lib/ventas"

export async function POST(req: Request) {
  const supabase = createAdminClient()
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN

  if (!accessToken) {
    return NextResponse.json({ error: "Mercado Pago no configurado" }, { status: 500 })
  }

  try {
    const body = await req.json()
    const paymentId = body.data?.id || body.id

    if (!paymentId) {
      return NextResponse.json({ ok: true })
    }

    const mpClient = new MercadoPagoConfig({ accessToken })
    const payment = new Payment(mpClient)
    const paymentData = await payment.get({ id: paymentId })

    if (paymentData.status !== "approved") {
      return NextResponse.json({ ok: true, status: paymentData.status })
    }

    const externalReference = paymentData.external_reference
    if (!externalReference) {
      return NextResponse.json({ ok: true })
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"

    const { data: pedidos } = await supabase
      .from("pedidos")
      .select("id, comprador_email, producto_titulo, talle, precio, direccion, metodo_envio, costo_envio, mail_pago_enviado, vendedor_id, producto_id, vendedor_tipo")
      .like("id", `${externalReference}%`)

    if (pedidos?.length) {
      const yaEnviado = pedidos.some(p => p.mail_pago_enviado)

      if (!yaEnviado) {
        for (const p of pedidos) {
          if (p.producto_id) {
            await supabase
              .from("productos")
              .update({ status: "sold" })
              .eq("id", p.producto_id)

            await registrarVentaFeria(supabase, {
              pedidoId: p.id,
              vendedorId: p.vendedor_id ?? null,
              vendedorTipo: p.vendedor_tipo ?? "oficial",
              productoTitulo: p.producto_titulo,
              precio: Number(p.precio),
            })
          }
        }

        const email = pedidos.find(p => p.comprador_email)?.comprador_email || ""
        const costoEnvio = Number(pedidos[0].costo_envio) || 0
        const subtotal = pedidos.reduce((s, p) => s + Number(p.precio), 0)

        if (email) {
          try {
            await fetch(`${siteUrl}/api/email/pedido-confirmado`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email,
                orderId: externalReference,
                items: pedidos.map(p => ({ titulo: p.producto_titulo, talle: p.talle, precio: Number(p.precio) })),
                direccion: pedidos[0].direccion,
                metodo_envio: pedidos[0].metodo_envio,
                costo_envio: costoEnvio,
                subtotal,
                total: subtotal + costoEnvio,
              }),
            })
          } catch (mailErr) {
            console.error("Error disparando mail pago confirmado:", mailErr)
          }
        }

        await supabase
          .from("pedidos")
          .update({ mail_pago_enviado: true })
          .like("id", `${externalReference}%`)

        sendAdminPush({
          title: "✅ Pago confirmado",
          body: `Pedido #${externalReference} · $${(subtotal + costoEnvio).toLocaleString("es-AR")}`,
          url: "/admin/pedidos",
          tag: `pago-${externalReference}`,
        }).catch(() => {})

        const sellersNotified = new Set<string>()
        for (const p of pedidos) {
          if (p.vendedor_id && !sellersNotified.has(p.vendedor_id)) {
            sellersNotified.add(p.vendedor_id)
            sendSellerPush(p.vendedor_id, {
              title: "✅ Pago confirmado",
              body: `Recibiste el pago por "${p.producto_titulo}".`,
              url: "/perfil/ventas",
              tag: `pago-${externalReference}-${p.vendedor_id}`,
            }).catch(() => {})
          }
        }
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("Error webhook MP:", err)
    return NextResponse.json({ error: "Error procesando webhook" }, { status: 500 })
  }
}

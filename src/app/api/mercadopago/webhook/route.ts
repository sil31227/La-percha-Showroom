import { NextResponse } from "next/server"
import { MercadoPagoConfig, Payment } from "mercadopago"
import { createAdminClient } from "@/lib/supabase-admin"
import { sendAdminPush } from "@/lib/push"

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
      .select("id, comprador_email, producto_titulo, talle, precio, direccion, metodo_envio, costo_envio, mail_pago_enviado")
      .like("id", `${externalReference}%`)

    if (pedidos?.length) {
      const yaEnviado = pedidos.some(p => p.mail_pago_enviado)

      if (!yaEnviado) {
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
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("Error webhook MP:", err)
    return NextResponse.json({ error: "Error procesando webhook" }, { status: 500 })
  }
}

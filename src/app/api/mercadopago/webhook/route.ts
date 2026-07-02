import { NextResponse } from "next/server"
import { MercadoPagoConfig, Payment } from "mercadopago"
import { createAdminClient } from "@/lib/supabase-admin"

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

    const now = new Date().toISOString()

    const { data: pedidos } = await supabase
      .from("pedidos")
      .select("id")
      .like("id", `${externalReference}%`)

    if (pedidos?.length) {
      for (const pedido of pedidos) {
        await supabase
          .from("pedidos")
          .update({
            status: "pending_shipment",
          })
          .eq("id", pedido.id)
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("Error webhook MP:", err)
    return NextResponse.json({ error: "Error procesando webhook" }, { status: 500 })
  }
}

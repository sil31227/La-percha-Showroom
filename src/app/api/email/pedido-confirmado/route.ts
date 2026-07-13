import { Resend } from "resend"
import { NextRequest, NextResponse } from "next/server"

const RESEND_KEY = process.env.RESEND_API_KEY
const resend = RESEND_KEY ? new Resend(RESEND_KEY) : null
const FROM = process.env.RESEND_FROM_EMAIL || "La Percha Showroom <onboarding@resend.dev>"

const METODO_LABEL: Record<string, string> = {
  correo_sucursal: "Correo Argentino (sucursal)",
  correo_domicilio: "Correo Argentino (domicilio)",
  arreglar_vendedor: "Arreglar con el vendedor",
  retiro_local: "Retiro en local",
}

interface Item { titulo: string; talle?: string; precio: number }

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, orderId, items, direccion, metodo_envio, costo_envio, subtotal, total } = body as {
      email?: string; orderId?: string; items?: Item[]; direccion?: string
      metodo_envio?: string; costo_envio?: number; subtotal?: number; total?: number
    }
    if (!email || !orderId || !items?.length) {
      return NextResponse.json({ error: "Faltan datos" }, { status: 400 })
    }

    if (resend) {
      const { error } = await resend.emails.send({
        from: FROM,
        to: email,
        subject: `Confirmamos tu pago · Pedido #${orderId}`,
        html: pedidoConfirmadoEmail({
          orderId, items, direccion,
          metodoLabel: METODO_LABEL[metodo_envio || ""] || metodo_envio || "",
          costoEnvio: costo_envio || 0,
          subtotal: subtotal || items.reduce((s, i) => s + i.precio, 0),
          total: total || 0,
        }),
      })
      if (error) {
        console.error("Error enviando mail pago confirmado (Resend):", error)
        return NextResponse.json({ ok: false, error: error.message }, { status: 502 })
      }
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error inesperado"
    console.error("Error mail pago confirmado:", e)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

function money(n: number) {
  return `$ ${n.toLocaleString("es-AR")}`
}

function pedidoConfirmadoEmail(d: {
  orderId: string; items: Item[]; direccion?: string
  metodoLabel: string; costoEnvio: number; subtotal: number; total: number
}) {
  const rows = d.items.map(i => `
    <tr>
      <td style="padding: 8px 0; font-size: 14px; color: #463828;">${i.titulo}${i.talle ? ` <span style="color:#a39584;">· Talle ${i.talle}</span>` : ""}</td>
      <td style="padding: 8px 0; font-size: 14px; color: #463828; text-align: right; font-weight: 600;">${money(i.precio)}</td>
    </tr>`).join("")

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: 'Inter', -apple-system, sans-serif; background: #f8f6f2; color: #463828; margin: 0; padding: 0;">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #ede9e0;">
  <tr>
    <td style="padding: 40px 32px 24px; text-align: center;">
      <h1 style="font-family: 'Playfair Display', 'Times New Roman', serif; font-weight: 500; font-size: 28px; color: #809671; margin: 0 0 8px;">La Percha Showroom</h1>
      <p style="font-size: 13px; color: #a39584; margin: 0; letter-spacing: 3px; text-transform: uppercase;">Pago confirmado</p>
    </td>
  </tr>
  <tr>
    <td style="padding: 0 32px 8px;">
      <p style="font-size: 16px; line-height: 1.6; margin: 0 0 8px;">¡Confirmamos tu pago!</p>
      <p style="font-size: 14px; line-height: 1.6; margin: 0 0 16px; color: #725C3A;">Pedido <strong>#${d.orderId}</strong>. Te avisamos cuando lo despachemos.</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-top: 1px solid #ede9e0; margin-top: 8px;">
        ${rows}
      </table>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-top: 1px solid #ede9e0; margin-top: 8px;">
        <tr><td style="padding: 8px 0 2px; font-size: 13px; color: #a39584;">Subtotal</td><td style="padding: 8px 0 2px; font-size: 13px; color: #463828; text-align: right;">${money(d.subtotal)}</td></tr>
        <tr><td style="padding: 2px 0; font-size: 13px; color: #a39584;">Envío${d.metodoLabel ? ` (${d.metodoLabel})` : ""}</td><td style="padding: 2px 0; font-size: 13px; color: #463828; text-align: right;">${d.costoEnvio === 0 ? "Gratis" : money(d.costoEnvio)}</td></tr>
        <tr><td style="padding: 8px 0; font-size: 15px; color: #463828; font-weight: 700; border-top: 1px solid #ede9e0;">Total</td><td style="padding: 8px 0; font-size: 15px; color: #809671; font-weight: 700; text-align: right; border-top: 1px solid #ede9e0;">${money(d.total)}</td></tr>
      </table>
      ${d.direccion ? `<p style="font-size: 12px; color: #a39584; line-height: 1.5; margin: 16px 0 0;">Envío a: ${d.direccion}</p>` : ""}
    </td>
  </tr>
  <tr>
    <td style="background: #f8f6f2; padding: 20px 32px; text-align: center;">
      <p style="font-size: 11px; color: #a39584; margin: 0;">La Percha Showroom · Bahía Blanca, Argentina</p>
    </td>
  </tr>
</table>
</body>
</html>`
}

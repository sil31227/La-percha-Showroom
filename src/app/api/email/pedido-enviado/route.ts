import { Resend } from "resend"
import { NextRequest, NextResponse } from "next/server"

const RESEND_KEY = process.env.RESEND_API_KEY
const resend = RESEND_KEY ? new Resend(RESEND_KEY) : null
const FROM = process.env.RESEND_FROM_EMAIL || "La Percha Showroom <onboarding@resend.dev>"

const TRACKING_URL = "https://www.correoargentino.com.ar/formularios/e-commerce"

function esCorreoArgentino(metodo?: string) {
  return metodo === "correo_sucursal" || metodo === "correo_domicilio"
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, orderId, producto_titulo, metodo_envio, seguimiento } = body as {
      email?: string; orderId?: string; producto_titulo?: string
      metodo_envio?: string; seguimiento?: string
    }
    if (!email || !orderId) {
      return NextResponse.json({ error: "Faltan datos" }, { status: 400 })
    }

    if (resend) {
      const { error } = await resend.emails.send({
        from: FROM,
        to: email,
        subject: `Tu pedido #${orderId} está en camino`,
        html: pedidoEnviadoEmail({
          orderId,
          producto: producto_titulo || "tu pedido",
          correo: esCorreoArgentino(metodo_envio),
          seguimiento: seguimiento || "",
        }),
      })
      if (error) {
        console.error("Error enviando mail pedido enviado (Resend):", error)
        return NextResponse.json({ ok: false, error: error.message }, { status: 502 })
      }
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error inesperado"
    console.error("Error mail pedido enviado:", e)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

function pedidoEnviadoEmail(d: { orderId: string; producto: string; correo: boolean; seguimiento: string }) {
  const bloqueCorreo = d.correo
    ? `<p style="font-size: 15px; line-height: 1.6; margin: 0 0 16px; color: #725C3A;">Tu pedido fue enviado por <strong>Correo Argentino</strong>.</p>
       ${d.seguimiento ? `<div style="text-align: center; margin: 16px 0;">
         <p style="font-size: 12px; color: #a39584; margin: 0 0 4px;">Número de seguimiento</p>
         <p style="font-size: 18px; font-weight: 700; color: #463828; margin: 0 0 12px; letter-spacing: 1px;">${d.seguimiento}</p>
         <a href="${TRACKING_URL}" style="display: inline-block; background: #809671; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 100px; font-size: 14px; font-weight: 600;">Seguir mi envío</a>
       </div>` : ""}`
    : `<p style="font-size: 15px; line-height: 1.6; margin: 0 0 16px; color: #725C3A;">Tu pedido fue despachado.</p>`

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: 'Inter', -apple-system, sans-serif; background: #f8f6f2; color: #463828; margin: 0; padding: 0;">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #ede9e0;">
  <tr>
    <td style="padding: 40px 32px 24px; text-align: center;">
      <h1 style="font-family: 'Playfair Display', 'Times New Roman', serif; font-weight: 500; font-size: 28px; color: #809671; margin: 0 0 8px;">La Percha Showroom</h1>
      <p style="font-size: 13px; color: #a39584; margin: 0; letter-spacing: 3px; text-transform: uppercase;">Tu pedido está en camino</p>
    </td>
  </tr>
  <tr>
    <td style="padding: 0 32px 24px;">
      <p style="font-size: 16px; line-height: 1.6; margin: 0 0 8px;">¡Buenas noticias!</p>
      <p style="font-size: 14px; line-height: 1.6; margin: 0 0 16px; color: #725C3A;">Pedido <strong>#${d.orderId}</strong> — ${d.producto}.</p>
      ${bloqueCorreo}
      <p style="font-size: 12px; color: #a39584; line-height: 1.5; margin: 16px 0 0;">Gracias por comprar en La Percha Showroom.</p>
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

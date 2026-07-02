import { Resend } from "resend"
import { NextRequest, NextResponse } from "next/server"

const RESEND_KEY = process.env.RESEND_API_KEY
const resend = RESEND_KEY ? new Resend(RESEND_KEY) : null
const FROM = process.env.RESEND_FROM_EMAIL || "La Percha Showroom <onboarding@resend.dev>"

export async function POST(req: NextRequest) {
  try {
    const { email, name, status } = await req.json()
    if (!email || !status) return NextResponse.json({ error: "Faltan datos" }, { status: 400 })

    if (resend) {
      await resend.emails.send({
        from: FROM,
        to: email,
        subject: status === "approved"
          ? "¡Aprobada! Ya podés vender en La Percha"
          : "Actualización sobre tu solicitud en La Percha",
        html: vendorStatusEmail(name || email, status),
      })
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

function vendorStatusEmail(name: string, status: string) {
  const isApproved = status === "approved"
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: 'Inter', -apple-system, sans-serif; background: #f8f6f2; color: #463828; margin: 0; padding: 0;">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #ede9e0;">
  <tr>
    <td style="padding: 40px 32px 32px; text-align: center;">
      <h1 style="font-family: 'Playfair Display', 'Times New Roman', serif; font-weight: 500; font-size: 28px; color: #809671; margin: 0 0 8px;">La Percha Showroom</h1>
      <p style="font-size: 13px; color: #a39584; margin: 0; letter-spacing: 3px; text-transform: uppercase;">Moda Circular · Comunidad · Confianza</p>
    </td>
  </tr>
  <tr>
    <td style="padding: 0 32px 32px;">
      <p style="font-size: 16px; line-height: 1.6; margin: 0 0 16px;">¡Hola${name ? ' ' + name.split(' ')[0] : ''}!</p>
      ${isApproved
        ? `<p style="font-size: 15px; line-height: 1.6; margin: 0 0 24px; color: #725C3A;">¡Buenas noticias! Tu solicitud para vender en La Percha Showroom fue <strong style="color: #4d8c4d;">aprobada</strong>. Ya podés publicar tus prendas y empezar a vender.</p>
           <div style="text-align: center; margin-bottom: 32px;">
             <p style="font-size: 14px; color: #463828; margin: 0 0 12px;">Vos te quedás con el <strong>80%</strong> de cada venta. Solo pagás comisión cuando vendés.</p>
           </div>
           <div style="text-align: center; margin-bottom: 32px;">
             <p style="font-size: 12px; color: #a39584; margin: 0;">Completá tus datos bancarios en la app para recibir los pagos.</p>
           </div>`
        : `<p style="font-size: 15px; line-height: 1.6; margin: 0 0 24px; color: #725C3A;">Lamentamos informarte que tu solicitud para vender en La Percha Showroom no fue aprobada en esta ocasión. Si tenés dudas, podés contactarnos respondiendo este mail.</p>`
      }
      <p style="font-size: 12px; color: #a39584; line-height: 1.5; margin: 0;">Gracias por ser parte de La Percha Showroom.</p>
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

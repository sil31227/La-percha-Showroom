import { Resend } from "resend"
import { NextRequest, NextResponse } from "next/server"

const RESEND_KEY = process.env.RESEND_API_KEY
const resend = RESEND_KEY ? new Resend(RESEND_KEY) : null
const FROM = process.env.RESEND_FROM_EMAIL || "La Percha Showroom <onboarding@resend.dev>"
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://laperchashowroom.com.ar"

export async function POST(req: NextRequest) {
  try {
    const { email, token } = await req.json()
    if (!email || !token) return NextResponse.json({ error: "Email y token requeridos" }, { status: 400 })

    const resetUrl = `${SITE_URL}/reestablecer-contrasena?token=${token}`

    if (resend) {
      const { error } = await resend.emails.send({
        from: FROM,
        to: email,
        subject: "Recuperá tu contraseña - La Percha Showroom",
        html: resetPasswordEmail(resetUrl),
      })
      if (error) {
        console.error("Error enviando email de recuperación (Resend):", error)
        return NextResponse.json({ ok: false, error: error.message || "No se pudo enviar el email" }, { status: 502 })
      }
    } else {
      console.warn("RESEND_API_KEY no configurada: no se envió email de recuperación")
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error inesperado"
    console.error("Error email recuperación:", e)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

function resetPasswordEmail(resetUrl: string) {
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
      <p style="font-size: 16px; line-height: 1.6; margin: 0 0 16px;">¡Hola!</p>
      <p style="font-size: 15px; line-height: 1.6; margin: 0 0 24px; color: #725C3A;">Recibimos una solicitud para restablecer tu contraseña. Hacé clic en el botón de abajo para elegir una nueva.</p>
      <div style="text-align: center; margin-bottom: 32px;">
        <a href="${resetUrl}" style="display: inline-block; background: #809671; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 100px; font-size: 14px; font-weight: 600;">Restablecer contraseña</a>
      </div>
      <p style="font-size: 12px; color: #a39584; line-height: 1.5; margin: 0 0 8px;">Este link vence en 1 hora.</p>
      <p style="font-size: 12px; color: #a39584; line-height: 1.5; margin: 0;">Si no solicitaste este cambio, ignorá este mensaje. Tu cuenta está segura.<br>Si el botón no funciona, copiá este link: <a href="${resetUrl}" style="color: #809671;">${resetUrl}</a></p>
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

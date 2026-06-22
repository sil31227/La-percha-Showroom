import { Resend } from "resend"
import { NextRequest, NextResponse } from "next/server"

const RESEND_KEY = process.env.RESEND_API_KEY
const resend = RESEND_KEY ? new Resend(RESEND_KEY) : null
const FROM = process.env.RESEND_FROM_EMAIL || "La Percha Showroom <onboarding@resend.dev>"
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function POST(req: NextRequest) {
  try {
    const { email, name } = await req.json()
    if (!email) return NextResponse.json({ error: "Email requerido" }, { status: 400 })

    const token = crypto.randomUUID()

    // Store token in Supabase
    await fetch(`${SUPABASE_URL}/rest/v1/verification_tokens`, {
      method: "POST",
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
      },
      body: JSON.stringify({ email, token, name: name || "", verified: false }),
    })

    const verifyUrl = `${SITE_URL}/verificar-email?token=${token}`

    if (resend) {
      await resend.emails.send({
        from: FROM,
        to: email,
        subject: "¡Bienvenida a La Percha Showroom!",
        html: welcomeEmail(name || email, verifyUrl),
      })
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

function welcomeEmail(name: string, verifyUrl: string) {
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
      <p style="font-size: 15px; line-height: 1.6; margin: 0 0 24px; color: #725C3A;">Gracias por registrarte en La Percha Showroom. Solo falta un paso para activar tu cuenta y empezar a comprar y vender ropa.</p>
      <div style="text-align: center; margin-bottom: 32px;">
        <a href="${verifyUrl}" style="display: inline-block; background: #809671; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 100px; font-size: 14px; font-weight: 600;">Verificar mi email</a>
      </div>
      <p style="font-size: 12px; color: #a39584; line-height: 1.5; margin: 0;">Si no creaste una cuenta en La Percha, ignorá este mensaje.<br>Si el botón no funciona, copiá este link: <a href="${verifyUrl}" style="color: #809671;">${verifyUrl}</a></p>
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

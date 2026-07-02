import { Resend } from "resend"
import { NextRequest, NextResponse } from "next/server"

const RESEND_KEY = process.env.RESEND_API_KEY
const resend = RESEND_KEY ? new Resend(RESEND_KEY) : null
const FROM = process.env.RESEND_FROM_EMAIL || "La Percha Showroom <onboarding@resend.dev>"
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "sil31227@gmail.com"
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"

export async function POST(req: NextRequest) {
  try {
    const { titulo, vendedora, precio } = await req.json()

    if (resend) {
      await resend.emails.send({
        from: FROM,
        to: ADMIN_EMAIL,
        subject: `🔔 Nueva publicación para moderar: ${titulo}`,
        html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: 'Inter', -apple-system, sans-serif; background: #f8f6f2; color: #463828; margin: 0; padding: 0;">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #ede9e0;">
  <tr><td style="padding: 40px 32px 32px; text-align:center">
    <h1 style="font-family:'Playfair Display',serif;font-weight:500;font-size:28px;color:#809671;margin:0 0 8px">La Percha Showroom</h1>
    <p style="font-size:13px;color:#a39584;margin:0;letter-spacing:3px;text-transform:uppercase">Panel Admin</p>
  </td></tr>
  <tr><td style="padding:0 32px 32px">
    <p style="font-size:16px;line-height:1.6;margin:0 0 16px">¡Nueva prenda para moderar!</p>
    <p style="font-size:15px;line-height:1.6;margin:0 0 8px;color:#725C3A"><strong>${titulo}</strong></p>
    <p style="font-size:14px;line-height:1.6;margin:0 0 8px;color:#725C3A">Vendedora: ${vendedora}</p>
    <p style="font-size:14px;line-height:1.6;margin:0 0 24px;color:#725C3A">Precio: $${Number(precio).toLocaleString("es-AR")}</p>
    <div style="text-align:center;margin-bottom:32px">
      <a href="${SITE_URL}/admin/moderacion" style="display:inline-block;background:#809671;color:#fff;text-decoration:none;padding:14px 32px;border-radius:100px;font-size:14px;font-weight:600">Ir a Moderación</a>
    </div>
  </td></tr>
  <tr><td style="background:#f8f6f2;padding:20px 32px;text-align:center">
    <p style="font-size:11px;color:#a39584;margin:0">La Percha Showroom · Bahía Blanca, Argentina</p>
  </td></tr>
</table></body></html>`
      })
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

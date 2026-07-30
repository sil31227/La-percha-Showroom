import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-admin"

export async function POST(req: NextRequest) {
  try {
    const { token, newPassword } = await req.json()
    if (!token || !newPassword) {
      return NextResponse.json({ error: "Token y nueva contraseña son requeridos" }, { status: 400 })
    }
    if (newPassword.length < 6) {
      return NextResponse.json({ error: "La contraseña debe tener al menos 6 caracteres" }, { status: 400 })
    }

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    const tokenRes = await fetch(
      `${SUPABASE_URL}/rest/v1/verification_tokens?token=eq.${encodeURIComponent(token)}&type=eq.password_reset`,
      {
        headers: {
          "apikey": SUPABASE_KEY,
          "Authorization": `Bearer ${SUPABASE_KEY}`,
        },
      }
    )

    const tokens = await tokenRes.json()
    const tokenData = Array.isArray(tokens) ? tokens[0] : null

    if (!tokenData) {
      return NextResponse.json({ error: "Token inválido o expirado" }, { status: 400 })
    }

    if (tokenData.verified) {
      return NextResponse.json({ error: "Este link ya fue usado. Si necesitás cambiar tu contraseña, solicitá uno nuevo." }, { status: 400 })
    }

    const createdAt = new Date(tokenData.created_at)
    const now = new Date()
    const hoursDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60)
    if (hoursDiff > 1) {
      return NextResponse.json({ error: "El link expiró (válido por 1 hora). Solicitá uno nuevo." }, { status: 400 })
    }

    const email = tokenData.email
    if (!email) {
      return NextResponse.json({ error: "Token inválido" }, { status: 400 })
    }

    const supabase = createAdminClient()
    const target = String(email).toLowerCase()

    let user: { id: string; email?: string } | undefined
    for (let page = 1; page <= 100 && !user; page++) {
      const { data, error: listError } = await supabase.auth.admin.listUsers({ page, perPage: 1000 })
      if (listError) return NextResponse.json({ error: listError.message }, { status: 500 })
      const found = (data?.users || []).find(u => u.email?.toLowerCase() === target)
      if (found) user = found
      if ((data?.users?.length || 0) < 1000) break
    }

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, { password: newPassword })
    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    await fetch(`${SUPABASE_URL}/rest/v1/verification_tokens?token=eq.${encodeURIComponent(token)}`, {
      method: "PATCH",
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
      },
      body: JSON.stringify({ verified: true, used_at: new Date().toISOString() }),
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error inesperado"
    console.error("[reset-password]", e)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

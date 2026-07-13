import { createAdminClient } from "@/lib/supabase-admin"
import { NextResponse } from "next/server"
import { sendSellerPush } from "@/lib/push"

export async function POST(req: Request) {
  try {
    const { userId, title, body, url, access_token } = await req.json()

    if (!userId || !title || !body) {
      return NextResponse.json({ error: "Faltan campos requeridos: userId, title, body" }, { status: 400 })
    }

    if (!access_token) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const supabase = createAdminClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser(access_token)

    if (authError || !user) {
      return NextResponse.json({ error: "Token inválido o expirado" }, { status: 401 })
    }

    await sendSellerPush(userId, { title, body, url })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[push/notify-seller] Error:", err)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

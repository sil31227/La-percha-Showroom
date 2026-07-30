import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-admin"
import { bearerToken, getUserFromToken } from "@/lib/auth-server"

export async function POST(request: Request) {
  try {
    const user = await getUserFromToken(bearerToken(request))
    if (!user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }
    const adminEmail = process.env.ADMIN_EMAIL
    if (!adminEmail || user.email !== adminEmail) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const { items } = await request.json()
    if (!items?.length) return NextResponse.json({ error: "Sin items" }, { status: 400 })

    const supabase = createAdminClient()

    for (const item of items) {
      await supabase.from("productos").update({ orden: item.orden }).eq("id", item.id)
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

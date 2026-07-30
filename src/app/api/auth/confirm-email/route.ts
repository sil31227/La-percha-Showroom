import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-admin"
import { bearerToken, getUserFromToken } from "@/lib/auth-server"

export async function POST(req: NextRequest) {
  try {
    const adminUser = await getUserFromToken(bearerToken(req))
    if (!adminUser?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }
    const adminEmail = process.env.ADMIN_EMAIL
    if (!adminEmail || adminUser.email !== adminEmail) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const { email } = await req.json()
    if (!email) return NextResponse.json({ error: "Email requerido" }, { status: 400 })

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
    if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })

    const { error } = await supabase.auth.admin.updateUserById(user.id, { email_confirm: true })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ ok: true })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error inesperado"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

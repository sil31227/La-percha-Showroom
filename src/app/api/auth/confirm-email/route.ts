import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-admin"

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email) return NextResponse.json({ error: "Email requerido" }, { status: 400 })

    const supabase = createAdminClient()

    const { data: users, error: listError } = await supabase.auth.admin.listUsers()
    if (listError) return NextResponse.json({ error: listError.message }, { status: 500 })

    const user = (users?.users || []).find(u => u.email === email)
    if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })

    const { error } = await supabase.auth.admin.updateUserById(user.id, { email_confirm: true })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

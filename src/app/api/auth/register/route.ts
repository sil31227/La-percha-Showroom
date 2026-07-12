import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-admin"

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email y contraseña son requeridos" }, { status: 400 })
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "La contraseña debe tener al menos 6 caracteres" }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { data: created, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
      user_metadata: { full_name: name || email.split("@")[0] },
    })

    if (createError) {
      const msg = createError.message.toLowerCase()
      if (msg.includes("already") || msg.includes("registered") || msg.includes("exists")) {
        return NextResponse.json({ error: "Ya existe una cuenta con ese email" }, { status: 409 })
      }
      return NextResponse.json({ error: createError.message }, { status: 500 })
    }

    const user = created.user
    if (!user) {
      return NextResponse.json({ error: "No se pudo crear la cuenta" }, { status: 500 })
    }

    const { error: profileError } = await supabase.from("profiles").upsert({
      id: user.id,
      full_name: name || email.split("@")[0],
      avatar_url: `https://i.pravatar.cc/80?u=${encodeURIComponent(email)}`,
      is_seller: false,
      seller_status: "none",
      balance: 0,
    })
    if (profileError) {
      console.error("[register] Error creando profile:", profileError)
    }

    return NextResponse.json({ ok: true, userId: user.id })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error inesperado"
    console.error("[register] Exception:", e)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

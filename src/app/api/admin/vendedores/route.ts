import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-admin"

export async function PATCH(request: Request) {
  try {
    const { id, status } = await request.json()

    if (!id || !status) {
      return NextResponse.json({ error: "Faltan id o status" }, { status: 400 })
    }

    if (!["approved", "rejected"].includes(status)) {
      return NextResponse.json({ error: "Status inválido" }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { error: vendorError } = await supabase
      .from("vendedores")
      .update({ status })
      .eq("id", id)

    if (vendorError) {
      return NextResponse.json({ error: vendorError.message }, { status: 500 })
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .update({ seller_status: status, is_seller: status === "approved" })
      .eq("id", id)
      .select("id")

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    if (!profile || profile.length === 0) {
      return NextResponse.json({ error: "No se encontró el perfil de la vendedora" }, { status: 404 })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

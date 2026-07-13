import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-admin"

export async function PATCH(request: Request) {
  try {
    const { id, status, seguimiento } = await request.json()

    if (!id || !status) {
      return NextResponse.json({ error: "Faltan id o status" }, { status: 400 })
    }

    if (!["shipped", "delivered", "cancelled"].includes(status)) {
      return NextResponse.json({ error: "Status inválido" }, { status: 400 })
    }

    const supabase = createAdminClient()

    const payload: Record<string, unknown> = { status }
    if (seguimiento) payload.seguimiento = seguimiento

    const { error } = await supabase.from("pedidos").update(payload).eq("id", id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

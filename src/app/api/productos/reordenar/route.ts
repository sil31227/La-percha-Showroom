import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-admin"

export async function POST(request: Request) {
  try {
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

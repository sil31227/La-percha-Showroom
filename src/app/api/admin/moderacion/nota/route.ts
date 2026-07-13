import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-admin"

const VALID_ACTIONS = ["approved", "rejected", "changes_requested"]

export async function POST(request: Request) {
  try {
    const { producto_id, tipo_accion, texto } = await request.json()

    if (!producto_id || !tipo_accion) {
      return NextResponse.json({ error: "Faltan producto_id o tipo_accion" }, { status: 400 })
    }

    if (!VALID_ACTIONS.includes(tipo_accion)) {
      return NextResponse.json({ error: "tipo_accion invalido" }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { data: note, error: noteError } = await supabase
      .from("comentarios_moderacion")
      .insert({
        producto_id,
        admin_id: "00000000-0000-0000-0000-000000000000",
        tipo_accion,
        texto: texto || null,
      })
      .select()
      .single()

    if (noteError) {
      return NextResponse.json({ error: noteError.message }, { status: 500 })
    }

    const { error: updateError } = await supabase
      .from("productos")
      .update({ status: tipo_accion })
      .eq("id", producto_id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ note })
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

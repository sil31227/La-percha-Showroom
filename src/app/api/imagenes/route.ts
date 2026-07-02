import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-admin"

export async function POST(request: Request) {
  try {
    const { paths } = await request.json()
    if (!paths?.length) return NextResponse.json({ error: "No se especificaron archivos" }, { status: 400 })

    const supabase = createAdminClient()
    const { error } = await supabase.storage.from("productos").remove(paths)

    if (error) {
      console.error("Error eliminando imagenes:", error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("Error en delete imagenes:", err)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

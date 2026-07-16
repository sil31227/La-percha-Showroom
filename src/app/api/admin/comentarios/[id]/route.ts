import { NextRequest, NextResponse } from "next/server"
import { bearerToken, getUserFromToken } from "@/lib/auth-server"
import { createAdminClient } from "@/lib/supabase-admin"

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: comentarioId } = await params
  const user = await getUserFromToken(bearerToken(_req))
  if (!user?.id) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  }

  const supabase = createAdminClient()

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .single()

  if (!profile) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  const { error } = await supabase
    .from("comentarios_producto")
    .update({ deleted: true })
    .eq("id", comentarioId)

  if (error) {
    return NextResponse.json({ error: "Error al eliminar comentario" }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

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

  const adminEmail = process.env.ADMIN_EMAIL
  if (!adminEmail || user.email !== adminEmail) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  const supabase = createAdminClient()

  const { error } = await supabase
    .from("comentarios_producto")
    .update({ deleted: true })
    .eq("id", comentarioId)

  if (error) {
    return NextResponse.json({ error: "Error al eliminar comentario" }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

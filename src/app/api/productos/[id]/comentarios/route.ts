import { NextRequest, NextResponse } from "next/server"
import { bearerToken, getUserFromToken } from "@/lib/auth-server"
import { createAdminClient } from "@/lib/supabase-admin"
import { sendPushToUser } from "@/lib/push"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: productoId } = await params
  const user = await getUserFromToken(bearerToken(req))
  if (!user?.id) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  }

  let body: { texto?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Body JSON inválido" }, { status: 400 })
  }

  if (!body.texto?.trim()) {
    return NextResponse.json({ error: "El comentario no puede estar vacío" }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { data: producto, error: prodErr } = await supabase
    .from("productos")
    .select("id, titulo, vendedor_id")
    .eq("id", productoId)
    .single()

  if (prodErr || !producto) {
    return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 })
  }

  const comentarioId = crypto.randomUUID()
  const { error: insertErr } = await supabase
    .from("comentarios_producto")
    .insert({
      id: comentarioId,
      producto_id: productoId,
      user_id: user.id,
      texto: body.texto.trim(),
    })

  if (insertErr) {
    return NextResponse.json({ error: "Error al publicar comentario" }, { status: 500 })
  }

  // Notify product owner (if not self-comment)
  if (producto.vendedor_id && producto.vendedor_id !== user.id) {
    const pushPayload = {
      title: "Nuevo comentario",
      body: `${user.email || "Alguien"} comentó en tu producto "${producto.titulo}"`,
      url: `/producto/${productoId}`,
      tag: `comment-${productoId}`,
    }

    const notifId = crypto.randomUUID()
    await supabase.from("notifications").insert({
      id: notifId,
      user_id: producto.vendedor_id,
      type: "new_comment",
      title: pushPayload.title,
      body: pushPayload.body,
      link: pushPayload.url,
    })

    await sendPushToUser(producto.vendedor_id, "seller", pushPayload)
  }

  return NextResponse.json({
    ok: true,
    comentario: {
      id: comentarioId,
      producto_id: productoId,
      user_id: user.id,
      texto: body.texto.trim(),
      deleted: false,
      created_at: new Date().toISOString(),
    },
  })
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: productoId } = await params

  const supabase = createAdminClient()

  const { data: comentarios, error } = await supabase
    .from("comentarios_producto")
    .select("id, producto_id, user_id, texto, deleted, created_at")
    .eq("producto_id", productoId)
    .eq("deleted", false)
    .order("created_at", { ascending: true })

  if (error) {
    return NextResponse.json({ error: "Error al cargar comentarios" }, { status: 500 })
  }

  // Fetch user names for display
  const userIds = [...new Set((comentarios || []).map(c => c.user_id))]
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url")
    .in("id", userIds.length ? userIds : ["none"])

  const userNameMap = new Map((profiles || []).map(p => [p.id, { name: p.full_name || "Usuario", avatar: p.avatar_url }]))

  const enriched = (comentarios || []).map(c => ({
    ...c,
    user_name: userNameMap.get(c.user_id)?.name || "Usuario",
    user_avatar: userNameMap.get(c.user_id)?.avatar || null,
  }))

  return NextResponse.json({ comentarios: enriched })
}

import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-admin"
import { bearerToken, getUserFromToken } from "@/lib/auth-server"

async function checkAdmin(request: Request) {
  const user = await getUserFromToken(bearerToken(request))
  if (!user?.id) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  }
  const adminEmail = process.env.ADMIN_EMAIL
  if (!adminEmail || user.email !== adminEmail) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }
  return null
}

export async function PATCH(request: Request) {
  try {
    const authError = await checkAdmin(request)
    if (authError) return authError

    const { id, status, seguimiento } = await request.json()

    if (!id || !status) {
      return NextResponse.json({ error: "Faltan id o status" }, { status: 400 })
    }

    if (!["shipped", "delivered", "cancelled"].includes(status)) {
      return NextResponse.json({ error: "Status inválido" }, { status: 400 })
    }

    const supabase = createAdminClient()

    if (status === "delivered") {
      const { data: pedido } = await supabase
        .from("pedidos")
        .select("vendedor_tipo, status")
        .eq("id", id)
        .single()

      if (!pedido) {
        return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 })
      }
      if (pedido.vendedor_tipo === "feria") {
        return NextResponse.json({ error: "Los pedidos de Feria los confirma la compradora" }, { status: 400 })
      }
      if (pedido.status !== "shipped") {
        return NextResponse.json({ error: "El pedido no está en camino" }, { status: 409 })
      }

      const { error: rpcError } = await supabase.rpc("confirmar_entrega", { p_pedido_id: id })
      if (rpcError) {
        return NextResponse.json({ error: rpcError.message }, { status: 500 })
      }
    } else {
      const payload: Record<string, unknown> = { status }
      if (seguimiento) payload.seguimiento = seguimiento

      const { error } = await supabase.from("pedidos").update(payload).eq("id", id)
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const authError = await checkAdmin(request)
    if (authError) return authError

    const { id } = await request.json()

    if (!id) {
      return NextResponse.json({ error: "Falta id" }, { status: 400 })
    }

    const supabase = createAdminClient()
    const { error } = await supabase.from("pedidos").delete().eq("id", id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

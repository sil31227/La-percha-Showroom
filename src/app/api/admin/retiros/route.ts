import { createAdminClient } from "@/lib/supabase-admin"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get("status")
  const supabase = createAdminClient()

  let query = supabase
    .from("retiros")
    .select("*, vendedores(nombre, email, avatar, cbu, banco, tipo_cuenta, alias, titular)")
    .order("created_at", { ascending: false })

  if (status && ["solicitado", "pagado", "rechazado"].includes(status)) {
    query = query.eq("status", status)
  }

  const { data, error } = await query
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ retiros: data || [] })
}

export async function PATCH(req: Request) {
  const { action, retiroId, motivo } = await req.json().catch(() => ({}))
  if (!retiroId || !["pagar", "rechazar"].includes(action)) {
    return NextResponse.json({ error: "Faltan action o retiroId" }, { status: 400 })
  }

  const supabase = createAdminClient()

  if (action === "pagar") {
    const { error } = await supabase.rpc("marcar_retiro_pagado", { p_retiro_id: retiroId })
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
  } else {
    const { error } = await supabase.rpc("rechazar_retiro", {
      p_retiro_id: retiroId,
      p_motivo: motivo || null,
    })
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
  }

  return NextResponse.json({ ok: true })
}

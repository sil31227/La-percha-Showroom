import { createAdminClient } from "@/lib/supabase-admin"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status")
    const supabase = createAdminClient()

    let query = supabase
      .from("retiros")
      .select("*")
      .order("created_at", { ascending: false })

    if (status && ["solicitado", "pagado", "rechazado"].includes(status)) {
      query = query.eq("status", status)
    }

    const { data: retiros, error } = await query
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const vendedorIds = [...new Set((retiros || []).map(r => r.vendedor_id).filter(Boolean))]
    const vendedoresMap: Record<string, unknown> = {}

    if (vendedorIds.length > 0) {
      const [{ data: profiles }, { data: vendedores }] = await Promise.all([
        supabase.from("profiles").select("id, full_name, email, avatar_url").in("id", vendedorIds),
        supabase.from("vendedores").select("id, cbu, banco, tipo_cuenta, alias, titular").in("id", vendedorIds),
      ])

      const profilesMap = new Map((profiles || []).map(p => [p.id, p]))
      const vendorsMap = new Map((vendedores || []).map(v => [v.id, v]))

      for (const id of vendedorIds) {
        const profile = profilesMap.get(id)
        const vendor = vendorsMap.get(id)
        vendedoresMap[id] = {
          nombre: profile?.full_name || "Vendedora",
          email: profile?.email || "",
          avatar: profile?.avatar_url || "",
          cbu: vendor?.cbu || null,
          banco: vendor?.banco || null,
          tipo_cuenta: vendor?.tipo_cuenta || null,
          alias: vendor?.alias || null,
          titular: vendor?.titular || null,
        }
      }
    }

    const enriched = (retiros || []).map(r => ({
      ...r,
      vendedores: vendedoresMap[r.vendedor_id] || null,
    }))

    return NextResponse.json({ retiros: enriched })
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
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

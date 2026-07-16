import { createAdminClient } from "@/lib/supabase-admin"
import { bearerToken, getUserFromToken } from "@/lib/auth-server"
import { sendAdminPush } from "@/lib/push"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const user = await getUserFromToken(bearerToken(req))
  if (!user?.id) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  }

  const { monto } = await req.json().catch(() => ({ monto: 0 }))
  const amount = Math.floor(Number(monto))
  if (!amount || amount <= 0) {
    return NextResponse.json({ error: "Monto inválido" }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { data: vendedor } = await supabase
    .from("vendedores")
    .select("cbu, nombre, email")
    .eq("id", user.id)
    .maybeSingle()

  const { data: retiroId, error } = await supabase.rpc("solicitar_retiro", {
    p_vendedor_id: user.id,
    p_monto: amount,
    p_cbu: vendedor?.cbu ?? null,
  })
  if (error) {
    return NextResponse.json({ error: error.message || "No se pudo procesar el retiro" }, { status: 400 })
  }

  const vendedorNombre = vendedor?.nombre || user.email || "Vendedora"
  sendAdminPush({
    title: "💰 Retiro solicitado",
    body: `${vendedorNombre} solicitó retirar $${amount.toLocaleString("es-AR")}`,
    url: "/admin/retiros",
    tag: `retiro-${retiroId}`,
  }).catch(() => {})

  const { data: adminSubs } = await supabase
    .from("push_subscriptions")
    .select("user_id")
    .eq("audience", "admin")

  if (adminSubs?.length) {
    const adminIds = [...new Set(adminSubs.map(s => s.user_id).filter(Boolean))]
    const notifId = `retiro-${retiroId}-${Date.now()}`
    await Promise.all(
      adminIds.map(uid =>
        supabase.from("notifications").insert({
          id: `${notifId}-${uid.slice(0, 8)}`,
          user_id: uid,
          type: "withdrawal_requested",
          title: "💰 Retiro solicitado",
          body: `${vendedorNombre} quiere retirar $${amount.toLocaleString("es-AR")}`,
          link: "/admin/retiros",
          read: false,
        }).then(({ error: notifErr }) => {
          if (notifErr) console.error("[retirar] Error insertando notificación admin:", notifErr)
        })
      )
    )
  }

  return NextResponse.json({ ok: true, retiroId })
}

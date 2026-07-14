import { createAdminClient } from "@/lib/supabase-admin"
import { bearerToken, getUserFromToken } from "@/lib/auth-server"
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
    .select("cbu")
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
  return NextResponse.json({ ok: true, retiroId })
}

import { createAdminClient } from "@/lib/supabase-admin"
import { NextResponse } from "next/server"

interface SubscribeBody {
  endpoint?: string
  keys?: { p256dh?: string; auth?: string }
  audience?: string
  access_token?: string
}

export async function POST(req: Request) {
  try {
    const body: SubscribeBody = await req.json()
    const endpoint = body.endpoint
    const p256dh = body.keys?.p256dh
    const auth = body.keys?.auth
    const audience = body.audience === "seller" ? "seller" : "admin"

    if (!endpoint || !p256dh || !auth) {
      return NextResponse.json({ error: "Suscripción inválida" }, { status: 400 })
    }

    const supabase = createAdminClient()

    let userId: string | null = null
    if (audience === "seller") {
      if (!body.access_token) {
        return NextResponse.json({ error: "No autenticado" }, { status: 401 })
      }

      const { data: { user }, error: authError } = await supabase.auth.getUser(body.access_token)

      if (authError || !user) {
        return NextResponse.json({ error: "Token inválido o expirado" }, { status: 401 })
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("seller_status")
        .eq("id", user.id)
        .single()

      if (profileError || !profile || profile.seller_status !== "approved") {
        return NextResponse.json({ error: "Solo vendedoras aprobadas pueden suscribirse" }, { status: 403 })
      }

      userId = user.id
    }

    const { error } = await supabase
      .from("push_subscriptions")
      .upsert(
        { endpoint, p256dh, auth, audience, user_id: userId },
        { onConflict: "endpoint" }
      )

    if (error) {
      console.error("[push/subscribe] Error guardando suscripción:", error)
      return NextResponse.json({ error: "No se pudo guardar la suscripción" }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[push/subscribe] Error:", err)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

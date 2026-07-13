import { createAdminClient } from "@/lib/supabase-admin"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

interface SubscribeBody {
  endpoint?: string
  keys?: { p256dh?: string; auth?: string }
  audience?: string
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

    let userId: string | null = null
    if (audience === "seller") {
      const supabaseAuth = createRouteHandlerClient({ cookies })
      const { data: { user } } = await supabaseAuth.auth.getUser()
      if (!user) {
        return NextResponse.json({ error: "No autenticado" }, { status: 401 })
      }
      userId = user.id
    }

    const supabase = createAdminClient()
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

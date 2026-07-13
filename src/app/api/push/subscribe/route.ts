import { createAdminClient } from "@/lib/supabase-admin"
import { NextResponse } from "next/server"

interface SubscribeBody {
  endpoint?: string
  keys?: { p256dh?: string; auth?: string }
}

export async function POST(req: Request) {
  try {
    const body: SubscribeBody = await req.json()
    const endpoint = body.endpoint
    const p256dh = body.keys?.p256dh
    const auth = body.keys?.auth

    if (!endpoint || !p256dh || !auth) {
      return NextResponse.json({ error: "Suscripción inválida" }, { status: 400 })
    }

    const supabase = createAdminClient()
    const { error } = await supabase
      .from("push_subscriptions")
      .upsert(
        { endpoint, p256dh, auth, audience: "admin" },
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

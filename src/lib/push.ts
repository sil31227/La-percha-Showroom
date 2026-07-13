import webpush from "web-push"
import { createAdminClient } from "@/lib/supabase-admin"

export interface AdminPushPayload {
  title: string
  body: string
  url?: string
  tag?: string
}

let configured = false

function ensureConfigured(): boolean {
  const publicKey = process.env.VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  const subject =
    process.env.VAPID_SUBJECT ||
    (process.env.ADMIN_EMAIL ? `mailto:${process.env.ADMIN_EMAIL}` : "mailto:noreply@example.com")

  if (!publicKey || !privateKey) {
    console.warn("[push] Faltan VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY. Push deshabilitado.")
    return false
  }

  if (!configured) {
    webpush.setVapidDetails(subject, publicKey, privateKey)
    configured = true
  }
  return true
}

export async function sendAdminPush(payload: AdminPushPayload): Promise<void> {
  try {
    if (!ensureConfigured()) return

    const supabase = createAdminClient()
    const { data: subs, error } = await supabase
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth")
      .eq("audience", "admin")

    if (error || !subs?.length) return

    const body = JSON.stringify({
      title: payload.title,
      body: payload.body,
      url: payload.url || "/admin/pedidos",
      tag: payload.tag,
    })

    await Promise.all(
      subs.map(async (s) => {
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            body
          )
        } catch (err: unknown) {
          const statusCode = (err as { statusCode?: number }).statusCode
          if (statusCode === 404 || statusCode === 410) {
            await supabase.from("push_subscriptions").delete().eq("id", s.id)
          } else {
            console.error("[push] Error enviando a suscripción", s.id, err)
          }
        }
      })
    )
  } catch (err) {
    console.error("[push] Error inesperado en sendAdminPush:", err)
  }
}

import { NextResponse } from "next/server"
import { sendSellerPush } from "@/lib/push"
import { bearerToken, getUserFromToken } from "@/lib/auth-server"

export async function POST(req: Request) {
  try {
    const user = await getUserFromToken(bearerToken(req))
    if (!user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }
    const adminEmail = process.env.ADMIN_EMAIL
    if (!adminEmail || user.email !== adminEmail) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const { userId, title, body, url } = await req.json()

    if (!userId || !title || !body) {
      return NextResponse.json({ error: "Faltan campos requeridos: userId, title, body" }, { status: 400 })
    }

    await sendSellerPush(userId, { title, body, url })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[push/notify-seller] Error:", err)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

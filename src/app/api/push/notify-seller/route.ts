import { NextResponse } from "next/server"
import { sendSellerPush } from "@/lib/push"

export async function POST(req: Request) {
  try {
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

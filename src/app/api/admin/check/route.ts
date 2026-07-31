import { NextResponse } from "next/server"
import { bearerToken, getUserFromToken } from "@/lib/auth-server"

export async function GET(request: Request) {
  try {
    const user = await getUserFromToken(bearerToken(request))
    if (!user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }
    const adminEmail = process.env.ADMIN_EMAIL
    if (!adminEmail || user.email !== adminEmail) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import { bearerToken, getUserFromToken } from "@/lib/auth-server"

export async function GET(request: Request) {
  try {
    const user = await getUserFromToken(bearerToken(request))
    if (!user?.id) {
      console.log("[admin/check] No autenticado - token invalido")
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }
    const adminEmail = process.env.ADMIN_EMAIL
    console.log("[admin/check] user.email:", user.email, "| ADMIN_EMAIL:", adminEmail || "NO SET", "| match:", user.email === adminEmail)
    if (!adminEmail || user.email !== adminEmail) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

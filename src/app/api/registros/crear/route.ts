import { NextRequest, NextResponse } from "next/server"
import { sendAdminPush } from "@/lib/push"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function POST(req: NextRequest) {
  try {
    const { email, name } = await req.json()
    if (!email) return NextResponse.json({ error: "Email requerido" }, { status: 400 })

    await fetch(`${SUPABASE_URL}/rest/v1/verification_tokens`, {
      method: "POST",
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
      },
      body: JSON.stringify({ email, name: name || email, token: crypto.randomUUID(), verified: false }),
    })

    await sendAdminPush({
      title: "👤 Nueva vendedora registrada",
      body: `${name || email}`,
      url: "/admin/registros",
    })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

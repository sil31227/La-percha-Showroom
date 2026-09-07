import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-admin"
import { registerUser } from "./register-user"

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json()
    const supabase = createAdminClient()
    const result = await registerUser(supabase, { name, email, password })
    return NextResponse.json(result.body, { status: result.status })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error inesperado"
    console.error("[register] Exception:", e)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

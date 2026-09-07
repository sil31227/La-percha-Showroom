import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-admin"
import { bearerToken, getUserFromToken } from "@/lib/auth-server"

async function findAuthUserByEmail(
  supabase: ReturnType<typeof createAdminClient>,
  email: string
) {
  const target = email.toLowerCase()
  for (let page = 1; page <= 100; page++) {
    const { data, error: listError } = await supabase.auth.admin.listUsers({ page, perPage: 1000 })
    if (listError) throw new Error(listError.message)
    const found = (data?.users || []).find(u => u.email?.toLowerCase() === target)
    if (found) return found
    if ((data?.users?.length || 0) < 1000) break
  }
  return null
}

async function confirmAuthEmail(
  supabase: ReturnType<typeof createAdminClient>,
  email: string
) {
  const user = await findAuthUserByEmail(supabase, email)
  if (!user) return { ok: false as const, status: 404 as const, error: "Usuario no encontrado" }

  if (user.email_confirmed_at) {
    return { ok: true as const, alreadyConfirmed: true as const, userId: user.id }
  }

  const { error } = await supabase.auth.admin.updateUserById(user.id, { email_confirm: true })
  if (error) return { ok: false as const, status: 500 as const, error: error.message }

  return { ok: true as const, alreadyConfirmed: false as const, userId: user.id }
}

/**
 * Confirma email en Supabase Auth.
 * Autorización:
 *  - token de verification_tokens (flujo público /verificar-email)
 *  - o sesión admin (ADMIN_EMAIL) para desbloqueo manual
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const token = typeof body.token === "string" ? body.token.trim() : ""
    const emailRaw = typeof body.email === "string" ? body.email.trim() : ""

    const supabase = createAdminClient()

    // 1) Flujo público: token de verificación de email
    if (token) {
      const { data: tokenRow, error: tokenError } = await supabase
        .from("verification_tokens")
        .select("id, email, token, type, verified, created_at")
        .eq("token", token)
        .maybeSingle()

      if (tokenError) {
        console.error("[confirm-email] token lookup:", tokenError)
        return NextResponse.json({ error: "No se pudo validar el token" }, { status: 500 })
      }
      if (!tokenRow?.email) {
        return NextResponse.json({ error: "Token no válido o expirado" }, { status: 400 })
      }

      const tokenType = tokenRow.type || "email_verification"
      if (tokenType !== "email_verification") {
        return NextResponse.json({ error: "Token no válido para verificación de email" }, { status: 400 })
      }

      const result = await confirmAuthEmail(supabase, tokenRow.email)
      if (!result.ok) {
        return NextResponse.json({ error: result.error }, { status: result.status })
      }

      // Marcar token (y otros del mismo email) como verificados
      const now = new Date().toISOString()
      await supabase
        .from("verification_tokens")
        .update({ verified: true, used_at: now })
        .eq("token", token)

      await supabase
        .from("verification_tokens")
        .update({ verified: true })
        .eq("email", tokenRow.email)
        .eq("type", "email_verification")
        .eq("verified", false)

      return NextResponse.json({
        ok: true,
        alreadyConfirmed: result.alreadyConfirmed,
        email: tokenRow.email,
      })
    }

    // 2) Flujo admin: email + sesión admin
    if (!emailRaw) {
      return NextResponse.json({ error: "Token o email requerido" }, { status: 400 })
    }

    const adminUser = await getUserFromToken(bearerToken(req))
    if (!adminUser?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }
    const adminEmail = process.env.ADMIN_EMAIL
    if (!adminEmail || adminUser.email !== adminEmail) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const result = await confirmAuthEmail(supabase, emailRaw)
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }

    await supabase
      .from("verification_tokens")
      .update({ verified: true })
      .eq("email", emailRaw)
      .eq("type", "email_verification")
      .eq("verified", false)

    // También por lower-case mismatch
    const target = emailRaw.toLowerCase()
    if (target !== emailRaw) {
      await supabase
        .from("verification_tokens")
        .update({ verified: true })
        .ilike("email", emailRaw)
        .eq("type", "email_verification")
        .eq("verified", false)
    }

    return NextResponse.json({
      ok: true,
      alreadyConfirmed: result.alreadyConfirmed,
      email: emailRaw,
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error inesperado"
    console.error("[confirm-email]", e)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

import { createClient } from "@supabase/supabase-js"

export function bearerToken(req: Request): string | null {
  const h = req.headers.get("authorization") || ""
  return h.startsWith("Bearer ") ? h.slice(7) : null
}

export async function getUserFromToken(
  token: string | null
): Promise<{ id: string; email: string | null } | null> {
  if (!token) return null
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anon) return null
  const client = createClient(url, anon)
  const { data } = await client.auth.getUser(token)
  if (!data.user) return null
  return { id: data.user.id, email: data.user.email ?? null }
}

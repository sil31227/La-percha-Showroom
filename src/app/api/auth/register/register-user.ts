type RegisterInput = {
  name?: string
  email: string
  password: string
}

type RegisterResult = {
  status: number
  body: Record<string, unknown>
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AdminLike = any

export async function registerUser(
  supabase: AdminLike,
  { name, email, password }: RegisterInput,
): Promise<RegisterResult> {
  if (!email || !password) {
    return { status: 400, body: { error: "Email y contraseña son requeridos" } }
  }
  if (password.length < 6) {
    return { status: 400, body: { error: "La contraseña debe tener al menos 6 caracteres" } }
  }

  const fullName = name || email.split("@")[0]

  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: false,
    user_metadata: { full_name: fullName },
  })

  if (createError) {
    const msg = createError.message.toLowerCase()
    if (msg.includes("already") || msg.includes("registered") || msg.includes("exists")) {
      return { status: 409, body: { error: "Ya existe una cuenta con ese email" } }
    }
    return { status: 500, body: { error: createError.message } }
  }

  const user = created.user
  if (!user) {
    return { status: 500, body: { error: "No se pudo crear la cuenta" } }
  }

  const { error: profileError } = await supabase.from("profiles").upsert({
    id: user.id,
    full_name: fullName,
    avatar_url: `https://i.pravatar.cc/80?u=${encodeURIComponent(email)}`,
    is_seller: false,
    seller_status: "none",
    balance: 0,
  })

  if (profileError) {
    console.error("[register] Error creando profile:", profileError)
    const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id)
    if (deleteError) {
      console.error("[register] Error eliminando usuario auth huérfano:", deleteError)
    }
    return {
      status: 500,
      body: { error: "No se pudo completar el registro. Intentá de nuevo." },
    }
  }

  return { status: 200, body: { ok: true, userId: user.id } }
}

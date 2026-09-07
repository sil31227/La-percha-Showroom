// @ts-nocheck — bun:test (run: bun test src/app/api/auth/register/register-user.test.ts)
import { describe, expect, test, mock } from "bun:test"
import { registerUser } from "./register-user"

function createMockSupabase(opts: {
  createUserResult?: { data: { user: { id: string } | null }; error: { message: string } | null }
  profileError?: { message: string } | null
  deleteUserError?: { message: string } | null
}) {
  const deleteUser = mock(() =>
    Promise.resolve({ data: null, error: opts.deleteUserError ?? null }),
  )
  const upsert = mock(() =>
    Promise.resolve({ data: null, error: opts.profileError ?? null }),
  )
  const createUser = mock(() =>
    Promise.resolve(
      opts.createUserResult ?? {
        data: { user: { id: "user-123" } },
        error: null,
      },
    ),
  )

  return {
    auth: { admin: { createUser, deleteUser } },
    from: mock(() => ({ upsert })),
    _spies: { createUser, deleteUser, upsert },
  }
}

describe("registerUser", () => {
  test("elimina el usuario auth y devuelve error si falla la creación del perfil", async () => {
    const supabase = createMockSupabase({
      profileError: { message: "duplicate key" },
    })

    const result = await registerUser(supabase, {
      name: "Ana",
      email: "ana@test.com",
      password: "secret1",
    })

    expect(supabase._spies.deleteUser).toHaveBeenCalledWith("user-123")
    expect(result.status).toBe(500)
    expect(result.body).toEqual({
      error: "No se pudo completar el registro. Intentá de nuevo.",
    })
  })

  test("no elimina usuario y devuelve ok si el perfil se crea bien", async () => {
    const supabase = createMockSupabase({ profileError: null })

    const result = await registerUser(supabase, {
      name: "Ana",
      email: "ana@test.com",
      password: "secret1",
    })

    expect(supabase._spies.deleteUser).not.toHaveBeenCalled()
    expect(result.status).toBe(200)
    expect(result.body).toEqual({ ok: true, userId: "user-123" })
  })
})

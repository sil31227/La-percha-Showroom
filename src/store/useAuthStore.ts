import { create } from "zustand"
import { supabase } from "@/lib/supabase"
import type { Session } from "@supabase/supabase-js"

export interface VentaRecord {
  id: string
  pedido_id: string
  title: string
  price: number
  monto_bruto: number
  comision: number
  monto_neto: number
  date: string
  status: "pendiente" | "liberado" | "retirado"
}

export interface RetiroRecord {
  id: string
  monto: number
  cbu: string
  status: "solicitado" | "pagado" | "rechazado"
  created_at: string
  pagado_at: string | null
}

export interface User {
  id: string
  name: string
  email: string
  avatar: string
  phone: string
  is_seller: boolean
  seller_status: "none" | "pending" | "approved" | "rejected"
  balance: number
  ventas: VentaRecord[]
  retiros: RetiroRecord[]
}

interface AuthStore {
  user: User | null
  session: Session | null
  isLoading: boolean
  initialized: boolean
  initialize: () => Promise<void>
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>
  register: (name: string, email: string, password: string) => Promise<{ ok: boolean; error?: string; needsConfirmation?: boolean }>
  requestSeller: () => Promise<void>
  refreshProfile: () => Promise<void>
  fetchVentas: () => Promise<VentaRecord[]>
  fetchRetiros: () => Promise<RetiroRecord[]>
  updateProfile: (data: { name?: string; avatar?: string; phone?: string }) => void
  withdraw: (amount: number) => Promise<{ ok: boolean; error?: string }>
  logout: () => Promise<void>
  isAuthenticated: () => boolean
}

function mapProfile(profile: Record<string, unknown> | null, email: string, userId?: string): User {
  return {
    id: (profile?.id as string) || userId || "",
    name: (profile?.full_name as string) || email.split("@")[0],
    email,
    avatar: (profile?.avatar_url as string) || `https://i.pravatar.cc/80?u=${encodeURIComponent(email)}`,
    phone: (profile?.phone as string) || "",
    is_seller: (profile?.is_seller as boolean) || false,
    seller_status: (profile?.seller_status as User["seller_status"]) || "none",
    balance: (profile?.balance as number) || 0,
    ventas: [],
    retiros: [],
  }
}

async function fetchProfile(userId: string): Promise<Record<string, unknown> | null> {
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single()
  return data
}

async function ensureProfile(userId: string, email: string, name: string) {
  const existing = await fetchProfile(userId)
  if (!existing) {
    await supabase.from("profiles").upsert({
      id: userId,
      full_name: name || email.split("@")[0],
      avatar_url: `https://i.pravatar.cc/80?u=${encodeURIComponent(email)}`,
      is_seller: false,
      seller_status: "none",
      balance: 0,
    })
  }
}

export const useAuthStore = create<AuthStore>()((set, get) => ({
  user: null,
  session: null,
  isLoading: false,
  initialized: false,

  initialize: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      await ensureProfile(session.user.id, session.user.email ?? "", session.user.user_metadata?.full_name || "")
      const profile = await fetchProfile(session.user.id)
      set({
        session,
        user: mapProfile(profile, session.user.email ?? "", session.user.id),
        initialized: true,
      })
    } else {
      set({ initialized: true })
    }

    supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        await ensureProfile(session.user.id, session.user.email ?? "", session.user.user_metadata?.full_name || "")
        const profile = await fetchProfile(session.user.id)
        set({ session, user: mapProfile(profile, session.user.email ?? "", session.user.id) })
      } else {
        set({ session: null, user: null })
      }
    })
  },

  login: async (email, password) => {
    set({ isLoading: true })
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      set({ isLoading: false })
      if (error.message.includes("Invalid login credentials")) {
        return { ok: false, error: "Email o contraseña incorrectos" }
      }
      if (error.message.includes("Email not confirmed") || (error as { code?: string }).code === "email_not_confirmed") {
        return { ok: false, error: "Tenés que confirmar tu email antes de ingresar. Revisá tu casilla (y la carpeta de spam)." }
      }
      return { ok: false, error: error.message }
    }
    if (data.user) {
      await ensureProfile(data.user.id, data.user.email ?? "", data.user.user_metadata?.full_name || "")
      const profile = await fetchProfile(data.user.id)
      set({
        session: data.session,
        user: mapProfile(profile, data.user.email ?? "", data.user.id),
        isLoading: false,
      })
      return { ok: true }
    }
    set({ isLoading: false })
    return { ok: false, error: "Error al iniciar sesión" }
  },

  register: async (name, email, password) => {
    set({ isLoading: true })
    if (password.length < 6) {
      set({ isLoading: false })
      return { ok: false, error: "La contraseña debe tener al menos 6 caracteres" }
    }

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    })
    const result = await res.json().catch(() => ({}))

    if (!res.ok) {
      set({ isLoading: false })
      return { ok: false, error: result.error || "Error al crear la cuenta" }
    }

    await fetch("/api/email/registro", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name }),
    }).catch(() => {})

    set({ isLoading: false })
    return { ok: true, needsConfirmation: true }
  },

  requestSeller: async () => {
    const user = get().user
    if (!user) { console.error("[requestSeller] No hay usuario autenticado"); return }
    try {
      const [profileRes, vendorRes] = await Promise.all([
        supabase.from("profiles").update({ seller_status: "pending" }).eq("id", user.id),
        supabase.from("vendedores").upsert({ id: user.id, nombre: user.name, email: user.email, avatar: user.avatar, status: "pending", productos_count: 0 }),
      ])
      if (profileRes.error) console.error("[requestSeller] Error profiles:", profileRes.error)
      if (vendorRes.error) console.error("[requestSeller] Error vendedores:", vendorRes.error)
      set(s => s.user ? { user: { ...s.user, seller_status: "pending" } } : s)
    } catch (err) {
      console.error("[requestSeller] Exception:", err)
    }
  },

  refreshProfile: async () => {
    const user = get().user
    if (!user?.id) return
    const profile = await fetchProfile(user.id)
    if (profile) {
      set(s => s.user ? {
        user: {
          ...s.user,
          name: (profile.full_name as string) || s.user.name,
          avatar: (profile.avatar_url as string) || s.user.avatar,
          phone: (profile.phone as string) || "",
          is_seller: (profile.is_seller as boolean) || false,
          seller_status: (profile.seller_status as User["seller_status"]) || "none",
          balance: (profile.balance as number) || 0,
        }
      } : s)
    }
  },

  updateProfile: (data) =>
    set(s => s.user ? {
      user: {
        ...s.user,
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.avatar !== undefined ? { avatar: data.avatar } : {}),
        ...(data.phone !== undefined ? { phone: data.phone } : {}),
      }
    } : s),

  withdraw: async (amount) => {
    const session = get().session
    if (!session?.access_token) {
      return { ok: false, error: "No autenticado" }
    }
    const res = await fetch("/api/saldo/retirar", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ monto: amount }),
    })
    const data = await res.json().catch(() => ({ error: "Error de conexión" }))
    if (!res.ok) {
      return { ok: false, error: data.error || "Error al procesar el retiro" }
    }
    await get().refreshProfile()
    const retiros = await get().fetchRetiros()
    set(s => s.user ? { user: { ...s.user, retiros } } : s)
    return { ok: true }
  },

  fetchVentas: async () => {
    const user = get().user
    if (!user?.id) return []
    const { data } = await supabase
      .from("ventas")
      .select("id, pedido_id, producto_titulo, monto_bruto, comision, monto_neto, status, created_at, liberado_at")
      .eq("vendedor_id", user.id)
      .order("created_at", { ascending: false })
    if (!data) return []
    return data.map((v: Record<string, unknown>) => ({
      id: v.id as string,
      pedido_id: v.pedido_id as string,
      title: v.producto_titulo as string,
      price: v.monto_bruto as number,
      monto_bruto: v.monto_bruto as number,
      comision: v.comision as number,
      monto_neto: v.monto_neto as number,
      date: (v.created_at as string)?.slice(0, 10) ?? "",
      status: v.status as VentaRecord["status"],
    }))
  },

  fetchRetiros: async () => {
    const user = get().user
    if (!user?.id) return []
    const { data } = await supabase
      .from("retiros")
      .select("id, monto, cbu, status, created_at, pagado_at")
      .eq("vendedor_id", user.id)
      .order("created_at", { ascending: false })
    if (!data) return []
    return data.map((r: Record<string, unknown>) => ({
      id: r.id as string,
      monto: r.monto as number,
      cbu: (r.cbu as string) || "",
      status: r.status as RetiroRecord["status"],
      created_at: r.created_at as string,
      pagado_at: r.pagado_at as string | null,
    }))
  },

  logout: async () => {
    await supabase.auth.signOut()
    set({ user: null, session: null })
  },

  isAuthenticated: () => get().user !== null,
}))

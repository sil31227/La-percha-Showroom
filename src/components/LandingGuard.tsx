"use client"

import { useEffect, useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

type ViewState = "loading" | "no-session" | "interstitial" | "remembered"

const REMEMBERED_KEY = "lapercha_device_remembered"

export function LandingGuard({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [view, setView] = useState<ViewState>("loading")
  const [userName, setUserName] = useState("")
  const [avatar, setAvatar] = useState("")

  useEffect(() => {
    const guard = document.getElementById("landing-guard-loading")
    if (guard) guard.style.display = "none"

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) {
        setView("no-session")
        return
      }

      const remembered = localStorage.getItem(REMEMBERED_KEY)
      if (remembered) {
        setView("remembered")
        router.replace("/home")
        return
      }

      const email = session.user.email ?? ""
      const metadata = session.user.user_metadata as Record<string, unknown> | undefined
      const name = (metadata?.full_name as string) || email.split("@")[0]
      setUserName(name)
      setAvatar(
        (metadata?.avatar_url as string) ||
        `https://i.pravatar.cc/80?u=${encodeURIComponent(email)}`
      )
      setView("interstitial")
    })
  }, [router])

  function handleContinue() {
    localStorage.setItem(REMEMBERED_KEY, "true")
    router.replace("/home")
  }

  function handleOtherAccount() {
    router.push("/ingresar")
  }

  if (view === "remembered") {
    return null
  }

  if (view === "loading") {
    return <>{children}</>
  }

  if (view === "no-session") {
    return <>{children}</>
  }

  return (
    <main className="min-h-screen bg-bg-page flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md space-y-8 text-center">
        <img
          src="/logo.jpg"
          alt="La Percha Showroom"
          className="w-40 h-40 lg:w-48 lg:h-48 mx-auto mix-blend-multiply"
        />

        <div className="space-y-3">
          <h1 className="font-display text-4xl lg:text-5xl text-text-strong tracking-tight leading-tight">
            La Percha{" "}
            <span className="text-brand italic">Showroom</span>
          </h1>
          <p className="text-text-muted text-sm lg:text-base leading-relaxed">
            Moda circular &middot; Comunidad &middot; Confianza
          </p>
        </div>

        <div className="flex flex-col items-center gap-2">
          <img
            src={avatar}
            alt={userName}
            className="w-12 h-12 rounded-full object-cover"
          />
          <p className="text-text-body text-lg font-semibold">
            ¿Sos {userName}?
          </p>
        </div>

        <div className="flex flex-col gap-3 w-full">
          <button
            onClick={handleContinue}
            className="w-full h-13 bg-matcha-700 hover:bg-matcha-800 !text-white
              font-semibold rounded-full flex items-center justify-center
              transition-colors text-sm lg:text-base shadow-lg shadow-matcha-700/25"
          >
            Sí, continuar
          </button>
          <button
            onClick={handleOtherAccount}
            className="text-carob-700 font-semibold text-sm hover:text-carob-800 transition-colors"
          >
            Usar otra cuenta
          </button>
        </div>
      </div>
    </main>
  )
}

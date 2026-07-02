"use client"
import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { CheckCircle2, XCircle, Loader2 } from "lucide-react"
import Link from "next/link"

function VerifyContent() {
  const params = useSearchParams()
  const token = params.get("token")
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("Verificando tu email...")

  useEffect(() => {
    if (!token) {
      setStatus("error")
      setMessage("Token no válido o expirado.")
      return
    }
    supabase.from("verification_tokens").select("*").eq("token", token).single().then(async ({ data, error }) => {
      if (error || !data) { setStatus("error"); setMessage("Token no válido o expirado."); return }
      if (data.verified) { setStatus("success"); setMessage("Tu email ya fue verificado anteriormente."); return }
      await supabase.from("verification_tokens").update({ verified: true }).eq("token", token)
      setStatus("success"); setMessage("¡Email verificado! Ya podés usar La Percha.")
    })
  }, [token])

  return (
    <>
      {status === "loading" && <Loader2 className="w-12 h-12 text-matcha-500 animate-spin mx-auto" />}
      {status === "success" && <CheckCircle2 className="w-12 h-12 text-success-500 mx-auto" />}
      {status === "error" && <XCircle className="w-12 h-12 text-error-500 mx-auto" />}
      <div>
        <h1 className="font-display text-xl text-text-strong mb-2">Verificación de email</h1>
        <p className="text-sm text-text-muted">{message}</p>
      </div>
      <Link href="/ingresar" className="inline-flex items-center gap-2 px-6 py-3 bg-brand text-white font-semibold rounded-full text-sm hover:bg-brand-hover transition-colors">Iniciar sesión</Link>
    </>
  )
}

export default function VerificarEmailPage() {
  return (
    <main className="min-h-screen bg-bg-page flex items-center justify-center px-6">
      <div className="w-full max-w-sm text-center space-y-6">
        <Suspense fallback={<Loader2 className="w-12 h-12 text-matcha-500 animate-spin mx-auto" />}>
          <VerifyContent />
        </Suspense>
      </div>
    </main>
  )
}

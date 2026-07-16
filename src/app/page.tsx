import Link from "next/link"
import { Sparkles, ShoppingBag, Shirt, Truck } from "lucide-react"
import { LandingGuard } from "@/components/LandingGuard"

export default function RootPage() {
  return (
    <LandingGuard>
      <LandingContent />
    </LandingGuard>
  )
}

function LandingContent() {
  return (
    <main className="min-h-screen bg-bg-page flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md space-y-8 text-center">
        <img src="/logo.jpg" alt="La Percha Showroom"
          className="w-40 h-40 lg:w-48 lg:h-48 mx-auto mix-blend-multiply" />

        <div className="space-y-3">
          <h1 className="font-display text-4xl lg:text-5xl text-text-strong tracking-tight leading-tight">
            La Percha{" "}
            <span className="text-brand italic">Showroom</span>
          </h1>
          <p className="text-text-muted text-sm lg:text-base leading-relaxed">
            Moda circular &middot; Comunidad &middot; Confianza
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Shirt, label: "Comprá ropa\ny regalería" },
            { icon: ShoppingBag, label: "Vendé lo que\nya no usás" },
            { icon: Truck, label: "Envíos a todo\nel país" },
          ].map(f => (
            <div key={f.label}
              className="flex flex-col items-center gap-2 p-3 rounded-xl bg-surface-sunken">
              <span className="w-10 h-10 rounded-xl bg-matcha-100 flex items-center justify-center">
                <f.icon className="w-5 h-5 text-matcha-500" />
              </span>
              <p className="text-[11px] text-text-muted leading-snug whitespace-pre-line">
                {f.label}
              </p>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 w-full">
          <Link href="/ingresar/registrarse"
            className="w-full h-13 bg-matcha-700 hover:bg-matcha-800 !text-white
              font-semibold rounded-full flex items-center justify-center gap-2
              transition-colors text-sm lg:text-base shadow-lg shadow-matcha-700/25">
            <Sparkles className="w-4 h-4" />
            Registrarme — comprá y vendé ropa
          </Link>
          <div className="flex gap-3">
            <Link href="/home"
              className="flex-1 h-12 border border-border-default text-text-body
                font-semibold rounded-full flex items-center justify-center
                hover:border-brand hover:text-brand transition-colors text-sm">
              Entrar a ver qué hay
            </Link>
            <Link href="/ingresar"
              className="flex-1 h-12 text-carob-700 font-semibold rounded-full
                flex items-center justify-center hover:bg-matcha-50 transition-colors text-sm">
              Ya tengo cuenta
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}

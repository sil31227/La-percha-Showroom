"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Wallet, Clock, ArrowDown, CheckCircle, AlertCircle, DollarSign, XCircle } from "lucide-react"
import { useAuthStore } from "@/store/useAuthStore"
import type { VentaRecord, RetiroRecord } from "@/store/useAuthStore"

export default function SaldoPage() {
  const { user, withdraw, fetchVentas, fetchRetiros } = useAuthStore()
  const [ventas, setVentas] = useState<VentaRecord[]>([])
  const [retiros, setRetiros] = useState<RetiroRecord[]>([])
  const [showRetiro, setShowRetiro] = useState(false)
  const [retiroAmount, setRetiroAmount] = useState("")
  const [retiroDone, setRetiroDone] = useState(false)
  const [retiroError, setRetiroError] = useState("")
  const [loadingRetiro, setLoadingRetiro] = useState(false)

  useEffect(() => {
    if (user?.id) {
      Promise.all([fetchVentas(), fetchRetiros()]).then(([v, r]) => {
        setVentas(v)
        setRetiros(r)
      })
    }
  }, [user?.id])

  if (!user) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center gap-4 px-5 text-center">
        <p className="text-text-muted text-sm">Ingresá para ver tu saldo</p>
        <Link href="/ingresar"
          className="px-6 py-2.5 rounded-full bg-brand text-white font-semibold text-sm">
          Ingresar
        </Link>
      </div>
    )
  }

  const liberado = ventas.filter(v => v.status === 'liberado')
  const pendiente = ventas.filter(v => v.status === 'pendiente')
  const totalNeto = liberado.reduce((s, v) => s + v.monto_neto, 0)
  const gananciaPendiente = pendiente.reduce((s, v) => s + v.monto_neto, 0)
  const balanceDisponible = user.balance

  async function handleRetiro() {
    const amount = Number(retiroAmount)
    if (!amount || amount <= 0 || amount > balanceDisponible!) return
    setLoadingRetiro(true)
    setRetiroError("")
    const result = await withdraw(amount)
    setLoadingRetiro(false)
    if (result.ok) {
      setRetiroDone(true)
      setShowRetiro(false)
      setRetiroAmount("")
      fetchRetiros().then(setRetiros)
      setTimeout(() => setRetiroDone(false), 4000)
    } else {
      setRetiroError(result.error || "Error al procesar el retiro")
    }
  }

  if (retiroDone) {
    return (
      <div className="flex flex-col min-h-screen">
        <header className="h-16 flex items-center gap-3 px-5 bg-bg-page border-b border-border-subtle sticky top-0 z-10 lg:top-16">
          <Link href="/perfil" className="w-9 h-9 rounded-full bg-surface-sunken flex items-center justify-center shrink-0">
            <ArrowLeft className="w-4 h-4 text-text-muted" />
          </Link>
          <h1 className="font-display text-xl text-text-strong">Saldo</h1>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-5 text-center">
          <div className="w-16 h-16 rounded-full bg-success-50 flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-success-500" />
          </div>
          <p className="text-text-strong font-semibold text-lg">¡Retiro solicitado!</p>
          <p className="text-text-muted text-sm max-w-xs">
            Recibirás <strong>$ {Number(retiroAmount).toLocaleString('es-AR')}</strong> en tu cuenta bancaria en las próximas 48 horas hábiles.
          </p>
          <Link href="/perfil"
            className="mt-2 px-6 py-2.5 rounded-full bg-brand text-white font-semibold text-sm">
            Volver al perfil
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="h-16 flex items-center gap-3 px-5 bg-bg-page border-b border-border-subtle sticky top-0 z-10 lg:top-16">
        <Link href="/perfil" className="w-9 h-9 rounded-full bg-surface-sunken flex items-center justify-center shrink-0">
          <ArrowLeft className="w-4 h-4 text-text-muted" />
        </Link>
        <h1 className="font-display text-xl text-text-strong">Saldo</h1>
      </header>

      <div className="flex-1 px-4 lg:px-6 py-6 space-y-6 pb-24 lg:pb-10 max-w-lg mx-auto w-full">
        {/* Tarjeta de saldo */}
        <div className="bg-gradient-to-br from-matcha-500 to-matcha-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-matcha-200" />
              <span className="text-sm font-semibold text-matcha-100">Saldo disponible</span>
            </div>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/20">
              La Percha
            </span>
          </div>
          <p className="text-3xl lg:text-4xl font-bold tracking-tight">
            $ {balanceDisponible.toLocaleString('es-AR')}
          </p>

          {user.is_seller && (
            <div className="mt-3 pt-3 border-t border-matcha-400/30 space-y-1.5">
              {gananciaPendiente > 0 && (
                <div className="flex items-center justify-between text-matcha-100 text-xs">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    Pendiente de liberar
                  </span>
                  <span className="font-semibold">$ {gananciaPendiente.toLocaleString('es-AR')}</span>
                </div>
              )}
              {totalNeto > 0 && (
                <div className="flex items-center justify-between text-matcha-100 text-xs">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Total liberado
                  </span>
                  <span className="font-semibold">$ {totalNeto.toLocaleString('es-AR')}</span>
                </div>
              )}
              {gananciaPendiente === 0 && totalNeto === 0 && (
                <p className="text-matcha-200 text-xs">Aún no tenés ventas</p>
              )}
              {gananciaPendiente > 0 && (
                <p className="text-[10px] text-matcha-200 leading-relaxed mt-1">
                  Se acredita cuando la compradora confirme la entrega.
                </p>
              )}
            </div>
          )}

          <div className="flex gap-3 mt-5">
            <button
              onClick={() => setShowRetiro(true)}
              disabled={balanceDisponible <= 0}
              className="flex-1 h-11 bg-white text-matcha-600 font-semibold rounded-full text-sm
                hover:bg-matcha-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              <ArrowDown className="w-4 h-4" />
              Retirar
            </button>
          </div>
        </div>

        {/* Resumen rápido si hay pendientes y balance 0 */}
        {user.is_seller && balanceDisponible === 0 && gananciaPendiente > 0 && (
          <div className="bg-warning-50 border border-warning-200 rounded-xl p-4 flex items-start gap-3">
            <Clock className="w-5 h-5 text-warning-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-warning-700">Saldo pendiente de liberación</p>
              <p className="text-xs text-warning-600 mt-0.5 leading-relaxed">
                Tenés <strong>$ {gananciaPendiente.toLocaleString('es-AR')}</strong> pendientes de que la compradora confirme la entrega. Una vez confirmado, el saldo se acreditará automáticamente y vas a poder retirarlo.
              </p>
            </div>
          </div>
        )}

        {/* Retiro form */}
        {showRetiro && (
          <div className="bg-surface-card rounded-xl border border-border-subtle p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-text-strong text-sm">Retirar saldo</h3>
              <button onClick={() => { setShowRetiro(false); setRetiroError("") }}
                className="text-xs text-text-muted hover:text-text-body">Cancelar</button>
            </div>

            <div className="bg-info-50 border border-info-200 rounded-lg p-3">
              <p className="text-xs text-info-600 leading-relaxed">
                El dinero se transfiere a tu CBU registrado en Datos de vendedora. Asegurate de que los datos estén correctos.
              </p>
            </div>

            {retiroError && (
              <div className="bg-danger-50 border border-danger-200 rounded-lg p-3 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-danger-500 shrink-0 mt-0.5" />
                <p className="text-xs text-danger-600">{retiroError}</p>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-text-muted uppercase tracking-wide mb-1.5">
                Monto a retirar
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">$</span>
                  <input type="number" value={retiroAmount}
                    onChange={e => setRetiroAmount(e.target.value)}
                    placeholder="0"
                    min={0} max={balanceDisponible} step={100}
                    className="w-full h-11 pl-7 pr-4 rounded-lg bg-surface-sunken text-sm text-text-body
                      border border-transparent focus:border-brand focus:outline-none transition-colors" />
                </div>
                <button onClick={() => setRetiroAmount(String(balanceDisponible))}
                  className="px-3 h-11 rounded-lg border border-border-default text-xs font-semibold text-text-muted
                    hover:border-brand hover:text-brand transition-colors shrink-0">
                  Todo
                </button>
              </div>
              <p className="text-[10px] text-text-subtle mt-1">
                Disponible: $ {balanceDisponible.toLocaleString('es-AR')}
              </p>
            </div>

            <button onClick={handleRetiro}
              disabled={loadingRetiro || !retiroAmount || Number(retiroAmount) <= 0 || Number(retiroAmount) > balanceDisponible}
              className="w-full h-11 bg-brand hover:bg-brand-hover text-white
                font-semibold rounded-full transition-colors disabled:opacity-50 text-sm">
              {loadingRetiro ? "Procesando..." : "Confirmar retiro"}
            </button>
          </div>
        )}

        {/* Estado de ventas */}
        {ventas.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-text-strong mb-3">Tus ventas</h2>
            <div className="space-y-3">
              {ventas.map(venta => (
                <div key={venta.id}
                  className="bg-surface-card rounded-xl border border-border-subtle p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0
                        ${venta.status === 'liberado' ? 'bg-success-50 text-success-500' :
                          venta.status === 'retirado' ? 'bg-surface-sunken text-text-muted' :
                          'bg-warning-50 text-warning-500'}`}>
                        {venta.status === 'liberado' ? <CheckCircle className="w-4 h-4" /> :
                         venta.status === 'retirado' ? <ArrowDown className="w-4 h-4" /> :
                         <Clock className="w-4 h-4" />}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-text-strong truncate">{venta.title}</p>
                        <p className="text-[10px] text-text-muted">{venta.date}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className="text-sm font-bold text-text-strong">
                        $ {venta.monto_neto.toLocaleString('es-AR')}
                      </p>
                      <span className="text-[10px] text-text-subtle">
                        Bruto: $ {venta.monto_bruto.toLocaleString('es-AR')}
                      </span>
                      <span className={`text-[10px] font-semibold ml-1
                        ${venta.status === 'liberado' ? 'text-success-500' :
                          venta.status === 'retirado' ? 'text-text-subtle' :
                          'text-warning-500'}`}>
                        {venta.status === 'liberado' ? 'Liberado' :
                         venta.status === 'retirado' ? 'Retirado' :
                         'Pendiente'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Historial de retiros */}
        {retiros.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-text-strong mb-3">Historial de retiros</h2>
            <div className="space-y-2">
              {retiros.map(retiro => (
                <div key={retiro.id}
                  className="bg-surface-card rounded-xl border border-border-subtle p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0
                      ${retiro.status === 'pagado' ? 'bg-success-50 text-success-500' :
                        retiro.status === 'rechazado' ? 'bg-danger-50 text-danger-500' :
                        'bg-warning-50 text-warning-500'}`}>
                      {retiro.status === 'pagado' ? <CheckCircle className="w-4 h-4" /> :
                       retiro.status === 'rechazado' ? <XCircle className="w-4 h-4" /> :
                       <Clock className="w-4 h-4" />}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-text-strong">$ {retiro.monto.toLocaleString('es-AR')}</p>
                      <p className="text-[10px] text-text-muted">
                        {new Date(retiro.created_at).toLocaleDateString('es-AR')}
                      </p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-semibold
                    ${retiro.status === 'pagado' ? 'text-success-500' :
                      retiro.status === 'rechazado' ? 'text-danger-500' :
                      'text-warning-500'}`}>
                    {retiro.status === 'pagado' ? 'Pagado' :
                     retiro.status === 'rechazado' ? 'Rechazado' :
                     'Solicitado'}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Explicación */}
        <div className="bg-surface-sunken rounded-xl p-4 space-y-3">
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wide">¿Cómo funciona?</h3>
          <div className="space-y-2">
            {[
              { icon: DollarSign, text: 'Vendés una prenda, La Percha retiene el 20% y acredita el 80% a tu saldo.' },
              { icon: Clock, text: 'El saldo se libera cuando la compradora confirma la entrega.' },
              { icon: ArrowDown, text: 'Podés retirar tu saldo a tu cuenta bancaria cuando quieras.' },
            ].map((item, i) => (
              <div key={i} className="flex gap-2.5">
                <item.icon className="w-4 h-4 text-text-subtle shrink-0 mt-0.5" />
                <p className="text-xs text-text-muted leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

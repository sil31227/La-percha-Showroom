import { Suspense } from "react"
import VendedoresContent from "./VendedoresContent"

export default function VendedoresPage() {
  return (
    <Suspense fallback={<div className="p-5 lg:pt-7 text-sm text-text-muted">Cargando...</div>}>
      <VendedoresContent />
    </Suspense>
  )
}

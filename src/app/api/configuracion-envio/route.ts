import { createAdminClient } from "@/lib/supabase-admin"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = createAdminClient()
  const { data, error } = await supabase.from("configuracion_envio").select("*").single()

  if (error || !data) {
    return NextResponse.json({ error: "Configuración no encontrada" }, { status: 500 })
  }

  return NextResponse.json({
    sucursal_price: data.sucursal_price,
    domicilio_price: data.domicilio_price,
    free_threshold: data.free_threshold,
    domicilio_surcharge: data.domicilio_surcharge,
  })
}

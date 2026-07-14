import type { SupabaseClient } from "@supabase/supabase-js"

export function calcularComision(precio: number): { comision: number; monto_neto: number } {
  const comision = Math.round(precio * 0.20)
  return { comision, monto_neto: precio - comision }
}

export async function registrarVentaFeria(
  supabase: SupabaseClient,
  params: { pedidoId: string; vendedorId: string | null; vendedorTipo: string; productoTitulo: string; precio: number }
): Promise<void> {
  if (params.vendedorTipo !== "feria" || !params.vendedorId) return
  const { comision, monto_neto } = calcularComision(params.precio)
  await supabase.from("ventas").insert({
    id: `V-${params.pedidoId}`,
    pedido_id: params.pedidoId,
    vendedor_id: params.vendedorId,
    producto_titulo: params.productoTitulo,
    monto_bruto: params.precio,
    comision,
    monto_neto,
    status: "pendiente",
  })
}

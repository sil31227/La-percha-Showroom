import { createAdminClient } from "@/lib/supabase-admin"
import { registrarVentaFeria } from "@/lib/ventas"
import { NextResponse } from "next/server"
import { sendAdminPush, sendSellerPush } from "@/lib/push"

interface CheckoutItem {
  productId: string
  title: string
  price: number
  image: string
  size: string
  store_type: string
  variantLabel?: string
  variantPrice?: number
}

function calcularCostoEnvio(
  metodo: string,
  subtotal: number,
  cfg: { sucursal_price: number; domicilio_price: number; free_threshold: number; domicilio_surcharge: number }
): number {
  if (metodo === "arreglar_vendedor") return 0
  if (metodo === "retiro_local") return 0
  if (subtotal >= cfg.free_threshold) {
    if (metodo === "correo_sucursal") return 0
    if (metodo === "correo_domicilio") return cfg.domicilio_surcharge
  }
  if (metodo === "correo_sucursal") return cfg.sucursal_price
  if (metodo === "correo_domicilio") return cfg.domicilio_price
  return 0
}

export async function POST(req: Request) {
  const supabase = createAdminClient()

  try {
    const body: {
      items: CheckoutItem[]
      direccion: unknown
      email?: string
      paymentMethod?: string
      metodo_envio?: string
      costo_envio?: number
    } = await req.json()
    const { items, direccion, email, paymentMethod, metodo_envio, costo_envio } = body

    if (!items?.length) {
      return NextResponse.json({ error: "El carrito está vacío" }, { status: 400 })
    }

    const rpcItems = items.map(item => ({
      product_id: item.productId,
      variant_label: item.variantLabel || null,
      size: item.size || null,
    }))

    const { data: reserved, error: rpcError } = await supabase.rpc("checkout_reservar_stock", {
      p_items: rpcItems,
    })

    if (rpcError || !reserved) {
      const msg = (rpcError as { message?: string })?.message || ""
      if (msg.includes("Sin stock")) {
        return NextResponse.json({ error: msg }, { status: 409 })
      }
      if (msg.includes("Variante no encontrada") || msg.includes("Producto no encontrado")) {
        return NextResponse.json({ error: msg }, { status: 400 })
      }
      console.error("[crear-pedido] Error en RPC checkout_reservar_stock:", rpcError)
      return NextResponse.json({ error: "Error al reservar stock" }, { status: 500 })
    }

    const vendedorIds = [...new Set(reserved.map((p: Record<string, unknown>) => p.vendedor_id as string).filter(Boolean))]
    const vendedorEmails = new Map<string, string>()
    if (vendedorIds.length > 0) {
      const { data: vendorData } = await supabase
        .from("vendedores")
        .select("id, email")
        .in("id", vendedorIds)
      if (vendorData) {
        for (const v of vendorData) {
          if (v.email) vendedorEmails.set(v.id as string, v.email as string)
        }
      }
    }

    const subtotal = reserved.reduce(
      (sum: number, r: Record<string, unknown>) =>
        sum + Number(r.variant_price ?? r.precio),
      0
    )

    const { data: cfgData } = await supabase.from("configuracion_envio").select("sucursal_price, domicilio_price, free_threshold, domicilio_surcharge").single()
    const metodo = metodo_envio || "arreglar_vendedor"
    let shipping = 0

    if (cfgData) {
      shipping = calcularCostoEnvio(metodo, subtotal, cfgData)
      if (costo_envio !== undefined && costo_envio !== shipping) {
        return NextResponse.json({ error: "El costo de envío no coincide con la configuración actual" }, { status: 400 })
      }
    } else if (costo_envio !== undefined) {
      shipping = costo_envio
    }

    const orderId = `LP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
    const now = new Date().toISOString()

    const addr = (direccion && typeof direccion === "object" ? direccion : {}) as { nombre?: string; email?: string }
    const compradorNombre = addr.nombre || email || "Comprador"
    const compradorEmail = addr.email || email || ""

    const itemByProductId = new Map(items.map(i => [i.productId, i]))

    for (const r of reserved as Array<Record<string, unknown>>) {
      const pid = r.product_id as string
      const vid = r.vendedor_id as string | null | undefined
      const vtipo = r.vendedor_tipo as string | undefined
      const precio = Number(r.variant_price ?? r.precio)
      const originalItem = itemByProductId.get(pid)

      const { error: insertError } = await supabase.from("pedidos").insert({
        id: `${orderId}-${pid.slice(-4)}`,
        producto_titulo: r.titulo as string,
        producto_imagen: (r.imagenes as string[])?.[0] || (originalItem?.image || ""),
        producto_id: pid,
        vendedor_id: vid as string | undefined,
        vendedor_tipo: vtipo as string | undefined,
        precio,
        comprador_nombre: compradorNombre,
        comprador_email: compradorEmail,
        vendedor_nombre: r.vendedor_nombre as string,
        vendedor_email: vid ? vendedorEmails.get(vid as string) || "" : "",
        talle: originalItem?.size || "",
        variante_label: (r.variant_label as string) || null,
        variante_atributos: r.variant_attributes as Record<string, string> | null,
        direccion: typeof direccion === "object" ? JSON.stringify(direccion) : String(direccion || ""),
        status: "pending_shipment",
        metodo_envio: metodo,
        costo_envio: shipping,
        created_at: now,
      })
      if (insertError) {
        console.error("[crear-pedido] Error insertando pedido:", insertError)
        return NextResponse.json({ error: "Error al crear el pedido" }, { status: 500 })
      }
      await registrarVentaFeria(supabase, {
        pedidoId: `${orderId}-${pid.slice(-4)}`,
        vendedorId: vid ?? null,
        vendedorTipo: vtipo ?? "oficial",
        productoTitulo: r.titulo as string,
        precio,
      })
      if (r.sold_out) {
        await supabase
          .from("productos")
          .update({ status: "sold", vendido: true })
          .eq("id", pid)
      }
    }

    const totalPush = subtotal + shipping
    sendAdminPush({
      title: "🛍️ Nuevo pedido",
      body: `${compradorNombre} · $${totalPush.toLocaleString("es-AR")} · #${orderId}`,
      url: "/admin/pedidos",
      tag: `pedido-${orderId}`,
    }).catch(() => {})

    const vendedoresNotificados = new Set<string>()
    for (const r of reserved as Array<Record<string, unknown>>) {
      const vid = r.vendedor_id as string | undefined
      const titulo = r.titulo as string
      if (vid && !vendedoresNotificados.has(vid)) {
        vendedoresNotificados.add(vid)
        await supabase.from("notifications").insert({
          id: `product-sold-${orderId}-${vid}-${Date.now()}`,
          user_id: vid,
          type: "product_sold",
          title: "¡Vendiste un producto!",
          body: `Alguien compró "${titulo}". Revisá tus ventas.`,
          link: "/perfil/ventas",
        }).then(({ error }) => {
          if (error) console.error("[crear-pedido] Error insertando notificación:", error)
        })
        sendSellerPush(vid, {
          title: "¡Vendiste un producto!",
          body: `Alguien compró "${titulo}". Revisá tus ventas.`,
          url: "/perfil/ventas",
          tag: `venta-${orderId}-${vid}`,
        }).catch(() => {})
      }
    }

    return NextResponse.json({
      ok: true,
      orderId,
      total: subtotal + shipping,
      subtotal,
      shipping,
      metodo_envio: metodo,
      paymentMethod: paymentMethod || "mercadopago",
    })
  } catch (err) {
    console.error("Error creando pedido:", err)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

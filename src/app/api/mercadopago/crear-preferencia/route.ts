import { NextResponse } from "next/server"
import { sendSellerPush } from "@/lib/push"
import { MercadoPagoConfig, Preference } from "mercadopago"
import { createAdminClient } from "@/lib/supabase-admin"

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://laperchashowroom.com.ar"

interface CheckoutItem {
  productId: string
  title: string
  price: number
  image: string
  size: string
  store_type: string
  variantLabel?: string
  variantPrice?: number
  variantAttributes?: Record<string, string>
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
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN

  if (!accessToken) {
    return NextResponse.json({ error: "Mercado Pago no configurado" }, { status: 500 })
  }

  try {
    const body: {
      items: CheckoutItem[]
      direccion: unknown
      email?: string
      payerName?: string
      metodo_envio?: string
      costo_envio?: number
    } = await req.json()
    const { items, direccion, email, payerName, metodo_envio, costo_envio } = body

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
      console.error("[crear-preferencia] Error en RPC checkout_reservar_stock:", rpcError)
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

    const itemByProductId = new Map(items.map(i => [i.productId, i]))

    const validItems = (reserved as Array<Record<string, unknown>>).map(r => {
      const pid = r.product_id as string
      const original = itemByProductId.get(pid)
      return {
        productId: pid,
        title: r.titulo as string,
        price: Number(r.variant_price ?? r.precio),
        image: (r.imagenes as string[])?.[0] || (original?.image || ""),
        size: original?.size || "",
        vendedor_nombre: r.vendedor_nombre as string,
        variantLabel: (r.variant_label as string) || undefined,
        variantAttributes: r.variant_attributes as Record<string, string> | undefined,
      }
    })

    const subtotal = validItems.reduce((sum, i) => sum + i.price, 0)

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
    const compradorNombre = addr.nombre || payerName || email || "Comprador"
    const compradorEmail = addr.email || email || ""

    const reservedMap = new Map(
      (reserved as Array<Record<string, unknown>>).map(r => [r.product_id as string, r])
    )

    for (const item of validItems) {
      const r = reservedMap.get(item.productId)
      const vid = r?.vendedor_id as string | undefined
      await supabase.from("pedidos").insert({
        id: `${orderId}-${item.productId.slice(-4)}`,
        producto_titulo: item.title,
        producto_imagen: item.image,
        producto_id: item.productId,
        vendedor_id: vid,
        vendedor_tipo: r?.vendedor_tipo as string | undefined,
        precio: item.price,
        comprador_nombre: compradorNombre,
        comprador_email: compradorEmail,
        vendedor_nombre: item.vendedor_nombre,
        vendedor_email: vid ? vendedorEmails.get(vid) || "" : "",
        talle: item.size,
        variante_label: item.variantLabel,
        variante_atributos: item.variantAttributes,
        direccion: typeof direccion === "object" ? JSON.stringify(direccion) : String(direccion || ""),
        status: "pending_shipment",
        metodo_envio: metodo,
        costo_envio: shipping,
        created_at: now,
      })
      if (r?.sold_out) {
        await supabase
          .from("productos")
          .update({ status: "sold", vendido: true })
          .eq("id", item.productId)
      }
    }

    const vendedoresNotificados = new Set<string>()
    for (const item of validItems) {
      const r = reservedMap.get(item.productId)
      if (r && r.vendedor_id) {
        const vid = r.vendedor_id as string
        if (!vendedoresNotificados.has(vid)) {
          vendedoresNotificados.add(vid)
          await supabase.from("notifications").insert({
            id: `product-sold-${orderId}-${vid}-${Date.now()}`,
            user_id: vid,
            type: "product_sold",
            title: "¡Vendiste un producto!",
            body: `Alguien compró "${r.titulo}". Revisá tus ventas.`,
            link: "/perfil/ventas",
          }).then(({ error }) => {
            if (error) console.error("[crear-preferencia] Error insertando notificación:", error)
          })
          sendSellerPush(vid, {
            title: "¡Vendiste un producto!",
            body: `Alguien compró "${r.titulo}". Revisá tus ventas.`,
            url: "/perfil/ventas",
            tag: `venta-${orderId}-${vid}`,
          }).catch(() => {})
        }
      }
    }

    const mpClient = new MercadoPagoConfig({ accessToken })
    const preference = new Preference(mpClient)

    const result = await preference.create({
      body: {
        external_reference: orderId,
        items: validItems.map(item => ({
          id: item.productId,
          title: item.title,
          description: item.size ? `Talle ${item.size}` : "",
          unit_price: item.price,
          quantity: 1,
          picture_url: item.image,
        })),
        shipments: shipping > 0 ? { cost: shipping, mode: "not_specified" } : undefined,
        back_urls: {
          success: `${siteUrl}/checkout/paso-3?status=approved&order_id=${orderId}`,
          pending: `${siteUrl}/checkout/paso-3?status=pending&order_id=${orderId}`,
          failure: `${siteUrl}/checkout/paso-2?status=rejected`,
        },
        auto_return: "approved",
        notification_url: `${siteUrl}/api/mercadopago/webhook`,
        payer: email ? { email, name: payerName || email } : undefined,
        statement_descriptor: "La Percha Showroom",
      },
    })

    return NextResponse.json({
      ok: true,
      orderId,
      initPoint: result.init_point,
      sandboxInitPoint: result.sandbox_init_point,
      preferenceId: result.id,
      total: subtotal + shipping,
      subtotal,
      shipping,
      metodo_envio: metodo,
    })
  } catch (err) {
    console.error("Error creando preferencia MP:", err)
    return NextResponse.json({ error: "Error al crear la preferencia de pago" }, { status: 500 })
  }
}

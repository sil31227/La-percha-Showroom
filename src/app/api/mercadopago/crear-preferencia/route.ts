import { NextResponse } from "next/server"
import { sendSellerPush } from "@/lib/push"
import { MercadoPagoConfig, Preference } from "mercadopago"
import { createAdminClient } from "@/lib/supabase-admin"

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"

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

    const ids = items.map(i => i.productId)

    const { data: products, error: productError } = await supabase
      .from("productos")
      .select("id, titulo, precio, imagenes, vendedor_nombre, vendedor_id, vendedor_tipo, status, variantes, stock")
      .in("id", ids)

    if (productError || !products) {
      return NextResponse.json({ error: "Error al validar productos" }, { status: 500 })
    }

    if (products.length !== ids.length) {
      return NextResponse.json({ error: "Uno o más productos no existen" }, { status: 400 })
    }

    const productMap = new Map(products.map(p => [p.id, p]))

    const vendedorIds = [...new Set(products.map(p => (p as Record<string, unknown>).vendedor_id as string).filter(Boolean))]
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

    for (const item of items) {
      const prod = productMap.get(item.productId)!
      if (item.variantLabel) {
        const variantes = (prod.variantes as Array<Record<string, unknown>>) || []
        const variant = variantes.find(
          (v: Record<string, unknown>) => v.nombre === item.variantLabel
        )
        if (!variant) {
          return NextResponse.json(
            { error: `Variante "${item.variantLabel}" no encontrada para "${prod.titulo}"` },
            { status: 400 }
          )
        }
        const variantStock = Number(variant.stock)
        if (isNaN(variantStock) || variantStock < 1) {
          return NextResponse.json(
            { error: `Sin stock de "${item.variantLabel}" para "${prod.titulo}"` },
            { status: 400 }
          )
        }
      } else {
        const generalStock = Number(prod.stock)
        if (isNaN(generalStock) || generalStock < 1) {
          return NextResponse.json(
            { error: `Sin stock para "${prod.titulo}"` },
            { status: 400 }
          )
        }
      }
    }

    const soldProductIds = new Set<string>()

    for (const item of items) {
      const prod = productMap.get(item.productId)!
      if (item.variantLabel) {
        const variantes = (prod.variantes as Array<Record<string, unknown>>) || []
        const variantIdx = variantes.findIndex(
          (v: Record<string, unknown>) => v.nombre === item.variantLabel
        )
        if (variantIdx !== -1) {
          const updatedVariants = [...variantes]
          const oldStock = Number(updatedVariants[variantIdx].stock)
          updatedVariants[variantIdx] = {
            ...updatedVariants[variantIdx],
            stock: Math.max(0, oldStock - 1),
          }
          const totalStock = updatedVariants.reduce((s, v: Record<string, unknown>) => s + Number(v.stock ?? 0), 0)
          if (totalStock === 0) soldProductIds.add(item.productId)
          await supabase
            .from("productos")
            .update({ variantes: updatedVariants })
            .eq("id", item.productId)
        }
      } else {
        const newStock = Math.max(0, Number(prod.stock) - 1)
        if (newStock === 0) soldProductIds.add(item.productId)
        await supabase
          .from("productos")
          .update({ stock: newStock })
          .eq("id", item.productId)
      }
    }

    const validItems = items.map(item => {
      const prod = productMap.get(item.productId)!
      return {
        ...item,
        title: prod.titulo as string,
        price: item.variantPrice || Number(prod.precio),
        image: (prod.imagenes as string[])?.[0] || item.image,
        vendedor_nombre: prod.vendedor_nombre as string,
      }
    })

    const subtotal = validItems.reduce((sum, i) => sum + i.price, 0)

    const { data: cfgData } = await supabase.from("configuracion_envio").select("*").single()
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

    for (const item of validItems) {
      const prod = productMap.get(item.productId)!
      const vid = (prod as Record<string, unknown>)?.vendedor_id as string | undefined
      await supabase.from("pedidos").insert({
        id: `${orderId}-${item.productId.slice(-4)}`,
        producto_titulo: item.title,
        producto_imagen: item.image,
        producto_id: item.productId,
        vendedor_id: vid,
        vendedor_tipo: (prod as Record<string, unknown>)?.vendedor_tipo as string | undefined,
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
      if (soldProductIds.has(item.productId)) {
        await supabase
          .from("productos")
          .update({ status: "sold", vendido: true })
          .eq("id", item.productId)
      }
    }

    const vendedoresNotificados = new Set<string>()
    for (const item of validItems) {
      const prod = productMap.get(item.productId)
      if (prod && (prod as Record<string, unknown>).vendedor_id) {
        const vid = (prod as Record<string, unknown>).vendedor_id as string
        if (!vendedoresNotificados.has(vid)) {
          vendedoresNotificados.add(vid)
          await supabase.from("notifications").insert({
            id: `product-sold-${orderId}-${vid}-${Date.now()}`,
            user_id: vid,
            type: "product_sold",
            title: "¡Vendiste un producto!",
            body: `Alguien compró "${prod.titulo}". Revisá tus ventas.`,
            link: "/perfil/ventas",
          }).then(({ error }) => {
            if (error) console.error("[crear-preferencia] Error insertando notificación:", error)
          })
          sendSellerPush(vid, {
            title: "¡Vendiste un producto!",
            body: `Alguien compró "${prod.titulo}". Revisá tus ventas.`,
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

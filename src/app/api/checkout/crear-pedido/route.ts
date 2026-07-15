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
        title: prod.titulo,
        price: Number(prod.precio),
        image: (prod.imagenes as string[])?.[0] || item.image,
        vendedor_nombre: prod.vendedor_nombre,
        vendedor_tipo: prod.vendedor_tipo,
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
    const compradorNombre = addr.nombre || email || "Comprador"
    const compradorEmail = addr.email || email || ""

    for (const item of validItems) {
      const prod = productMap.get(item.productId)
      const vid = (prod as Record<string, unknown>)?.vendedor_id as string | null | undefined
      const vtipo = (prod as Record<string, unknown>)?.vendedor_tipo as string | undefined
      await supabase.from("pedidos").insert({
        id: `${orderId}-${item.productId.slice(-4)}`,
        producto_titulo: item.title,
        producto_imagen: item.image,
        producto_id: item.productId,
        vendedor_id: vid as string | undefined,
        vendedor_tipo: vtipo as string | undefined,
        precio: item.price,
        comprador_nombre: compradorNombre,
        comprador_email: compradorEmail,
        vendedor_nombre: item.vendedor_nombre,
        vendedor_email: vid ? vendedorEmails.get(vid) || "" : "",
        talle: item.size,
        direccion: typeof direccion === "object" ? JSON.stringify(direccion) : String(direccion || ""),
        status: "pending_shipment",
        metodo_envio: metodo,
        costo_envio: shipping,
        created_at: now,
      })
      await registrarVentaFeria(supabase, {
        pedidoId: `${orderId}-${item.productId.slice(-4)}`,
        vendedorId: vid ?? null,
        vendedorTipo: vtipo ?? "oficial",
        productoTitulo: item.title,
        precio: item.price,
      })
      if (soldProductIds.has(item.productId)) {
        await supabase
          .from("productos")
          .update({ status: "sold" })
          .eq("id", item.productId)
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
    for (const item of validItems) {
      const prod = productMap.get(item.productId)
      if (prod && (prod as Record<string, unknown>).vendedor_id) {
        const vid = (prod as Record<string, unknown>).vendedor_id as string
        if (!vendedoresNotificados.has(vid)) {
          vendedoresNotificados.add(vid)
          sendSellerPush(vid, {
            title: "¡Vendiste un producto!",
            body: `Alguien compró "${prod.titulo}". Revisá tus ventas.`,
            url: "/perfil/ventas",
            tag: `venta-${orderId}-${vid}`,
          }).catch(() => {})
        }
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

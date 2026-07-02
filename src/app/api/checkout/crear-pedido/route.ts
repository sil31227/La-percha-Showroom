import { createAdminClient } from "@/lib/supabase-admin"
import { NextResponse } from "next/server"

interface CheckoutItem {
  productId: string
  title: string
  price: number
  image: string
  size: string
  store_type: string
}

export async function POST(req: Request) {
  const supabase = createAdminClient()

  try {
    const body: { items: CheckoutItem[]; direccion: unknown; email?: string; paymentMethod?: string } = await req.json()
    const { items, direccion, email, paymentMethod } = body

    if (!items?.length) {
      return NextResponse.json({ error: "El carrito está vacío" }, { status: 400 })
    }

    const ids = items.map(i => i.productId)

    const { data: products, error: productError } = await supabase
      .from("productos")
      .select("id, titulo, precio, imagenes, vendedor_nombre, vendedor_tipo, status")
      .in("id", ids)

    if (productError || !products) {
      return NextResponse.json({ error: "Error al validar productos" }, { status: 500 })
    }

    if (products.length !== ids.length) {
      return NextResponse.json({ error: "Uno o más productos no existen" }, { status: 400 })
    }

    const productMap = new Map(products.map(p => [p.id, p]))

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

    const orderId = `LP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
    const total = validItems.reduce((sum, i) => sum + i.price, 0)
    const shipping = total >= 25000 ? 0 : 4500

    const now = new Date().toISOString()

    for (const item of validItems) {
      await supabase.from("pedidos").insert({
        id: `${orderId}-${item.productId.slice(-4)}`,
        producto_titulo: item.title,
        producto_imagen: item.image,
        precio: item.price,
        comprador_nombre: email || "Comprador",
        comprador_email: email || "",
        vendedor_nombre: item.vendedor_nombre,
        vendedor_email: "",
        talle: item.size,
        direccion: typeof direccion === "object" ? JSON.stringify(direccion) : String(direccion || ""),
        status: "pending_shipment",
        created_at: now,
      })
    }

    return NextResponse.json({
      ok: true,
      orderId,
      total: total + shipping,
      subtotal: total,
      shipping,
      paymentMethod: paymentMethod || "mercadopago",
    })
  } catch (err) {
    console.error("Error creando pedido:", err)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

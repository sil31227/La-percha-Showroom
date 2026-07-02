import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-admin"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "No se recibió ningún archivo" }, { status: 400 })
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "El archivo supera los 10MB" }, { status: 400 })
    }

    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"]
    if (!allowed.includes(file.type)) {
      return NextResponse.json({ error: "Formato no permitido. Usá JPEG, PNG, WebP, GIF o AVIF" }, { status: 400 })
    }

    const ext = file.name.split(".").pop() || "jpg"
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

    const supabase = createAdminClient()

    const { error } = await supabase.storage
      .from("productos")
      .upload(filename, file, {
        cacheControl: "3600",
        upsert: false,
      })

    if (error) {
      console.error("Error al subir a Supabase Storage:", error.message)
      return NextResponse.json({ error: "Error al subir la imagen: " + error.message }, { status: 500 })
    }

    const { data: urlData } = supabase.storage.from("productos").getPublicUrl(filename)

    return NextResponse.json({ url: urlData.publicUrl })
  } catch (err) {
    console.error("Error en upload:", err)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

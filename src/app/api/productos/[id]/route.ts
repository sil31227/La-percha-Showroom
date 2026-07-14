import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-admin"

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createAdminClient()

    const { data: product, error: fetchError } = await supabase
      .from("productos")
      .select("id, imagenes")
      .eq("id", id)
      .single()

    if (fetchError || !product) {
      return NextResponse.json({ error: "Publicación no encontrada" }, { status: 404 })
    }

    const imagePaths = ((product.imagenes as string[]) || [])
      .filter((url: string) => url.includes("hvmctiqzjbqsghuwhquk.supabase.co"))
      .map((url: string) => {
        const parts = url.split("/productos/")
        return parts[1]?.split("?")[0]
      })
      .filter(Boolean) as string[]

    const { error: deleteError } = await supabase
      .from("productos")
      .delete()
      .eq("id", id)

    if (deleteError) {
      console.error("Error eliminando producto:", deleteError.message)
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    if (imagePaths.length > 0) {
      await supabase.storage.from("productos").remove(imagePaths)
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("Error en delete producto:", err)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  "https://hvmctiqzjbqsghuwhquk.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2bWN0aXF6amJxc2dodXdocXVrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjEyOTYwOCwiZXhwIjoyMDk3NzA1NjA4fQ.RqR8FPN6dUUviSAppbtMMpM8wTyO42hnZ_1iZLq0sgE"
)

const categorias = [
  { id: "mujer", nombre: "Mujer", orden: 1 },
  { id: "hombre", nombre: "Hombre", orden: 2 },
  { id: "kids", nombre: "Kids", orden: 3 },
  { id: "tienda", nombre: "Tienda Percha", orden: 4 },
]

const subcategorias = [
  { id: "ropa", categoria_id: "mujer", nombre: "Ropa", orden: 1 },
  { id: "calzado", categoria_id: "mujer", nombre: "Calzado", orden: 2 },
  { id: "accesorios", categoria_id: "mujer", nombre: "Accesorios", orden: 3 },
  { id: "belleza", categoria_id: "mujer", nombre: "Belleza", orden: 4 },
  { id: "ropa-h", categoria_id: "hombre", nombre: "Ropa", orden: 1 },
  { id: "calzado-h", categoria_id: "hombre", nombre: "Calzado", orden: 2 },
  { id: "accesorios-h", categoria_id: "hombre", nombre: "Accesorios", orden: 3 },
  { id: "bebes", categoria_id: "kids", nombre: "Bebés", orden: 1 },
  { id: "ninas", categoria_id: "kids", nombre: "Niñas", orden: 2 },
  { id: "ninos", categoria_id: "kids", nombre: "Niños", orden: 3 },
  { id: "regaleria", categoria_id: "tienda", nombre: "Regalería", orden: 1 },
  { id: "bazar", categoria_id: "tienda", nombre: "Bazar", orden: 2 },
  { id: "decoracion", categoria_id: "tienda", nombre: "Decoración", orden: 3 },
]

const { error: catErr } = await supabase.from("categorias").upsert(categorias, { onConflict: "id" })
if (catErr) { console.error("❌ categorias:", catErr.message); process.exit(1) }
console.log("✅ Categorías creadas")

const { error: subErr } = await supabase.from("subcategorias").upsert(subcategorias, { onConflict: "id" })
if (subErr) { console.error("❌ subcategorias:", subErr.message); process.exit(1) }
console.log("✅ Subcategorías creadas")

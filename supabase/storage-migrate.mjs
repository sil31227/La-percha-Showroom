import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  "https://hvmctiqzjbqsghuwhquk.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2bWN0aXF6amJxc2dodXdocXVrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjEyOTYwOCwiZXhwIjoyMDk3NzA1NjA4fQ.RqR8FPN6dUUviSAppbtMMpM8wTyO42hnZ_1iZLq0sgE"
)

const { data, error } = await supabase.storage.createBucket("productos", {
  public: true,
  fileSizeLimit: "10MB",
  allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"],
})

if (error) {
  if (error.message?.includes("already exists") || error.message?.includes("Duplicate")) {
    console.log("⚠️  El bucket 'productos' ya existe, actualizando...")
    const { error: updError } = await supabase.storage.updateBucket("productos", {
      public: true,
      fileSizeLimit: "10MB",
      allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"],
    })
    if (updError) console.error("❌", updError.message)
    else console.log("✅ Bucket 'productos' actualizado exitosamente")
  } else {
    console.error("❌", error.message)
  }
} else {
  console.log("✅ Bucket 'productos' creado exitosamente")
}

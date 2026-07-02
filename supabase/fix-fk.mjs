import { createClient } from "@supabase/supabase-js"
import fs from "fs"

const supabase = createClient(
  "https://hvmctiqzjbqsghuwhquk.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2bWN0aXF6amJxc2dodXdocXVrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjEyOTYwOCwiZXhwIjoyMDk3NzA1NjA4fQ.RqR8FPN6dUUviSAppbtMMpM8wTyO42hnZ_1iZLq0sgE"
)

const sql = `
ALTER TABLE productos DROP CONSTRAINT IF EXISTS productos_categoria_id_fkey;
ALTER TABLE productos DROP CONSTRAINT IF EXISTS productos_subcategoria_id_fkey;
`

const { data, error } = await supabase.rpc("exec_sql", { sql_text: sql }).single()

if (error) {
  console.error("❌ Error rpc:", error.message)
} else {
  console.log("✅ FKs eliminadas de productos")
}

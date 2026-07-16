import { createClient } from "@supabase/supabase-js"
import fs from "fs"
import pg from "pg"

const PROJECT_REF = "hvmctiqzjbqsghuwhquk"
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2bWN0aXF6amJxc2dodXdocXVrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjEyOTYwOCwiZXhwIjoyMDk3NzA1NjA4fQ.RqR8FPN6dUUviSAppbtMMpM8wTyO42hnZ_1iZLq0sgE"

const pool = new pg.Pool({
  host: `db.${PROJECT_REF}.supabase.co`,
  port: 5432,
  database: "postgres",
  user: "postgres",
  password: SERVICE_ROLE_KEY,
  ssl: { rejectUnauthorized: false },
})

const sql = fs.readFileSync(new URL("./schema.sql", import.meta.url), "utf8")

try {
  await pool.query(sql)
  console.log("✅ Schema migrado exitosamente")
} catch (error) {
  console.error("❌", error.message)
} finally {
  await pool.end()
}

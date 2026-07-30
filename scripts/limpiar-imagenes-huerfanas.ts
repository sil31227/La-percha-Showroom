/**
 * Script para detectar y eliminar imágenes huérfanas del bucket "productos".
 *
 * Huérfanas = archivos en Supabase Storage que no están referenciados
 * por ninguna tabla (productos, profiles, vendedores, pedidos).
 *
 * Uso:
 *   npx tsx scripts/limpiar-imagenes-huerfanas.ts --dry-run   (solo listar)
 *   npx tsx scripts/limpiar-imagenes-huerfanas.ts              (listar y borrar)
 */

import { createClient } from "@supabase/supabase-js"
import * as fs from "fs"
import * as path from "path"

const BATCH_SIZE = 50
const SUPABASE_URL = "https://hvmctiqzjbqsghuwhquk.supabase.co"

function loadEnv() {
  const envPath = path.resolve(process.cwd(), ".env.local")
  if (!fs.existsSync(envPath)) {
    console.error("❌ .env.local no encontrado en", envPath)
    process.exit(1)
  }
  const content = fs.readFileSync(envPath, "utf-8")
  for (const line of content.split("\n")) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const eqIndex = trimmed.indexOf("=")
    if (eqIndex === -1) continue
    const key = trimmed.slice(0, eqIndex)
    let value = trimmed.slice(eqIndex + 1)
    value = value.replace(/^["']|["']$/g, "")
    if (key && value) process.env[key] = value
  }
}

function extractStoragePath(url: string): string | null {
  const parts = url.split("/productos/")
  if (parts.length < 2) return null
  return parts[1]?.split("?")[0] || null
}

async function listAllFiles(
  supabase: ReturnType<typeof createClient>,
  prefix = "",
): Promise<string[]> {
  const files: string[] = []
  let offset = 0
  const limit = 100

  while (true) {
    const { data, error } = await supabase.storage
      .from("productos")
      .list(prefix, { limit, offset, sortBy: { column: "name", order: "asc" } })

    if (error) {
      console.error(`  ⚠️  Error listando "${prefix || "/"}": ${error.message}`)
      break
    }

    if (!data || data.length === 0) break

    for (const item of data) {
      if (item.id === null) {
        const subFiles = await listAllFiles(
          supabase,
          prefix ? `${prefix}/${item.name}` : item.name,
        )
        files.push(...subFiles)
      } else {
        const fullPath = prefix ? `${prefix}/${item.name}` : item.name
        files.push(fullPath)
      }
    }

    if (data.length < limit) break
    offset += limit
  }

  return files
}

async function main() {
  loadEnv()

  const dryRun = process.argv.includes("--dry-run")
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!serviceRoleKey) {
    console.error("❌ SUPABASE_SERVICE_ROLE_KEY no configurada en .env.local")
    process.exit(1)
  }

  const supabase = createClient(SUPABASE_URL, serviceRoleKey)

  console.log("🔍 Listando archivos en el bucket 'productos'...")
  const storageFiles = await listAllFiles(supabase)
  console.log(`   ${storageFiles.length} archivos encontrados\n`)

  const referencedPaths = new Set<string>()

  console.log("📋 Obteniendo imágenes referenciadas desde 'productos.imagenes'...")
  const { data: productos, error: dbError } = await supabase
    .from("productos")
    .select("id, imagenes")

  if (dbError) {
    console.error("❌ Error consultando productos:", dbError.message)
    process.exit(1)
  }

  for (const p of productos ?? []) {
    for (const url of (p.imagenes as string[]) || []) {
      const sp = extractStoragePath(url)
      if (sp) referencedPaths.add(sp)
    }
  }
  console.log(
    `   ${referencedPaths.size} rutas únicas desde ${productos?.length ?? 0} productos`,
  )

  console.log("📋 Obteniendo imágenes referenciadas desde 'profiles.avatar_url'...")
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, avatar_url")

  if (profilesError) {
    console.error("❌ Error consultando profiles:", profilesError.message)
    process.exit(1)
  }

  let avatarRefs = 0
  for (const p of profiles ?? []) {
    const sp = extractStoragePath((p.avatar_url as string) || "")
    if (sp) {
      referencedPaths.add(sp)
      avatarRefs++
    }
  }
  console.log(
    `   ${avatarRefs} avatares referenciados desde ${profiles?.length ?? 0} perfiles`,
  )

  console.log("📋 Obteniendo imágenes referenciadas desde 'vendedores.avatar'...")
  const { data: vendedoresData, error: vendedoresError } = await supabase
    .from("vendedores")
    .select("id, avatar")

  if (vendedoresError) {
    console.error("❌ Error consultando vendedores:", vendedoresError.message)
    process.exit(1)
  }

  let vendorAvatarRefs = 0
  for (const v of vendedoresData ?? []) {
    const sp = extractStoragePath((v.avatar as string) || "")
    if (sp) {
      referencedPaths.add(sp)
      vendorAvatarRefs++
    }
  }
  console.log(
    `   ${vendorAvatarRefs} avatares referenciados desde ${vendedoresData?.length ?? 0} vendedores`,
  )

  console.log("📋 Obteniendo imágenes referenciadas desde 'pedidos.producto_imagen'...")
  const { data: pedidos, error: pedidosError } = await supabase
    .from("pedidos")
    .select("id, producto_imagen")

  if (pedidosError) {
    console.error("❌ Error consultando pedidos:", pedidosError.message)
    process.exit(1)
  }

  let pedidoRefs = 0
  for (const p of pedidos ?? []) {
    const sp = extractStoragePath((p.producto_imagen as string) || "")
    if (sp) {
      referencedPaths.add(sp)
      pedidoRefs++
    }
  }
  console.log(
    `   ${pedidoRefs} imágenes referenciadas desde ${pedidos?.length ?? 0} pedidos\n`,
  )

  console.log(`📊 Total: ${referencedPaths.size} rutas únicas referenciadas\n`)

  const orphaned = storageFiles.filter((f) => !referencedPaths.has(f))
  console.log(`📊 ${orphaned.length} imágenes huérfanas encontradas`)

  if (orphaned.length === 0) {
    console.log("✅ No hay imágenes huérfanas. Todo limpio.")
    return
  }

  console.log("\nImágenes huérfanas:")
  for (const f of orphaned) {
    console.log(`   ${f}`)
  }

  if (dryRun) {
    console.log(`\n💡 Dry run. Para borrar, ejecuta sin --dry-run`)
    return
  }

  console.log(`\n🗑️  Eliminando ${orphaned.length} imágenes huérfanas...`)

  let deleted = 0
  let errores = 0
  for (let i = 0; i < orphaned.length; i += BATCH_SIZE) {
    const batch = orphaned.slice(i, i + BATCH_SIZE)
    const lote = Math.floor(i / BATCH_SIZE) + 1
    const totalLotes = Math.ceil(orphaned.length / BATCH_SIZE)

    const { error } = await supabase.storage.from("productos").remove(batch)
    if (error) {
      console.error(`   ❌ Lote ${lote}/${totalLotes}: ${error.message}`)
      errores += batch.length
    } else {
      deleted += batch.length
      console.log(`   ✅ Lote ${lote}/${totalLotes}: ${batch.length} eliminadas`)
    }
  }

  console.log(
    `\n✅ ${deleted} imágenes eliminadas` +
      (errores > 0 ? ` (${errores} con error)` : ""),
  )
}

main().catch((err) => {
  console.error("❌ Error inesperado:", err)
  process.exit(1)
})

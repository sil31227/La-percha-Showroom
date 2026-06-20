# Tech Stack — Investigación

Evaluación de opciones tecnológicas para La Percha Showroom.

---

## Requisitos del sistema

| Requisito | Prioridad | Notas |
|-----------|-----------|-------|
| **Mobile-first PWA** | Alta | La app del comprador debe sentirse nativa en iOS/Android |
| **Desktop responsive** | Alta | Los paneles de admin y vendedor son desktop-first |
| **Autenticación** | Alta | Login con teléfono, roles (comprador/vendedor/admin) |
| **Base de datos** | Alta | Productos, usuarios, órdenes, favoritos, pagos |
| **Upload de imágenes** | Alta | Multi-upload, optimización, thumbnails |
| **Pagos** | Alta | Integración con Mercado Pago (checkout + notificaciones IPN) |
| **Emails** | Media | Notificaciones transaccionales (compra, envío, entrega) |
| **Hosting** | Alta | Serverless o bajo costo para MVP |
| **Dominio** | Alta | .com.ar, SSL |

---

## Comparativa de stacks

### Opción A: Next.js + Supabase (Recomendada)

| Capa | Tech | Costo MVP |
|------|------|-----------|
| Frontend | Next.js 14 (App Router) | $0 (Vercel) |
| UI | Tailwind CSS + Design System propio | $0 |
| Auth | Supabase Auth (magic link + phone) | $0 |
| DB | Supabase PostgreSQL | $0 |
| Storage | Supabase Storage | $0 (5GB) |
| API | Next.js API Routes | $0 |
| Pagos | Mercado Pago SDK | $0 + comisiones |
| Email | Resend | $0 (100/día) |

**Ventajas:**
- Stack unificado (React en frontend y backend)
- Supabase free tier generoso (500MB DB, 5GB storage, 50K usuarios)
- RLS para seguridad a nivel base de datos
- Deploy continuo con Vercel + GitHub
- SSR/SSG para SEO
- Gran ecosistema y comunidad

**Desventajas:**
- Vendor lock-in con Vercel/Supabase (mitigable: son open source)
- Cold starts en API routes (mitigable: edge functions)

### Opción B: Remix + SQLite (Turso)

| Capa | Tech | Costo MVP |
|------|------|-----------|
| Frontend | Remix | $0 (Cloudflare Pages) |
| DB | Turso (SQLite edge) | $0 (9GB) |
| Auth | Clerk o Lucía | $0 (free tier) |
| Storage | Cloudflare R2 | $0 (10GB) |

**Ventajas:**
- Edge-first, muy rápido globalmente
- Sin cold starts
- Stack moderno y minimalista

**Desventajas:**
- SQLite menos potente para queries complejas
- Menos integraciones que el ecosistema Vercel/Next
- Clerk free tier limitado (10K MAU)

### Opción C: Laravel + MySQL + VPS

| Capa | Tech | Costo MVP |
|------|------|-----------|
| Backend | Laravel 11 | $0 (open source) |
| DB | MySQL | ~$15/mes (VPS) |
| Frontend | Blade + Livewire o Inertia + React | $0 |
| Hosting | VPS (DigitalOcean/Hostinger) | ~$15-25/mes |

**Ventajas:**
- Robusto, ecosistema maduro
- Control total del servidor

**Desventajas:**
- Costo mensual fijo
- Mayor overhead de operaciones (server management)
- Menor velocidad de iteración que serverless

---

## Decisión

**Recomendación: Next.js + Supabase** (ver [[../../02 - WDS/E-Development/README|E-Development]] para el plan de implementación detallado).

---

## Links

- [[../../01 - PROYECTO/La Percha Showroom|La Percha Showroom]]
- [[../../02 - WDS/E-Development/README|E-Development]]
- [[../../01 - PROYECTO/Decisiones|Decisiones]]
- [[Mercado-Bahia-Blanca|Mercado]]
- [[Competencia|Competencia]]

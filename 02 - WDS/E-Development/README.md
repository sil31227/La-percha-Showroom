# E — Development

Arquitectura técnica y plan de implementación de La Percha Showroom.

---

## Dos apps web, una sola API

| App | URL sugerida | Usuarios | Plataforma |
|-----|-------------|----------|------------|
| **App Cliente** | laperchashowroom.com.ar | Compradores y vendedores | Mobile-first (390px) |
| **App Admin** | admin.laperchashowroom.com.ar | Silvina (la dueña) | Desktop (1280px) |

Comparten el mismo backend (Supabase + API Routes). La separación es solo de frontend.

## Stack sugerido

### Opción recomendada: Next.js + Supabase

| Capa | Tecnología | Razón |
|------|-----------|-------|
| **App Cliente** | Next.js 14 (App Router) | SSR/SSG, SEO, mobile-first |
| **App Admin** | Next.js 14 (App Router) | Misma base, rutas y layouts separados |
| **UI Components** | Design System propio + Tailwind CSS | Los 14 componentes del DS son React puro, Tailwind para layout/utilidades |
| **Backend** | Next.js API Routes + Supabase | API serverless compartida por ambas apps |
| **Base de datos** | Supabase (PostgreSQL) | Row Level Security, real-time, storage para imágenes, gratuito generoso |
| **Auth** | Supabase Auth | Una sola auth para ambas apps; el rol `admin` da acceso al panel |
| **Pagos** | Mercado Pago Checkout API | Checkout transparente, webhooks para estado de pago |
| **Storage** | Supabase Storage | Imágenes de productos, avatar de perfil |
| **Email** | Resend | Notificaciones transaccionales, confirmación de compra |
| **Hosting** | Vercel (frontend/API) + Supabase (DB) | Deploy automático, CDN global, SSL, free tier generoso |
| **Dominio** | Por definir (.com.ar) | — |
| **Analytics** | Plausible o Umami | Privacidad-first, simple |
| **Monitoreo** | Sentry (free tier) | Errores en frontend y backend |

### Alternativas

| Opción | Pros | Contras |
|--------|------|---------|
| **Next.js + Prisma + PlanetScale** | SQL tipado, branching | Menos generoso en free tier |
| **Remix + SQLite (Turso)** | Simple, edge-first | SQLite menos potente para queries complejas |
| **Laravel + MySQL** | Robusto, ecosistema PHP | Overkill para MVP, más lento de iterar |
| **Tiendanube / Shopify** | No-code, rápido | Comisiones altas, no soporta modelo "feria de usados" |

---

## Arquitectura

Dos aplicaciones web independientes que comparten backend (API + DB):

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENTE — App Cliente                  │
│  Mobile-first web (390x844), responsive desktop          │
│  Next.js App Router                                      │
│                                                          │
│  ┌─────────────┐  ┌──────────────────────────────────┐  │
│  │ Modo compra  │  │  Modo vendedor (si autorizado)    │  │
│  │ • Home       │  │  • Mis publicaciones              │  │
│  │ • Producto   │  │  • Mis ventas                     │  │
│  │ • Carrito    │  │  • Ganancias                      │  │
│  │ • Favoritos  │  │  • Publicar prenda                │  │
│  │ • Tracking   │  │  • Solicitar retiro               │  │
│  └──────┬───────┘  └──────────────┬───────────────────┘  │
└─────────┼─────────────────────────┼──────────────────────┘
          │                         │
          ▼                         ▼
┌─────────────────────────────────────────────────────────┐
│                  API Compartida                          │
│  Next.js API Routes (mismo dominio o subdominio)         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────┐ │
│  │ Products │ │  Orders  │ │ Sellers  │ │ Admin     │ │
│  │ CRUD     │ │ Flow     │ │ AuthZ    │ │ Moderation│ │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └─────┬─────┘ │
└───────┼─────────────┼───────────┼─────────────┼───────┘
        │             │           │             │
        ▼             ▼           ▼             ▼
┌─────────────────────────────────────────────────────────┐
│                 Supabase (DB + Auth + Storage)            │
│  auth.users │ products │ orders │ favorites │ payouts   │
└─────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────┐
│                    ADMIN — App Admin                      │
│  Desktop web (1280x760), Next.js App Router              │
│                                                          │
│  • Dashboard       • Tienda Oficial (CRUD)               │
│  • Moderación      • Vendedores (autorizar/revocar)      │
│  • Pedidos         • Finanzas                            │
└─────────────────────────────────────────────────────────┘
```

### Separación de apps

| | App Cliente | App Admin |
|---|-----------|-----------|
| **Repositorio** | Mismo monorepo o repos separados | Mismo monorepo o repos separados |
| **Dominio** | `lapercha.com.ar` | `admin.lapercha.com.ar` (subdominio) |
| **Auth** | Supabase Auth (magic link + teléfono) | Supabase Auth (solo admin) |
| **Viewport** | Mobile-first 390x844 | Desktop 1280x760 |
| **Código compartido** | API Routes, tipos, formatPrecio, design system tokens | API Routes, tipos, design system tokens |
| **Deploy** | Vercel | Vercel |

---

## Modelo de datos

### Tablas principales

```sql
-- Usuarios (extiende auth.users de Supabase)
-- Un solo registro sirve tanto para comprar como para vender.
-- is_seller se activa cuando el usuario completa el onboarding de vendedor.
-- role solo distingue admin vs usuario normal.
users (
  id uuid PK,
  email text,
  phone text,
  full_name text,
  role enum('user', 'admin'),      -- 'admin' solo para Silvina
  is_seller boolean DEFAULT false, -- true cuando activó el modo vendedor
  avatar_url text,
  created_at timestamp
)

-- Tiendas de vendedores
seller_stores (
  id uuid PK,
  user_id uuid FK -> users.id,
  store_name text,
  payment_cvu text,            -- CVU/alias para retiros
  rating_avg decimal(2,1),
  total_sales int,
  created_at timestamp
)

-- Productos
products (
  id uuid PK,
  store_type enum('oficial', 'feria'),
  seller_id uuid FK -> users.id,  -- null si es Tienda Oficial
  title text,
  description text,
  price int,                    -- en pesos argentinos (centavos no se usan)
  original_price int,           -- precio original si hay descuento
  category text,
  size text,
  condition text,               -- 'new', 'like_new', 'good', 'fair'
  status enum('pending', 'approved', 'rejected', 'changes_requested'),
  moderation_notes text,
  created_at timestamp,
  updated_at timestamp
)

-- Imágenes de productos
product_images (
  id uuid PK,
  product_id uuid FK -> products.id,
  url text,
  sort_order int
)

-- Órdenes / Pedidos
orders (
  id text PK,                   -- #LP-2841
  buyer_id uuid FK -> users.id,
  status enum('pending', 'paid', 'preparing', 'shipped', 'delivered', 'cancelled'),
  subtotal int,
  shipping_cost int,
  total int,
  shipping_method enum('correo_argentino', 'pickup'),
  shipping_address jsonb,
  mercado_pago_id text,
  created_at timestamp,
  updated_at timestamp
)

-- Items de la orden
order_items (
  id uuid PK,
  order_id text FK -> orders.id,
  product_id uuid FK -> products.id,
  seller_id uuid FK -> users.id,
  quantity int,
  price_at_purchase int,        -- precio al que se compró
  commission int,               -- comisión calculada (20%)
  seller_earning int,           -- ganancia del vendedor (80%)
  status enum('pending', 'shipped', 'delivered', 'funds_released')
)

-- Favoritos
favorites (
  user_id uuid FK -> users.id,
  product_id uuid FK -> products.id,
  created_at timestamp,
  PRIMARY KEY (user_id, product_id)
)

-- Retiros de vendedores
payouts (
  id uuid PK,
  seller_id uuid FK -> users.id,
  amount int,
  cvu text,
  status enum('pending', 'completed', 'failed'),
  created_at timestamp
)
```

---

## Seguridad (Row Level Security)

### Políticas Supabase RLS

| Recurso | Comprador | Vendedor | Admin |
|---------|-----------|----------|-------|
| `products` | Leer solo aprobados | Leer/crear/editar propios | CRUD total |
| `orders` | Leer/crear propios | Leer donde es seller | CRUD total |
| `favorites` | Leer/crear/borrar propios | — | — |
| `payouts` | — | Crear/leer propios | Leer todos |
| `seller_stores` | — | Editar propia | Leer todos |

---

## Flujo de pagos

```
1. Comprador toca "Pagar con Mercado Pago"
2. Frontend manda items[] a POST /api/crear-preferencia
3. Backend valida server-side (OBLIGATORIO):
   a. SELECT id, title, price, stock FROM products WHERE id IN (...)
   b. ¿Existen todos los ids? → si no, 400
   c. ¿cantidad <= stock para cada item? → si no, 400
   d. Reconstruye items con title y unit_price REALES de la BD
   e. Calcula total = Σ (precio_real * cantidad)
   f. Inserta en checkout_pendientes con precios validados
4. Crea preferencia en Mercado Pago con datos server-side
5. Redirige al comprador al checkout de MP
6. MP procesa pago → IPN (webhook) a /api/mercadopago/ipn
7. Backend:
   - Valida firma del webhook
   - Crea orden con status 'paid'
   - Notifica al vendedor y al admin
   - Retiene el pago
8. Vendedor despacha → marca como 'shipped'
9. Comprador confirma entrega → status 'delivered'
10. Backend:
   - Calcula comisión (20%)
   - Libera fondos al vendedor (80%)
   - Status de item → 'funds_released'
11. Vendedor solicita retiro → payout
```

---

## Hosting y costos estimados (MVP)

| Servicio | Plan | Costo mensual |
|----------|------|---------------|
| Vercel | Free (Hobby) | $0 |
| Supabase | Free (2 proyectos, 500MB DB, 5GB storage) | $0 |
| Mercado Pago | Sin costo fijo (comisión por transacción) | ~4% por venta |
| Resend | Free (100 emails/día) | $0 |
| Dominio .com.ar | nic.ar | ~$2.000/año |
| **Total mensual estimado** | | **~$0 + comisiones MP** |

---

## Roadmap de implementación

### Fase 1 — Fundación (Sprint 1-2)

- [ ] Setup Next.js + Tailwind + Supabase (dos proyectos Next.js: `app-cliente` y `app-admin`)
- [ ] Auth compartida con Supabase (magic link + teléfono)
- [ ] Estructura de rutas de cada app
- [ ] Implementar Design System como componentes React

### Fase 2 — App Cliente: Comprador (Sprint 3-4)

- [ ] Home: Tienda Oficial + Feria de Ropa
- [ ] Detalle de producto
- [ ] Carrito (local state, no requiere login)
- [ ] Favoritos (requiere login)
- [ ] Checkout con Mercado Pago

### Fase 3 — App Cliente: Vendedor (Sprint 5-6)

- [ ] Onboarding de vendedor desde la cuenta del usuario (tab "Vender")
- [ ] Formulario de activación: nombre completo, DNI, CVU/alias
- [ ] Panel de vendedor dentro de la app cliente: publicaciones, ventas, ganancias
- [ ] Publicar prenda (formulario + upload imágenes)
- [ ] Gestión de publicaciones propias

### Fase 4 — App Admin (Sprint 7-8)

- [ ] Login exclusivo (solo role='admin' puede entrar)
- [ ] Cola de moderación de la Feria
- [ ] CRUD Tienda Oficial (ropa + regalería + accesorios + etc.)
- [ ] Gestión de pedidos
- [ ] Finanzas y retiros

### Fase 5 — Pulido y lanzamiento (Sprint 9-10)

- [ ] SEO y metadata
- [ ] Emails transaccionales con Resend (compra, envío, entrega)
- [ ] PWA manifest + service worker
- [ ] Tests E2E
- [ ] Deploy a producción
- [ ] Dominio + SSL

---

## Consideraciones técnicas importantes

### Mobile-first PWA
- La app del comprador debe sentirse nativa en iOS/Android
- Usar `viewport: 390x844` como base
- Service worker para cache de imágenes y offline básico
- `apple-mobile-web-app-capable` para standalone mode

### Imágenes
- Upload directo a Supabase Storage desde el frontend
- Transformación on-the-fly de thumbnails
- Límite: 5MB por imagen, máximo 5 imágenes por producto
- Placeholder taupe mientras carga (definido en tokens)

### Rendimiento
- Next.js Image component para optimización automática
- Static Generation para Home y páginas de producto
- ISR para revalidar cada 60s productos nuevos

### Escalabilidad
- El MVP apunta a ~50 publicaciones activas y ~100 usuarios
- La arquitectura escala a miles sin cambios (Supabase + Vercel)
- Si crece, considerar CDN para imágenes y Redis para caché

---

## Reglas de seguridad y consistencia

Decisiones de arquitectura para prevenir bugs críticos desde el día 1. Basado en hallazgos de proyectos similares con carrito + Mercado Pago.

---

### 1. Precio validado SIEMPRE en el servidor

**Regla:** el endpoint `/api/crear-preferencia` NUNCA usa el `price` que manda el frontend. Reconstruye los items con precios reales desde la BD.

**Endpoint:** `src/app/api/mercadopago/crear-preferencia/route.ts`

```ts
// CORRECTO
export async function POST(req: Request) {
  const { items, payer } = await req.json();
  const supabase = createAdminClient();

  // Fetch server-side — NUNCA confiar en item.price del body
  const { data: products } = await supabase
    .from("products")
    .select("id, title, price, stock")
    .in("id", items.map(i => i.productId));

  // Validar existencia
  if (!products || products.length !== items.length) {
    return Response.json({ error: "Producto no encontrado" }, { status: 400 });
  }

  // Validar stock
  for (const item of items) {
    const prod = products.find(p => p.id === item.productId);
    if (!prod || item.quantity > prod.stock) {
      return Response.json({ error: `Stock insuficiente para ${prod?.title}` }, { status: 400 });
    }
  }

  // Reconstruir items con precios REALES de BD
  const validItems = items.map(item => {
    const prod = products.find(p => p.id === item.productId)!;
    return {
      ...item,
      title: prod.title,
      unit_price: prod.price, // ← precio de BD, NUNCA item.price del cliente
    };
  });

  const total = validItems.reduce((sum, i) => sum + i.unit_price * i.quantity, 0);

  // Insertar en checkout_pendientes con precios validados
  await supabase.from("checkout_pendientes").insert({
    items: validItems,
    total,
    payer_email: payer.email,
  });

  // Crear preferencia MP con datos server-side
  const preference = await mercadopago.preferences.create({
    items: validItems.map(i => ({
      title: i.title,
      unit_price: i.unit_price,
      quantity: i.quantity,
    })),
    // ...
  });

  return Response.json({ preferenceId: preference.id });
}
```

**Qué previene:** un atacante intercepta el POST y manda `price: 1` — el servidor lo ignora y usa el precio real de la BD.

---

### 2. Talle y estado propagados de punta a punta

**Regla:** el talle (`size`) elegido en la página de producto se propaga por toda la cadena. Cada combinación `productoId + talle` es una línea distinta del carrito (usa `lineId`).

```ts
// mockData.ts — ItemCarrito
interface ItemCarrito {
  productoId: string;
  cantidad: number;
  size?: string;       // "S" | "M" | "L" | "XL"
  lineId: string;      // productoId + "::" + size
}

// Helper para generar lineId
function buildLineId(productoId: string, size?: string): string {
  return [productoId, size ?? ""].join("::");
}
```

**Cadena completa donde debe aparecer `size`:**

| Eslabón | Archivo | Campo |
|---------|---------|-------|
| Página producto | `producto/[id]/page.tsx` | Selector de talle (FilterChip) |
| Carrito | `cartStore.ts` | `ItemCarrito.size` |
| Checkout paso 2 | `checkout/paso-2/page.tsx` | Mostrar talle junto al nombre |
| POST a crear-preferencia | `crear-preferencia/route.ts` | Preservar `size` en `checkout_pendientes.items` |
| Webhook → pedido | `webhook/route.ts` | Propagar a `pedidos.items` |
| Emails (Resend) | `orderNotifications.ts` | Mostrar "Vestido de lino (M)" |
| Admin panel | `admin/pedidos/[id]/page.tsx` | Mostrar talle en detalle |
| Tracking | `tracking/[code]/page.tsx` | Mostrar talle |

**Qué previene:** el comprador elige talle M pero el vendedor recibe la orden sin talle y manda uno incorrecto.

---

### 3. Stock con doble validación (UX + API)

**Regla:** el stock se respeta en dos capas.

**Capa UX (frontend):** el botón "+" del `QuantityStepper` en `/carrito` se deshabilita cuando `cantidad >= stock`.

```tsx
// carrito/page.tsx — el QuantityStepper debe clamar a stock
const stock = productos[item.productoId]?.stock ?? 99;

<QuantityStepper
  value={item.cantidad}
  max={stock}  // ← techo real
  onChange={(qty) => updateQuantity(item.lineId, qty)}
/>
```

**Capa API (server-side):** antes de crear la preferencia de MP, validar `cantidad <= stock` para cada item (ver regla 1). Esta es la garantía real — la UX es solo conveniencia.

**Qué previene:** overselling — se venden más unidades de las que existen.

---

### 4. `formatPrecio` único en toda la app

**Regla:** una sola función en `src/lib/format.ts`, importada en todos lados.

```ts
// src/lib/format.ts
export function formatPrecio(precio: number): string {
  return `$ ${precio.toLocaleString("es-AR")}`;
}
// Ejemplo: formatPrecio(18900) → "$ 18.900"
```

**Prohibido:** redefinir `formatPrecio` en `orderNotifications.ts`, `pago-exitoso/page.tsx`, o cualquier otro archivo.

**Qué previene:** que el carrito muestre `$ 18.900` y el email diga `$ARS 18.900,00`.

---

### 5. Hook compartido `useProductosPorIds`

**Regla:** la lógica de fetch de productos a Supabase está en un solo hook, usado por carrito, checkout y favoritos.

```ts
// src/lib/useProductosPorIds.ts ("use client")
interface ProductoCarrito {
  id: string;
  title: string;
  price: number;
  images: string[];
  stock: number;
  size?: string;
  condition: string;
}

export function useProductosPorIds(items: ItemCarrito[]): Record<string, ProductoCarrito> {
  const [productos, setProductos] = useState<Record<string, ProductoCarrito>>({});

  useEffect(() => {
    if (!items.length) return;
    const ids = items.map(i => i.productoId);
    supabase
      .from("products")
      .select("id, title, price, images, stock, size, condition")
      .in("id", ids)
      .then(({ data }) => {
        if (data) setProductos(Object.fromEntries(data.map(p => [p.id, p])));
      });
  }, [items]); // items tiene referencia estable via useSyncExternalStore

  return productos;
}
```

**Consumidores:** `carrito/page.tsx`, `checkout/paso-2/page.tsx`, `favoritos/page.tsx`.

**Qué previene:** código duplicado, queries repetidas a Supabase, columnas inconsistentes entre vistas.

---

## Anti-patrones a evitar

Errores comunes detectados en codebases similares. NO hacer:

| # | Anti-patrón | Por qué es peligroso | Regla que lo cubre |
|---|------------|---------------------|-------------------|
| 1 | `unit_price: item.price` en el POST a MP | El cliente puede mandar cualquier precio | Regla 1 |
| 2 | `addItem(producto.id)` sin pasar el talle | El talle se pierde, carrito mezcla talles distintos | Regla 2 |
| 3 | `key={item.productoId}` en lista de carrito | Dos líneas del mismo producto en talles distintos colisionan | Regla 2 (`key={item.lineId}`) |
| 4 | Botón "+" sin `max={stock}` | El comprador puede sumar más del stock | Regla 3 |
| 5 | `Intl.NumberFormat` distinto en emails | Inconsistencia visual entre UI y comunicaciones | Regla 4 |
| 6 | `useEffect` con query a Supabase copiada y pegada | Divergencia de columnas, queries duplicadas | Regla 5 |
| 7 | Validar solo en frontend | El stock y precio real solo se garantizan server-side | Reglas 1 y 3 |

---

## Links

- [[../La Percha Showroom|La Percha Showroom]]
- [[../Roles/Comprador|Comprador]]
- [[../Roles/Vendedor|Vendedor]]
- [[../Roles/Admin|Admin]]
- [[D-Design-System/README|D — Design System]]
- [[../../03 - REFERENCIAS/Investigacion/Tech-Stack|Investigación Tech Stack]]

---
type: decisions-log
status: activo
---

# Decisiones de Diseño

Registro cronológico de decisiones clave del proyecto.

---

## Decisiones registradas

### 2026-06-19 — Reglas de seguridad y consistencia

Prevención de bugs críticos basada en hallazgos de proyectos similares con carrito + Mercado Pago.

#### 1. Precio validado siempre en el servidor

**Decisión:** el endpoint `/api/crear-preferencia` de Mercado Pago nunca usa el `price` del body del cliente. Hace un `SELECT` a `products` y reconstruye los items con `title` y `unit_price` reales de la BD.

**Razón:** es el vector de ataque más común en marketplaces. Un atacante intercepta el POST y paga $1 por un producto de $18.900. La validación server-side lo anula.

**Consecuencias:**
- El frontend no necesita mandar `price` en el body (se ignora)
- `checkout_pendientes` y `pedidos` siempre tienen `precioUnitario` = precio real de BD
- Agrega una query extra a `products` en cada creación de preferencia (~50ms)

#### 2. Talle propagado de punta a punta

**Decisión:** el talle (`size`) elegido en la página de producto se propaga por toda la cadena: carrito → checkout → `order_items` → emails → admin panel → tracking. Cada combinación `productoId + talle` es una línea distinta del carrito con su propio `lineId`.

**Razón:** sin esto, el comprador elige talle M pero la orden llega sin talle y el vendedor manda uno incorrecto.

**Consecuencias:**
- `ItemCarrito` incluye `size` opcional y `lineId`
- `key={item.lineId}` en listas de carrito (evita colisiones)
- El talle aparece en emails, admin y tracking
- Productos sin talle (Tienda Oficial) no se ven afectados

#### 3. Stock con doble validación

**Decisión:** el stock se respeta en dos capas: UX (botón "+" deshabilitado si `cantidad >= stock`) y API (validación server-side antes de crear la preferencia). La garantía real es server-side.

**Razón:** la validación frontend es conveniencia UX pero se saltea con `curl`. La validación server-side es la única garantía real contra overselling.

**Consecuencias:**
- `QuantityStepper` recibe prop `max={stock}`
- El endpoint de crear-preferencia valida `cantidad <= stock` por cada item
- Si un producto se agota entre que el usuario lo ve y paga, recibe un 400 claro

#### 4. `formatPrecio` único

**Decisión:** una sola función `formatPrecio` en `src/lib/format.ts`, importada por toda la app. Formato: `$ 18.900` (signo pesos + espacio + número con punto de miles).

**Razón:** en proyectos anteriores se detectaron hasta 3 implementaciones distintas de `formatPrecio` con formatos inconsistentes entre UI y emails.

**Consecuencias:**
- Prohibido redefinir `formatPrecio` en `orderNotifications.ts`, `pago-exitoso`, u otros
- Si se necesita un formato distinto (ej. sin signo), usar un parámetro opcional
- `Intl.NumberFormat` se usa solo dentro de `formatPrecio`, no en consumidores

#### 5. Hook compartido para fetch de productos

**Decisión:** `useProductosPorIds(items)` centraliza la query a Supabase con columnas `id, title, price, images, stock, size, condition`. Lo usan carrito, checkout paso-2 y favoritos.

**Razón:** evita código duplicado, queries repetidas, y divergencia de columnas entre vistas.

**Consecuencias:**
- Las 3 vistas comparten la misma interfaz `ProductoCarrito`
- Agregar una columna nueva (ej. `free_shipping`) se hace en un solo lugar
- El hook recibe `items` (no `ids`) para mantener referencia estable y evitar re-fetches infinitos

---

## Pendientes de decidir

- [ ] Definir stack tecnológico (frontend, backend, base de datos)
- [ ] Definir hosting y dominio
- [ ] Integración de Mercado Pago (checkout API vs botón)
- [ ] Sistema de notificaciones (email, push, WhatsApp)
- [ ] Estrategia de SEO / presencia web
- [ ] Método de verificación de identidad de vendedores
- [ ] Política de devoluciones y reclamos

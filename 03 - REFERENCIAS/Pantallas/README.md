# Pantallas — La Percha Showroom

Índice de todas las pantallas del producto, organizadas por app. Los UI kits están implementados en el Design System.

---

## App Cliente (Mobile-first — 390x844)

### Modo Compra

Implementado en `La Percha Showroom Design System/ui_kits/shopper-app/`.

| # | Pantalla | Ruta | Archivo | Descripción |
|---|----------|------|---------|-------------|
| 1 | **Home** | `/` | `Home.jsx` | Feed con header, búsqueda, chips de categorías, banner, Tienda Oficial horizontal, Feria 2x2 |
| 2 | **Producto** | `/product` | `Product.jsx` | Detalle completo: imágenes, talles, descripción, reseñas, sticky buy bar |
| 3 | **Carrito** | `/cart` | `Cart.jsx` | Items, QuantityStepper, cupón, resumen, pago con Mercado Pago |
| 4 | **Confirmación** | `/confirm` | `Extra.jsx` | Checkmark verde, order ID, StatusPill, tracking, volver al inicio |
| 5 | **Favoritos** | `/fav` | `Extra.jsx` | Grilla 2x2 de favoritos o EmptyState si está vacío |
| 6 | **Tracking** | `/tracking/[id]` | (pendiente) | Estado del pedido, datos de envío |

### Modo Vendedor

Pantallas dentro de la misma App Cliente, accesibles solo para usuarios autorizados. Referencia desktop en `ui_kits/seller-dashboard/`, adaptadas a mobile.

| # | Pantalla | Ruta | Descripción |
|---|----------|------|-------------|
| 7 | **Onboarding vendedor** | `/vender/onboarding` | Formulario: nombre tienda, CBU/CVU. Envía solicitud a la admin. |
| 8 | **Pendiente de autorización** | `/vender/pendiente` | StatusPill "Pendiente de autorización" con instrucciones. |
| 9 | **Mis publicaciones** | `/vender/publicaciones` | Lista de prendas publicadas con StatusPill, botón "Publicar prenda". |
| 10 | **Publicar prenda** | `/vender/publicar` | Formulario: fotos, título, categoría, talle, estado, precio, descripción. |
| 11 | **Mis ventas** | `/vender/ventas` | Historial de ventas con estados. |
| 12 | **Ganancias** | `/vender/ganancias` | Saldo disponible (80%), botón "Solicitar retiro", historial. |

### Navegación

[[BottomNav]] con 5 items: Inicio, Buscar, Vender/Mi tienda (CTA salvia), Favoritos (badge), Carrito (badge).

---

## App Admin (Desktop — 1280x760)

Implementado en `La Percha Showroom Design System/ui_kits/admin/`.

| # | Sección | Ruta | Descripción |
|---|---------|------|-------------|
| 1 | **Login** | `/login` | Acceso exclusivo admin |
| 2 | **Dashboard** | `/` | Resumen: ventas, comisiones, pendientes |
| 3 | **Tienda Oficial** | `/tienda` | CRUD de productos propios (regalería, bazar, etc.) |
| 4 | **Moderación** | `/moderacion` | Cola de publicaciones (lista 340px) + detalle con acciones (aprobar, cambios, rechazar) |
| 5 | **Vendedores** | `/vendedores` | Solicitudes pendientes + vendedores activos (autorizar/revocar) |
| 6 | **Pedidos** | `/pedidos` | Todas las órdenes con StatusPill y filtros |
| 7 | **Finanzas** | `/finanzas` | Ingresos, comisiones, retiros |

### Sidebar

6 items: Dashboard, Tienda Oficial, Moderación (badge), Vendedores, Pedidos (badge), Finanzas.

---

## Pantallas pendientes de diseño

- [ ] Perfil de cliente (App Cliente)
- [ ] Historial de compras (App Cliente)
- [ ] Pantalla de categoría con filtros aplicados (App Cliente)
- [ ] Resultados de búsqueda (App Cliente)
- [ ] Notificaciones (App Cliente)
- [ ] Detalle de vendedor (App Admin)
- [ ] Reportes financieros (App Admin)

---

## Links

- [[../../01 - PROYECTO/La Percha Showroom|La Percha Showroom]]
- [[../../01 - PROYECTO/Roles/Cliente|Rol Cliente]]
- [[../../01 - PROYECTO/Roles/Admin|Rol Admin]]
- [[../../02 - WDS/D-Design-System/README|Design System]]
- [[../../02 - WDS/C-UX-Scenarios/README|UX Scenarios]]

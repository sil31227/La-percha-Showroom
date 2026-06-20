---
type: role
name: Admin
platform: desktop web (1280x760)
app: App Admin (separada de la App Cliente)
---

# Admin — App Admin

Silvina (la dueña) gestiona toda la plataforma desde una app web de escritorio independiente. No comparte código de frontend con la App Cliente.

---

## Panel de administración

### Sidebar

Sidebar oscuro (248px, ink-900) con navegación de 6 items:
1. **Dashboard** — resumen general
2. **Tienda Oficial** — gestión de sus propios productos
3. **Moderación** — cola de publicaciones de la Feria (badge: pendientes)
4. **Vendedores** — autorizar o revocar vendedores
5. **Pedidos** — seguimiento de todas las órdenes (badge: pendientes)
6. **Finanzas** — ingresos, comisiones, retiros

---

## Tienda Oficial

Silvina carga y administra sus productos de regalería, bazar, decoración, cosmética y accesorios.

- CRUD completo de productos
- Sin moderación (se publican directamente)
- Categorías: regalería, bazar, decoración, cosmética, accesorios, importados
- Los productos aparecen en la App Cliente bajo "Tienda Oficial"

---

## Moderación de la Feria

Layout dividido:
- **Panel izquierdo (340px):** lista de publicaciones en cola
- **Panel derecho:** detalle de la publicación seleccionada

### Detalle de publicación

- Galería de imágenes (principal + thumbnails)
- [[Badge]] de categoría
- Título en Marcellus
- "Publicado por [vendedor] · [tiempo]"
- Precio
- Info grid 2x2:
  - "Comisión La Percha (20%)" = $X
  - "Recibe el vendedor (80%)" = $Y
  - "Categoría permitida" = "Sí · es ropa"
  - "Talle / estado"
- Descripción
- **Acciones:** [[Button]] "Aprobar" (primary), [[Button]] "Pedir cambios" (outline), [[Button]] "Rechazar" (danger)

### Reglas de moderación

1. Solo se permite **ropa** (remeras, jeans, camperas, vestidos, calzado, deportiva, infantil)
2. Las fotos deben ser reales (no de catálogo o stock)
3. El precio debe ser razonable
4. La descripción debe ser clara y honesta sobre el estado
5. Si se rechaza o pide cambios, la admin escribe el motivo

---

## Gestión de vendedores

Control de quién puede vender en la Feria de Ropa.

### Solicitudes pendientes

Lista de usuarios que pidieron ser vendedores:
- Nombre, email, teléfono
- Nombre de la tienda
- CBU/CVU configurado
- Fecha de solicitud
- Acciones: **Autorizar** o **Rechazar**

### Vendedores activos

- Lista de vendedores autorizados
- Estadísticas por vendedor: publicaciones activas, ventas del mes, calificación
- Acción: **Revocar** (desactiva el modo vendedor, no elimina la cuenta)

---

## Pedidos

Seguimiento de todas las órdenes (Tienda Oficial + Feria de Ropa).

- Lista filtrable por [[StatusPill]]: pendiente, pagado, preparando, enviado, entregado, cancelado
- Detalle de pedido: items con talle y precio, datos del comprador, método de envío
- Tracking de envíos por Correo Argentino
- Confirmación de entrega para liberar pagos a vendedores

---

## Finanzas

- Ingresos por comisiones de la Feria (20%)
- Ingresos por ventas de Tienda Oficial (100%)
- Retiros solicitados por vendedores (pendientes y completados)
- Métricas mensuales: ventas totales, comisiones, ganancia neta

---

## Ver también

- [[La Percha Showroom]]
- [[Cliente]]
- [[../../02 - WDS/C-UX-Scenarios/README|C-UX-Scenarios]]
- [[../../03 - REFERENCIAS/Pantallas/README|Pantallas]]

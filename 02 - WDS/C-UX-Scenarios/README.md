# C — UX Scenarios

Escenarios paso a paso para los dos roles principales, basados en los UI kits existentes y la arquitectura de dos apps.

---

## CLIENTE — App Cliente

### C1 — Descubrimiento y primera compra

**Contexto:** María (32, Bahía Blanca) abre la App Cliente por primera vez porque una amiga le pasó el link.

1. **Abre la app** → ve el Home con el logo, saludo "Hola 👋", barra de búsqueda
2. **Scrollea** → ve los chips de categorías ([[FilterChip]]), el banner hero, la Tienda Oficial en horizontal
3. **Explora la Feria** → grilla 2x2 de [[ProductCard]]: ve un Vestido de lino a $18.900 con 4.5 estrellas
4. **Entra al producto** → imagen hero 380px, talles disponibles (S, M, L, XL), descripción, envío
5. **Elige talle M** → toca el chip, se marca seleccionado
6. **Agrega al carrito** → toast "Agregado al carrito", badge en el BottomNav se actualiza
7. **Sigue explorando** → vuelve al Home, encuentra "Vela de soja" en Tienda Oficial ($6.800), la agrega
8. **Abre el carrito** → ve los 2 items, subtotal, envío, total
9. **Toca "Pagar con Mercado Pago"** → se le pide registrarse (nombre, teléfono, email)
10. **Se registra** → checkout de MP, pago exitoso
11. **Confirmación** → medallón verde, "¡Pago confirmado!", #LP-XXXX, [[StatusPill]] "preparando"
12. **Tracking** → toca "Seguir mi pedido", ve estado y fecha estimada

### C2 — Guardar para después

**Contexto:** Juana (27) está en el bondi, scrollea por hobby.

1. Navega el Home, ve un Jean mom fit que le gusta
2. Entra al producto, toca el corazón → se pone terracota ([[IconButton]] active)
3. Le pide registrarse para guardar favoritos → se registra
4. Sigue guardando productos
5. Después abre Favoritos desde el [[BottomNav]] y ve todo lo guardado

### C3 — Búsqueda por categoría

**Contexto:** Pedro (38) quiere comprar una campera para su hija.

1. Abre la app, toca el chip "Camperas"
2. La grilla se filtra mostrando solo camperas de la Feria
3. Ve una Campera de jean a $26.500 con envío gratis
4. Entra, revisa fotos, descripción, estado ("Como nuevo")
5. "Comprar ahora" → checkout con Mercado Pago

### C4 — Carrito vacío

1. Toca el carrito en el [[BottomNav]]
2. Ve [[EmptyState]]: "Tu carrito está vacío · Sumá prendas de la feria o productos de la Tienda Oficial"
3. Botón "Explorar productos" → Home

### C5 — Envío gratis no alcanzado

1. Abre el carrito, suma $18.000
2. Ve "Te faltan $7.000 para envío gratis"
3. Agrega un Buzo deportivo ($16.800)
4. Vuelve al carrito: envío dice "GRATIS"

---

## CLIENTE → VENDEDOR — Activación del modo vendedor

### V1 — Solicitar ser vendedor

**Contexto:** Caro (29) ya compró varias veces. Quiere vender ropa que ya no usa.

1. Toca "Vender" en el [[BottomNav]] (CTA central salvia)
2. **Si no está registrada** → login / registro
3. Ve la pantalla "Quiero vender en La Percha"
4. Completa: "Nombre de tu tienda", "CBU/CVU para recibir pagos"
5. Envía la solicitud
6. Ve [[StatusPill]] "Pendiente de autorización"
7. Recibe notificación cuando la admin la autorice

### V2 — Admin autoriza al vendedor

**Contexto:** Silvina recibe la solicitud de Caro en la App Admin.

1. Ve la solicitud en "Vendedores" → "Solicitudes pendientes"
2. Revisa datos de Caro: nombre, tienda, CBU
3. Toca **"Autorizar"**
4. Caro recibe notificación en la App Cliente
5. Su [[BottomNav]] ahora muestra "Mi tienda" en vez de "Vender"

### V3 — Publicar una prenda (ya autorizada)

1. Toca "Mi tienda" en el [[BottomNav]]
2. Ve su panel: "Mis publicaciones" (vacío), "Mis ventas", "Ganancias"
3. Toca "Publicar prenda"
4. Sube fotos, completa título, categoría, talle, estado, precio, descripción
5. Envía → [[StatusPill]] "En revisión"
6. Recibe notificación cuando la admin la aprueba o rechaza

### V4 — Venta completada (ya autorizada)

1. Recibe notificación: "¡Vendiste Vestido de lino!"
2. Entra a "Mis ventas", ve la orden con [[StatusPill]] "pagado"
3. Prepara el paquete y lo lleva a Correo Argentino
4. Marca "Enviado" en su panel
5. El comprador confirma entrega
6. El pago se libera: $15.120 acreditados (80%)
7. Ve el monto en "Ganancias"
8. Toca "Solicitar retiro" → confirma → transferencia a su CBU

---

## ADMIN — App Admin

### A1 — Cargar producto en Tienda Oficial

1. Entra a la App Admin (escritorio), hace login
2. Sidebar → Tienda Oficial
3. "Agregar producto"
4. Completa: título, categoría, precio, descripción, sube fotos
5. Guarda → se publica instantáneamente en la App Cliente

### A2 — Moderar una publicación

1. Sidebar → Moderación (badge: 4 pendientes)
2. Panel izquierdo: lista de 4 publicaciones en cola
3. Selecciona "Vestido de fiesta lentejuelas" ($34.000)
4. Revisa detalle en panel derecho: fotos reales, categoría ok, descripción clara
5. **Aprueba** → [[Button]] "Aprobar" (primary)
6. La publicación sale de la cola, el vendedor recibe notificación

### A3 — Pedir cambios en una publicación

1. Revisa "Conjunto deportivo" ($19.900)
2. Las fotos parecen de catálogo, no del producto real
3. Toca [[Button]] "Pedir cambios" (outline)
4. Escribe motivo: "Por favor subí fotos reales del producto"
5. La publicación vuelve al vendedor con [[StatusPill]] "Cambios requeridos"

### A4 — Rechazar una publicación

1. Revisa un producto que no es ropa
2. Info grid: "Categoría permitida = No · no es ropa"
3. Toca [[Button]] "Rechazar" (danger)
4. Escribe motivo: "Solo se permite ropa. No aceptamos calzado deportivo."
5. El vendedor recibe notificación con el motivo

### A5 — Autorizar un nuevo vendedor

1. Sidebar → Vendedores → "Solicitudes pendientes" (badge: 3)
2. Revisa solicitud de Caro: tienda "Caro Indumentaria", CBU configurado
3. Toca **"Autorizar"**
4. Caro ahora puede publicar en la Feria

### A6 — Gestionar pedidos y finanzas

1. Sidebar → Pedidos (badge: 6 pendientes)
2. Filtra por estado, revisa órdenes
3. Sidebar → Finanzas
4. Ve ingresos del mes: comisiones (20% Feria) + ventas Tienda Oficial
5. Revisa retiros pendientes de vendedores

---

## Links

- [[../La Percha Showroom|La Percha Showroom]]
- [[A-Product-Brief/README|A — Product Brief]]
- [[B-Trigger-Map/README|B — Trigger Map]]
- [[D-Design-System/README|D — Design System]]
- [[../../03 - REFERENCIAS/Pantallas/README|Pantallas]]

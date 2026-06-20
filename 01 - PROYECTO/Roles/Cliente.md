---
type: role
name: Cliente
platform: mobile-first web (390x844), desktop responsive
---

# Cliente — App Cliente

Usuario de la app mobile/web. Tiene dos modos:

1. **Modo comprador** — disponible sin registro. Explorar, comprar, pagar.
2. **Modo vendedor** — requiere registro + autorización de la admin. Publicar ropa en la Feria.

> **Cuenta única:** el usuario se registra una sola vez. Desde su perfil activa el modo vendedor. La admin decide si lo autoriza o no.

---

## Modo comprador

### Sin registro

Cualquier persona puede:
- Ver el Home con Tienda Oficial y Feria de Ropa
- Filtrar por categorías
- Ver detalle de producto con fotos, talles, descripción
- Agregar al carrito
- Iniciar el checkout (requiere registro para pagar)

### Con registro

Registro mínimo: nombre, teléfono, email. Sin verificación de identidad. **Activación inmediata — Silvina no revisa el registro.**

Funciones adicionales:
- Guardar favoritos
- Completar compras con Mercado Pago
- Seguimiento de pedidos
- Historial de compras
- Solicitar ser vendedor (esto sí requiere revisión de la admin)

### Flujo de compra

#### 1. Home

- Header con logo y saludo ("Hola 👋")
- Barra de búsqueda
- Chips de categorías ([[FilterChip]]: Todo, Vestidos, Jeans, Camperas, Calzado, Deportiva, Infantil)
- Banner hero
- Sección "Tienda Oficial" con scroll horizontal de [[ProductCard]]
- Sección "Feria de Ropa" con grilla 2 columnas de [[ProductCard]]

#### 2. Producto

- Imagen hero (380px) con iconos de volver, compartir y favoritos
- [[Badge]] de origen: "Tienda Oficial" o "Feria de Ropa"
- [[Badge]] de beneficio: "Envío gratis"
- Título en Marcellus
- [[Rating]] con estrellas y cantidad de reseñas
- [[PriceTag]] con precio actual
- Selector de talle ([[FilterChip]]: S, M, L, XL) — solo en Feria
- Info de envío: Correo Argentino 3-5 días o retiro en Palihue
- [[Tabs]]: Descripción / Reseñas
- Barra sticky inferior: [[Button]] "Agregar" + [[Button]] "Comprar ahora"

#### 3. Carrito

- Header "Tu carrito" + botón volver
- Lista de items con [[QuantityStepper]]
- Input de cupón
- Resumen: Subtotal + Envío + Total
- "Te faltan $X para envío gratis" si no llega a $25.000
- [[Button]] "Pagar con Mercado Pago" (primary, full width)

#### 4. Confirmación de pago

- Medallón verde con checkmark
- "¡Pago confirmado!"
- Número de pedido (#LP-XXXX)
- [[StatusPill]] "preparando"
- [[Button]] "Seguir mi pedido"

#### 5. Favoritos

- Grilla 2 columnas de [[ProductCard]]
- [[EmptyState]] "Todavía no tenés favoritos · Tocá el corazón…"

#### 6. Tracking de pedido

- [[StatusPill]] del pedido: pendiente → pagado → preparando → enviado → entregado
- Datos de envío (Correo Argentino o retiro)
- Productos comprados con talles

#### 7. Perfil

Accesible desde el BottomNav. Solo disponible con registro (sin sesión muestra pantalla de login/registro).

**Encabezado:**
- Avatar circular (inicial del nombre si no hay foto)
- Nombre del usuario
- Teléfono / email

**Secciones:**

| Sección | Contenido |
|---------|-----------|
| **Mis pedidos** | Historial de compras con [[StatusPill]] de cada orden. Toca un pedido → va al tracking. |
| **Mis datos** | Editar nombre, teléfono, email, dirección de envío. |
| **Datos de cobro** | CBU/CVU o alias para recibir pagos si vende algo. Editable. Solo visible si `is_seller=true` o si está en proceso de solicitud. |
| **Mis ventas** | Historial de prendas vendidas (solo si es vendedor autorizado). Link al panel de vendedor. |
| **Cerrar sesión** | Botón al pie. |

**Estado sin registro:**
- Pantalla con ilustración + texto "Creá tu cuenta para comprar, guardar favoritos y vender ropa"
- [[Button]] "Registrarse" (primary) + link "Ya tengo cuenta"

### Navegación ([[BottomNav]])

5 items:
1. **Inicio** (home)
2. **Perfil** (usuario — muestra login si no está registrado)
3. **Vender** (CTA central salvia — onboarding o panel según estado)
4. **Favoritos** (badge con cantidad)
5. **Carrito** (badge con cantidad)

---

## Modo vendedor

Disponible solo para usuarios registrados **autorizados por la admin**.

### Activación

1. El cliente toca "Vender" en el [[BottomNav]] (o desde su perfil)
2. Si no está registrado → login / registro
3. Si está registrado pero no autorizado → pantalla "Quiero vender en La Percha"
   - Completa datos: nombre de la tienda, CBU/CVU para cobrar
   - Envía solicitud a la admin
   - Ve [[StatusPill]] "Pendiente de autorización"
4. Cuando la admin autoriza → recibe notificación
5. El tab "Vender" del [[BottomNav]] ahora abre directamente su panel de vendedor
6. En "Perfil" aparece la sección "Mis ventas" y "Datos de cobro"

### Panel de vendedor (dentro de la App Cliente)

Vista mobile con tabs o secciones:

| Sección | Contenido |
|---------|-----------|
| **Mis publicaciones** | Lista de prendas publicadas con [[StatusPill]]: en revisión, aprobada, rechazada, cambios requeridos. Botón "Publicar prenda". |
| **Mis ventas** | Historial de ventas con estados: pendiente de envío, enviado, entregado, fondos liberados. |
| **Ganancias** | Saldo disponible (80% después de comisión). Botón "Solicitar retiro". Historial de retiros. |

### Publicar una prenda

1. Toca "Publicar prenda"
2. Sube fotos (máx 5, con guía de buena luz natural)
3. Completa: título, categoría, talle, estado (nuevo / como nuevo / bueno), precio, descripción
4. Envía a revisión
5. La admin la modera → recibe notificación cuando se aprueba o rechaza

### Cuando alguien compra

1. Notificación: "¡Vendiste [producto]!"
2. El pago queda retenido por La Percha
3. El vendedor despacha (Correo Argentino o coordina retiro)
4. Marca como "Enviado"
5. El comprador confirma entrega
6. El pago se libera: 80% acreditado en ganancias
7. Solicita retiro cuando quiera

---

## Notificaciones

- Toast al agregar al carrito
- Toast al guardar favorito
- Notificación de autorización de vendedor
- Notificación de publicación aprobada/rechazada
- Notificación de venta realizada

## Ver también

- [[La Percha Showroom]]
- [[Admin]]
- [[../../02 - WDS/C-UX-Scenarios/README|C-UX-Scenarios]]
- [[../../03 - REFERENCIAS/Pantallas/README|Pantallas]]
- [[../../02 - WDS/E-Development/README|E-Development]]

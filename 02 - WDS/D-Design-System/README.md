# D — Design System

Sistema de diseño visual y de componentes de La Percha Showroom, creado por Claude Design.

> **Source:** `La Percha Showroom Design System/` — todos los tokens, componentes y UI kits están implementados en esta carpeta.

---

## Identidad visual

### Logo

Archivo: `La Percha Showroom Design System/assets/logo.jpg`

Circular badge con:
- Percha (hanger) como ícono central
- Hoja (leaf) que refuerza lo natural/artesanal
- Wordmark script "La Percha" en Parisienne

Clear space alrededor del logo, no recolorear ni estirar. En superficies oscuras mantenerlo dentro de su círculo claro.

### Tipografía

| Uso | Fuente | Pesos | Google Fonts |
|-----|--------|-------|-------------|
| **Display** (headings, heros) | Marcellus | 400 (único) | [Link](https://fonts.google.com/specimen/Marcellus) |
| **UI / Body** | Mulish | 300, 400, 600, 700, 800 | [Link](https://fonts.google.com/specimen/Mulish) |
| **Script decorativo** | Parisienne | 400 (único) | [Link](https://fonts.google.com/specimen/Parisienne) |
| **Mono (specímenes)** | JetBrains Mono | 400 | [Link](https://fonts.google.com/specimen/JetBrains+Mono) |

Escala tipográfica: `text-2xs` (11px) hasta `text-4xl` (48px) en 8 stops.

---

## Paleta de colores

### Primarios

| Token | Color | Uso |
|-------|-------|-----|
| `--brand` (sage-600) | `#5c7c38` | CTA principal, acentos, estados activos |
| `--brand-hover` (sage-700) | `#3d5a28` | Hover del CTA principal |
| `--accent` (mint-500) | `#4f9489` | Secundario: envío gratis, info, botones secondary |

### Neutros

| Token | Color | Uso |
|-------|-------|-----|
| `--bg-page` (taupe-50) | `#f7f5f2` | Fondo de página |
| `--bg-canvas` | `#fffdf9` | Fondo de canvas/bloques |
| `--surface-card` | `#ffffff` | Tarjetas |
| `--surface-sunken` (taupe-100) | `#eeebe6` | Superficies hundidas |

### Texto

| Token | Color | Uso |
|-------|-------|-----|
| `--text-strong` (ink-900) | `#2b2722` | Títulos, precios |
| `--text-body` (ink-800) | `#3d3933` | Cuerpo de texto |
| `--text-muted` (ink-600) | `#6b6660` | Texto secundario |
| `--text-subtle` (ink-500) | `#827d76` | Placeholders, texto terciario |

### Semánticos

| Token | Color | Uso |
|-------|-------|-----|
| `--success-600` | `#3f8f4f` | Éxito, aprobado |
| `--warning-500` | `#d08a2c` | Advertencia, pendiente, en revisión |
| `--error-500` (terracotta) | `#c4492f` | Error, rechazado, favorito activo |
| `--info-600` | `#3d7870` | Informativo |
| `--rating-star` | `#eaa92b` | Estrella de calificación (ámbar) |

### Bordes

| Token | Color | Uso |
|-------|-------|-----|
| `--border-subtle` (ink-200) | `#d4d1cc` | Bordes de tarjetas, dividers |
| `--border-default` (ink-300) | `#c4c0ba` | Bordes de inputs, chips inactivos |

Archivos: `La Percha Showroom Design System/tokens/colors.css`

---

## Espaciado

Escala base 4px: `--space-1` (4px) hasta `--space-16` (64px) en 8 stops.

| Token | Valor | Uso |
|-------|-------|-----|
| `--gutter-mobile` | 16px | Padding lateral en mobile |
| `--gutter-desktop` | 32px | Padding lateral en desktop |
| `--container-max` | 1280px | Ancho máximo de contenido |
| `--content-max` | 720px | Ancho máximo de lectura |
| `--bottomnav-height` | 64px | Altura de navegación inferior |
| `--tap-min` | 44px | Touch target mínimo |
| `--tap-comfortable` | 48px | Touch target cómodo |

Archivos: `La Percha Showroom Design System/tokens/spacing.css`

---

## Efectos

### Radios

| Token | Valor | Uso |
|-------|-------|-----|
| `--radius-sm` | 8px | Chips, badges pequeños |
| `--radius-md` | 12px | Inputs, botones |
| `--radius-lg` | 16px | Tarjetas de producto |
| `--radius-xl` | 22px | Sheets, heroes |
| `--radius-pill` | 999px | Chips, botones pill, status pills |

### Sombras

Sombras cálidas con tinte taupe, nunca negro puro (`rgba(50,44,36,…)`).

| Token | Uso |
|-------|-----|
| `--shadow-sm` | Tarjetas en reposo |
| `--shadow-md` | Tarjetas en hover (lift + translateY -2px) |
| `--shadow-brand` | CTA principal (tinte salvia) |

### Animación

| Token | Valor | Uso |
|-------|-------|-----|
| `--dur-fast` | 140ms | Press, toggle |
| `--dur-base` | 220ms | Transiciones, hover |
| `--dur-slow` | 340ms | Sheets, modals |
| `--ease-spring` | cubic-bezier | Switch thumb, toast pop |

**Press behavior:** Botones → scale(0.97). IconButtons → scale(0.9). Sensación táctil de "hundimiento".

Archivos: `La Percha Showroom Design System/tokens/effects.css`

---

## Componentes

14 componentes React implementados en `La Percha Showroom Design System/components/`:

### Commerce

| Componente | Descripción | Archivo |
|------------|-------------|---------|
| [[PriceTag]] | Precio con opción de tachado + % OFF | `components/commerce/PriceTag.jsx` |
| [[ProductCard]] | Tarjeta de producto con imagen, rating, badges | `components/commerce/ProductCard.jsx` |

### Feedback

| Componente | Descripción | Archivo |
|------------|-------------|---------|
| [[Badge]] | Etiqueta de estado (6 tonos, solid/soft) | `components/feedback/Badge.jsx` |
| [[EmptyState]] | Estado vacío con icono, título, acción | `components/feedback/EmptyState.jsx` |
| [[FilterChip]] | Chip de filtro toggle | `components/feedback/FilterChip.jsx` |
| [[Rating]] | Estrellas de calificación (0-5, half) | `components/feedback/Rating.jsx` |
| [[StatusPill]] | Pill de estado (11 variantes de negocio) | `components/feedback/StatusPill.jsx` |

### Forms

| Componente | Descripción | Archivo |
|------------|-------------|---------|
| [[Button]] | Botón multi-variante (5 variantes, 3 tamaños) | `components/forms/Button.jsx` |
| [[IconButton]] | Botón solo ícono (ghost/soft/brand) | `components/forms/IconButton.jsx` |
| [[Input]] | Campo de texto con label, icono, error | `components/forms/Input.jsx` |
| [[QuantityStepper]] | Selector de cantidad +/− | `components/forms/QuantityStepper.jsx` |
| [[Switch]] | Toggle con animación spring | `components/forms/Switch.jsx` |

### Navigation

| Componente | Descripción | Archivo |
|------------|-------------|---------|
| [[BottomNav]] | Navegación inferior mobile (5 items) | `components/navigation/BottomNav.jsx` |
| [[Tabs]] | Pestañas horizontales con underline | `components/navigation/Tabs.jsx` |

---

## UI Kits

Tres kits de interfaz completos en `La Percha Showroom Design System/ui_kits/`:

### Shopper App
- **Vista:** mobile 390x844
- **Pantallas:** Home, Producto, Carrito, Confirmación de pago, Favoritos
- **Archivos:** `shopper-app/index.html`, `Home.jsx`, `Product.jsx`, `Cart.jsx`, `Extra.jsx`, `data.js`, `chrome.js`

### Seller Dashboard
- **Vista:** desktop 1280x760
- **Secciones:** Inicio (stats, publicaciones, banner de retiro)
- **Archivos:** `seller-dashboard/index.html`, `panel-chrome.js`

### Admin Panel
- **Vista:** desktop 1280x760
- **Secciones:** Moderación (cola + detalle con acciones)
- **Archivos:** `admin/index.html`, `panel-chrome.js`

---

## Guías de contenido

### Voz y tono

- **Idioma:** español argentino, voseo
- **Tono:** cálido, cercano, alentador. NUNCA corporativo.
- **Oraciones:** cortas. Como hablaría una vecina con buen gusto.
- **Casing:** Sentence case para UI. UPPERCASE espaciado solo para eyebrows ("FERIA DE ROPA", "TIENDA OFICIAL")
- **Montos:** pesos argentinos, punto para miles: `$18.900`
- **Emoji:** solo 👋 en saludos. Nunca como íconos de datos.

### Íconos

- **Sistema:** Lucide (1.9-2px stroke, round caps/joins)
- **Uso:** outline por defecto, corazón se rellena en favorito (terracota), estrella rellena en rating (ámbar)
- **Tamaños:** 18px inline, 22px nav, 30-44px empty-states

Archivos: `La Percha Showroom Design System/guidelines/`

---

## Links

- [[../La Percha Showroom|La Percha Showroom]]
- [[../Pricing|Pricing]]
- [[C-UX-Scenarios/README|C — UX Scenarios]]
- [[E-Development/README|E — Development]]
- [[../../03 - REFERENCIAS/Pantallas/README|Pantallas]]

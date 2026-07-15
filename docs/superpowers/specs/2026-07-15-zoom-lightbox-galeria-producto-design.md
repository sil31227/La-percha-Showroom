# Zoom y lightbox en la galería de producto

**Fecha:** 2026-07-15
**Estado:** Diseño aprobado

## Contexto

En la página de detalle de producto (`src/app/(cliente)/producto/[id]/page.tsx`) las fotos
se muestran mediante `src/components/ProductGallery.tsx`. La galería **ya es 100% manual**:
el usuario navega con flechas, dots, thumbnails, swipe (mobile) y scroll-snap. No existe
autoplay ni temporizadores, por lo que no hay nada que cambiar respecto a "que no se muevan
solas".

Lo que falta es **poder hacer zoom para ver el detalle de la ropa**. Hoy no hay zoom,
lightbox ni modal de imagen ampliada en ninguna parte del proyecto.

El proyecto es Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS v4, con UI
100% custom y `lucide-react` para íconos. No se usan librerías de carrusel ni de lightbox.

## Objetivo

Agregar zoom a la galería del **detalle de producto** (solo ahí; las tarjetas del catálogo
no se tocan), combinando:

- **Desktop:** efecto lupa al pasar el mouse sobre la imagen principal + click abre un
  lightbox a pantalla completa con zoom.
- **Mobile:** tap sobre la imagen activa abre el lightbox a pantalla completa con
  pinch-to-zoom y pan.

Sin dependencias nuevas: solo Tailwind v4 + `lucide-react`.

## Arquitectura y componentes

### Componente nuevo: `src/components/ImageLightbox.tsx`

Overlay a pantalla completa con zoom y navegación. Responsabilidad aislada: overlay +
gestos de zoom/pan + navegación entre imágenes.

**Props:**

```ts
interface Props {
  images: string[]
  title: string
  startIndex: number
  onClose: () => void
  onIndexChange?: (index: number) => void
}
```

**Comportamiento:**

- Overlay `fixed inset-0`, fondo `bg-black/90`, z-index alto, bloquea el scroll del `body`
  mientras está abierto.
- Botón cerrar (icono `X` de lucide) arriba a la derecha. Cierra también con tecla
  `Escape` y con click sobre el fondo.
- **Zoom desktop:** rueda del mouse hace zoom in/out (rango 1x–4x) centrado en el cursor.
  Con zoom >1x, arrastrar con el mouse hace pan. Doble-click alterna entre 1x y 2.5x.
- **Zoom mobile:** pinch con dos dedos para zoom; un dedo para pan cuando la imagen está
  ampliada.
- **Navegación entre fotos:** flechas ‹ › (`ChevronLeft`/`ChevronRight`) + contador
  `n / total`. En mobile, swipe horizontal cambia de foto **solo cuando el zoom está en
  1x** (para no chocar con el pan). Al cambiar de foto el zoom se resetea a 1x.
- **Sincronización:** abre en `startIndex`; al cambiar de foto notifica vía
  `onIndexChange` para que la galería quede en la última foto vista al cerrar.
- **Errores/fallback:** reusa el mismo `fallbackSrc` (SVG "Sin imagen") y manejo `onError`
  que hoy usa `ProductGallery`.

### Componente modificado: `src/components/ProductGallery.tsx`

Se mantiene TODO lo actual (flechas, dots, thumbnails, swipe, scroll-snap, manejo de
errores). Se agrega:

- **Desktop:** efecto lupa al `mouseenter` sobre la imagen principal — un recuadro/lupa
  que muestra la zona ampliada (~2x) siguiendo el cursor (calculando `background-position`
  según la posición relativa del mouse). Desaparece al `mouseleave`. Cursor `zoom-in`
  sobre la imagen. Click abre el lightbox en la imagen activa. Solo se aplica si la imagen
  no está en estado de error.
- **Mobile:** tap sobre la imagen activa abre el lightbox.
- Estado local para controlar apertura del lightbox (`lightboxOpen: boolean`), reusando el
  `active` existente como `startIndex`. El `onIndexChange` del lightbox actualiza `active`.

La lupa desktop no debe interferir con las flechas de navegación (quedan por encima con su
`z-index` actual).

## Flujo de datos

1. `ProductGallery` ya recibe `images` y `title` desde la página de detalle.
2. El índice activo vive en `ProductGallery` (`active`).
3. Al abrir el lightbox se le pasa `startIndex={active}`.
4. El lightbox reporta cambios de índice con `onIndexChange`, que actualiza `active`.
5. Al cerrar, `ProductGallery` refleja la última foto vista.

## Manejo de errores

- Imágenes que fallan al cargar usan el `fallbackSrc` compartido (mismo SVG actual).
- El efecto lupa se desactiva para imágenes en error.
- Si `images` está vacío, se mantiene el estado actual ("Sin imágenes") y no se habilita
  zoom/lightbox.

## Accesibilidad

- Lightbox con `role="dialog"`, `aria-modal="true"`, foco atrapado dentro del overlay,
  cierre con `Escape`.
- Botones (cerrar, prev, next) con `aria-label`.
- El scroll-snap y swipe actuales de la galería se mantienen intactos.

## Testing / verificación

El proyecto no tiene setup de tests automatizados. Verificación:

- `bun run lint`
- `bun run build`
- Prueba manual: hover/lupa en desktop, click abre lightbox, rueda hace zoom, pan con
  arrastre, doble-click alterna, flechas navegan; en mobile tap abre, pinch hace zoom, pan
  con un dedo, swipe cambia foto solo en 1x, Escape/click-fondo cierran.

## Fuera de alcance (YAGNI)

- No se toca `ProductCard` ni el mini-carrusel del catálogo.
- No se agrega autoplay (no existe y no se quiere).
- No se agregan dependencias externas.
- No se agrega galería de zoom en otras pantallas (favoritos, publicaciones, etc.).

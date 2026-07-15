# Zoom y Lightbox en Galería de Producto — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Agregar zoom (lupa en desktop al hover + lightbox fullscreen con zoom/pan en click y pinch en mobile) a la galería del detalle de producto.

**Architecture:** Un componente nuevo `ImageLightbox` (overlay fullscreen autónomo con zoom/pan/navegación, sin dependencias externas) invocado desde `ProductGallery`, que además gana un efecto lupa en su imagen principal de desktop. La navegación manual existente (flechas, dots, thumbnails, swipe, scroll-snap) se mantiene intacta.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript 5, Tailwind CSS v4, `lucide-react`. Runtime Bun.

## Global Constraints

- Sin dependencias nuevas: solo Tailwind v4 + `lucide-react`.
- Componentes `"use client"`.
- No modificar `ProductCard` ni el catálogo.
- Reusar el `fallbackSrc` (SVG "Sin imagen") ya definido en `ProductGallery.tsx:17`.
- No hay framework de tests: la verificación es `bun run lint`, `bun run build` y prueba manual descrita en cada task.
- Seguir el estilo del proyecto: clases Tailwind con tokens custom (`bg-surface-card`, `text-text-strong`, etc.), sin comentarios en el código.

---

### Task 1: Componente `ImageLightbox` — overlay, cierre y navegación

**Files:**
- Create: `src/components/ImageLightbox.tsx`

**Interfaces:**
- Consumes: nada.
- Produces:
  ```ts
  interface Props {
    images: string[]
    title: string
    startIndex: number
    onClose: () => void
    onIndexChange?: (index: number) => void
  }
  export function ImageLightbox(props: Props): JSX.Element
  ```

- [ ] **Step 1: Crear el componente con overlay, imagen, cierre y navegación (sin zoom todavía)**

Crear `src/components/ImageLightbox.tsx`:

```tsx
"use client"
import { useState, useEffect, useCallback } from "react"
import { X, ChevronLeft, ChevronRight } from "lucide-react"

interface Props {
  images: string[]
  title: string
  startIndex: number
  onClose: () => void
  onIndexChange?: (index: number) => void
}

const fallbackSrc = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='800' fill='%23f2efe8'%3E%3Crect width='600' height='800'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23c4baac' font-size='18' font-family='sans-serif'%3ESin imagen%3C/text%3E%3C/svg%3E"

export function ImageLightbox({ images, title, startIndex, onClose, onIndexChange }: Props) {
  const total = images.length
  const [index, setIndex] = useState(startIndex)
  const [imgErrors, setImgErrors] = useState<Record<number, boolean>>({})

  const markError = (i: number) => setImgErrors(prev => ({ ...prev, [i]: true }))

  const goTo = useCallback((i: number) => {
    if (total <= 1) return
    const next = (i + total) % total
    setIndex(next)
    onIndexChange?.(next)
  }, [total, onIndexChange])

  const prev = useCallback(() => goTo(index - 1), [index, goTo])
  const next = useCallback(() => goTo(index + 1), [index, goTo])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
      else if (e.key === "ArrowLeft") prev()
      else if (e.key === "ArrowRight") next()
    }
    document.addEventListener("keydown", onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [onClose, prev, next])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${title} — imagen ampliada`}
      className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center select-none"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        aria-label="Cerrar"
        className="absolute top-4 right-4 z-[102] w-10 h-10 rounded-full bg-white/10 hover:bg-white/20
          flex items-center justify-center text-white transition-colors"
      >
        <X className="w-5 h-5" />
      </button>

      <div
        className="relative w-full h-full flex items-center justify-center overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={imgErrors[index] ? fallbackSrc : images[index]}
          alt={`${title} foto ${index + 1}`}
          onError={() => markError(index)}
          className="max-w-[92vw] max-h-[88vh] object-contain"
          draggable={false}
        />
      </div>

      {total > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); prev() }}
            aria-label="Anterior"
            className="absolute left-3 top-1/2 -translate-y-1/2 z-[101] w-11 h-11 rounded-full
              bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); next() }}
            aria-label="Siguiente"
            className="absolute right-3 top-1/2 -translate-y-1/2 z-[101] w-11 h-11 rounded-full
              bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
          <span className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[101] px-3 py-1 rounded-full
            bg-white/10 text-white text-sm tabular-nums">
            {index + 1} / {total}
          </span>
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verificar lint**

Run: `bun run lint`
Expected: sin errores nuevos en `src/components/ImageLightbox.tsx`.

- [ ] **Step 3: Commit**

```bash
git add src/components/ImageLightbox.tsx
git commit -m "feat: componente ImageLightbox con overlay y navegacion"
```

---

### Task 2: Zoom y pan en el `ImageLightbox`

**Files:**
- Modify: `src/components/ImageLightbox.tsx`

**Interfaces:**
- Consumes: el componente de Task 1.
- Produces: mismo export, comportamiento de zoom añadido (sin cambios de firma).

- [ ] **Step 1: Agregar estado de zoom/pan y handlers**

Dentro de `ImageLightbox`, añadir tras el estado existente:

```tsx
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const dragging = useRef(false)
  const dragStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 })
  const pinchStart = useRef<{ dist: number; scale: number } | null>(null)
  const touchStart = useRef<{ x: number; y: number } | null>(null)

  const resetZoom = useCallback(() => {
    setScale(1)
    setOffset({ x: 0, y: 0 })
  }, [])
```

Añadir `useRef` al import de React:

```tsx
import { useState, useEffect, useCallback, useRef } from "react"
```

Modificar `goTo` para resetear zoom al cambiar de foto — reemplazar el cuerpo por:

```tsx
  const goTo = useCallback((i: number) => {
    if (total <= 1) return
    const next = (i + total) % total
    setIndex(next)
    setScale(1)
    setOffset({ x: 0, y: 0 })
    onIndexChange?.(next)
  }, [total, onIndexChange])
```

- [ ] **Step 2: Agregar handlers de wheel, doble-click, mouse-drag y touch**

Añadir antes del `return`:

```tsx
  const clampScale = (s: number) => Math.min(4, Math.max(1, s))

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const nextScale = clampScale(scale + (e.deltaY < 0 ? 0.3 : -0.3))
    if (nextScale === 1) setOffset({ x: 0, y: 0 })
    setScale(nextScale)
  }

  const handleDoubleClick = () => {
    if (scale > 1) resetZoom()
    else setScale(2.5)
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return
    dragging.current = true
    dragStart.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging.current) return
    setOffset({
      x: dragStart.current.ox + (e.clientX - dragStart.current.x),
      y: dragStart.current.oy + (e.clientY - dragStart.current.y),
    })
  }

  const endDrag = () => { dragging.current = false }

  const dist = (t: React.TouchList) =>
    Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY)

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      pinchStart.current = { dist: dist(e.touches), scale }
      touchStart.current = null
    } else if (e.touches.length === 1) {
      if (scale > 1) {
        dragStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, ox: offset.x, oy: offset.y }
      }
      touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchStart.current) {
      const nextScale = clampScale(pinchStart.current.scale * (dist(e.touches) / pinchStart.current.dist))
      if (nextScale === 1) setOffset({ x: 0, y: 0 })
      setScale(nextScale)
    } else if (e.touches.length === 1 && scale > 1) {
      setOffset({
        x: dragStart.current.ox + (e.touches[0].clientX - dragStart.current.x),
        y: dragStart.current.oy + (e.touches[0].clientY - dragStart.current.y),
      })
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    pinchStart.current = null
    if (scale <= 1 && touchStart.current && e.changedTouches.length) {
      const dx = e.changedTouches[0].clientX - touchStart.current.x
      const dy = e.changedTouches[0].clientY - touchStart.current.y
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
        if (dx < 0) next()
        else prev()
      }
    }
    touchStart.current = null
  }
```

- [ ] **Step 3: Conectar handlers y transform en el contenedor/imagen**

Reemplazar el `<div>` contenedor de la imagen y el `<img>` (el bloque con `onClick={(e) => e.stopPropagation()}`) por:

```tsx
      <div
        className="relative w-full h-full flex items-center justify-center overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={endDrag}
        onMouseLeave={endDrag}
        onDoubleClick={handleDoubleClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ cursor: scale > 1 ? "grab" : "zoom-in", touchAction: "none" }}
      >
        <img
          src={imgErrors[index] ? fallbackSrc : images[index]}
          alt={`${title} foto ${index + 1}`}
          onError={() => markError(index)}
          className="max-w-[92vw] max-h-[88vh] object-contain transition-transform duration-75"
          style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})` }}
          draggable={false}
        />
      </div>
```

- [ ] **Step 4: Verificar lint y build**

Run: `bun run lint && bun run build`
Expected: sin errores.

- [ ] **Step 5: Commit**

```bash
git add src/components/ImageLightbox.tsx
git commit -m "feat: zoom con rueda, doble-click, pinch y pan en ImageLightbox"
```

---

### Task 3: Integrar lightbox + lupa desktop en `ProductGallery`

**Files:**
- Modify: `src/components/ProductGallery.tsx`

**Interfaces:**
- Consumes: `ImageLightbox` de Tasks 1-2.
- Produces: galería con apertura de lightbox (mobile tap + desktop click) y lupa hover en desktop.

- [ ] **Step 1: Importar y agregar estado del lightbox y de la lupa**

En `src/components/ProductGallery.tsx`, añadir import:

```tsx
import { ImageLightbox } from "./ImageLightbox"
```

Añadir junto al estado existente (tras `touchStartY`):

```tsx
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lens, setLens] = useState<{ show: boolean; x: number; y: number }>({ show: false, x: 50, y: 50 })
```

- [ ] **Step 2: Abrir lightbox al tocar la imagen en mobile**

En el bloque mobile, envolver la imagen en un botón. Reemplazar el `<div className="relative h-[320px] sm:h-[400px] bg-surface-sunken">...</div>` (líneas ~80-88) por:

```tsx
            <button
              type="button"
              onClick={() => setLightboxOpen(true)}
              className="relative h-[320px] sm:h-[400px] w-full bg-surface-sunken block"
              aria-label="Ampliar imagen"
            >
              <img
                src={imgErrors[i] ? fallbackSrc : img}
                alt={`${title} foto ${i + 1}`}
                loading={i === 0 ? "eager" : "lazy"}
                onError={() => markError(i)}
                className="w-full h-full object-contain bg-surface-sunken"
              />
            </button>
```

- [ ] **Step 3: Agregar lupa hover + click al abrir lightbox en la imagen principal desktop**

Reemplazar el `<img>` principal de desktop (líneas ~138-143) y agregar el recuadro lupa. Dentro del `<div className="relative aspect-[3/4] max-h-[520px] ...">`, reemplazar el `<img>` por:

```tsx
          <div
            className="w-full h-full cursor-zoom-in"
            onClick={() => setLightboxOpen(true)}
            onMouseEnter={() => !imgErrors[active] && setLens(l => ({ ...l, show: true }))}
            onMouseLeave={() => setLens(l => ({ ...l, show: false }))}
            onMouseMove={(e) => {
              const r = e.currentTarget.getBoundingClientRect()
              setLens({
                show: true,
                x: ((e.clientX - r.left) / r.width) * 100,
                y: ((e.clientY - r.top) / r.height) * 100,
              })
            }}
          >
            <img
              src={imgErrors[active] ? fallbackSrc : images[active]}
              alt={`${title} foto ${active + 1}`}
              onError={() => markError(active)}
              className="w-full h-full object-contain bg-surface-sunken pointer-events-none"
            />
            {lens.show && !imgErrors[active] && (
              <div
                className="absolute inset-0 pointer-events-none bg-no-repeat"
                style={{
                  backgroundImage: `url(${images[active]})`,
                  backgroundSize: "200%",
                  backgroundPosition: `${lens.x}% ${lens.y}%`,
                }}
              />
            )}
          </div>
```

- [ ] **Step 4: Renderizar el lightbox al final del componente**

Antes del `</div>` de cierre del `return` (después del bloque desktop), añadir:

```tsx
      {lightboxOpen && (
        <ImageLightbox
          images={images}
          title={title}
          startIndex={active}
          onClose={() => setLightboxOpen(false)}
          onIndexChange={setActive}
        />
      )}
```

- [ ] **Step 5: Verificar lint y build**

Run: `bun run lint && bun run build`
Expected: sin errores.

- [ ] **Step 6: Prueba manual**

Ejecutar `bun run dev`, abrir un producto con varias fotos:
- Desktop: hover sobre imagen principal muestra lupa (zona ampliada sigue el cursor); click abre lightbox; rueda hace zoom; arrastre hace pan; doble-click alterna; flechas/Escape funcionan.
- Mobile (responsive): tap sobre la imagen abre lightbox; pinch hace zoom; un dedo hace pan con zoom; swipe cambia foto en 1x; botón X y click-fondo cierran.
- La navegación previa de la galería (flechas, dots, thumbnails, swipe) sigue funcionando.

- [ ] **Step 7: Commit**

```bash
git add src/components/ProductGallery.tsx
git commit -m "feat: lupa hover y apertura de lightbox en galeria de producto"
```

---

## Self-Review

**Spec coverage:**
- Lightbox fullscreen con zoom → Task 1 + 2. ✓
- Lupa hover desktop → Task 3 Step 3. ✓
- Pinch/pan mobile → Task 2. ✓
- Apertura click (desktop) / tap (mobile) → Task 3. ✓
- Navegación + reset zoom al cambiar foto → Task 2 Step 1 (`goTo`). ✓
- Sincronización de índice → `onIndexChange={setActive}`, Task 3 Step 4. ✓
- Fallback/errores → `fallbackSrc` reusado, `markError`. ✓
- Accesibilidad (dialog, aria, Escape, foco) → Task 1. ✓
- Sin dependencias nuevas → solo lucide-react + Tailwind. ✓
- No tocar ProductCard/catálogo → fuera de alcance. ✓

**Placeholder scan:** sin TBD/TODO; todo el código está completo.

**Type consistency:** `Props` de `ImageLightbox` idéntico entre Task 1 y su uso en Task 3; `onIndexChange` opcional usado como `setActive`; `goTo` con misma firma en Tasks 1 y 2.

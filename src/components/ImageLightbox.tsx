"use client"
import { useState, useEffect, useCallback, useRef } from "react"
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
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const dragging = useRef(false)
  const dragStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 })
  const pinchStart = useRef<{ dist: number; scale: number } | null>(null)
  const touchStart = useRef<{ x: number; y: number } | null>(null)

  const markError = (i: number) => setImgErrors(prev => ({ ...prev, [i]: true }))

  const resetZoom = useCallback(() => {
    setScale(1)
    setOffset({ x: 0, y: 0 })
  }, [])

  const goTo = useCallback((i: number) => {
    if (total <= 1) return
    const next = (i + total) % total
    setIndex(next)
    setScale(1)
    setOffset({ x: 0, y: 0 })
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

  const clampScale = (s: number) => Math.min(4, Math.max(1, s))

  const handleWheel = (e: React.WheelEvent) => {
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

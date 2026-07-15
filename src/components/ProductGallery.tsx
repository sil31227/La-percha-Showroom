"use client"
import { useState, useRef, useCallback } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { ImageLightbox } from "./ImageLightbox"

interface Props {
  images: string[]
  title: string
}

export function ProductGallery({ images, title }: Props) {
  const [active, setActive] = useState(0)
  const [imgErrors, setImgErrors] = useState<Record<number, boolean>>({})
  const scrollRef = useRef<HTMLDivElement>(null)
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lens, setLens] = useState<{ show: boolean; x: number; y: number }>({ show: false, x: 50, y: 50 })

  const fallbackSrc = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='800' fill='%23f2efe8'%3E%3Crect width='600' height='800'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23c4baac' font-size='18' font-family='sans-serif'%3ESin imagen%3C/text%3E%3C/svg%3E"

  const total = images?.length || 0

  const goTo = useCallback((idx: number) => {
    if (total <= 1) return
    const next = Math.max(0, Math.min(idx, total - 1))
    setActive(next)
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ left: next * scrollRef.current.clientWidth, behavior: 'smooth' })
    }
  }, [total])

  const prev = useCallback(() => {
    goTo(active === 0 ? total - 1 : active - 1)
  }, [active, total, goTo])

  const next = useCallback(() => {
    goTo(active === total - 1 ? 0 : active + 1)
  }, [active, total, goTo])

  const handleScroll = () => {
    if (!scrollRef.current) return
    const idx = Math.round(scrollRef.current.scrollLeft / scrollRef.current.clientWidth)
    setActive(idx)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current
    const dy = e.changedTouches[0].clientY - touchStartY.current
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
      if (dx < 0) next()
      else prev()
    }
  }

  const markError = (i: number) => setImgErrors(prev => ({ ...prev, [i]: true }))

  if (total === 0) {
    return (
      <div className="aspect-[3/4] bg-surface-sunken rounded-xl flex items-center justify-center">
        <p className="text-text-muted text-sm">Sin imágenes</p>
      </div>
    )
  }

  return (
    <div>
      {/* Mobile: scroll snap carousel */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="lg:hidden flex overflow-x-auto snap-x snap-mandatory scrollbar-none relative"
      >
        {images.map((img, i) => (
          <div key={i} className="shrink-0 w-full snap-center">
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
          </div>
        ))}

        {/* Navigation arrows — mobile */}
        {total > 1 && (
          <>
            <button
              onClick={prev}
              aria-label="Anterior"
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full
                bg-surface-card/80 backdrop-blur-sm flex items-center justify-center
                text-text-strong shadow-md hover:bg-surface-card active:scale-90 transition-all"
            >
              <ChevronLeft className="w-4.5 h-4.5" />
            </button>
            <button
              onClick={next}
              aria-label="Siguiente"
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full
                bg-surface-card/80 backdrop-blur-sm flex items-center justify-center
                text-text-strong shadow-md hover:bg-surface-card active:scale-90 transition-all"
            >
              <ChevronRight className="w-4.5 h-4.5" />
            </button>
          </>
        )}
      </div>

      {/* Dots + counter — mobile */}
      {total > 1 && (
        <div className="lg:hidden flex items-center justify-center gap-1.5 mt-2">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Foto ${i + 1}`}
              className={`w-1.5 h-1.5 rounded-full transition-all
                ${i === active ? 'bg-text-strong w-4' : 'bg-border-default'}`}
            />
          ))}
          <span className="text-[10px] text-text-muted ml-2 tabular-nums">
            {active + 1} / {total}
          </span>
        </div>
      )}

      {/* Desktop: main image + thumbnails */}
      <div className="hidden lg:block">
        <div className="relative aspect-[3/4] max-h-[520px] rounded-xl bg-surface-sunken overflow-hidden">
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

          {/* Navigation arrows — desktop */}
          {total > 1 && (
            <>
              <button
                onClick={prev}
                aria-label="Anterior"
                className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full
                  bg-surface-card/80 backdrop-blur-sm flex items-center justify-center
                  text-text-strong shadow-md hover:bg-surface-card active:scale-90 transition-all"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={next}
                aria-label="Siguiente"
                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full
                  bg-surface-card/80 backdrop-blur-sm flex items-center justify-center
                  text-text-strong shadow-md hover:bg-surface-card active:scale-90 transition-all"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              {/* Counter badge */}
              <span className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full
                bg-surface-card/80 backdrop-blur-sm text-xs font-medium text-text-body
                tabular-nums">
                {active + 1} / {total}
              </span>
            </>
          )}
        </div>

        {/* Thumbnail strip */}
        {total > 1 && (
          <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className={`w-16 h-20 rounded-md overflow-hidden shrink-0 border-2 transition-colors
                  ${i === active ? 'border-brand' : 'border-transparent hover:border-border-default'}`}
              >
                <img
                  src={imgErrors[i] ? fallbackSrc : img}
                  alt={`${title} miniatura ${i + 1}`}
                  loading="lazy"
                  onError={() => markError(i)}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {lightboxOpen && (
        <ImageLightbox
          images={images}
          title={title}
          startIndex={active}
          onClose={() => setLightboxOpen(false)}
          onIndexChange={setActive}
        />
      )}
    </div>
  )
}

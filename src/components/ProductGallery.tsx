"use client"
import { useState, useRef } from "react"

interface Props {
  images: string[]
  title: string
}

export function ProductGallery({ images, title }: Props) {
  const [active, setActive] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)

  const handleScroll = () => {
    if (!scrollRef.current) return
    const idx = Math.round(scrollRef.current.scrollLeft / scrollRef.current.clientWidth)
    setActive(idx)
  }

  return (
    <div>
      {/* Mobile: scroll snap */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="lg:hidden flex overflow-x-auto snap-x snap-mandatory scrollbar-none">
        {images.map((img, i) => (
          <div key={i} className="shrink-0 w-full snap-center">
            <div className="relative h-[320px] bg-surface-sunken">
              <img src={img} alt={`${title} foto ${i + 1}`}
                className="w-full h-full object-cover" />
            </div>
          </div>
        ))}
      </div>

      {/* Dots mobile */}
      {images.length > 1 && (
        <div className="lg:hidden flex justify-center gap-1.5 mt-2">
          {images.map((_, i) => (
            <span key={i}
              className={`w-1.5 h-1.5 rounded-full transition-colors
                ${i === active ? 'bg-text-strong' : 'bg-border-default'}`} />
          ))}
        </div>
      )}

      {/* Desktop: imagen principal + thumbnails */}
      <div className="hidden lg:block">
        <div className="relative h-[480px] rounded-xl bg-surface-sunken overflow-hidden">
          <img src={images[active]} alt={`${title} foto ${active + 1}`}
            className="w-full h-full object-cover" />
        </div>
        {images.length > 1 && (
          <div className="flex gap-2 mt-2">
            {images.map((img, i) => (
              <button key={i}
                onClick={() => setActive(i)}
                className={`w-16 h-16 rounded-md overflow-hidden border-2 transition-colors
                  ${i === active ? 'border-brand' : 'border-transparent'}`}>
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

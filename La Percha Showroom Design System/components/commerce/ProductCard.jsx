import React from 'react';
import { Badge } from '../feedback/Badge.jsx';
import { Rating } from '../feedback/Rating.jsx';
import { IconButton } from '../forms/IconButton.jsx';
import { PriceTag } from './PriceTag.jsx';

const HeartIcon = ({ filled }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 1 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
  </svg>
);

const PhotoPlaceholder = () => (
  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, var(--taupe-100), var(--taupe-200))', color: 'var(--taupe-400)' }}>
    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="8.5" cy="8.5" r="1.8" /><path d="M21 15l-5-5L5 21" /></svg>
  </div>
);

/**
 * ProductCard — marketplace product tile. Works for Tienda Oficial and Feria de Ropa.
 * Mobile-first 2-up grid; composes Badge, Rating, PriceTag and a favorite IconButton.
 */
export function ProductCard({
  title, price, original, image, rating, reviews,
  official = false, freeShipping = false, seller, favorite = false,
  onToggleFavorite, onClick, style = {},
}) {
  return (
    <article onClick={onClick} style={{
      display: 'flex', flexDirection: 'column', background: 'var(--surface-card)',
      border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)',
      overflow: 'hidden', cursor: onClick ? 'pointer' : 'default', boxShadow: 'var(--shadow-sm)',
      transition: 'box-shadow var(--dur-base) var(--ease-out), transform var(--dur-base) var(--ease-out)', ...style,
    }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      <div style={{ position: 'relative', aspectRatio: '1 / 1.18', background: 'var(--taupe-100)' }}>
        {image ? <img src={image} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <PhotoPlaceholder />}
        <div style={{ position: 'absolute', top: 8, left: 8, display: 'flex', gap: 5 }}>
          {official && <Badge tone="brand" solid size="sm">Oficial</Badge>}
          {freeShipping && <Badge tone="mint" size="sm">Envío gratis</Badge>}
        </div>
        <div style={{ position: 'absolute', top: 6, right: 6 }}>
          <IconButton variant="soft" size="sm" ariaLabel="Favorito" active={favorite}
            onClick={(e) => { e.stopPropagation(); onToggleFavorite && onToggleFavorite(); }}>
            <HeartIcon filled={favorite} />
          </IconButton>
        </div>
      </div>
      <div style={{ padding: '10px 12px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {rating != null && <Rating value={rating} count={reviews} size={13} />}
        <h3 style={{
          fontFamily: 'var(--font-ui)', fontWeight: 'var(--fw-semibold)', fontSize: 'var(--text-base)',
          color: 'var(--text-strong)', lineHeight: 'var(--leading-snug)', margin: 0,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>{title}</h3>
        <PriceTag price={price} original={original} size="md" />
        {seller && <span style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>por {seller}</span>}
      </div>
    </article>
  );
}

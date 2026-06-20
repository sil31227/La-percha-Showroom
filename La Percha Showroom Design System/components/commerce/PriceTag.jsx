import React from 'react';

const fmt = (n) => '$' + Number(n).toLocaleString('es-AR');

/** PriceTag — current price with optional strikethrough original & discount %. */
export function PriceTag({ price, original, size = 'md', style = {} }) {
  const sizes = { sm: 'var(--text-base)', md: 'var(--text-lg)', lg: 'var(--text-2xl)' };
  const hasSale = original != null && original > price;
  const pct = hasSale ? Math.round((1 - price / original) * 100) : 0;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap', ...style }}>
      <span style={{ fontFamily: 'var(--font-ui)', fontWeight: 'var(--fw-extra)', fontSize: sizes[size], color: 'var(--price)', letterSpacing: '-0.01em' }}>{fmt(price)}</span>
      {hasSale && (
        <>
          <span style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', color: 'var(--text-subtle)', textDecoration: 'line-through' }}>{fmt(original)}</span>
          <span style={{ fontFamily: 'var(--font-ui)', fontWeight: 'var(--fw-bold)', fontSize: 'var(--text-sm)', color: 'var(--success-600)' }}>{pct}% OFF</span>
        </>
      )}
    </span>
  );
}

import React from 'react';

const Star = ({ fill, size }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden="true">
    <path d="M10 1.6l2.47 5.01 5.53.8-4 3.9.94 5.5L10 14.2l-4.94 2.6.94-5.5-4-3.9 5.53-.8z"
      fill={fill} />
  </svg>
);

/** Rating — read-only star rating with optional count. */
export function Rating({ value = 0, count, size = 15, showValue = false, style = {} }) {
  const stars = [0, 1, 2, 3, 4].map((i) => {
    const filled = value >= i + 1;
    const half = !filled && value > i;
    return (
      <span key={i} style={{ position: 'relative', display: 'inline-flex' }}>
        <Star fill="var(--ink-200)" size={size} />
        {(filled || half) && (
          <span style={{ position: 'absolute', inset: 0, overflow: 'hidden', width: half ? `${(value - i) * 100}%` : '100%' }}>
            <Star fill="var(--rating-star)" size={size} />
          </span>
        )}
      </span>
    );
  });
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, ...style }}>
      <span style={{ display: 'inline-flex', gap: 1 }}>{stars}</span>
      {showValue && <span style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-bold)', color: 'var(--text-strong)' }}>{value.toFixed(1)}</span>}
      {count != null && <span style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>({count})</span>}
    </span>
  );
}

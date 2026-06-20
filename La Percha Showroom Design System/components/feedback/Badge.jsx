import React from 'react';

/** Badge — small status/label pill. Tones map to the semantic palette. */
export function Badge({ children, tone = 'neutral', solid = false, size = 'md', style = {} }) {
  const tones = {
    neutral: { soft: ['var(--ink-100)', 'var(--ink-700)'], solid: ['var(--ink-700)', '#fff'] },
    brand:   { soft: ['var(--sage-100)', 'var(--sage-700)'], solid: ['var(--brand)', '#fff'] },
    mint:    { soft: ['var(--mint-100)', 'var(--mint-700)'], solid: ['var(--mint-500)', '#fff'] },
    success: { soft: ['var(--success-50)', 'var(--success-600)'], solid: ['var(--success-500)', '#fff'] },
    warning: { soft: ['var(--warning-50)', 'var(--warning-600)'], solid: ['var(--warning-500)', '#fff'] },
    error:   { soft: ['var(--error-50)', 'var(--error-600)'], solid: ['var(--error-500)', '#fff'] },
  };
  const t = tones[tone] || tones.neutral;
  const [bg, fg] = solid ? t.solid : t.soft;
  const sm = size === 'sm';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: sm ? '2px 8px' : '3px 10px', background: bg, color: fg,
      borderRadius: 'var(--radius-pill)', fontFamily: 'var(--font-ui)',
      fontWeight: 'var(--fw-bold)', fontSize: sm ? 'var(--text-2xs)' : 'var(--text-xs)',
      letterSpacing: '0.02em', lineHeight: 1.4, whiteSpace: 'nowrap', ...style,
    }}>{children}</span>
  );
}

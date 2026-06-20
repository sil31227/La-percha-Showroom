import React from 'react';

/** QuantityStepper — −/＋ quantity control for cart line items. */
export function QuantityStepper({ value = 1, min = 1, max = 99, onChange, size = 'md', style = {} }) {
  const dim = size === 'sm' ? 30 : 36;
  const set = (n) => { const c = Math.max(min, Math.min(max, n)); if (onChange) onChange(c); };
  const btn = (label, fn, off) => (
    <button type="button" aria-label={label} disabled={off} onClick={fn}
      style={{
        width: dim, height: dim, display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: 'none', background: 'transparent', cursor: off ? 'not-allowed' : 'pointer',
        color: off ? 'var(--ink-300)' : 'var(--text-strong)', fontSize: 18, fontWeight: 600,
        fontFamily: 'var(--font-ui)', borderRadius: 'var(--radius-sm)',
      }}>{label === 'Quitar' ? '−' : '+'}</button>
  );
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', border: '1px solid var(--border-default)',
      borderRadius: 'var(--radius-pill)', background: 'var(--surface-card)', ...style,
    }}>
      {btn('Quitar', () => set(value - 1), value <= min)}
      <span style={{
        minWidth: 26, textAlign: 'center', fontFamily: 'var(--font-ui)', fontWeight: 'var(--fw-bold)',
        fontSize: 'var(--text-base)', color: 'var(--text-strong)',
      }}>{value}</span>
      {btn('Agregar', () => set(value + 1), value >= max)}
    </div>
  );
}

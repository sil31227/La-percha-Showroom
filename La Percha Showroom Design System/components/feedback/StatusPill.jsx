import React from 'react';

/**
 * StatusPill — order / payment / publication status with a leading dot.
 * Centralizes the La Percha state vocabulary so colors stay consistent.
 */
export function StatusPill({ status, style = {} }) {
  const map = {
    pendiente:   ['var(--warning-50)', 'var(--warning-600)', 'Pendiente'],
    pagado:      ['var(--mint-100)', 'var(--mint-700)', 'Pagado'],
    preparando:  ['var(--mint-100)', 'var(--mint-700)', 'Preparando'],
    enviado:     ['var(--sage-100)', 'var(--sage-700)', 'Enviado'],
    entregado:   ['var(--success-50)', 'var(--success-600)', 'Entregado'],
    liberado:    ['var(--success-50)', 'var(--success-600)', 'Pago liberado'],
    cancelado:   ['var(--error-50)', 'var(--error-600)', 'Cancelado'],
    revision:    ['var(--warning-50)', 'var(--warning-600)', 'En revisión'],
    aprobada:    ['var(--success-50)', 'var(--success-600)', 'Aprobada'],
    rechazada:   ['var(--error-50)', 'var(--error-600)', 'Rechazada'],
    cambios:     ['var(--warning-50)', 'var(--warning-600)', 'Cambios pedidos'],
  };
  const [bg, fg, label] = map[status] || ['var(--ink-100)', 'var(--ink-700)', status];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 11px 4px 9px',
      background: bg, color: fg, borderRadius: 'var(--radius-pill)',
      fontFamily: 'var(--font-ui)', fontWeight: 'var(--fw-bold)', fontSize: 'var(--text-xs)',
      lineHeight: 1.4, whiteSpace: 'nowrap', ...style,
    }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: fg, flex: '0 0 auto' }} />
      {label}
    </span>
  );
}

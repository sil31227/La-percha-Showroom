import React from 'react';

/** FilterChip — selectable filter/category chip used in toolbars & filter sheets. */
export function FilterChip({ children, selected = false, onClick, iconLeft = null, style = {} }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={selected}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6, height: 38, padding: '0 16px',
        borderRadius: 'var(--radius-pill)', cursor: 'pointer', whiteSpace: 'nowrap',
        fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-semibold)',
        background: selected ? 'var(--ink-900)' : 'var(--surface-card)',
        color: selected ? '#fff' : 'var(--text-body)',
        border: `1px solid ${selected ? 'var(--ink-900)' : 'var(--border-default)'}`,
        transition: 'all var(--dur-fast) var(--ease-out)', ...style,
      }}>
      {iconLeft}
      {children}
    </button>
  );
}

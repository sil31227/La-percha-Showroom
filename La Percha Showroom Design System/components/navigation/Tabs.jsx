import React from 'react';

/** Tabs — underline tab bar for in-page sections (Descripción, Reseñas; Ventas, Ganancias). */
export function Tabs({ tabs = [], active, onChange, style = {} }) {
  return (
    <div role="tablist" style={{
      display: 'flex', gap: 4, borderBottom: '1px solid var(--border-subtle)',
      overflowX: 'auto', ...style,
    }}>
      {tabs.map((t) => {
        const key = typeof t === 'string' ? t : t.key;
        const label = typeof t === 'string' ? t : t.label;
        const count = typeof t === 'string' ? null : t.count;
        const on = key === active;
        return (
          <button key={key} role="tab" aria-selected={on} type="button" onClick={() => onChange && onChange(key)}
            style={{
              position: 'relative', padding: '12px 14px', border: 'none', background: 'transparent',
              cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'var(--font-ui)',
              fontSize: 'var(--text-base)', fontWeight: on ? 'var(--fw-bold)' : 'var(--fw-semibold)',
              color: on ? 'var(--text-strong)' : 'var(--text-muted)',
              transition: 'color var(--dur-fast)',
            }}>
            {label}{count != null && <span style={{ color: 'var(--text-subtle)', fontWeight: 600 }}> ({count})</span>}
            <span style={{
              position: 'absolute', left: 10, right: 10, bottom: -1, height: 3, borderRadius: '3px 3px 0 0',
              background: on ? 'var(--brand)' : 'transparent', transition: 'background var(--dur-fast)',
            }} />
          </button>
        );
      })}
    </div>
  );
}

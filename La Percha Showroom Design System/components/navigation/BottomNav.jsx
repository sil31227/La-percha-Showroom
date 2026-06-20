import React from 'react';

/**
 * BottomNav — fixed mobile bottom navigation (Inicio, Buscar, Vender, Favoritos, Perfil).
 * The primary navigation pattern for La Percha's mobile-first experience.
 */
export function BottomNav({ items = [], active, onChange, style = {} }) {
  return (
    <nav style={{
      display: 'flex', alignItems: 'stretch', justifyContent: 'space-around',
      height: 'var(--bottomnav-height)', paddingBottom: 'var(--safe-bottom)',
      background: 'var(--surface-card)', borderTop: '1px solid var(--border-subtle)',
      boxShadow: '0 -2px 12px rgba(50,44,36,0.05)', ...style,
    }}>
      {items.map((it) => {
        const on = it.key === active;
        const accent = it.accent;
        return (
          <button key={it.key} type="button" onClick={() => onChange && onChange(it.key)}
            aria-current={on ? 'page' : undefined}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: 3, border: 'none', background: 'transparent', cursor: 'pointer', position: 'relative',
              color: on ? 'var(--brand)' : 'var(--text-subtle)',
              transition: 'color var(--dur-fast)',
            }}>
            {accent ? (
              <span style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', width: 44, height: 34,
                marginTop: -2, borderRadius: 'var(--radius-pill)', background: 'var(--brand)', color: '#fff',
                boxShadow: 'var(--shadow-brand)',
              }}>{it.icon}</span>
            ) : (
              <span style={{ display: 'flex', position: 'relative' }}>
                {it.icon}
                {it.badge != null && (
                  <span style={{
                    position: 'absolute', top: -5, right: -8, minWidth: 16, height: 16, padding: '0 4px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--radius-pill)',
                    background: 'var(--error-500)', color: '#fff', fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-ui)',
                  }}>{it.badge}</span>
                )}
              </span>
            )}
            <span style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-2xs)', fontWeight: on ? 'var(--fw-bold)' : 'var(--fw-semibold)', letterSpacing: '0.01em' }}>{it.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

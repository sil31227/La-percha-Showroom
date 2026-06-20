// Shared desktop panel chrome (sidebar, topbar, stat cards) for seller + admin kits
(function () {
  const svg = (children, size = 20) => React.createElement('svg', { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.9, strokeLinecap: 'round', strokeLinejoin: 'round' }, children);
  const P = (d) => React.createElement('path', { d, key: d });
  const PI = {
    grid: svg([P('M3 3h7v7H3z'), P('M14 3h7v7h-7z'), P('M14 14h7v7h-7z'), P('M3 14h7v7H3z')]),
    tag: svg([P('M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0l-7.2-7.2A2 2 0 0 1 3 12V4a1 1 0 0 1 1-1h8a2 2 0 0 1 1.4.6l6.2 6.2a2 2 0 0 1 0 2.6z'), React.createElement('circle', { cx: 7.5, cy: 7.5, r: 1.5, key: 'c' })]),
    cart: svg([React.createElement('circle', { cx: 9, cy: 20, r: 1.5, key: 'a' }), React.createElement('circle', { cx: 17, cy: 20, r: 1.5, key: 'b' }), P('M3 4h2l2.4 11.4a1.5 1.5 0 0 0 1.5 1.2h7.7a1.5 1.5 0 0 0 1.5-1.2L21 8H6')]),
    wallet: svg([P('M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'), P('M16 12h4'), P('M3 9h18')]),
    chart: svg([P('M3 3v18h18'), P('M7 14l4-4 3 3 5-6')]),
    check: svg([P('M20 6 9 17l-5-5')]),
    x: svg([P('M18 6 6 18'), P('M6 6l12 12')]),
    edit: svg([P('M12 20h9'), P('M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z')]),
    bell: svg([P('M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9'), P('M13.7 21a2 2 0 0 1-3.4 0')]),
    users: svg([P('M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2'), React.createElement('circle', { cx: 9, cy: 7, r: 4, key: 'a' }), P('M22 21v-2a4 4 0 0 0-3-3.9')]),
    truck: svg([P('M3 7h11v9H3z'), P('M14 10h4l3 3v3h-7'), React.createElement('circle', { cx: 7.5, cy: 18, r: 1.6, key: 'a' }), React.createElement('circle', { cx: 17, cy: 18, r: 1.6, key: 'b' })]),
    money: svg([React.createElement('circle', { cx: 12, cy: 12, r: 9, key: 'a' }), P('M9.5 14.5c1.3 1 4 1 5.3 0M9.5 9.5c1.3-1 4-1 5.3 0M12 6v12')]),
  };
  window.PanelIcons = PI;

  window.Sidebar = function Sidebar({ role, items, active, onSelect }) {
    return React.createElement('aside', { style: { width: 248, flex: '0 0 248px', background: 'var(--ink-900)', color: 'var(--ink-300)', display: 'flex', flexDirection: 'column', padding: '22px 14px' } },
      React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 11, padding: '0 8px 22px' } },
        React.createElement('img', { src: 'logo.jpg', style: { width: 40, height: 40, borderRadius: '50%' } }),
        React.createElement('div', null,
          React.createElement('div', { style: { fontFamily: 'var(--font-display)', fontSize: 17, color: '#fff', lineHeight: 1 } }, 'La Percha'),
          React.createElement('div', { style: { fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--ink-500)', marginTop: 3 } }, role)
        )
      ),
      React.createElement('nav', { style: { display: 'flex', flexDirection: 'column', gap: 3, marginTop: 8 } },
        items.map(it => {
          const on = it.key === active;
          return React.createElement('button', { key: it.key, onClick: () => onSelect && onSelect(it.key), style: { display: 'flex', alignItems: 'center', gap: 12, padding: '11px 12px', borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-ui)', fontSize: 14, fontWeight: on ? 700 : 500, background: on ? 'var(--sage-600)' : 'transparent', color: on ? '#fff' : 'var(--ink-300)' } },
            React.createElement('span', { style: { display: 'flex', opacity: on ? 1 : .8 } }, it.icon),
            it.label,
            it.badge != null && React.createElement('span', { style: { marginLeft: 'auto', background: on ? 'rgba(255,255,255,.25)' : 'var(--error-500)', color: '#fff', borderRadius: 999, fontSize: 11, fontWeight: 700, padding: '1px 7px' } }, it.badge)
          );
        })
      )
    );
  };

  window.TopBar = function TopBar({ title, sub, right }) {
    return React.createElement('header', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 28px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--surface-card)' } },
      React.createElement('div', null,
        React.createElement('h1', { style: { fontFamily: 'var(--font-display)', fontWeight: 400, fontSize: 24, color: 'var(--text-strong)', margin: 0 } }, title),
        sub && React.createElement('p', { style: { margin: '3px 0 0', fontSize: 13, color: 'var(--text-muted)' } }, sub)
      ),
      React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 14 } }, right)
    );
  };

  window.StatCard = function StatCard({ label, value, delta, tone = 'brand', icon }) {
    const tones = { brand: ['var(--sage-100)', 'var(--sage-700)'], mint: ['var(--mint-100)', 'var(--mint-700)'], warning: ['var(--warning-50)', 'var(--warning-600)'], neutral: ['var(--ink-100)', 'var(--ink-700)'] };
    const [bg, fg] = tones[tone] || tones.brand;
    return React.createElement('div', { style: { flex: 1, background: 'var(--surface-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: 18, boxShadow: 'var(--shadow-sm)' } },
      React.createElement('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 } },
        React.createElement('span', { style: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: 38, height: 38, borderRadius: 11, background: bg, color: fg } }, icon),
        delta && React.createElement('span', { style: { fontSize: 12, fontWeight: 700, color: 'var(--success-600)' } }, delta)
      ),
      React.createElement('div', { style: { fontFamily: 'var(--font-ui)', fontWeight: 800, fontSize: 26, color: 'var(--text-strong)', letterSpacing: '-0.01em' } }, value),
      React.createElement('div', { style: { fontSize: 13, color: 'var(--text-muted)', marginTop: 2 } }, label)
    );
  };
})();

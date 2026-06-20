// Shared icons + phone chrome for the shopper UI kit
(function () {
  const Icon = (paths, size = 22, fill = false) => (
    React.createElement('svg', { width: size, height: size, viewBox: '0 0 24 24', fill: fill ? 'currentColor' : 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }, paths)
  );
  const p = (d) => React.createElement('path', { d, key: d });
  window.LPIcons = {
    home: (s) => Icon([p('M3 10.5 12 3l9 7.5'), p('M5 9.5V21h14V9.5')], s),
    search: (s) => Icon([React.createElement('circle', { cx: 11, cy: 11, r: 7, key: 'c' }), p('m21 21-4.3-4.3')], s),
    plus: (s) => Icon([p('M12 5v14'), p('M5 12h14')], s),
    heart: (s, f) => Icon([p('M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 1 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z')], s, f),
    user: (s) => Icon([React.createElement('circle', { cx: 12, cy: 8, r: 4, key: 'c' }), p('M4 21c0-4 4-6 8-6s8 2 8 6')], s),
    bag: (s) => Icon([p('M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z'), p('M3 6h18'), p('M16 10a4 4 0 0 1-8 0')], s),
    back: (s) => Icon([p('m15 18-6-6 6-6')], s),
    share: (s) => Icon([React.createElement('circle', { cx: 18, cy: 5, r: 3, key: 'a' }), React.createElement('circle', { cx: 6, cy: 12, r: 3, key: 'b' }), React.createElement('circle', { cx: 18, cy: 19, r: 3, key: 'c' }), p('m8.6 13.5 6.8 4'), p('m15.4 6.5-6.8 4')], s),
    truck: (s) => Icon([p('M3 7h11v9H3z'), p('M14 10h4l3 3v3h-7'), React.createElement('circle', { cx: 7, cy: 18, r: 2, key: 'a' }), React.createElement('circle', { cx: 17, cy: 18, r: 2, key: 'b' })], s),
    store: (s) => Icon([p('M4 8 6 3h12l2 5'), p('M4 8v12h16V8'), p('M4 8h16'), p('M9 20v-6h6v6')], s),
    check: (s) => Icon([p('M20 6 9 17l-5-5')], s),
    chevron: (s) => Icon([p('m9 6 6 6-6 6')], s),
    star: (s) => Icon([p('M12 2l3 6.5 7 .9-5 4.8 1.2 7L12 18l-6.4 3.2L6.8 14l-5-4.8 7-.9z')], s, true),
    wallet: (s) => Icon([p('M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'), p('M16 12h4'), p('M3 9h18')], s),
    logout: (s) => Icon([p('M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4'), p('m16 17 5-5-5-5'), p('M21 12H9')], s),
    edit: (s) => Icon([p('M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7'), p('M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4z')], s),
  };

  // Phone shell (sin status bar simulada — se usa en mobile real)
  window.PhoneFrame = function PhoneFrame({ children }) {
    return React.createElement('div', {
      style: { width: 390, height: 844, background: 'var(--bg-page)', borderRadius: 0, overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column', fontFamily: 'var(--font-ui)' }
    }, children);
  };
})();

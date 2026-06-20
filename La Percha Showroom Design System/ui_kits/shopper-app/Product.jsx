// Product detail screen
function ProductScreen({ id, onBack, onAdd, favs, toggleFav }) {
  const DS = window.LaPerchaShowroomDesignSystem_72de99;
  const { Button, IconButton, Badge, Rating, PriceTag, Tabs } = DS;
  const D = window.LP_DATA;
  const I = window.LPIcons;
  const prod = D.all.find(p => p.id === id) || D.all[0];
  const [tab, setTab] = React.useState('desc');
  const [size, setSize] = React.useState('M');
  const fav = !!favs[prod.id];

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 92 }}>
        {/* Image hero */}
        <div style={{ position: 'relative', height: 380, background: 'linear-gradient(135deg, var(--taupe-100), var(--taupe-300))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color: 'var(--taupe-500)' }}>{React.createElement('svg', { width: 64, height: 64, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.2 }, React.createElement('rect', { x: 3, y: 3, width: 18, height: 18, rx: 3 }), React.createElement('circle', { cx: 8.5, cy: 8.5, r: 1.8 }), React.createElement('path', { d: 'M21 15l-5-5L5 21' }))}</span>
          <div style={{ position: 'absolute', top: 50, left: 16, right: 16, display: 'flex', justifyContent: 'space-between' }}>
            <IconButton variant="soft" ariaLabel="Volver" onClick={onBack}>{I.back(20)}</IconButton>
            <div style={{ display: 'flex', gap: 8 }}>
              <IconButton variant="soft" ariaLabel="Compartir">{I.share(18)}</IconButton>
              <IconButton variant="soft" ariaLabel="Favorito" active={fav} onClick={() => toggleFav(prod.id)}>{I.heart(18, fav)}</IconButton>
            </div>
          </div>
          <div style={{ position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 6 }}>
            {[0,1,2,3].map(i => <span key={i} style={{ width: i === 0 ? 18 : 6, height: 6, borderRadius: 3, background: i === 0 ? 'var(--ink-900)' : 'rgba(43,39,34,.3)' }} />)}
          </div>
        </div>

        {/* Body */}
        <div style={{ background: 'var(--surface-card)', borderRadius: '22px 22px 0 0', marginTop: -18, position: 'relative', padding: '18px 18px 0' }}>
          <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
            {prod.official ? <Badge tone="brand" solid>Tienda Oficial</Badge> : <Badge tone="neutral">Feria de Ropa</Badge>}
            {prod.freeShipping && <Badge tone="mint">Envío gratis</Badge>}
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 400, fontSize: 25, lineHeight: 1.15, color: 'var(--text-strong)', margin: '0 0 8px' }}>{prod.title}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <Rating value={prod.rating} count={prod.reviews} showValue />
            {prod.seller && <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>· por <b style={{ color: 'var(--text-link)' }}>{prod.seller}</b></span>}
          </div>
          <PriceTag price={prod.price} original={prod.original} size="lg" />

          {/* Size selector (clothing) */}
          {!prod.official && (
            <div style={{ margin: '18px 0 4px' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-body)', marginBottom: 8 }}>Talle</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {['S','M','L','XL'].map(s => (
                  <button key={s} onClick={() => setSize(s)} style={{ width: 46, height: 44, borderRadius: 'var(--radius-md)', border: `1.5px solid ${size===s?'var(--ink-900)':'var(--border-default)'}`, background: size===s?'var(--ink-900)':'var(--surface-card)', color: size===s?'#fff':'var(--text-body)', fontWeight: 700, fontFamily: 'var(--font-ui)', cursor: 'pointer' }}>{s}</button>
                ))}
              </div>
            </div>
          )}

          {/* Shipping row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 0', margin: '16px 0', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
            <span style={{ color: 'var(--sage-700)' }}>{I.truck(22)}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-strong)' }}>Correo Argentino · 3-5 días</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>O retiro en showroom (Palihue) sin cargo</div>
            </div>
            <span style={{ color: 'var(--text-subtle)' }}>{I.chevron(18)}</span>
          </div>

          {/* Tabs */}
          <Tabs active={tab} onChange={setTab} tabs={[{ key: 'desc', label: 'Descripción' }, { key: 'rev', label: 'Reseñas', count: prod.reviews }]} />
          <div style={{ padding: '14px 0 8px', fontSize: 14, lineHeight: 1.6, color: 'var(--text-body)' }}>
            {tab === 'desc'
              ? 'Prenda en excelente estado, lista para usar. Calce cómodo y atemporal. Coordiná el envío con Correo Argentino o pasá a buscarla por el showroom en Palihue.'
              : 'Muy buena atención y la prenda igual a las fotos. Llegó rápido y bien embalada. ¡Recomiendo a la vendedora!'}
          </div>
        </div>
      </div>

      {/* Sticky buy bar */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px 16px calc(12px + env(safe-area-inset-bottom))', background: 'var(--surface-card)', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: 12, boxShadow: '0 -4px 16px rgba(50,44,36,.06)' }}>
        <Button variant="outline" iconLeft={I.bag(18)} onClick={() => onAdd(prod.id)}>Agregar</Button>
        <Button variant="primary" full onClick={() => onAdd(prod.id, true)}>Comprar ahora</Button>
      </div>
    </div>
  );
}
window.ProductScreen = ProductScreen;

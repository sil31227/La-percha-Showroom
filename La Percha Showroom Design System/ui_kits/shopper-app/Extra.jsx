// Favorites + simple confirmation screens
function FavScreen({ favs, toggleFav, onOpen, onExplore }) {
  const DS = window.LaPerchaShowroomDesignSystem_72de99;
  const { ProductCard, EmptyState, Button } = DS;
  const D = window.LP_DATA;
  const I = window.LPIcons;
  const list = D.all.filter(p => favs[p.id]);
  return (
    <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 84 }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 400, fontSize: 24, color: 'var(--text-strong)', margin: 0, padding: '12px 16px 14px' }}>Favoritos</h1>
      {list.length === 0 ? (
        <EmptyState icon={I.heart(30)} title="Todavía no tenés favoritos"
          description="Tocá el corazón en los productos que te gusten para guardarlos acá."
          action={<Button onClick={onExplore}>Explorar</Button>} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: '0 16px' }}>
          {list.map(p => <ProductCard key={p.id} {...p} favorite onToggleFavorite={() => toggleFav(p.id)} onClick={() => onOpen(p.id)} />)}
        </div>
      )}
    </div>
  );
}

function ConfirmScreen({ onDone }) {
  const DS = window.LaPerchaShowroomDesignSystem_72de99;
  const { Button, StatusPill } = DS;
  const I = window.LPIcons;
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 28px' }}>
      <div style={{ width: 92, height: 92, borderRadius: '50%', background: 'var(--success-50)', color: 'var(--success-500)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 22 }}>{I.check(44)}</div>
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 400, fontSize: 28, color: 'var(--text-strong)', margin: '0 0 8px' }}>¡Pago confirmado!</h1>
      <p style={{ fontSize: 15, color: 'var(--text-muted)', margin: '0 0 18px', lineHeight: 1.55 }}>Tu pedido <b>#LP-2841</b> está en preparación. Te avisamos cuando lo despachemos por Correo Argentino.</p>
      <StatusPill status="preparando" />
      <div style={{ height: 24 }} />
      <Button variant="primary" size="lg" full onClick={onDone}>Seguir mi pedido</Button>
      <button onClick={onDone} style={{ marginTop: 12, background: 'none', border: 'none', color: 'var(--text-link)', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'var(--font-ui)' }}>Volver al inicio</button>
    </div>
  );
}
window.FavScreen = FavScreen;
window.ConfirmScreen = ConfirmScreen;

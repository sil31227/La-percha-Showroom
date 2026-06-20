// Cart + checkout screen
function CartScreen({ items, setQty, removeItem, onCheckout, onBack, onExplore }) {
  const DS = window.LaPerchaShowroomDesignSystem_72de99;
  const { Button, QuantityStepper, Badge, EmptyState, IconButton } = DS;
  const D = window.LP_DATA;
  const I = window.LPIcons;

  const lines = Object.entries(items).map(([id, qty]) => ({ prod: D.all.find(p => p.id === id), qty })).filter(l => l.prod);
  const subtotal = lines.reduce((s, l) => s + l.prod.price * l.qty, 0);
  const shipping = subtotal >= 25000 || subtotal === 0 ? 0 : 2500;
  const total = subtotal + shipping;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px 12px' }}>
        <IconButton variant="ghost" ariaLabel="Volver" onClick={onBack}>{I.back(22)}</IconButton>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 400, fontSize: 22, color: 'var(--text-strong)', margin: 0 }}>Tu carrito</h1>
      </div>

      {lines.length === 0 ? (
        <EmptyState icon={I.bag(30)} title="Tu carrito está vacío"
          description="Sumá prendas de la feria o productos de la tienda oficial y aparecerán acá."
          action={<Button onClick={onExplore}>Explorar la feria</Button>} />
      ) : (
        <>
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 12px' }}>
            {lines.map(({ prod, qty }) => (
              <div key={prod.id} style={{ display: 'flex', gap: 12, padding: '14px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                <div style={{ width: 76, height: 88, borderRadius: 'var(--radius-md)', background: 'linear-gradient(135deg, var(--taupe-100), var(--taupe-200))', flex: '0 0 76px' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-strong)', lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{prod.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', margin: '3px 0 8px' }}>{prod.official ? 'Tienda Oficial' : `por ${prod.seller}`}</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <QuantityStepper value={qty} size="sm" onChange={(n) => setQty(prod.id, n)} />
                    <span style={{ fontWeight: 800, fontSize: 16, color: 'var(--price)' }}>{D.fmt(prod.price * qty)}</span>
                  </div>
                </div>
              </div>
            ))}

            {/* Coupon */}
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <input placeholder="Cupón de descuento" style={{ flex: 1, height: 44, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', padding: '0 14px', fontFamily: 'var(--font-ui)', fontSize: 15, background: 'var(--surface-card)' }} />
              <Button variant="secondary">Aplicar</Button>
            </div>
          </div>

          {/* Summary */}
          <div style={{ padding: '14px 16px calc(14px + env(safe-area-inset-bottom))', background: 'var(--surface-card)', borderTop: '1px solid var(--border-subtle)', boxShadow: '0 -4px 16px rgba(50,44,36,.06)' }}>
            <Row label="Subtotal" value={D.fmt(subtotal)} />
            <Row label="Envío" value={shipping === 0 ? 'Gratis' : D.fmt(shipping)} green={shipping === 0} />
            {shipping > 0 && <div style={{ fontSize: 11, color: 'var(--text-muted)', margin: '2px 0 8px' }}>Te faltan {D.fmt(25000 - subtotal)} para envío gratis</div>}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', margin: '8px 0 14px', paddingTop: 10, borderTop: '1px dashed var(--border-default)' }}>
              <span style={{ fontWeight: 700, fontSize: 15 }}>Total</span>
              <span style={{ fontWeight: 800, fontSize: 24, color: 'var(--price)' }}>{D.fmt(total)}</span>
            </div>
            <Button variant="primary" size="lg" full onClick={onCheckout} iconLeft={mpLogo()}>Pagar con Mercado Pago</Button>
          </div>
        </>
      )}
    </div>
  );
}

function Row({ label, value, green }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, padding: '4px 0', color: 'var(--text-body)' }}>
      <span>{label}</span>
      <span style={{ fontWeight: 700, color: green ? 'var(--success-600)' : 'var(--text-strong)' }}>{value}</span>
    </div>
  );
}
function mpLogo() {
  return React.createElement('svg', { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'currentColor' }, React.createElement('path', { d: 'M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16zm-2.5 9.5c1.2.8 4 .8 5.2 0' , fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round' }));
}
window.CartScreen = CartScreen;

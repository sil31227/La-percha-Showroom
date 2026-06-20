// ProfileScreen and SearchScreen — not in _ds_bundle.js, loaded fresh via Babel

// Íconos locales que no están en la versión del bundle de LPIcons
var _ico = (function() {
  var mk = function(paths, s) {
    return React.createElement('svg', { width: s, height: s, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }, paths);
  };
  var p = function(d) { return React.createElement('path', { d: d, key: d }); };
  return {
    wallet:  function(s) { return mk([p('M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'), p('M16 12h4'), p('M3 9h18')], s); },
    logout:  function(s) { return mk([p('M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4'), p('m16 17 5-5-5-5'), p('M21 12H9')], s); },
    edit:    function(s) { return mk([p('M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7'), p('M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4z')], s); },
    camera:  function(s) { return mk([p('M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z'), React.createElement('circle', { cx: 12, cy: 13, r: 4, key: 'c' })], s); },
    tag:     function(s) { return mk([p('M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0l-7.2-7.2A2 2 0 0 1 3 12V4a1 1 0 0 1 1-1h8a2 2 0 0 1 1.4.6l6.2 6.2a2 2 0 0 1 0 2.6z'), React.createElement('circle', { cx: 7.5, cy: 7.5, r: 1.5, key: 'dot' })], s); },
    user:    function(s) { return mk([React.createElement('circle', { cx: 12, cy: 8, r: 4, key: 'c' }), p('M4 21c0-4 4-6 8-6s8 2 8 6')], s); },
    mail:    function(s) { return mk([p('M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z'), p('m22 6-10 7L2 6')], s); },
    phone:   function(s) { return mk([p('M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.1-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.4 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.6 2z')], s); },
  };
})();

// ─── Search ─────────────────────────────────────────────────────────────────
function SearchScreen({ onBack, onOpen }) {
  const DS = window.LaPerchaShowroomDesignSystem_72de99;
  const { ProductCard, FilterChip } = DS;
  const D = window.LP_DATA;
  const I = window.LPIcons;
  const [q, setQ] = React.useState('');

  const results = q.length > 1
    ? D.all.filter(function(p) {
        return p.title.toLowerCase().indexOf(q.toLowerCase()) !== -1
          || (p.cat || '').toLowerCase().indexOf(q.toLowerCase()) !== -1;
      })
    : [];

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px 12px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-page)' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', color: 'var(--text-strong)', padding: 0 }}>
          {I.back(24)}
        </button>
        <input
          autoFocus
          value={q}
          onChange={function(e) { setQ(e.target.value); }}
          placeholder="Buscar prendas, regalería, bazar…"
          style={{ flex: 1, height: 40, background: 'var(--surface-sunken)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-pill)', padding: '0 16px', fontFamily: 'var(--font-ui)', fontSize: 15, color: 'var(--text-body)', outline: 'none' }}
        />
        {q.length > 0 && (
          <button onClick={function() { setQ(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontFamily: 'var(--font-ui)', fontSize: 14, padding: 0 }}>
            Limpiar
          </button>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 20, minHeight: 0 }}>
        {q.length < 2 ? (
          <div style={{ padding: '20px 16px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text-subtle)', marginBottom: 12 }}>
              Explorá por categoría
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {D.categories.filter(function(c) { return c !== 'Todo'; }).map(function(c) {
                return <FilterChip key={c} onClick={function() { setQ(c); }}>{c}</FilterChip>;
              })}
            </div>
            <div style={{ marginTop: 28, fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text-subtle)', marginBottom: 12 }}>
              Búsquedas sugeridas
            </div>
            {['Vestido lino', 'Jean mom fit', 'Campera oversize', 'Set de mates'].map(function(s) {
              return (
                <button key={s} onClick={function() { setQ(s); }} style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '12px 0', background: 'none', border: 'none', borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer', fontFamily: 'var(--font-ui)', fontSize: 15, color: 'var(--text-body)', textAlign: 'left' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{I.search(16)}</span>
                  {s}
                </button>
              );
            })}
          </div>
        ) : results.length === 0 ? (
          <div style={{ padding: '56px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 14 }}>🔍</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--text-strong)', marginBottom: 8 }}>Sin resultados</div>
            <div style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.5 }}>
              No encontramos nada para "{q}".<br />Probá con otro término.
            </div>
          </div>
        ) : (
          <div style={{ padding: '12px 16px 0' }}>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 14 }}>
              {results.length} resultado{results.length !== 1 ? 's' : ''}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {results.map(function(p) {
                return <ProductCard key={p.id} {...p} onClick={function() { onOpen && onOpen(p.id); }} />;
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Profile ─────────────────────────────────────────────────────────────────
function ProfileScreen() {
  const DS = window.LaPerchaShowroomDesignSystem_72de99;
  const { StatusPill, Button } = DS;
  const I = window.LPIcons;

  const user = { name: 'Martina Yaquinta', phone: '+54 9 291 555-1234', initial: 'M', isSeller: true };
  const orders = [
    { id: '#LP-2841', desc: 'Vestido de lino + Campera jean', total: '$45.400', status: 'enviado', date: '18 jun' },
    { id: '#LP-2794', desc: 'Set de mates artesanales', total: '$12.500', status: 'entregado', date: '10 jun' },
    { id: '#LP-2761', desc: 'Crema corporal karité', total: '$9.200', status: 'entregado', date: '2 jun' },
  ];

  const [section, setSection] = React.useState(null);

  if (section === 'pedidos') {
    return (
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 84, minHeight: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px 16px' }}>
          <button onClick={function() { setSection(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', color: 'var(--text-strong)', padding: 0 }}>
            {I.back(24)}
          </button>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 400, fontSize: 22, margin: 0, color: 'var(--text-strong)' }}>Mis pedidos</h1>
        </div>
        {orders.map(function(o) {
          return (
            <div key={o.id} style={{ margin: '0 16px 12px', background: 'var(--surface-card)', borderRadius: 'var(--radius-lg)', padding: '14px 16px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
                <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-strong)' }}>{o.id}</span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{o.date}</span>
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-body)', marginBottom: 12 }}>{o.desc}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <StatusPill status={o.status} />
                <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-strong)' }}>{o.total}</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  if (section === 'datos') {
    return (
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 84, minHeight: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px 16px' }}>
          <button onClick={function() { setSection(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', color: 'var(--text-strong)', padding: 0 }}>
            {I.back(24)}
          </button>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 400, fontSize: 22, margin: 0, color: 'var(--text-strong)' }}>Mis datos</h1>
        </div>
        {[
          { label: 'Nombre', value: 'Martina Yaquinta' },
          { label: 'Teléfono', value: '+54 9 291 555-1234' },
          { label: 'Email', value: 'martina@email.com' },
          { label: 'Dirección de envío', value: 'Palihue, Bahía Blanca, Buenos Aires' },
        ].map(function(f) {
          return (
            <div key={f.label} style={{ margin: '0 16px 12px', background: 'var(--surface-card)', borderRadius: 'var(--radius-lg)', padding: '14px 16px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--text-subtle)', marginBottom: 4 }}>{f.label}</div>
              <div style={{ fontSize: 15, color: 'var(--text-strong)' }}>{f.value}</div>
            </div>
          );
        })}
        <div style={{ padding: '4px 16px' }}>
          <Button variant="primary" full>Guardar cambios</Button>
        </div>
      </div>
    );
  }

  if (section === 'cobro') {
    return (
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 84, minHeight: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px 16px' }}>
          <button onClick={function() { setSection(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', color: 'var(--text-strong)', padding: 0 }}>
            {I.back(24)}
          </button>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 400, fontSize: 22, margin: 0, color: 'var(--text-strong)' }}>Datos de vendedora</h1>
        </div>
        <div style={{ margin: '0 16px 16px', background: 'var(--sage-50)', border: '1px solid var(--sage-200)', borderRadius: 'var(--radius-lg)', padding: '14px 16px', fontSize: 13, color: 'var(--sage-800)', lineHeight: 1.5 }}>
          Cuando vendas algo, te transferimos el <b>80%</b> directamente a tu CVU. La comisión de La Percha es el 20%.
        </div>
        {[
          { label: 'Nombre de tu tienda', value: 'Martina Store', mono: false },
          { label: 'Banco / billetera', value: 'Naranja X', mono: false },
          { label: 'CBU / CVU', value: '0000003100092100034892', mono: true },
          { label: 'Alias', value: 'martina.yaquinta.mp', mono: false },
        ].map(function(f) {
          return (
            <div key={f.label} style={{ margin: '0 16px 12px', background: 'var(--surface-card)', borderRadius: 'var(--radius-lg)', padding: '14px 16px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--text-subtle)', marginBottom: 4 }}>{f.label}</div>
              <div style={{ fontSize: 15, color: 'var(--text-strong)', fontFamily: f.mono ? 'monospace' : 'inherit', letterSpacing: f.mono ? '.04em' : 0 }}>{f.value}</div>
            </div>
          );
        })}
        <div style={{ padding: '4px 16px' }}>
          <Button variant="outline" full>Editar datos</Button>
        </div>
      </div>
    );
  }

  // Pantalla principal
  function Row(props) {
    return (
      <button onClick={props.onClick} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '15px 16px', background: 'none', border: 'none', borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer', textAlign: 'left' }}>
        <span style={{ width: 38, height: 38, borderRadius: 11, background: props.danger ? 'var(--error-50)' : 'var(--sage-100)', color: props.danger ? 'var(--error-500)' : 'var(--sage-700)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 38px' }}>
          {props.icon}
        </span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: props.danger ? 'var(--error-500)' : 'var(--text-strong)' }}>{props.label}</div>
          {props.sub && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{props.sub}</div>}
        </div>
        {!props.danger && <span style={{ color: 'var(--text-subtle)' }}>{I.chevron(18)}</span>}
      </button>
    );
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 84, minHeight: 0 }}>
      <div style={{ background: 'linear-gradient(160deg, var(--sage-100), var(--bg-page))', padding: '24px 20px 28px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--sage-600)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: 32, flex: '0 0 72px' }}>
          {user.initial}
        </div>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--text-strong)', lineHeight: 1.1 }}>{user.name}</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{user.phone}</div>
          {user.isSeller && (
            <span style={{ display: 'inline-flex', marginTop: 8, background: 'var(--sage-600)', color: '#fff', borderRadius: 99, fontSize: 11, fontWeight: 700, padding: '3px 10px', letterSpacing: '.04em' }}>
              Vendedora activa
            </span>
          )}
        </div>
      </div>

      <div style={{ background: 'var(--surface-card)', borderTop: '1px solid var(--border-subtle)', marginTop: 10 }}>
        <Row icon={I.bag(18)} label="Mis pedidos" sub="3 compras realizadas" onClick={function() { setSection('pedidos'); }} />
        <Row icon={_ico.edit(18)} label="Mis datos" sub="Nombre, teléfono, dirección" onClick={function() { setSection('datos'); }} />
      </div>

      {user.isSeller && (
        <div style={{ background: 'var(--surface-card)', borderTop: '1px solid var(--border-subtle)', marginTop: 10 }}>
          <div style={{ padding: '10px 16px 4px', fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text-subtle)' }}>
            Vendedora
          </div>
          <Row icon={_ico.wallet(18)} label="Datos de vendedora" sub="Tienda · CVU · alias de cobro" onClick={function() { setSection('cobro'); }} />
          <Row icon={I.store(18)} label="Mis ventas" sub="5 prendas publicadas" onClick={function() {}} />
        </div>
      )}

      <div style={{ background: 'var(--surface-card)', borderTop: '1px solid var(--border-subtle)', marginTop: 10 }}>
        <Row icon={_ico.logout(18)} label="Cerrar sesión" danger={true} onClick={function() {}} />
      </div>
    </div>
  );
}

window.SearchScreen = SearchScreen;
window.ProfileScreen = ProfileScreen;

// ─── Pantalla de registro (usuario no logueado toca Vender) ──────────────────
function RegisterScreen({ onBack, onRegistered }) {
  const DS = window.LaPerchaShowroomDesignSystem_72de99;
  const { Button, Input } = DS;
  const [nombre, setNombre] = React.useState('');
  const [tel, setTel] = React.useState('');
  const [email, setEmail] = React.useState('');

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px 8px' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', color: 'var(--text-strong)', padding: 0, marginRight: 8 }}>
          {_ico.logout(22)}
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 24px 32px', minHeight: 0 }}>
        <img src="logo.jpg" style={{ width: 56, height: 56, borderRadius: '50%', marginBottom: 20, display: 'block' }} />
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 400, fontSize: 28, color: 'var(--text-strong)', margin: '0 0 6px' }}>
          Registrate en La Percha
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: '0 0 28px', lineHeight: 1.5 }}>
          Creá tu cuenta para comprar y guardar favoritos. Si después querés vender ropa, lo activás desde tu perfil.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-subtle)', letterSpacing: '.08em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Nombre completo</label>
            <input value={nombre} onChange={function(e) { setNombre(e.target.value); }} placeholder="Ej: Martina Yaquinta" style={{ width: '100%', height: 46, background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', padding: '0 14px', fontFamily: 'var(--font-ui)', fontSize: 15, color: 'var(--text-body)', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-subtle)', letterSpacing: '.08em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Teléfono</label>
            <input value={tel} onChange={function(e) { setTel(e.target.value); }} placeholder="+54 9 291 ···" type="tel" style={{ width: '100%', height: 46, background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', padding: '0 14px', fontFamily: 'var(--font-ui)', fontSize: 15, color: 'var(--text-body)', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-subtle)', letterSpacing: '.08em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Email <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(opcional)</span></label>
            <input value={email} onChange={function(e) { setEmail(e.target.value); }} placeholder="hola@email.com" type="email" style={{ width: '100%', height: 46, background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', padding: '0 14px', fontFamily: 'var(--font-ui)', fontSize: 15, color: 'var(--text-body)', outline: 'none', boxSizing: 'border-box' }} />
          </div>
        </div>

        <div style={{ marginTop: 28 }}>
          <Button variant="primary" full onClick={onRegistered} disabled={!nombre || !tel}>
            Crear cuenta gratis
          </Button>
        </div>
        <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--text-muted)', marginTop: 18 }}>
          ¿Ya tenés cuenta?{' '}
          <button onClick={onRegistered} style={{ background: 'none', border: 'none', color: 'var(--text-link)', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-ui)', fontSize: 14, padding: 0 }}>
            Iniciá sesión
          </button>
        </p>
      </div>
    </div>
  );
}

// ─── Onboarding vendedor (registrado pero no vendedor aún) ───────────────────
function SellerOnboardingScreen({ onBack, onSubmitted }) {
  const DS = window.LaPerchaShowroomDesignSystem_72de99;
  const { Button } = DS;
  const [tienda, setTienda] = React.useState('');
  const [cvu, setCvu] = React.useState('');
  const [sent, setSent] = React.useState(false);

  if (sent) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 28px', textAlign: 'center' }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--sage-100)', color: 'var(--sage-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 22 }}>
          {_ico.tag(36)}
        </div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 400, fontSize: 26, color: 'var(--text-strong)', margin: '0 0 10px' }}>¡Listo, ya podés vender!</h2>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6, margin: '0 0 28px' }}>
          Tus datos quedaron guardados. Publicá tu primera prenda y Silvina la revisa antes de que aparezca en la Feria.
        </p>
        <Button variant="primary" full onClick={onSubmitted}>Publicar mi primera prenda</Button>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px 8px' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', color: 'var(--text-strong)', padding: 0 }}>
          {window.LPIcons ? window.LPIcons.back(24) : null}
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 24px 32px', minHeight: 0 }}>
        <div style={{ width: 52, height: 52, borderRadius: 16, background: 'var(--sage-100)', color: 'var(--sage-700)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
          {_ico.tag(26)}
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 400, fontSize: 26, color: 'var(--text-strong)', margin: '0 0 8px' }}>
          Quiero vender en La Percha
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: '0 0 6px', lineHeight: 1.5 }}>
          Publicá ropa nueva o usada en la Feria. Cada prenda pasa por revisión antes de publicarse.
        </p>
        {/* Comisión — bloque destacado */}
        <div style={{ background: 'var(--sage-50)', border: '1px solid var(--sage-200)', borderRadius: 'var(--radius-lg)', padding: '16px', marginBottom: 28 }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--sage-700)', marginBottom: 10 }}>¿Cómo funciona?</div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
            <div style={{ flex: 1, background: '#fff', borderRadius: 10, padding: '12px', textAlign: 'center', border: '1px solid var(--sage-200)' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: 'var(--sage-700)', lineHeight: 1 }}>80%</div>
              <div style={{ fontSize: 12, color: 'var(--sage-800)', marginTop: 4, fontWeight: 600 }}>Para vos</div>
            </div>
            <div style={{ flex: 1, background: '#fff', borderRadius: 10, padding: '12px', textAlign: 'center', border: '1px solid var(--sage-200)' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: 'var(--text-muted)', lineHeight: 1 }}>20%</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, fontWeight: 600 }}>Comisión La Percha</div>
            </div>
          </div>
          <p style={{ fontSize: 13, color: 'var(--sage-800)', margin: 0, lineHeight: 1.5 }}>
            Cuando vendés algo, La Percha retiene el pago hasta que el comprador confirma la entrega. Después te transferimos el 80% directo a tu CVU.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-subtle)', letterSpacing: '.08em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Nombre de tu tienda</label>
            <input value={tienda} onChange={function(e) { setTienda(e.target.value); }} placeholder="Ej: Caro Indumentaria" style={{ width: '100%', height: 46, background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', padding: '0 14px', fontFamily: 'var(--font-ui)', fontSize: 15, color: 'var(--text-body)', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-subtle)', letterSpacing: '.08em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>CVU o alias de cobro</label>
            <input value={cvu} onChange={function(e) { setCvu(e.target.value); }} placeholder="Ej: caro.mp o 000000310009..." style={{ width: '100%', height: 46, background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', padding: '0 14px', fontFamily: 'var(--font-ui)', fontSize: 15, color: 'var(--text-body)', outline: 'none', boxSizing: 'border-box' }} />
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '6px 0 0' }}>Acá te depositamos tus ganancias cuando vendas.</p>
          </div>
        </div>

        <div style={{ marginTop: 28 }}>
          <Button variant="primary" full onClick={function() { setSent(true); }} disabled={!tienda || !cvu}>
            Enviar solicitud
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Subir producto (vendedor autorizado) ────────────────────────────────────
function PublishScreen({ onBack, onPublished }) {
  const DS = window.LaPerchaShowroomDesignSystem_72de99;
  const { Button, FilterChip } = DS;
  const I = window.LPIcons;

  const [fotos, setFotos] = React.useState(0);
  const [titulo, setTitulo] = React.useState('');
  const [cat, setCat] = React.useState('');
  const [talle, setTalle] = React.useState('');
  const [estado, setEstado] = React.useState('');
  const [precio, setPrecio] = React.useState('');
  const [desc, setDesc] = React.useState('');
  const [sent, setSent] = React.useState(false);

  if (sent) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 28px', textAlign: 'center' }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--sage-100)', color: 'var(--sage-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 22 }}>
          {_ico.tag(36)}
        </div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 400, fontSize: 26, color: 'var(--text-strong)', margin: '0 0 10px' }}>¡Prenda enviada a revisión!</h2>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6, margin: '0 0 28px' }}>
          Silvina va a revisar tu publicación. Cuando esté aprobada vas a recibir una notificación y aparecerá en la Feria.
        </p>
        <Button variant="primary" full onClick={onPublished}>Volver al inicio</Button>
      </div>
    );
  }

  var cats = ['Vestidos', 'Jeans', 'Camperas', 'Calzado', 'Deportiva', 'Infantil', 'Remeras'];
  var talles = ['XS', 'S', 'M', 'L', 'XL', 'Único'];
  var estados = ['Nuevo', 'Como nuevo', 'Buen estado', 'Regular'];

  var canPublish = titulo && cat && talle && estado && precio;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-page)' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', color: 'var(--text-strong)', padding: 0 }}>
          {I && I.back ? I.back(24) : null}
        </button>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--text-strong)' }}>Publicar prenda</span>
        <div style={{ width: 24 }} />
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px 80px', minHeight: 0 }}>

        {/* Fotos */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-subtle)', letterSpacing: '.08em', textTransform: 'uppercase', display: 'block', marginBottom: 10 }}>Fotos <span style={{ color: 'var(--error-500)' }}>*</span></label>
          <div style={{ display: 'flex', gap: 10 }}>
            {[0,1,2,3,4].map(function(i) {
              var filled = i < fotos;
              return (
                <button key={i} onClick={function() { setFotos(Math.max(fotos === i + 1 ? i : i + 1, fotos < i + 1 ? i + 1 : fotos)); }}
                  style={{ width: 60, height: 72, borderRadius: 10, background: filled ? 'var(--sage-100)' : 'var(--surface-sunken)', border: filled ? '2px solid var(--sage-400)' : '2px dashed var(--border-default)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: filled ? 'var(--sage-600)' : 'var(--text-muted)', flexShrink: 0 }}>
                  {filled ? _ico.camera(20) : (i === fotos ? _ico.camera(20) : null)}
                </button>
              );
            })}
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '8px 0 0' }}>Usá fotos reales con buena luz natural. Máximo 5.</p>
        </div>

        {/* Título */}
        <div style={{ marginBottom: 18 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-subtle)', letterSpacing: '.08em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Título <span style={{ color: 'var(--error-500)' }}>*</span></label>
          <input value={titulo} onChange={function(e) { setTitulo(e.target.value); }} placeholder="Ej: Vestido de lino natural manga corta" style={{ width: '100%', height: 46, background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', padding: '0 14px', fontFamily: 'var(--font-ui)', fontSize: 15, color: 'var(--text-body)', outline: 'none', boxSizing: 'border-box' }} />
        </div>

        {/* Categoría */}
        <div style={{ marginBottom: 18 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-subtle)', letterSpacing: '.08em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Categoría <span style={{ color: 'var(--error-500)' }}>*</span></label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {cats.map(function(c) {
              return <FilterChip key={c} selected={cat === c} onClick={function() { setCat(c); }}>{c}</FilterChip>;
            })}
          </div>
        </div>

        {/* Talle */}
        <div style={{ marginBottom: 18 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-subtle)', letterSpacing: '.08em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Talle <span style={{ color: 'var(--error-500)' }}>*</span></label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {talles.map(function(t) {
              return <FilterChip key={t} selected={talle === t} onClick={function() { setTalle(t); }}>{t}</FilterChip>;
            })}
          </div>
        </div>

        {/* Estado */}
        <div style={{ marginBottom: 18 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-subtle)', letterSpacing: '.08em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Estado <span style={{ color: 'var(--error-500)' }}>*</span></label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {estados.map(function(e) {
              return <FilterChip key={e} selected={estado === e} onClick={function() { setEstado(e); }}>{e}</FilterChip>;
            })}
          </div>
        </div>

        {/* Precio */}
        <div style={{ marginBottom: 18 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-subtle)', letterSpacing: '.08em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Precio <span style={{ color: 'var(--error-500)' }}>*</span></label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontFamily: 'var(--font-ui)', fontSize: 15, color: 'var(--text-muted)', fontWeight: 700 }}>$</span>
            <input value={precio} onChange={function(e) { setPrecio(e.target.value.replace(/\D/g, '')); }} placeholder="0" type="text" inputMode="numeric" style={{ width: '100%', height: 46, background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', padding: '0 14px 0 26px', fontFamily: 'var(--font-ui)', fontSize: 15, color: 'var(--text-body)', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          {precio ? (
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <div style={{ flex: 1, background: 'var(--success-50)', border: '1px solid var(--success-200)', borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: 'var(--success-700)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em' }}>Vos recibís</div>
                <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 800, fontSize: 17, color: 'var(--success-700)' }}>${Math.round(Number(precio) * 0.8).toLocaleString('es-AR')}</div>
              </div>
              <div style={{ flex: 1, background: 'var(--surface-sunken)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em' }}>Comisión (20%)</div>
                <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 800, fontSize: 17, color: 'var(--text-muted)' }}>${Math.round(Number(precio) * 0.2).toLocaleString('es-AR')}</div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Descripción */}
        <div style={{ marginBottom: 28 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-subtle)', letterSpacing: '.08em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Descripción</label>
          <textarea value={desc} onChange={function(e) { setDesc(e.target.value); }} placeholder="Contá el estado real, medidas, cómo coordinás el envío..." rows={3} style={{ width: '100%', background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', padding: '12px 14px', fontFamily: 'var(--font-ui)', fontSize: 15, color: 'var(--text-body)', outline: 'none', boxSizing: 'border-box', resize: 'vertical', lineHeight: 1.5 }} />
        </div>

        <Button variant="primary" full onClick={function() { setSent(true); }} disabled={!canPublish}>
          Publicar prenda
        </Button>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', marginTop: 10, lineHeight: 1.5 }}>
          Silvina revisará tu publicación antes de que aparezca en la Feria.
        </p>
      </div>
    </div>
  );
}

// ─── Welcome ─────────────────────────────────────────────────────────────────
function WelcomeScreen({ onEnter, onRegister, onLogin }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-page)', overflow: 'hidden' }}>

      {/* Hero */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 32px 24px' }}>
        {/* Logo / marca */}
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--sage-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--sage-700)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.4 7.2 12 2 3.6 7.2v9.6L12 22l8.4-5.2z"/>
            <path d="M12 2v20M3.6 7.2l8.4 5.2 8.4-5.2"/>
          </svg>
        </div>

        <div style={{ fontFamily: 'var(--font-display)', fontSize: 30, color: 'var(--ink-900)', textAlign: 'center', lineHeight: 1.2, marginBottom: 10 }}>
          La Percha Showroom
        </div>
        <div style={{ fontFamily: 'var(--font-ui)', fontSize: 15, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.5 }}>
          Tu espacio de moda circular en Bahía Blanca
        </div>

        {/* Ilustración / separador visual */}
        <div style={{ margin: '36px 0', display: 'flex', gap: 12, justifyContent: 'center' }}>
          {['🛍️', '👗', '✨'].map(function(e, i) {
            return (
              <div key={i} style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--surface-card)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>
                {e}
              </div>
            );
          })}
        </div>

        {/* Propuesta de valor */}
        <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '16px 20px', width: '100%', maxWidth: 320 }}>
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7 }}>
            {[
              { ico: '🛒', txt: 'Comprá ropa y regalería' },
              { ico: '👕', txt: 'Vendé lo que ya no usás' },
              { ico: '📦', txt: 'Envíos a todo el país' },
            ].map(function(item) {
              return (
                <div key={item.ico} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <span style={{ fontSize: 16 }}>{item.ico}</span>
                  <span>{item.txt}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Acciones */}
      <div style={{ padding: '0 24px 40px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <button
          onClick={onRegister}
          style={{ width: '100%', height: 52, background: 'var(--sage-700)', color: '#fff', border: 'none', borderRadius: 'var(--radius-pill)', fontFamily: 'var(--font-ui)', fontSize: 16, fontWeight: 700, cursor: 'pointer', letterSpacing: '.01em' }}
        >
          Registrarme — comprá y vendé ropa
        </button>

        <button
          onClick={onEnter}
          style={{ width: '100%', height: 52, background: 'var(--surface-card)', color: 'var(--text-strong)', border: '1.5px solid var(--border-default)', borderRadius: 'var(--radius-pill)', fontFamily: 'var(--font-ui)', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}
        >
          Entrar a ver qué hay
        </button>

        <button
          onClick={onLogin}
          style={{ background: 'none', border: 'none', fontFamily: 'var(--font-ui)', fontSize: 14, color: 'var(--text-muted)', cursor: 'pointer', padding: '4px 0', textDecoration: 'underline', textUnderlineOffset: 3 }}
        >
          Ya tengo cuenta
        </button>
      </div>
    </div>
  );
}

window.WelcomeScreen = WelcomeScreen;
window.RegisterScreen = RegisterScreen;
window.SellerOnboardingScreen = SellerOnboardingScreen;
window.PublishScreen = PublishScreen;

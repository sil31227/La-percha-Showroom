// Home screen — La Percha Showroom shopper app
function HomeScreen({ onOpen, favs, toggleFav, cat, setCat, onSearch }) {
  const DS = window.LaPerchaShowroomDesignSystem_72de99;
  const { ProductCard, FilterChip, Badge } = DS;
  const D = window.LP_DATA;
  const I = window.LPIcons;

  return (
    <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 84 }}>
      {/* Header */}
      <div style={{ padding: '6px 16px 12px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <img src="logo.jpg" alt="La Percha" style={{ width: 42, height: 42, borderRadius: '50%' }} />
        <div style={{ flex: 1 }}>
          <div className="lp-eyebrow" style={{ fontSize: 10, color: 'var(--text-subtle)' }}>Palihue · Showroom</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 19, color: 'var(--text-strong)', lineHeight: 1.1 }}>La Percha</div>
        </div>
      </div>

      {/* Search */}
      <div style={{ padding: '0 16px 12px' }}>
        <button onClick={onSearch} style={{ width: '100%', height: 46, display: 'flex', alignItems: 'center', gap: 10, padding: '0 16px', background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-pill)', color: 'var(--text-subtle)', cursor: 'pointer', fontFamily: 'var(--font-ui)', fontSize: 15 }}>
          {I.search(18)} Buscar prendas, regalería, bazar…
        </button>
      </div>

      {/* Category chips */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '0 16px 14px', scrollbarWidth: 'none' }}>
        {D.categories.map(c => <FilterChip key={c} selected={cat === c} onClick={() => setCat(c)}>{c}</FilterChip>)}
      </div>

      {/* Hero banner */}
      <div style={{ margin: '0 16px 22px', borderRadius: 'var(--radius-xl)', overflow: 'hidden', background: 'linear-gradient(120deg, var(--mint-200), var(--sage-200))', padding: '22px 20px', position: 'relative' }}>
        <div className="lp-eyebrow" style={{ color: 'var(--sage-800)' }}>Feria de Ropa</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 27, color: 'var(--ink-900)', lineHeight: 1.1, margin: '6px 0 4px', maxWidth: 240 }}>Renová tu placard, cerca tuyo</div>
        <p style={{ margin: '0 0 14px', fontSize: 13, color: 'var(--ink-800)', maxWidth: 230 }}>Ropa seleccionada por vendedores de la comunidad. Envío gratis desde $25.000.</p>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--ink-900)', color: '#fff', padding: '9px 16px', borderRadius: 'var(--radius-pill)', fontSize: 13, fontWeight: 700 }}>Ver la feria {I.chevron(15)}</span>
      </div>

      {/* Tienda Oficial */}
      <SectionHeader title="Tienda Oficial" sub="Seleccionado por Silvina" icon={I.store(18)} />
      <div style={{ display: 'flex', gap: 12, overflowX: 'auto', padding: '0 16px 22px', scrollbarWidth: 'none' }}>
        {D.official.map(prod => (
          <div key={prod.id} style={{ width: 156, flex: '0 0 156px' }}>
            <ProductCard {...prod} favorite={!!favs[prod.id]} onToggleFavorite={() => toggleFav(prod.id)} onClick={() => onOpen(prod.id)} />
          </div>
        ))}
      </div>

      {/* Feria de Ropa grid */}
      <SectionHeader title="Feria de Ropa" sub="De la comunidad" icon={I.heart(17)} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: '0 16px' }}>
        {D.feria.map(prod => (
          <ProductCard key={prod.id} {...prod} favorite={!!favs[prod.id]} onToggleFavorite={() => toggleFav(prod.id)} onClick={() => onOpen(prod.id)} />
        ))}
      </div>
    </div>
  );
}

function SectionHeader({ title, sub, icon }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px 12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 10, background: 'var(--sage-100)', color: 'var(--sage-700)' }}>{icon}</span>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 19, color: 'var(--text-strong)', lineHeight: 1 }}>{title}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{sub}</div>
        </div>
      </div>
      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-link)' }}>Ver todo</span>
    </div>
  );
}
window.HomeScreen = HomeScreen;

/* @ds-bundle: {"format":3,"namespace":"LaPerchaShowroomDesignSystem_72de99","components":[{"name":"PriceTag","sourcePath":"components/commerce/PriceTag.jsx"},{"name":"ProductCard","sourcePath":"components/commerce/ProductCard.jsx"},{"name":"Badge","sourcePath":"components/feedback/Badge.jsx"},{"name":"EmptyState","sourcePath":"components/feedback/EmptyState.jsx"},{"name":"FilterChip","sourcePath":"components/feedback/FilterChip.jsx"},{"name":"Rating","sourcePath":"components/feedback/Rating.jsx"},{"name":"StatusPill","sourcePath":"components/feedback/StatusPill.jsx"},{"name":"Button","sourcePath":"components/forms/Button.jsx"},{"name":"IconButton","sourcePath":"components/forms/IconButton.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"QuantityStepper","sourcePath":"components/forms/QuantityStepper.jsx"},{"name":"Switch","sourcePath":"components/forms/Switch.jsx"},{"name":"BottomNav","sourcePath":"components/navigation/BottomNav.jsx"},{"name":"Tabs","sourcePath":"components/navigation/Tabs.jsx"}],"sourceHashes":{"components/commerce/PriceTag.jsx":"6cb5b6864be1","components/commerce/ProductCard.jsx":"2498fba531dd","components/feedback/Badge.jsx":"769c89dfc127","components/feedback/EmptyState.jsx":"a36ad1aba1fb","components/feedback/FilterChip.jsx":"c469254b3515","components/feedback/Rating.jsx":"752a3edbc98e","components/feedback/StatusPill.jsx":"f6407b58f6ba","components/forms/Button.jsx":"be16f721a53e","components/forms/IconButton.jsx":"c54f79a2a36f","components/forms/Input.jsx":"44ac8afa5089","components/forms/QuantityStepper.jsx":"295c4d9ff11a","components/forms/Switch.jsx":"0e88399c1131","components/navigation/BottomNav.jsx":"caf846eafb7c","components/navigation/Tabs.jsx":"bb1d1f175077","ui_kits/admin/panel-chrome.js":"0afd82f89964","ui_kits/seller-dashboard/panel-chrome.js":"0afd82f89964","ui_kits/shopper-app/Cart.jsx":"394941574cb4","ui_kits/shopper-app/Extra.jsx":"1ee9bd570cd3","ui_kits/shopper-app/Home.jsx":"8fd5d505b1c2","ui_kits/shopper-app/Product.jsx":"72243c26c4e3","ui_kits/shopper-app/chrome.js":"4ff7cbafaa34","ui_kits/shopper-app/data.js":"fe2d13e5acfc"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.LaPerchaShowroomDesignSystem_72de99 = window.LaPerchaShowroomDesignSystem_72de99 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/commerce/PriceTag.jsx
try { (() => {
const fmt = n => '$' + Number(n).toLocaleString('es-AR');

/** PriceTag — current price with optional strikethrough original & discount %. */
function PriceTag({
  price,
  original,
  size = 'md',
  style = {}
}) {
  const sizes = {
    sm: 'var(--text-base)',
    md: 'var(--text-lg)',
    lg: 'var(--text-2xl)'
  };
  const hasSale = original != null && original > price;
  const pct = hasSale ? Math.round((1 - price / original) * 100) : 0;
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'baseline',
      gap: 8,
      flexWrap: 'wrap',
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-ui)',
      fontWeight: 'var(--fw-extra)',
      fontSize: sizes[size],
      color: 'var(--price)',
      letterSpacing: '-0.01em'
    }
  }, fmt(price)), hasSale && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-ui)',
      fontSize: 'var(--text-sm)',
      color: 'var(--text-subtle)',
      textDecoration: 'line-through'
    }
  }, fmt(original)), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-ui)',
      fontWeight: 'var(--fw-bold)',
      fontSize: 'var(--text-sm)',
      color: 'var(--success-600)'
    }
  }, pct, "% OFF")));
}
Object.assign(__ds_scope, { PriceTag });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/commerce/PriceTag.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Badge.jsx
try { (() => {
/** Badge — small status/label pill. Tones map to the semantic palette. */
function Badge({
  children,
  tone = 'neutral',
  solid = false,
  size = 'md',
  style = {}
}) {
  const tones = {
    neutral: {
      soft: ['var(--ink-100)', 'var(--ink-700)'],
      solid: ['var(--ink-700)', '#fff']
    },
    brand: {
      soft: ['var(--sage-100)', 'var(--sage-700)'],
      solid: ['var(--brand)', '#fff']
    },
    mint: {
      soft: ['var(--mint-100)', 'var(--mint-700)'],
      solid: ['var(--mint-500)', '#fff']
    },
    success: {
      soft: ['var(--success-50)', 'var(--success-600)'],
      solid: ['var(--success-500)', '#fff']
    },
    warning: {
      soft: ['var(--warning-50)', 'var(--warning-600)'],
      solid: ['var(--warning-500)', '#fff']
    },
    error: {
      soft: ['var(--error-50)', 'var(--error-600)'],
      solid: ['var(--error-500)', '#fff']
    }
  };
  const t = tones[tone] || tones.neutral;
  const [bg, fg] = solid ? t.solid : t.soft;
  const sm = size === 'sm';
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      padding: sm ? '2px 8px' : '3px 10px',
      background: bg,
      color: fg,
      borderRadius: 'var(--radius-pill)',
      fontFamily: 'var(--font-ui)',
      fontWeight: 'var(--fw-bold)',
      fontSize: sm ? 'var(--text-2xs)' : 'var(--text-xs)',
      letterSpacing: '0.02em',
      lineHeight: 1.4,
      whiteSpace: 'nowrap',
      ...style
    }
  }, children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Badge.jsx", error: String((e && e.message) || e) }); }

// components/feedback/EmptyState.jsx
try { (() => {
const tints = {
  neutral: ['var(--taupe-200)', 'var(--ink-500)'],
  brand: ['var(--sage-100)', 'var(--sage-700)'],
  mint: ['var(--mint-100)', 'var(--mint-600)'],
  success: ['var(--success-50)', 'var(--success-600)'],
  warning: ['var(--warning-50)', 'var(--warning-600)'],
  error: ['var(--error-50)', 'var(--error-600)']
};

/**
 * Centered placeholder for empty / error / success screen states.
 * Icon medallion, title, description and an optional action.
 */
function EmptyState({
  icon,
  title,
  description,
  action,
  tone = 'neutral',
  style = {}
}) {
  const [bg, fg] = tints[tone] || tints.neutral;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
      gap: 12,
      padding: '44px 28px',
      maxWidth: 360,
      margin: '0 auto',
      ...style
    }
  }, icon != null ? /*#__PURE__*/React.createElement("div", {
    style: {
      width: 72,
      height: 72,
      borderRadius: '50%',
      background: bg,
      color: fg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, icon) : null, /*#__PURE__*/React.createElement("h3", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 400,
      fontSize: 'var(--text-xl)',
      color: 'var(--text-strong)',
      margin: 0
    }
  }, title), description ? /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 'var(--text-sm)',
      color: 'var(--text-muted)',
      margin: 0,
      lineHeight: 1.55
    }
  }, description) : null, action ? /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 4
    }
  }, action) : null);
}
Object.assign(__ds_scope, { EmptyState });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/EmptyState.jsx", error: String((e && e.message) || e) }); }

// components/feedback/FilterChip.jsx
try { (() => {
/** FilterChip — selectable filter/category chip used in toolbars & filter sheets. */
function FilterChip({
  children,
  selected = false,
  onClick,
  iconLeft = null,
  style = {}
}) {
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onClick,
    "aria-pressed": selected,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      height: 38,
      padding: '0 16px',
      borderRadius: 'var(--radius-pill)',
      cursor: 'pointer',
      whiteSpace: 'nowrap',
      fontFamily: 'var(--font-ui)',
      fontSize: 'var(--text-sm)',
      fontWeight: 'var(--fw-semibold)',
      background: selected ? 'var(--ink-900)' : 'var(--surface-card)',
      color: selected ? '#fff' : 'var(--text-body)',
      border: `1px solid ${selected ? 'var(--ink-900)' : 'var(--border-default)'}`,
      transition: 'all var(--dur-fast) var(--ease-out)',
      ...style
    }
  }, iconLeft, children);
}
Object.assign(__ds_scope, { FilterChip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/FilterChip.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Rating.jsx
try { (() => {
const Star = ({
  fill,
  size
}) => /*#__PURE__*/React.createElement("svg", {
  width: size,
  height: size,
  viewBox: "0 0 20 20",
  "aria-hidden": "true"
}, /*#__PURE__*/React.createElement("path", {
  d: "M10 1.6l2.47 5.01 5.53.8-4 3.9.94 5.5L10 14.2l-4.94 2.6.94-5.5-4-3.9 5.53-.8z",
  fill: fill
}));

/** Rating — read-only star rating with optional count. */
function Rating({
  value = 0,
  count,
  size = 15,
  showValue = false,
  style = {}
}) {
  const stars = [0, 1, 2, 3, 4].map(i => {
    const filled = value >= i + 1;
    const half = !filled && value > i;
    return /*#__PURE__*/React.createElement("span", {
      key: i,
      style: {
        position: 'relative',
        display: 'inline-flex'
      }
    }, /*#__PURE__*/React.createElement(Star, {
      fill: "var(--ink-200)",
      size: size
    }), (filled || half) && /*#__PURE__*/React.createElement("span", {
      style: {
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        width: half ? `${(value - i) * 100}%` : '100%'
      }
    }, /*#__PURE__*/React.createElement(Star, {
      fill: "var(--rating-star)",
      size: size
    })));
  });
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      gap: 1
    }
  }, stars), showValue && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-ui)',
      fontSize: 'var(--text-sm)',
      fontWeight: 'var(--fw-bold)',
      color: 'var(--text-strong)'
    }
  }, value.toFixed(1)), count != null && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-ui)',
      fontSize: 'var(--text-xs)',
      color: 'var(--text-muted)'
    }
  }, "(", count, ")"));
}
Object.assign(__ds_scope, { Rating });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Rating.jsx", error: String((e && e.message) || e) }); }

// components/feedback/StatusPill.jsx
try { (() => {
/**
 * StatusPill — order / payment / publication status with a leading dot.
 * Centralizes the La Percha state vocabulary so colors stay consistent.
 */
function StatusPill({
  status,
  style = {}
}) {
  const map = {
    pendiente: ['var(--warning-50)', 'var(--warning-600)', 'Pendiente'],
    pagado: ['var(--mint-100)', 'var(--mint-700)', 'Pagado'],
    preparando: ['var(--mint-100)', 'var(--mint-700)', 'Preparando'],
    enviado: ['var(--sage-100)', 'var(--sage-700)', 'Enviado'],
    entregado: ['var(--success-50)', 'var(--success-600)', 'Entregado'],
    liberado: ['var(--success-50)', 'var(--success-600)', 'Pago liberado'],
    cancelado: ['var(--error-50)', 'var(--error-600)', 'Cancelado'],
    revision: ['var(--warning-50)', 'var(--warning-600)', 'En revisión'],
    aprobada: ['var(--success-50)', 'var(--success-600)', 'Aprobada'],
    rechazada: ['var(--error-50)', 'var(--error-600)', 'Rechazada'],
    cambios: ['var(--warning-50)', 'var(--warning-600)', 'Cambios pedidos']
  };
  const [bg, fg, label] = map[status] || ['var(--ink-100)', 'var(--ink-700)', status];
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: '4px 11px 4px 9px',
      background: bg,
      color: fg,
      borderRadius: 'var(--radius-pill)',
      fontFamily: 'var(--font-ui)',
      fontWeight: 'var(--fw-bold)',
      fontSize: 'var(--text-xs)',
      lineHeight: 1.4,
      whiteSpace: 'nowrap',
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 7,
      height: 7,
      borderRadius: '50%',
      background: fg,
      flex: '0 0 auto'
    }
  }), label);
}
Object.assign(__ds_scope, { StatusPill });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/StatusPill.jsx", error: String((e && e.message) || e) }); }

// components/forms/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Button — primary call-to-action and supporting actions for La Percha Showroom.
 * Variants: primary (sage), secondary (mint-tinted), outline, ghost, danger.
 */
function Button({
  children,
  variant = 'primary',
  size = 'md',
  full = false,
  disabled = false,
  iconLeft = null,
  iconRight = null,
  type = 'button',
  onClick,
  style = {},
  ...rest
}) {
  const sizes = {
    sm: {
      padding: '0 14px',
      height: 36,
      fontSize: 'var(--text-sm)',
      radius: 'var(--radius-sm)',
      gap: 6
    },
    md: {
      padding: '0 20px',
      height: 44,
      fontSize: 'var(--text-base)',
      radius: 'var(--radius-md)',
      gap: 8
    },
    lg: {
      padding: '0 26px',
      height: 52,
      fontSize: 'var(--text-md)',
      radius: 'var(--radius-lg)',
      gap: 9
    }
  };
  const s = sizes[size] || sizes.md;
  const variants = {
    primary: {
      background: 'var(--brand)',
      color: 'var(--text-on-brand)',
      border: '1px solid var(--brand)',
      boxShadow: 'var(--shadow-brand)'
    },
    secondary: {
      background: 'var(--mint-100)',
      color: 'var(--mint-700)',
      border: '1px solid var(--mint-200)',
      boxShadow: 'none'
    },
    outline: {
      background: 'transparent',
      color: 'var(--text-strong)',
      border: '1px solid var(--border-default)',
      boxShadow: 'none'
    },
    ghost: {
      background: 'transparent',
      color: 'var(--text-strong)',
      border: '1px solid transparent',
      boxShadow: 'none'
    },
    danger: {
      background: 'var(--error-500)',
      color: '#fff',
      border: '1px solid var(--error-500)',
      boxShadow: 'none'
    }
  };
  const v = variants[variant] || variants.primary;
  return /*#__PURE__*/React.createElement("button", _extends({
    type: type,
    disabled: disabled,
    onClick: onClick,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: s.gap,
      height: s.height,
      padding: s.padding,
      width: full ? '100%' : 'auto',
      fontFamily: 'var(--font-ui)',
      fontWeight: 'var(--fw-bold)',
      fontSize: s.fontSize,
      lineHeight: 1,
      letterSpacing: '0.005em',
      whiteSpace: 'nowrap',
      borderRadius: s.radius,
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1,
      transition: 'transform var(--dur-fast) var(--ease-out), filter var(--dur-fast) var(--ease-out)',
      ...v,
      ...style
    },
    onMouseDown: e => {
      if (!disabled) e.currentTarget.style.transform = 'scale(0.97)';
    },
    onMouseUp: e => {
      e.currentTarget.style.transform = 'scale(1)';
    },
    onMouseLeave: e => {
      e.currentTarget.style.transform = 'scale(1)';
    }
  }, rest), iconLeft, children, iconRight);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Button.jsx", error: String((e && e.message) || e) }); }

// components/forms/IconButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * IconButton — square tappable control for icon-only actions (favorite, share,
 * close, cart). Sizes meet the 44px touch-target minimum at md+.
 */
function IconButton({
  children,
  variant = 'ghost',
  size = 'md',
  active = false,
  disabled = false,
  ariaLabel,
  onClick,
  style = {},
  ...rest
}) {
  const sizes = {
    sm: 36,
    md: 44,
    lg: 52
  };
  const dim = sizes[size] || sizes.md;
  const variants = {
    ghost: {
      background: 'transparent',
      color: 'var(--text-strong)',
      border: '1px solid transparent'
    },
    soft: {
      background: 'var(--surface-card)',
      color: 'var(--text-strong)',
      border: '1px solid var(--border-subtle)',
      boxShadow: 'var(--shadow-sm)'
    },
    brand: {
      background: 'var(--brand)',
      color: '#fff',
      border: '1px solid var(--brand)'
    }
  };
  const v = variants[variant] || variants.ghost;
  const activeStyle = active ? {
    background: 'var(--error-50)',
    color: 'var(--error-500)',
    border: '1px solid var(--error-500)'
  } : {};
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    "aria-label": ariaLabel,
    "aria-pressed": active,
    disabled: disabled,
    onClick: onClick,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: dim,
      height: dim,
      borderRadius: 'var(--radius-pill)',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1,
      transition: 'transform var(--dur-fast) var(--ease-out), background var(--dur-fast)',
      ...v,
      ...activeStyle,
      ...style
    },
    onMouseDown: e => {
      if (!disabled) e.currentTarget.style.transform = 'scale(0.9)';
    },
    onMouseUp: e => {
      e.currentTarget.style.transform = 'scale(1)';
    },
    onMouseLeave: e => {
      e.currentTarget.style.transform = 'scale(1)';
    }
  }, rest), children);
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/commerce/ProductCard.jsx
try { (() => {
const HeartIcon = ({
  filled
}) => /*#__PURE__*/React.createElement("svg", {
  width: "18",
  height: "18",
  viewBox: "0 0 24 24",
  fill: filled ? 'currentColor' : 'none',
  stroke: "currentColor",
  strokeWidth: "2",
  strokeLinecap: "round",
  strokeLinejoin: "round"
}, /*#__PURE__*/React.createElement("path", {
  d: "M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 1 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"
}));
const PhotoPlaceholder = () => /*#__PURE__*/React.createElement("div", {
  style: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, var(--taupe-100), var(--taupe-200))',
    color: 'var(--taupe-400)'
  }
}, /*#__PURE__*/React.createElement("svg", {
  width: "34",
  height: "34",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "1.5"
}, /*#__PURE__*/React.createElement("rect", {
  x: "3",
  y: "3",
  width: "18",
  height: "18",
  rx: "3"
}), /*#__PURE__*/React.createElement("circle", {
  cx: "8.5",
  cy: "8.5",
  r: "1.8"
}), /*#__PURE__*/React.createElement("path", {
  d: "M21 15l-5-5L5 21"
})));

/**
 * ProductCard — marketplace product tile. Works for Tienda Oficial and Feria de Ropa.
 * Mobile-first 2-up grid; composes Badge, Rating, PriceTag and a favorite IconButton.
 */
function ProductCard({
  title,
  price,
  original,
  image,
  rating,
  reviews,
  official = false,
  freeShipping = false,
  seller,
  favorite = false,
  onToggleFavorite,
  onClick,
  style = {}
}) {
  return /*#__PURE__*/React.createElement("article", {
    onClick: onClick,
    style: {
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--surface-card)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
      cursor: onClick ? 'pointer' : 'default',
      boxShadow: 'var(--shadow-sm)',
      transition: 'box-shadow var(--dur-base) var(--ease-out), transform var(--dur-base) var(--ease-out)',
      ...style
    },
    onMouseEnter: e => {
      e.currentTarget.style.boxShadow = 'var(--shadow-md)';
      e.currentTarget.style.transform = 'translateY(-2px)';
    },
    onMouseLeave: e => {
      e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
      e.currentTarget.style.transform = 'translateY(0)';
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      aspectRatio: '1 / 1.18',
      background: 'var(--taupe-100)'
    }
  }, image ? /*#__PURE__*/React.createElement("img", {
    src: image,
    alt: title,
    style: {
      width: '100%',
      height: '100%',
      objectFit: 'cover'
    }
  }) : /*#__PURE__*/React.createElement(PhotoPlaceholder, null), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 8,
      left: 8,
      display: 'flex',
      gap: 5
    }
  }, official && /*#__PURE__*/React.createElement(__ds_scope.Badge, {
    tone: "brand",
    solid: true,
    size: "sm"
  }, "Oficial"), freeShipping && /*#__PURE__*/React.createElement(__ds_scope.Badge, {
    tone: "mint",
    size: "sm"
  }, "Env\xEDo gratis")), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 6,
      right: 6
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.IconButton, {
    variant: "soft",
    size: "sm",
    ariaLabel: "Favorito",
    active: favorite,
    onClick: e => {
      e.stopPropagation();
      onToggleFavorite && onToggleFavorite();
    }
  }, /*#__PURE__*/React.createElement(HeartIcon, {
    filled: favorite
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '10px 12px 14px',
      display: 'flex',
      flexDirection: 'column',
      gap: 6
    }
  }, rating != null && /*#__PURE__*/React.createElement(__ds_scope.Rating, {
    value: rating,
    count: reviews,
    size: 13
  }), /*#__PURE__*/React.createElement("h3", {
    style: {
      fontFamily: 'var(--font-ui)',
      fontWeight: 'var(--fw-semibold)',
      fontSize: 'var(--text-base)',
      color: 'var(--text-strong)',
      lineHeight: 'var(--leading-snug)',
      margin: 0,
      display: '-webkit-box',
      WebkitLineClamp: 2,
      WebkitBoxOrient: 'vertical',
      overflow: 'hidden'
    }
  }, title), /*#__PURE__*/React.createElement(__ds_scope.PriceTag, {
    price: price,
    original: original,
    size: "md"
  }), seller && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-ui)',
      fontSize: 'var(--text-xs)',
      color: 'var(--text-muted)'
    }
  }, "por ", seller)));
}
Object.assign(__ds_scope, { ProductCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/commerce/ProductCard.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Input — labeled text field with optional leading icon, helper and error text.
 * Mobile-first: 48px tall, 16px font to avoid iOS zoom-on-focus.
 */
function Input({
  label,
  type = 'text',
  placeholder = '',
  value,
  defaultValue,
  onChange,
  iconLeft = null,
  suffix = null,
  helper = '',
  error = '',
  disabled = false,
  id,
  style = {},
  ...rest
}) {
  const fieldId = id || (label ? `in-${label.replace(/\s+/g, '-').toLowerCase()}` : undefined);
  const invalid = Boolean(error);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      width: '100%',
      ...style
    }
  }, label && /*#__PURE__*/React.createElement("label", {
    htmlFor: fieldId,
    style: {
      fontFamily: 'var(--font-ui)',
      fontSize: 'var(--text-sm)',
      fontWeight: 'var(--fw-semibold)',
      color: 'var(--text-body)'
    }
  }, label), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      height: 48,
      padding: '0 14px',
      background: disabled ? 'var(--surface-sunken)' : 'var(--surface-card)',
      border: `1px solid ${invalid ? 'var(--error-500)' : 'var(--border-default)'}`,
      borderRadius: 'var(--radius-md)',
      transition: 'border-color var(--dur-fast), box-shadow var(--dur-fast)'
    },
    onFocusCapture: e => {
      if (!invalid) e.currentTarget.style.boxShadow = '0 0 0 3px var(--sage-100)', e.currentTarget.style.borderColor = 'var(--sage-500)';
    },
    onBlurCapture: e => {
      e.currentTarget.style.boxShadow = 'none';
      if (!invalid) e.currentTarget.style.borderColor = 'var(--border-default)';
    }
  }, iconLeft && /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-subtle)',
      display: 'flex'
    }
  }, iconLeft), /*#__PURE__*/React.createElement("input", _extends({
    id: fieldId,
    type: type,
    placeholder: placeholder,
    value: value,
    defaultValue: defaultValue,
    onChange: onChange,
    disabled: disabled,
    "aria-invalid": invalid,
    style: {
      flex: 1,
      minWidth: 0,
      border: 'none',
      outline: 'none',
      background: 'transparent',
      fontFamily: 'var(--font-ui)',
      fontSize: '16px',
      color: 'var(--text-strong)'
    }
  }, rest)), suffix && /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-subtle)',
      fontSize: 'var(--text-sm)'
    }
  }, suffix)), (helper || error) && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--text-xs)',
      color: invalid ? 'var(--error-500)' : 'var(--text-muted)'
    }
  }, error || helper));
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/forms/QuantityStepper.jsx
try { (() => {
/** QuantityStepper — −/＋ quantity control for cart line items. */
function QuantityStepper({
  value = 1,
  min = 1,
  max = 99,
  onChange,
  size = 'md',
  style = {}
}) {
  const dim = size === 'sm' ? 30 : 36;
  const set = n => {
    const c = Math.max(min, Math.min(max, n));
    if (onChange) onChange(c);
  };
  const btn = (label, fn, off) => /*#__PURE__*/React.createElement("button", {
    type: "button",
    "aria-label": label,
    disabled: off,
    onClick: fn,
    style: {
      width: dim,
      height: dim,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: 'none',
      background: 'transparent',
      cursor: off ? 'not-allowed' : 'pointer',
      color: off ? 'var(--ink-300)' : 'var(--text-strong)',
      fontSize: 18,
      fontWeight: 600,
      fontFamily: 'var(--font-ui)',
      borderRadius: 'var(--radius-sm)'
    }
  }, label === 'Quitar' ? '−' : '+');
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      border: '1px solid var(--border-default)',
      borderRadius: 'var(--radius-pill)',
      background: 'var(--surface-card)',
      ...style
    }
  }, btn('Quitar', () => set(value - 1), value <= min), /*#__PURE__*/React.createElement("span", {
    style: {
      minWidth: 26,
      textAlign: 'center',
      fontFamily: 'var(--font-ui)',
      fontWeight: 'var(--fw-bold)',
      fontSize: 'var(--text-base)',
      color: 'var(--text-strong)'
    }
  }, value), btn('Agregar', () => set(value + 1), value >= max));
}
Object.assign(__ds_scope, { QuantityStepper });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/QuantityStepper.jsx", error: String((e && e.message) || e) }); }

// components/forms/Switch.jsx
try { (() => {
/** Switch — on/off toggle for settings (envío gratis, notificaciones). */
function Switch({
  checked = false,
  onChange,
  disabled = false,
  label,
  id,
  style = {}
}) {
  const sid = id || (label ? `sw-${label.replace(/\s+/g, '-').toLowerCase()}` : undefined);
  const toggle = () => {
    if (!disabled && onChange) onChange(!checked);
  };
  const control = /*#__PURE__*/React.createElement("button", {
    type: "button",
    role: "switch",
    "aria-checked": checked,
    id: sid,
    disabled: disabled,
    onClick: toggle,
    style: {
      position: 'relative',
      width: 46,
      height: 28,
      flex: '0 0 auto',
      borderRadius: 'var(--radius-pill)',
      border: 'none',
      cursor: disabled ? 'not-allowed' : 'pointer',
      padding: 0,
      background: checked ? 'var(--brand)' : 'var(--ink-300)',
      opacity: disabled ? 0.5 : 1,
      transition: 'background var(--dur-base) var(--ease-out)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      top: 3,
      left: checked ? 21 : 3,
      width: 22,
      height: 22,
      borderRadius: '50%',
      background: '#fff',
      boxShadow: 'var(--shadow-sm)',
      transition: 'left var(--dur-base) var(--ease-spring)'
    }
  }));
  if (!label) return control;
  return /*#__PURE__*/React.createElement("label", {
    htmlFor: sid,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 10,
      cursor: 'pointer',
      ...style
    }
  }, control, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-ui)',
      fontSize: 'var(--text-base)',
      color: 'var(--text-body)'
    }
  }, label));
}
Object.assign(__ds_scope, { Switch });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Switch.jsx", error: String((e && e.message) || e) }); }

// components/navigation/BottomNav.jsx
try { (() => {
/**
 * BottomNav — fixed mobile bottom navigation (Inicio, Buscar, Vender, Favoritos, Perfil).
 * The primary navigation pattern for La Percha's mobile-first experience.
 */
function BottomNav({
  items = [],
  active,
  onChange,
  style = {}
}) {
  return /*#__PURE__*/React.createElement("nav", {
    style: {
      display: 'flex',
      alignItems: 'stretch',
      justifyContent: 'space-around',
      height: 'var(--bottomnav-height)',
      paddingBottom: 'var(--safe-bottom)',
      background: 'var(--surface-card)',
      borderTop: '1px solid var(--border-subtle)',
      boxShadow: '0 -2px 12px rgba(50,44,36,0.05)',
      ...style
    }
  }, items.map(it => {
    const on = it.key === active;
    const accent = it.accent;
    return /*#__PURE__*/React.createElement("button", {
      key: it.key,
      type: "button",
      onClick: () => onChange && onChange(it.key),
      "aria-current": on ? 'page' : undefined,
      style: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3,
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
        position: 'relative',
        color: on ? 'var(--brand)' : 'var(--text-subtle)',
        transition: 'color var(--dur-fast)'
      }
    }, accent ? /*#__PURE__*/React.createElement("span", {
      style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 44,
        height: 34,
        marginTop: -2,
        borderRadius: 'var(--radius-pill)',
        background: 'var(--brand)',
        color: '#fff',
        boxShadow: 'var(--shadow-brand)'
      }
    }, it.icon) : /*#__PURE__*/React.createElement("span", {
      style: {
        display: 'flex',
        position: 'relative'
      }
    }, it.icon, it.badge != null && /*#__PURE__*/React.createElement("span", {
      style: {
        position: 'absolute',
        top: -5,
        right: -8,
        minWidth: 16,
        height: 16,
        padding: '0 4px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 'var(--radius-pill)',
        background: 'var(--error-500)',
        color: '#fff',
        fontSize: 10,
        fontWeight: 700,
        fontFamily: 'var(--font-ui)'
      }
    }, it.badge)), /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'var(--font-ui)',
        fontSize: 'var(--text-2xs)',
        fontWeight: on ? 'var(--fw-bold)' : 'var(--fw-semibold)',
        letterSpacing: '0.01em'
      }
    }, it.label));
  }));
}
Object.assign(__ds_scope, { BottomNav });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/BottomNav.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Tabs.jsx
try { (() => {
/** Tabs — underline tab bar for in-page sections (Descripción, Reseñas; Ventas, Ganancias). */
function Tabs({
  tabs = [],
  active,
  onChange,
  style = {}
}) {
  return /*#__PURE__*/React.createElement("div", {
    role: "tablist",
    style: {
      display: 'flex',
      gap: 4,
      borderBottom: '1px solid var(--border-subtle)',
      overflowX: 'auto',
      ...style
    }
  }, tabs.map(t => {
    const key = typeof t === 'string' ? t : t.key;
    const label = typeof t === 'string' ? t : t.label;
    const count = typeof t === 'string' ? null : t.count;
    const on = key === active;
    return /*#__PURE__*/React.createElement("button", {
      key: key,
      role: "tab",
      "aria-selected": on,
      type: "button",
      onClick: () => onChange && onChange(key),
      style: {
        position: 'relative',
        padding: '12px 14px',
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        fontFamily: 'var(--font-ui)',
        fontSize: 'var(--text-base)',
        fontWeight: on ? 'var(--fw-bold)' : 'var(--fw-semibold)',
        color: on ? 'var(--text-strong)' : 'var(--text-muted)',
        transition: 'color var(--dur-fast)'
      }
    }, label, count != null && /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--text-subtle)',
        fontWeight: 600
      }
    }, " (", count, ")"), /*#__PURE__*/React.createElement("span", {
      style: {
        position: 'absolute',
        left: 10,
        right: 10,
        bottom: -1,
        height: 3,
        borderRadius: '3px 3px 0 0',
        background: on ? 'var(--brand)' : 'transparent',
        transition: 'background var(--dur-fast)'
      }
    }));
  }));
}
Object.assign(__ds_scope, { Tabs });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Tabs.jsx", error: String((e && e.message) || e) }); }

// ui_kits/admin/panel-chrome.js
try { (() => {
// Shared desktop panel chrome (sidebar, topbar, stat cards) for seller + admin kits
(function () {
  const svg = (children, size = 20) => React.createElement('svg', {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.9,
    strokeLinecap: 'round',
    strokeLinejoin: 'round'
  }, children);
  const P = d => React.createElement('path', {
    d,
    key: d
  });
  const PI = {
    grid: svg([P('M3 3h7v7H3z'), P('M14 3h7v7h-7z'), P('M14 14h7v7h-7z'), P('M3 14h7v7H3z')]),
    tag: svg([P('M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0l-7.2-7.2A2 2 0 0 1 3 12V4a1 1 0 0 1 1-1h8a2 2 0 0 1 1.4.6l6.2 6.2a2 2 0 0 1 0 2.6z'), React.createElement('circle', {
      cx: 7.5,
      cy: 7.5,
      r: 1.5,
      key: 'c'
    })]),
    cart: svg([React.createElement('circle', {
      cx: 9,
      cy: 20,
      r: 1.5,
      key: 'a'
    }), React.createElement('circle', {
      cx: 17,
      cy: 20,
      r: 1.5,
      key: 'b'
    }), P('M3 4h2l2.4 11.4a1.5 1.5 0 0 0 1.5 1.2h7.7a1.5 1.5 0 0 0 1.5-1.2L21 8H6')]),
    wallet: svg([P('M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'), P('M16 12h4'), P('M3 9h18')]),
    chart: svg([P('M3 3v18h18'), P('M7 14l4-4 3 3 5-6')]),
    check: svg([P('M20 6 9 17l-5-5')]),
    x: svg([P('M18 6 6 18'), P('M6 6l12 12')]),
    edit: svg([P('M12 20h9'), P('M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z')]),
    bell: svg([P('M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9'), P('M13.7 21a2 2 0 0 1-3.4 0')]),
    users: svg([P('M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2'), React.createElement('circle', {
      cx: 9,
      cy: 7,
      r: 4,
      key: 'a'
    }), P('M22 21v-2a4 4 0 0 0-3-3.9')]),
    truck: svg([P('M3 7h11v9H3z'), P('M14 10h4l3 3v3h-7'), React.createElement('circle', {
      cx: 7.5,
      cy: 18,
      r: 1.6,
      key: 'a'
    }), React.createElement('circle', {
      cx: 17,
      cy: 18,
      r: 1.6,
      key: 'b'
    })]),
    money: svg([React.createElement('circle', {
      cx: 12,
      cy: 12,
      r: 9,
      key: 'a'
    }), P('M9.5 14.5c1.3 1 4 1 5.3 0M9.5 9.5c1.3-1 4-1 5.3 0M12 6v12')])
  };
  window.PanelIcons = PI;
  window.Sidebar = function Sidebar({
    role,
    items,
    active,
    onSelect
  }) {
    return React.createElement('aside', {
      style: {
        width: 248,
        flex: '0 0 248px',
        background: 'var(--ink-900)',
        color: 'var(--ink-300)',
        display: 'flex',
        flexDirection: 'column',
        padding: '22px 14px'
      }
    }, React.createElement('div', {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 11,
        padding: '0 8px 22px'
      }
    }, React.createElement('img', {
      src: 'logo.jpg',
      style: {
        width: 40,
        height: 40,
        borderRadius: '50%'
      }
    }), React.createElement('div', null, React.createElement('div', {
      style: {
        fontFamily: 'var(--font-display)',
        fontSize: 17,
        color: '#fff',
        lineHeight: 1
      }
    }, 'La Percha'), React.createElement('div', {
      style: {
        fontSize: 10,
        letterSpacing: '.14em',
        textTransform: 'uppercase',
        color: 'var(--ink-500)',
        marginTop: 3
      }
    }, role))), React.createElement('nav', {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
        marginTop: 8
      }
    }, items.map(it => {
      const on = it.key === active;
      return React.createElement('button', {
        key: it.key,
        onClick: () => onSelect && onSelect(it.key),
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '11px 12px',
          borderRadius: 'var(--radius-md)',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          fontFamily: 'var(--font-ui)',
          fontSize: 14,
          fontWeight: on ? 700 : 500,
          background: on ? 'var(--sage-600)' : 'transparent',
          color: on ? '#fff' : 'var(--ink-300)'
        }
      }, React.createElement('span', {
        style: {
          display: 'flex',
          opacity: on ? 1 : .8
        }
      }, it.icon), it.label, it.badge != null && React.createElement('span', {
        style: {
          marginLeft: 'auto',
          background: on ? 'rgba(255,255,255,.25)' : 'var(--error-500)',
          color: '#fff',
          borderRadius: 999,
          fontSize: 11,
          fontWeight: 700,
          padding: '1px 7px'
        }
      }, it.badge));
    })));
  };
  window.TopBar = function TopBar({
    title,
    sub,
    right
  }) {
    return React.createElement('header', {
      style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '20px 28px',
        borderBottom: '1px solid var(--border-subtle)',
        background: 'var(--surface-card)'
      }
    }, React.createElement('div', null, React.createElement('h1', {
      style: {
        fontFamily: 'var(--font-display)',
        fontWeight: 400,
        fontSize: 24,
        color: 'var(--text-strong)',
        margin: 0
      }
    }, title), sub && React.createElement('p', {
      style: {
        margin: '3px 0 0',
        fontSize: 13,
        color: 'var(--text-muted)'
      }
    }, sub)), React.createElement('div', {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 14
      }
    }, right));
  };
  window.StatCard = function StatCard({
    label,
    value,
    delta,
    tone = 'brand',
    icon
  }) {
    const tones = {
      brand: ['var(--sage-100)', 'var(--sage-700)'],
      mint: ['var(--mint-100)', 'var(--mint-700)'],
      warning: ['var(--warning-50)', 'var(--warning-600)'],
      neutral: ['var(--ink-100)', 'var(--ink-700)']
    };
    const [bg, fg] = tones[tone] || tones.brand;
    return React.createElement('div', {
      style: {
        flex: 1,
        background: 'var(--surface-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: 18,
        boxShadow: 'var(--shadow-sm)'
      }
    }, React.createElement('div', {
      style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12
      }
    }, React.createElement('span', {
      style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 38,
        height: 38,
        borderRadius: 11,
        background: bg,
        color: fg
      }
    }, icon), delta && React.createElement('span', {
      style: {
        fontSize: 12,
        fontWeight: 700,
        color: 'var(--success-600)'
      }
    }, delta)), React.createElement('div', {
      style: {
        fontFamily: 'var(--font-ui)',
        fontWeight: 800,
        fontSize: 26,
        color: 'var(--text-strong)',
        letterSpacing: '-0.01em'
      }
    }, value), React.createElement('div', {
      style: {
        fontSize: 13,
        color: 'var(--text-muted)',
        marginTop: 2
      }
    }, label));
  };
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/admin/panel-chrome.js", error: String((e && e.message) || e) }); }

// ui_kits/seller-dashboard/panel-chrome.js
try { (() => {
// Shared desktop panel chrome (sidebar, topbar, stat cards) for seller + admin kits
(function () {
  const svg = (children, size = 20) => React.createElement('svg', {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.9,
    strokeLinecap: 'round',
    strokeLinejoin: 'round'
  }, children);
  const P = d => React.createElement('path', {
    d,
    key: d
  });
  const PI = {
    grid: svg([P('M3 3h7v7H3z'), P('M14 3h7v7h-7z'), P('M14 14h7v7h-7z'), P('M3 14h7v7H3z')]),
    tag: svg([P('M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0l-7.2-7.2A2 2 0 0 1 3 12V4a1 1 0 0 1 1-1h8a2 2 0 0 1 1.4.6l6.2 6.2a2 2 0 0 1 0 2.6z'), React.createElement('circle', {
      cx: 7.5,
      cy: 7.5,
      r: 1.5,
      key: 'c'
    })]),
    cart: svg([React.createElement('circle', {
      cx: 9,
      cy: 20,
      r: 1.5,
      key: 'a'
    }), React.createElement('circle', {
      cx: 17,
      cy: 20,
      r: 1.5,
      key: 'b'
    }), P('M3 4h2l2.4 11.4a1.5 1.5 0 0 0 1.5 1.2h7.7a1.5 1.5 0 0 0 1.5-1.2L21 8H6')]),
    wallet: svg([P('M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'), P('M16 12h4'), P('M3 9h18')]),
    chart: svg([P('M3 3v18h18'), P('M7 14l4-4 3 3 5-6')]),
    check: svg([P('M20 6 9 17l-5-5')]),
    x: svg([P('M18 6 6 18'), P('M6 6l12 12')]),
    edit: svg([P('M12 20h9'), P('M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z')]),
    bell: svg([P('M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9'), P('M13.7 21a2 2 0 0 1-3.4 0')]),
    users: svg([P('M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2'), React.createElement('circle', {
      cx: 9,
      cy: 7,
      r: 4,
      key: 'a'
    }), P('M22 21v-2a4 4 0 0 0-3-3.9')]),
    truck: svg([P('M3 7h11v9H3z'), P('M14 10h4l3 3v3h-7'), React.createElement('circle', {
      cx: 7.5,
      cy: 18,
      r: 1.6,
      key: 'a'
    }), React.createElement('circle', {
      cx: 17,
      cy: 18,
      r: 1.6,
      key: 'b'
    })]),
    money: svg([React.createElement('circle', {
      cx: 12,
      cy: 12,
      r: 9,
      key: 'a'
    }), P('M9.5 14.5c1.3 1 4 1 5.3 0M9.5 9.5c1.3-1 4-1 5.3 0M12 6v12')])
  };
  window.PanelIcons = PI;
  window.Sidebar = function Sidebar({
    role,
    items,
    active,
    onSelect
  }) {
    return React.createElement('aside', {
      style: {
        width: 248,
        flex: '0 0 248px',
        background: 'var(--ink-900)',
        color: 'var(--ink-300)',
        display: 'flex',
        flexDirection: 'column',
        padding: '22px 14px'
      }
    }, React.createElement('div', {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 11,
        padding: '0 8px 22px'
      }
    }, React.createElement('img', {
      src: 'logo.jpg',
      style: {
        width: 40,
        height: 40,
        borderRadius: '50%'
      }
    }), React.createElement('div', null, React.createElement('div', {
      style: {
        fontFamily: 'var(--font-display)',
        fontSize: 17,
        color: '#fff',
        lineHeight: 1
      }
    }, 'La Percha'), React.createElement('div', {
      style: {
        fontSize: 10,
        letterSpacing: '.14em',
        textTransform: 'uppercase',
        color: 'var(--ink-500)',
        marginTop: 3
      }
    }, role))), React.createElement('nav', {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
        marginTop: 8
      }
    }, items.map(it => {
      const on = it.key === active;
      return React.createElement('button', {
        key: it.key,
        onClick: () => onSelect && onSelect(it.key),
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '11px 12px',
          borderRadius: 'var(--radius-md)',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          fontFamily: 'var(--font-ui)',
          fontSize: 14,
          fontWeight: on ? 700 : 500,
          background: on ? 'var(--sage-600)' : 'transparent',
          color: on ? '#fff' : 'var(--ink-300)'
        }
      }, React.createElement('span', {
        style: {
          display: 'flex',
          opacity: on ? 1 : .8
        }
      }, it.icon), it.label, it.badge != null && React.createElement('span', {
        style: {
          marginLeft: 'auto',
          background: on ? 'rgba(255,255,255,.25)' : 'var(--error-500)',
          color: '#fff',
          borderRadius: 999,
          fontSize: 11,
          fontWeight: 700,
          padding: '1px 7px'
        }
      }, it.badge));
    })));
  };
  window.TopBar = function TopBar({
    title,
    sub,
    right
  }) {
    return React.createElement('header', {
      style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '20px 28px',
        borderBottom: '1px solid var(--border-subtle)',
        background: 'var(--surface-card)'
      }
    }, React.createElement('div', null, React.createElement('h1', {
      style: {
        fontFamily: 'var(--font-display)',
        fontWeight: 400,
        fontSize: 24,
        color: 'var(--text-strong)',
        margin: 0
      }
    }, title), sub && React.createElement('p', {
      style: {
        margin: '3px 0 0',
        fontSize: 13,
        color: 'var(--text-muted)'
      }
    }, sub)), React.createElement('div', {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 14
      }
    }, right));
  };
  window.StatCard = function StatCard({
    label,
    value,
    delta,
    tone = 'brand',
    icon
  }) {
    const tones = {
      brand: ['var(--sage-100)', 'var(--sage-700)'],
      mint: ['var(--mint-100)', 'var(--mint-700)'],
      warning: ['var(--warning-50)', 'var(--warning-600)'],
      neutral: ['var(--ink-100)', 'var(--ink-700)']
    };
    const [bg, fg] = tones[tone] || tones.brand;
    return React.createElement('div', {
      style: {
        flex: 1,
        background: 'var(--surface-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: 18,
        boxShadow: 'var(--shadow-sm)'
      }
    }, React.createElement('div', {
      style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12
      }
    }, React.createElement('span', {
      style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 38,
        height: 38,
        borderRadius: 11,
        background: bg,
        color: fg
      }
    }, icon), delta && React.createElement('span', {
      style: {
        fontSize: 12,
        fontWeight: 700,
        color: 'var(--success-600)'
      }
    }, delta)), React.createElement('div', {
      style: {
        fontFamily: 'var(--font-ui)',
        fontWeight: 800,
        fontSize: 26,
        color: 'var(--text-strong)',
        letterSpacing: '-0.01em'
      }
    }, value), React.createElement('div', {
      style: {
        fontSize: 13,
        color: 'var(--text-muted)',
        marginTop: 2
      }
    }, label));
  };
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/seller-dashboard/panel-chrome.js", error: String((e && e.message) || e) }); }

// ui_kits/shopper-app/Cart.jsx
try { (() => {
// Cart + checkout screen
function CartScreen({
  items,
  setQty,
  removeItem,
  onCheckout,
  onBack,
  onExplore
}) {
  const DS = window.LaPerchaShowroomDesignSystem_72de99;
  const {
    Button,
    QuantityStepper,
    Badge,
    EmptyState,
    IconButton
  } = DS;
  const D = window.LP_DATA;
  const I = window.LPIcons;
  const lines = Object.entries(items).map(([id, qty]) => ({
    prod: D.all.find(p => p.id === id),
    qty
  })).filter(l => l.prod);
  const subtotal = lines.reduce((s, l) => s + l.prod.price * l.qty, 0);
  const shipping = subtotal >= 25000 || subtotal === 0 ? 0 : 2500;
  const total = subtotal + shipping;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '8px 16px 12px'
    }
  }, /*#__PURE__*/React.createElement(IconButton, {
    variant: "ghost",
    ariaLabel: "Volver",
    onClick: onBack
  }, I.back(22)), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 400,
      fontSize: 22,
      color: 'var(--text-strong)',
      margin: 0
    }
  }, "Tu carrito")), lines.length === 0 ? /*#__PURE__*/React.createElement(EmptyState, {
    icon: I.bag(30),
    title: "Tu carrito est\xE1 vac\xEDo",
    description: "Sum\xE1 prendas de la feria o productos de la tienda oficial y aparecer\xE1n ac\xE1.",
    action: /*#__PURE__*/React.createElement(Button, {
      onClick: onExplore
    }, "Explorar la feria")
  }) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflowY: 'auto',
      padding: '0 16px 12px'
    }
  }, lines.map(({
    prod,
    qty
  }) => /*#__PURE__*/React.createElement("div", {
    key: prod.id,
    style: {
      display: 'flex',
      gap: 12,
      padding: '14px 0',
      borderBottom: '1px solid var(--border-subtle)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 76,
      height: 88,
      borderRadius: 'var(--radius-md)',
      background: 'linear-gradient(135deg, var(--taupe-100), var(--taupe-200))',
      flex: '0 0 76px'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 600,
      color: 'var(--text-strong)',
      lineHeight: 1.3,
      display: '-webkit-box',
      WebkitLineClamp: 2,
      WebkitBoxOrient: 'vertical',
      overflow: 'hidden'
    }
  }, prod.title), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'var(--text-muted)',
      margin: '3px 0 8px'
    }
  }, prod.official ? 'Tienda Oficial' : `por ${prod.seller}`), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement(QuantityStepper, {
    value: qty,
    size: "sm",
    onChange: n => setQty(prod.id, n)
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 800,
      fontSize: 16,
      color: 'var(--price)'
    }
  }, D.fmt(prod.price * qty)))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      marginTop: 16
    }
  }, /*#__PURE__*/React.createElement("input", {
    placeholder: "Cup\xF3n de descuento",
    style: {
      flex: 1,
      height: 44,
      borderRadius: 'var(--radius-md)',
      border: '1px solid var(--border-default)',
      padding: '0 14px',
      fontFamily: 'var(--font-ui)',
      fontSize: 15,
      background: 'var(--surface-card)'
    }
  }), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary"
  }, "Aplicar"))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '14px 16px calc(14px + env(safe-area-inset-bottom))',
      background: 'var(--surface-card)',
      borderTop: '1px solid var(--border-subtle)',
      boxShadow: '0 -4px 16px rgba(50,44,36,.06)'
    }
  }, /*#__PURE__*/React.createElement(Row, {
    label: "Subtotal",
    value: D.fmt(subtotal)
  }), /*#__PURE__*/React.createElement(Row, {
    label: "Env\xEDo",
    value: shipping === 0 ? 'Gratis' : D.fmt(shipping),
    green: shipping === 0
  }), shipping > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: 'var(--text-muted)',
      margin: '2px 0 8px'
    }
  }, "Te faltan ", D.fmt(25000 - subtotal), " para env\xEDo gratis"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      margin: '8px 0 14px',
      paddingTop: 10,
      borderTop: '1px dashed var(--border-default)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 700,
      fontSize: 15
    }
  }, "Total"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 800,
      fontSize: 24,
      color: 'var(--price)'
    }
  }, D.fmt(total))), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "lg",
    full: true,
    onClick: onCheckout,
    iconLeft: mpLogo()
  }, "Pagar con Mercado Pago"))));
}
function Row({
  label,
  value,
  green
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: 14,
      padding: '4px 0',
      color: 'var(--text-body)'
    }
  }, /*#__PURE__*/React.createElement("span", null, label), /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 700,
      color: green ? 'var(--success-600)' : 'var(--text-strong)'
    }
  }, value));
}
function mpLogo() {
  return React.createElement('svg', {
    width: 20,
    height: 20,
    viewBox: '0 0 24 24',
    fill: 'currentColor'
  }, React.createElement('path', {
    d: 'M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16zm-2.5 9.5c1.2.8 4 .8 5.2 0',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round'
  }));
}
window.CartScreen = CartScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/shopper-app/Cart.jsx", error: String((e && e.message) || e) }); }

// ui_kits/shopper-app/Extra.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
// Favorites + simple confirmation screens
function FavScreen({
  favs,
  toggleFav,
  onOpen,
  onExplore
}) {
  const DS = window.LaPerchaShowroomDesignSystem_72de99;
  const {
    ProductCard,
    EmptyState,
    Button
  } = DS;
  const D = window.LP_DATA;
  const I = window.LPIcons;
  const list = D.all.filter(p => favs[p.id]);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflowY: 'auto',
      paddingBottom: 84
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 400,
      fontSize: 24,
      color: 'var(--text-strong)',
      margin: 0,
      padding: '12px 16px 14px'
    }
  }, "Favoritos"), list.length === 0 ? /*#__PURE__*/React.createElement(EmptyState, {
    icon: I.heart(30),
    title: "Todav\xEDa no ten\xE9s favoritos",
    description: "Toc\xE1 el coraz\xF3n en los productos que te gusten para guardarlos ac\xE1.",
    action: /*#__PURE__*/React.createElement(Button, {
      onClick: onExplore
    }, "Explorar")
  }) : /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 12,
      padding: '0 16px'
    }
  }, list.map(p => /*#__PURE__*/React.createElement(ProductCard, _extends({
    key: p.id
  }, p, {
    favorite: true,
    onToggleFavorite: () => toggleFav(p.id),
    onClick: () => onOpen(p.id)
  })))));
}
function ConfirmScreen({
  onDone
}) {
  const DS = window.LaPerchaShowroomDesignSystem_72de99;
  const {
    Button,
    StatusPill
  } = DS;
  const I = window.LPIcons;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: '0 28px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 92,
      height: 92,
      borderRadius: '50%',
      background: 'var(--success-50)',
      color: 'var(--success-500)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 22
    }
  }, I.check(44)), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 400,
      fontSize: 28,
      color: 'var(--text-strong)',
      margin: '0 0 8px'
    }
  }, "\xA1Pago confirmado!"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 15,
      color: 'var(--text-muted)',
      margin: '0 0 18px',
      lineHeight: 1.55
    }
  }, "Tu pedido ", /*#__PURE__*/React.createElement("b", null, "#LP-2841"), " est\xE1 en preparaci\xF3n. Te avisamos cuando lo despachemos por Correo Argentino."), /*#__PURE__*/React.createElement(StatusPill, {
    status: "preparando"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 24
    }
  }), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "lg",
    full: true,
    onClick: onDone
  }, "Seguir mi pedido"), /*#__PURE__*/React.createElement("button", {
    onClick: onDone,
    style: {
      marginTop: 12,
      background: 'none',
      border: 'none',
      color: 'var(--text-link)',
      fontWeight: 700,
      fontSize: 14,
      cursor: 'pointer',
      fontFamily: 'var(--font-ui)'
    }
  }, "Volver al inicio"));
}
window.FavScreen = FavScreen;
window.ConfirmScreen = ConfirmScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/shopper-app/Extra.jsx", error: String((e && e.message) || e) }); }

// ui_kits/shopper-app/Home.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
// Home screen — La Percha Showroom shopper app
function HomeScreen({
  onOpen,
  favs,
  toggleFav,
  cat,
  setCat,
  onSearch
}) {
  const DS = window.LaPerchaShowroomDesignSystem_72de99;
  const {
    ProductCard,
    FilterChip,
    Badge
  } = DS;
  const D = window.LP_DATA;
  const I = window.LPIcons;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflowY: 'auto',
      paddingBottom: 84
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '6px 16px 12px',
      display: 'flex',
      alignItems: 'center',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "logo.jpg",
    alt: "La Percha",
    style: {
      width: 42,
      height: 42,
      borderRadius: '50%'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "lp-eyebrow",
    style: {
      fontSize: 10,
      color: 'var(--text-subtle)'
    }
  }, "Palihue \xB7 Showroom"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 19,
      color: 'var(--text-strong)',
      lineHeight: 1.1
    }
  }, "La Percha"))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '0 16px 12px'
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onSearch,
    style: {
      width: '100%',
      height: 46,
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '0 16px',
      background: 'var(--surface-card)',
      border: '1px solid var(--border-default)',
      borderRadius: 'var(--radius-pill)',
      color: 'var(--text-subtle)',
      cursor: 'pointer',
      fontFamily: 'var(--font-ui)',
      fontSize: 15
    }
  }, I.search(18), " Buscar prendas, regaler\xEDa, bazar\u2026")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      overflowX: 'auto',
      padding: '0 16px 14px',
      scrollbarWidth: 'none'
    }
  }, D.categories.map(c => /*#__PURE__*/React.createElement(FilterChip, {
    key: c,
    selected: cat === c,
    onClick: () => setCat(c)
  }, c))), /*#__PURE__*/React.createElement("div", {
    style: {
      margin: '0 16px 22px',
      borderRadius: 'var(--radius-xl)',
      overflow: 'hidden',
      background: 'linear-gradient(120deg, var(--mint-200), var(--sage-200))',
      padding: '22px 20px',
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "lp-eyebrow",
    style: {
      color: 'var(--sage-800)'
    }
  }, "Feria de Ropa"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 27,
      color: 'var(--ink-900)',
      lineHeight: 1.1,
      margin: '6px 0 4px',
      maxWidth: 240
    }
  }, "Renov\xE1 tu placard, cerca tuyo"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '0 0 14px',
      fontSize: 13,
      color: 'var(--ink-800)',
      maxWidth: 230
    }
  }, "Ropa seleccionada por vendedores de la comunidad. Env\xEDo gratis desde $25.000."), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      background: 'var(--ink-900)',
      color: '#fff',
      padding: '9px 16px',
      borderRadius: 'var(--radius-pill)',
      fontSize: 13,
      fontWeight: 700
    }
  }, "Ver la feria ", I.chevron(15))), /*#__PURE__*/React.createElement(SectionHeader, {
    title: "Tienda Oficial",
    sub: "Seleccionado por Silvina",
    icon: I.store(18)
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 12,
      overflowX: 'auto',
      padding: '0 16px 22px',
      scrollbarWidth: 'none'
    }
  }, D.official.map(prod => /*#__PURE__*/React.createElement("div", {
    key: prod.id,
    style: {
      width: 156,
      flex: '0 0 156px'
    }
  }, /*#__PURE__*/React.createElement(ProductCard, _extends({}, prod, {
    favorite: !!favs[prod.id],
    onToggleFavorite: () => toggleFav(prod.id),
    onClick: () => onOpen(prod.id)
  }))))), /*#__PURE__*/React.createElement(SectionHeader, {
    title: "Feria de Ropa",
    sub: "De la comunidad",
    icon: I.heart(17)
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 12,
      padding: '0 16px'
    }
  }, D.feria.map(prod => /*#__PURE__*/React.createElement(ProductCard, _extends({
    key: prod.id
  }, prod, {
    favorite: !!favs[prod.id],
    onToggleFavorite: () => toggleFav(prod.id),
    onClick: () => onOpen(prod.id)
  })))));
}
function SectionHeader({
  title,
  sub,
  icon
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 16px 12px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 9
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 32,
      height: 32,
      borderRadius: 10,
      background: 'var(--sage-100)',
      color: 'var(--sage-700)'
    }
  }, icon), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 19,
      color: 'var(--text-strong)',
      lineHeight: 1
    }
  }, title), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: 'var(--text-muted)'
    }
  }, sub))), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      fontWeight: 700,
      color: 'var(--text-link)'
    }
  }, "Ver todo"));
}
window.HomeScreen = HomeScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/shopper-app/Home.jsx", error: String((e && e.message) || e) }); }

// ui_kits/shopper-app/Product.jsx
try { (() => {
// Product detail screen
function ProductScreen({
  id,
  onBack,
  onAdd,
  favs,
  toggleFav
}) {
  const DS = window.LaPerchaShowroomDesignSystem_72de99;
  const {
    Button,
    IconButton,
    Badge,
    Rating,
    PriceTag,
    Tabs
  } = DS;
  const D = window.LP_DATA;
  const I = window.LPIcons;
  const prod = D.all.find(p => p.id === id) || D.all[0];
  const [tab, setTab] = React.useState('desc');
  const [size, setSize] = React.useState('M');
  const fav = !!favs[prod.id];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflowY: 'auto',
      paddingBottom: 92
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      height: 380,
      background: 'linear-gradient(135deg, var(--taupe-100), var(--taupe-300))',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--taupe-500)'
    }
  }, React.createElement('svg', {
    width: 64,
    height: 64,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.2
  }, React.createElement('rect', {
    x: 3,
    y: 3,
    width: 18,
    height: 18,
    rx: 3
  }), React.createElement('circle', {
    cx: 8.5,
    cy: 8.5,
    r: 1.8
  }), React.createElement('path', {
    d: 'M21 15l-5-5L5 21'
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 50,
      left: 16,
      right: 16,
      display: 'flex',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement(IconButton, {
    variant: "soft",
    ariaLabel: "Volver",
    onClick: onBack
  }, I.back(20)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(IconButton, {
    variant: "soft",
    ariaLabel: "Compartir"
  }, I.share(18)), /*#__PURE__*/React.createElement(IconButton, {
    variant: "soft",
    ariaLabel: "Favorito",
    active: fav,
    onClick: () => toggleFav(prod.id)
  }, I.heart(18, fav)))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      bottom: 14,
      left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex',
      gap: 6
    }
  }, [0, 1, 2, 3].map(i => /*#__PURE__*/React.createElement("span", {
    key: i,
    style: {
      width: i === 0 ? 18 : 6,
      height: 6,
      borderRadius: 3,
      background: i === 0 ? 'var(--ink-900)' : 'rgba(43,39,34,.3)'
    }
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--surface-card)',
      borderRadius: '22px 22px 0 0',
      marginTop: -18,
      position: 'relative',
      padding: '18px 18px 0'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6,
      marginBottom: 10
    }
  }, prod.official ? /*#__PURE__*/React.createElement(Badge, {
    tone: "brand",
    solid: true
  }, "Tienda Oficial") : /*#__PURE__*/React.createElement(Badge, {
    tone: "neutral"
  }, "Feria de Ropa"), prod.freeShipping && /*#__PURE__*/React.createElement(Badge, {
    tone: "mint"
  }, "Env\xEDo gratis")), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 400,
      fontSize: 25,
      lineHeight: 1.15,
      color: 'var(--text-strong)',
      margin: '0 0 8px'
    }
  }, prod.title), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement(Rating, {
    value: prod.rating,
    count: prod.reviews,
    showValue: true
  }), prod.seller && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: 'var(--text-muted)'
    }
  }, "\xB7 por ", /*#__PURE__*/React.createElement("b", {
    style: {
      color: 'var(--text-link)'
    }
  }, prod.seller))), /*#__PURE__*/React.createElement(PriceTag, {
    price: prod.price,
    original: prod.original,
    size: "lg"
  }), !prod.official && /*#__PURE__*/React.createElement("div", {
    style: {
      margin: '18px 0 4px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 700,
      color: 'var(--text-body)',
      marginBottom: 8
    }
  }, "Talle"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8
    }
  }, ['S', 'M', 'L', 'XL'].map(s => /*#__PURE__*/React.createElement("button", {
    key: s,
    onClick: () => setSize(s),
    style: {
      width: 46,
      height: 44,
      borderRadius: 'var(--radius-md)',
      border: `1.5px solid ${size === s ? 'var(--ink-900)' : 'var(--border-default)'}`,
      background: size === s ? 'var(--ink-900)' : 'var(--surface-card)',
      color: size === s ? '#fff' : 'var(--text-body)',
      fontWeight: 700,
      fontFamily: 'var(--font-ui)',
      cursor: 'pointer'
    }
  }, s)))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '14px 0',
      margin: '16px 0',
      borderTop: '1px solid var(--border-subtle)',
      borderBottom: '1px solid var(--border-subtle)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--sage-700)'
    }
  }, I.truck(22)), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 700,
      color: 'var(--text-strong)'
    }
  }, "Correo Argentino \xB7 3-5 d\xEDas"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'var(--text-muted)'
    }
  }, "O retiro en showroom (Palihue) sin cargo")), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-subtle)'
    }
  }, I.chevron(18))), /*#__PURE__*/React.createElement(Tabs, {
    active: tab,
    onChange: setTab,
    tabs: [{
      key: 'desc',
      label: 'Descripción'
    }, {
      key: 'rev',
      label: 'Reseñas',
      count: prod.reviews
    }]
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '14px 0 8px',
      fontSize: 14,
      lineHeight: 1.6,
      color: 'var(--text-body)'
    }
  }, tab === 'desc' ? 'Prenda en excelente estado, lista para usar. Calce cómodo y atemporal. Coordiná el envío con Correo Argentino o pasá a buscarla por el showroom en Palihue.' : 'Muy buena atención y la prenda igual a las fotos. Llegó rápido y bien embalada. ¡Recomiendo a la vendedora!'))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      padding: '12px 16px calc(12px + env(safe-area-inset-bottom))',
      background: 'var(--surface-card)',
      borderTop: '1px solid var(--border-subtle)',
      display: 'flex',
      gap: 12,
      boxShadow: '0 -4px 16px rgba(50,44,36,.06)'
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "outline",
    iconLeft: I.bag(18),
    onClick: () => onAdd(prod.id)
  }, "Agregar"), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    full: true,
    onClick: () => onAdd(prod.id, true)
  }, "Comprar ahora")));
}
window.ProductScreen = ProductScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/shopper-app/Product.jsx", error: String((e && e.message) || e) }); }

// ui_kits/shopper-app/chrome.js
try { (() => {
// Shared icons + phone chrome for the shopper UI kit
(function () {
  const Icon = (paths, size = 22, fill = false) => React.createElement('svg', {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: fill ? 'currentColor' : 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round'
  }, paths);
  const p = d => React.createElement('path', {
    d,
    key: d
  });
  window.LPIcons = {
    home: s => Icon([p('M3 10.5 12 3l9 7.5'), p('M5 9.5V21h14V9.5')], s),
    search: s => Icon([React.createElement('circle', {
      cx: 11,
      cy: 11,
      r: 7,
      key: 'c'
    }), p('m21 21-4.3-4.3')], s),
    plus: s => Icon([p('M12 5v14'), p('M5 12h14')], s),
    heart: (s, f) => Icon([p('M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 1 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z')], s, f),
    user: s => Icon([React.createElement('circle', {
      cx: 12,
      cy: 8,
      r: 4,
      key: 'c'
    }), p('M4 21c0-4 4-6 8-6s8 2 8 6')], s),
    bag: s => Icon([p('M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z'), p('M3 6h18'), p('M16 10a4 4 0 0 1-8 0')], s),
    back: s => Icon([p('m15 18-6-6 6-6')], s),
    share: s => Icon([React.createElement('circle', {
      cx: 18,
      cy: 5,
      r: 3,
      key: 'a'
    }), React.createElement('circle', {
      cx: 6,
      cy: 12,
      r: 3,
      key: 'b'
    }), React.createElement('circle', {
      cx: 18,
      cy: 19,
      r: 3,
      key: 'c'
    }), p('m8.6 13.5 6.8 4'), p('m15.4 6.5-6.8 4')], s),
    truck: s => Icon([p('M3 7h11v9H3z'), p('M14 10h4l3 3v3h-7'), React.createElement('circle', {
      cx: 7,
      cy: 18,
      r: 2,
      key: 'a'
    }), React.createElement('circle', {
      cx: 17,
      cy: 18,
      r: 2,
      key: 'b'
    })], s),
    store: s => Icon([p('M4 8 6 3h12l2 5'), p('M4 8v12h16V8'), p('M4 8h16'), p('M9 20v-6h6v6')], s),
    check: s => Icon([p('M20 6 9 17l-5-5')], s),
    chevron: s => Icon([p('m9 6 6 6-6 6')], s),
    star: s => Icon([p('M12 2l3 6.5 7 .9-5 4.8 1.2 7L12 18l-6.4 3.2L6.8 14l-5-4.8 7-.9z')], s, true)
  };

  // Status bar + phone shell
  window.PhoneFrame = function PhoneFrame({
    children,
    dark
  }) {
    return React.createElement('div', {
      style: {
        width: 390,
        height: 844,
        background: 'var(--bg-page)',
        borderRadius: 0,
        overflow: 'hidden',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'var(--font-ui)'
      }
    }, React.createElement('div', {
      style: {
        height: 44,
        flex: '0 0 44px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 22px',
        background: dark ? 'transparent' : 'var(--bg-page)',
        color: dark ? '#fff' : 'var(--ink-900)',
        fontWeight: 700,
        fontSize: 14,
        position: dark ? 'absolute' : 'relative',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 5
      }
    }, React.createElement('span', null, '9:41'), React.createElement('span', {
      style: {
        display: 'flex',
        gap: 5,
        alignItems: 'center',
        fontSize: 12
      }
    }, '5G  ▮▮▮▮  100%')), children);
  };
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/shopper-app/chrome.js", error: String((e && e.message) || e) }); }

// ui_kits/shopper-app/data.js
try { (() => {
// La Percha Showroom — mock data for the shopper UI kit
window.LP_DATA = {
  categories: ['Todo', 'Vestidos', 'Jeans', 'Camperas', 'Calzado', 'Deportiva', 'Infantil'],
  official: [{
    id: 'o1',
    title: 'Set de mates artesanales pintados a mano',
    price: 12500,
    rating: 5,
    reviews: 8,
    official: true,
    cat: 'Bazar'
  }, {
    id: 'o2',
    title: 'Vela de soja aroma vainilla & cedro',
    price: 6800,
    original: 8500,
    rating: 4.5,
    reviews: 21,
    official: true,
    freeShipping: true,
    cat: 'Decoración'
  }, {
    id: 'o3',
    title: 'Crema corporal natural karité',
    price: 9200,
    rating: 4.5,
    reviews: 14,
    official: true,
    cat: 'Cosmética'
  }, {
    id: 'o4',
    title: 'Juego de bowls de cerámica esmaltada',
    price: 18900,
    rating: 5,
    reviews: 5,
    official: true,
    cat: 'Bazar'
  }],
  feria: [{
    id: 'f1',
    title: 'Vestido de lino natural manga corta',
    price: 18900,
    original: 24000,
    rating: 4.5,
    reviews: 32,
    freeShipping: true,
    seller: 'Caro Indumentaria',
    cat: 'Vestidos'
  }, {
    id: 'f2',
    title: 'Campera de jean oversize tiro alto',
    price: 26500,
    rating: 4,
    reviews: 17,
    seller: 'Vintage Bahía',
    cat: 'Camperas'
  }, {
    id: 'f3',
    title: 'Zapatillas urbanas de cuero blancas',
    price: 32000,
    original: 39000,
    rating: 5,
    reviews: 44,
    seller: 'Pasos Store',
    cat: 'Calzado'
  }, {
    id: 'f4',
    title: 'Jean mom fit celeste claro',
    price: 21500,
    rating: 4.5,
    reviews: 28,
    freeShipping: true,
    seller: 'Denim Club',
    cat: 'Jeans'
  }, {
    id: 'f5',
    title: 'Buzo deportivo algodón frisado',
    price: 16800,
    rating: 4,
    reviews: 11,
    seller: 'Activa',
    cat: 'Deportiva'
  }, {
    id: 'f6',
    title: 'Vestido infantil floreado',
    price: 11900,
    rating: 5,
    reviews: 9,
    seller: 'Pequeños',
    cat: 'Infantil'
  }],
  get all() {
    return [...this.official, ...this.feria];
  },
  fmt(n) {
    return '$' + Number(n).toLocaleString('es-AR');
  }
};
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/shopper-app/data.js", error: String((e && e.message) || e) }); }

__ds_ns.PriceTag = __ds_scope.PriceTag;

__ds_ns.ProductCard = __ds_scope.ProductCard;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.EmptyState = __ds_scope.EmptyState;

__ds_ns.FilterChip = __ds_scope.FilterChip;

__ds_ns.Rating = __ds_scope.Rating;

__ds_ns.StatusPill = __ds_scope.StatusPill;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.QuantityStepper = __ds_scope.QuantityStepper;

__ds_ns.Switch = __ds_scope.Switch;

__ds_ns.BottomNav = __ds_scope.BottomNav;

__ds_ns.Tabs = __ds_scope.Tabs;

})();

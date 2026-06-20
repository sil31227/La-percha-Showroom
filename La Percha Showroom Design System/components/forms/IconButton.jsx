import React from 'react';

/**
 * IconButton — square tappable control for icon-only actions (favorite, share,
 * close, cart). Sizes meet the 44px touch-target minimum at md+.
 */
export function IconButton({
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
  const sizes = { sm: 36, md: 44, lg: 52 };
  const dim = sizes[size] || sizes.md;
  const variants = {
    ghost: { background: 'transparent', color: 'var(--text-strong)', border: '1px solid transparent' },
    soft: { background: 'var(--surface-card)', color: 'var(--text-strong)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' },
    brand: { background: 'var(--brand)', color: '#fff', border: '1px solid var(--brand)' },
  };
  const v = variants[variant] || variants.ghost;
  const activeStyle = active ? { background: 'var(--error-50)', color: 'var(--error-500)', border: '1px solid var(--error-500)' } : {};
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: dim, height: dim, borderRadius: 'var(--radius-pill)',
        cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1,
        transition: 'transform var(--dur-fast) var(--ease-out), background var(--dur-fast)',
        ...v, ...activeStyle, ...style,
      }}
      onMouseDown={(e) => { if (!disabled) e.currentTarget.style.transform = 'scale(0.9)'; }}
      onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
      {...rest}
    >
      {children}
    </button>
  );
}

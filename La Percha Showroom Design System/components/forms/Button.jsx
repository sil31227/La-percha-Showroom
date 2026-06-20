import React from 'react';

/**
 * Button — primary call-to-action and supporting actions for La Percha Showroom.
 * Variants: primary (sage), secondary (mint-tinted), outline, ghost, danger.
 */
export function Button({
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
    sm: { padding: '0 14px', height: 36, fontSize: 'var(--text-sm)', radius: 'var(--radius-sm)', gap: 6 },
    md: { padding: '0 20px', height: 44, fontSize: 'var(--text-base)', radius: 'var(--radius-md)', gap: 8 },
    lg: { padding: '0 26px', height: 52, fontSize: 'var(--text-md)', radius: 'var(--radius-lg)', gap: 9 },
  };
  const s = sizes[size] || sizes.md;

  const variants = {
    primary: { background: 'var(--brand)', color: 'var(--text-on-brand)', border: '1px solid var(--brand)', boxShadow: 'var(--shadow-brand)' },
    secondary: { background: 'var(--mint-100)', color: 'var(--mint-700)', border: '1px solid var(--mint-200)', boxShadow: 'none' },
    outline: { background: 'transparent', color: 'var(--text-strong)', border: '1px solid var(--border-default)', boxShadow: 'none' },
    ghost: { background: 'transparent', color: 'var(--text-strong)', border: '1px solid transparent', boxShadow: 'none' },
    danger: { background: 'var(--error-500)', color: '#fff', border: '1px solid var(--error-500)', boxShadow: 'none' },
  };
  const v = variants[variant] || variants.primary;

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: s.gap,
        height: s.height, padding: s.padding, width: full ? '100%' : 'auto',
        fontFamily: 'var(--font-ui)', fontWeight: 'var(--fw-bold)', fontSize: s.fontSize,
        lineHeight: 1, letterSpacing: '0.005em', whiteSpace: 'nowrap',
        borderRadius: s.radius, cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'transform var(--dur-fast) var(--ease-out), filter var(--dur-fast) var(--ease-out)',
        ...v, ...style,
      }}
      onMouseDown={(e) => { if (!disabled) e.currentTarget.style.transform = 'scale(0.97)'; }}
      onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
      {...rest}
    >
      {iconLeft}
      {children}
      {iconRight}
    </button>
  );
}

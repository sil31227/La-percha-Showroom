import React from 'react';

/**
 * Input — labeled text field with optional leading icon, helper and error text.
 * Mobile-first: 48px tall, 16px font to avoid iOS zoom-on-focus.
 */
export function Input({
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
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%', ...style }}>
      {label && (
        <label htmlFor={fieldId} style={{
          fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-semibold)',
          color: 'var(--text-body)',
        }}>{label}</label>
      )}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, height: 48, padding: '0 14px',
        background: disabled ? 'var(--surface-sunken)' : 'var(--surface-card)',
        border: `1px solid ${invalid ? 'var(--error-500)' : 'var(--border-default)'}`,
        borderRadius: 'var(--radius-md)',
        transition: 'border-color var(--dur-fast), box-shadow var(--dur-fast)',
      }}
        onFocusCapture={(e) => { if (!invalid) e.currentTarget.style.boxShadow = '0 0 0 3px var(--sage-100)', e.currentTarget.style.borderColor = 'var(--sage-500)'; }}
        onBlurCapture={(e) => { e.currentTarget.style.boxShadow = 'none'; if (!invalid) e.currentTarget.style.borderColor = 'var(--border-default)'; }}
      >
        {iconLeft && <span style={{ color: 'var(--text-subtle)', display: 'flex' }}>{iconLeft}</span>}
        <input
          id={fieldId}
          type={type}
          placeholder={placeholder}
          value={value}
          defaultValue={defaultValue}
          onChange={onChange}
          disabled={disabled}
          aria-invalid={invalid}
          style={{
            flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent',
            fontFamily: 'var(--font-ui)', fontSize: '16px', color: 'var(--text-strong)',
          }}
          {...rest}
        />
        {suffix && <span style={{ color: 'var(--text-subtle)', fontSize: 'var(--text-sm)' }}>{suffix}</span>}
      </div>
      {(helper || error) && (
        <span style={{ fontSize: 'var(--text-xs)', color: invalid ? 'var(--error-500)' : 'var(--text-muted)' }}>
          {error || helper}
        </span>
      )}
    </div>
  );
}

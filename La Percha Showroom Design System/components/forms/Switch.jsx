import React from 'react';

/** Switch — on/off toggle for settings (envío gratis, notificaciones). */
export function Switch({ checked = false, onChange, disabled = false, label, id, style = {} }) {
  const sid = id || (label ? `sw-${label.replace(/\s+/g, '-').toLowerCase()}` : undefined);
  const toggle = () => { if (!disabled && onChange) onChange(!checked); };
  const control = (
    <button
      type="button" role="switch" aria-checked={checked} id={sid} disabled={disabled}
      onClick={toggle}
      style={{
        position: 'relative', width: 46, height: 28, flex: '0 0 auto', borderRadius: 'var(--radius-pill)',
        border: 'none', cursor: disabled ? 'not-allowed' : 'pointer', padding: 0,
        background: checked ? 'var(--brand)' : 'var(--ink-300)', opacity: disabled ? 0.5 : 1,
        transition: 'background var(--dur-base) var(--ease-out)',
      }}
    >
      <span style={{
        position: 'absolute', top: 3, left: checked ? 21 : 3, width: 22, height: 22,
        borderRadius: '50%', background: '#fff', boxShadow: 'var(--shadow-sm)',
        transition: 'left var(--dur-base) var(--ease-spring)',
      }} />
    </button>
  );
  if (!label) return control;
  return (
    <label htmlFor={sid} style={{ display: 'inline-flex', alignItems: 'center', gap: 10, cursor: 'pointer', ...style }}>
      {control}
      <span style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-base)', color: 'var(--text-body)' }}>{label}</span>
    </label>
  );
}

import React from 'react';

const tints = {
  neutral: ['var(--taupe-200)', 'var(--ink-500)'],
  brand:   ['var(--sage-100)', 'var(--sage-700)'],
  mint:    ['var(--mint-100)', 'var(--mint-600)'],
  success: ['var(--success-50)', 'var(--success-600)'],
  warning: ['var(--warning-50)', 'var(--warning-600)'],
  error:   ['var(--error-50)', 'var(--error-600)'],
};

/**
 * Centered placeholder for empty / error / success screen states.
 * Icon medallion, title, description and an optional action.
 */
export function EmptyState({ icon, title, description, action, tone = 'neutral', style = {} }) {
  const [bg, fg] = tints[tone] || tints.neutral;
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
      gap: 12, padding: '44px 28px', maxWidth: 360, margin: '0 auto', ...style,
    }}>
      {icon != null ? (
        <div style={{
          width: 72, height: 72, borderRadius: '50%', background: bg, color: fg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>{icon}</div>
      ) : null}
      <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 400, fontSize: 'var(--text-xl)', color: 'var(--text-strong)', margin: 0 }}>{title}</h3>
      {description ? (
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', margin: 0, lineHeight: 1.55 }}>{description}</p>
      ) : null}
      {action ? <div style={{ marginTop: 4 }}>{action}</div> : null}
    </div>
  );
}

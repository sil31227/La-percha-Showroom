import * as React from 'react';

export interface BadgeProps {
  children?: React.ReactNode;
  /** @default "neutral" */
  tone?: 'neutral' | 'brand' | 'mint' | 'success' | 'warning' | 'error';
  /** Solid fill instead of soft tint. @default false */
  solid?: boolean;
  size?: 'sm' | 'md';
  style?: React.CSSProperties;
}

/** Small label/status pill (Oficial, Nuevo, Envío gratis, -20%). */
export function Badge(props: BadgeProps): JSX.Element;

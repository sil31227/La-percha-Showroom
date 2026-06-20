import * as React from 'react';

export interface IconButtonProps {
  children?: React.ReactNode;
  /** @default "ghost" */
  variant?: 'ghost' | 'soft' | 'brand';
  /** @default "md" */
  size?: 'sm' | 'md' | 'lg';
  /** Toggled state — renders the terracotta "active" treatment (e.g. favorited). */
  active?: boolean;
  disabled?: boolean;
  /** Required for accessibility on icon-only buttons. */
  ariaLabel?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  style?: React.CSSProperties;
}

/** Round icon-only button for favorite/share/close/cart actions. */
export function IconButton(props: IconButtonProps): JSX.Element;

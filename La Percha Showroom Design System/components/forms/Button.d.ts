import * as React from 'react';

/**
 * @startingPoint section="Forms" subtitle="CTA + action buttons" viewport="700x200"
 */
export interface ButtonProps {
  children?: React.ReactNode;
  /** Visual style. @default "primary" */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  /** @default "md" */
  size?: 'sm' | 'md' | 'lg';
  /** Stretch to container width. @default false */
  full?: boolean;
  disabled?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  type?: 'button' | 'submit' | 'reset';
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  style?: React.CSSProperties;
}

/**
 * Primary action button. Sage primary for the main CTA per screen; outline/ghost
 * for secondary actions; danger for destructive flows.
 */
export function Button(props: ButtonProps): JSX.Element;

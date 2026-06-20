import * as React from 'react';

export interface PriceTagProps {
  price: number;
  /** Original price; when higher than `price`, shows strikethrough + % OFF. */
  original?: number;
  size?: 'sm' | 'md' | 'lg';
  style?: React.CSSProperties;
}

/** Price display with AR formatting and optional sale treatment. */
export function PriceTag(props: PriceTagProps): JSX.Element;

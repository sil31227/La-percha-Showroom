import * as React from 'react';

export interface RatingProps {
  /** 0–5, supports halves. */
  value?: number;
  /** Review count shown as "(N)". */
  count?: number;
  size?: number;
  showValue?: boolean;
  style?: React.CSSProperties;
}

/** Read-only star rating in the brand amber. */
export function Rating(props: RatingProps): JSX.Element;

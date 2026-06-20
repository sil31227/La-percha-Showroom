import * as React from 'react';

export interface FilterChipProps {
  children?: React.ReactNode;
  selected?: boolean;
  onClick?: () => void;
  iconLeft?: React.ReactNode;
  style?: React.CSSProperties;
}

/** Selectable chip for category/filter rows. Selected = ink fill. */
export function FilterChip(props: FilterChipProps): JSX.Element;

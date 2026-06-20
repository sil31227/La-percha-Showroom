import * as React from 'react';

export interface QuantityStepperProps {
  value?: number;
  min?: number;
  max?: number;
  onChange?: (next: number) => void;
  size?: 'sm' | 'md';
  style?: React.CSSProperties;
}

/** Pill −/＋ quantity stepper for cart line items. */
export function QuantityStepper(props: QuantityStepperProps): JSX.Element;

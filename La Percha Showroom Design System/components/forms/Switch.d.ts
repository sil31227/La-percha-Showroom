import * as React from 'react';

export interface SwitchProps {
  checked?: boolean;
  onChange?: (next: boolean) => void;
  disabled?: boolean;
  label?: string;
  id?: string;
  style?: React.CSSProperties;
}

/** On/off toggle for settings. Sage when on. */
export function Switch(props: SwitchProps): JSX.Element;

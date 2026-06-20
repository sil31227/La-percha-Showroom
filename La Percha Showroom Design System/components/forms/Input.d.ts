import * as React from 'react';

export interface InputProps {
  label?: string;
  type?: string;
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  iconLeft?: React.ReactNode;
  suffix?: React.ReactNode;
  helper?: string;
  /** When set, field renders the error state and shows this message. */
  error?: string;
  disabled?: boolean;
  id?: string;
  style?: React.CSSProperties;
}

/** Labeled text field. 48px tall, 16px text (no iOS zoom). Supports icon, helper, error. */
export function Input(props: InputProps): JSX.Element;

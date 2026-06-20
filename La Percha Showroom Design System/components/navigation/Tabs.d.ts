import * as React from 'react';

export interface TabItem {
  key: string;
  label: string;
  count?: number;
}

export interface TabsProps {
  /** Strings or {key,label,count} objects. */
  tabs: Array<string | TabItem>;
  active?: string;
  onChange?: (key: string) => void;
  style?: React.CSSProperties;
}

/** Underline tab bar for in-page section switching. */
export function Tabs(props: TabsProps): JSX.Element;

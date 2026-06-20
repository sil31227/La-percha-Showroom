import * as React from 'react';

export interface BottomNavItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  /** Notification count bubble. */
  badge?: number | string;
  /** Render as the raised central "Vender" action. */
  accent?: boolean;
}

/**
 * @startingPoint section="Navigation" subtitle="Mobile tab bar" viewport="390x72"
 */
export interface BottomNavProps {
  items: BottomNavItem[];
  active?: string;
  onChange?: (key: string) => void;
  style?: React.CSSProperties;
}

/** Fixed mobile bottom navigation — primary nav for the shopper app. */
export function BottomNav(props: BottomNavProps): JSX.Element;

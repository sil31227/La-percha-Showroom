import * as React from "react";

/** Centered placeholder for empty / error / success screen states. */
export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  /** Optional action node (usually a Button). */
  action?: React.ReactNode;
  tone?: "neutral" | "brand" | "mint" | "success" | "warning" | "error";
  style?: React.CSSProperties;
}

export function EmptyState(props: EmptyStateProps): JSX.Element;

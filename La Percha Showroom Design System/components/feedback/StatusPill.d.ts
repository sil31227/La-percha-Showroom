import * as React from 'react';

export type LPStatus =
  | 'pendiente' | 'pagado' | 'preparando' | 'enviado' | 'entregado' | 'liberado' | 'cancelado'
  | 'revision' | 'aprobada' | 'rechazada' | 'cambios';

export interface StatusPillProps {
  /** Order/payment/publication status key. */
  status: LPStatus;
  style?: React.CSSProperties;
}

/** Canonical status pill with a colored dot. Covers order, payment & moderation states. */
export function StatusPill(props: StatusPillProps): JSX.Element;

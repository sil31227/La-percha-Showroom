import * as React from 'react';

/**
 * @startingPoint section="Commerce" subtitle="Product grid tile" viewport="240x360"
 */
export interface ProductCardProps {
  title: string;
  price: number;
  original?: number;
  /** Image URL; omit to show the taupe photo placeholder. */
  image?: string;
  rating?: number;
  reviews?: number;
  /** Tienda Oficial flag → "Oficial" badge. */
  official?: boolean;
  freeShipping?: boolean;
  /** Seller name (Feria de Ropa). */
  seller?: string;
  favorite?: boolean;
  onToggleFavorite?: () => void;
  onClick?: () => void;
  style?: React.CSSProperties;
}

/**
 * Marketplace product tile for both Tienda Oficial and Feria de Ropa. Designed for a
 * mobile 2-up grid.
 */
export function ProductCard(props: ProductCardProps): JSX.Element;

export type Condition = 'new_tag' | 'new' | 'like_new' | 'used'
export type StoreType = 'oficial' | 'feria'
export type SortOption = 'newest' | 'price_asc' | 'price_desc'
export type ProductType = 'ropa' | 'regaleria' | 'bazar' | 'decoracion'
export type Category = 'mujer' | 'hombre' | 'kids' | 'regaleria' | 'bazar' | 'decoracion'
export type Subcategory = 'ropa' | 'calzado' | 'accesorios' | 'belleza' | 'bebes' | 'ninas' | 'ninos'

export interface Variante {
  id: string
  talle: string
  color: string
  precio: number
  stock: number
  imagen: string
}

export interface Seller {
  id: string
  name: string
  avatar: string
  rating: number
  sales_count: number
}

export interface Product {
  id: string
  title: string
  description: string
  brand: string
  price: number
  images: string[]
  sizes: string[]
  condition: Condition
  store_type: StoreType
  category: Category
  subcategory?: Subcategory
  seller: Seller
  tipo?: ProductType
  accepts_offers: boolean
  free_shipping: boolean
  material?: string
  stock?: number
  variantes?: Variante[]
  created_at: string
}

export interface CartItem {
  productId: string
  title: string
  price: number
  image: string
  size: string
  quantity: number
  store_type: StoreType
  variantLabel?: string
  variantPrice?: number
  variantAttributes?: Record<string, string>
  variantStock?: number
}

export interface Filters {
  category: string
  subcategory: string
  size: string
  condition: string
  priceMax: number
  sort: SortOption
  search: string
}

export type ShippingMethod = 'correo_sucursal' | 'correo_domicilio' | 'arreglar_vendedor' | 'retiro_local'

export interface ShippingConfig {
  sucursal_price: number
  domicilio_price: number
  free_threshold: number
  domicilio_surcharge: number
}

export type NotificationType =
  | "product_approved"
  | "product_rejected"
  | "product_changes_requested"
  | "seller_approved"
  | "seller_rejected"
  | "order_shipped"
  | "order_delivered"
  | "product_sold"

export type ModerationActionType = 'approved' | 'rejected' | 'changes_requested'

export interface ModerationNote {
  id: string
  producto_id: string
  admin_id: string
  tipo_accion: ModerationActionType
  texto: string | null
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  body?: string
  link?: string | null
  read: boolean
  created_at?: string
}

export type Condition = 'new_tag' | 'new' | 'like_new' | 'used'
export type StoreType = 'oficial' | 'feria'
export type SortOption = 'newest' | 'price_asc' | 'price_desc'
export type Category = 'mujer' | 'hombre' | 'kids' | 'regaleria' | 'bazar' | 'decoracion'
export type Subcategory = 'ropa' | 'calzado' | 'accesorios' | 'belleza' | 'bebes' | 'ninas' | 'ninos'

export interface Variante {
  nombre: string
  atributos: Record<string, string>
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
  accepts_offers: boolean
  free_shipping: boolean
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
  store_type: StoreType
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

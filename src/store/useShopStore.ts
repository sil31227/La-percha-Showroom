import { create } from "zustand"
import type { CartItem, Filters } from "@/lib/types"

const CART_KEY = "lapercha_cart"
const FAV_KEY = "lapercha_favs"
const SHIPPING_KEY = "lapercha_shipping"

function cartKey(productId: string, size: string, variantLabel?: string) {
  return `${productId}||${size}||${variantLabel || ""}`
}

function loadCart(): CartItem[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(CART_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveCart(cart: CartItem[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(CART_KEY, JSON.stringify(cart))
}

function loadFavs(): string[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(FAV_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveFavs(favs: string[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(FAV_KEY, JSON.stringify(favs))
}

function loadShipping(): { shippingMethod: string | null; shippingCost: number } {
  if (typeof window === "undefined") return { shippingMethod: null, shippingCost: 0 }
  try {
    const raw = localStorage.getItem(SHIPPING_KEY)
    return raw ? JSON.parse(raw) : { shippingMethod: null, shippingCost: 0 }
  } catch {
    return { shippingMethod: null, shippingCost: 0 }
  }
}

function saveShipping(method: string | null, cost: number) {
  if (typeof window === "undefined") return
  localStorage.setItem(SHIPPING_KEY, JSON.stringify({ shippingMethod: method, shippingCost: cost }))
}

interface ShopStore {
  cart: CartItem[]
  addToCart: (item: CartItem) => void
  removeFromCart: (productId: string, size: string, variantLabel?: string) => void
  updateQuantity: (productId: string, size: string, variantLabel: string | undefined, quantity: number) => void
  clearCart: () => void
  cartCount: () => number
  cartTotal: () => number

  shippingMethod: string | null
  shippingCost: number
  setShipping: (method: string, cost: number) => void

  favorites: string[]
  toggleFavorite: (productId: string) => void
  isFavorite: (productId: string) => boolean

  filters: Filters
  setFilter: (key: keyof Filters, value: string | number) => void
  resetFilters: () => void
}

const DEFAULT_FILTERS: Filters = {
  category: "all",
  subcategory: "",
  size: "",
  condition: "",
  priceMax: 0,
  sort: "newest",
  search: "",
}

export const useShopStore = create<ShopStore>()((set, get) => ({
  cart: typeof window !== "undefined" ? loadCart() : [],
  ...(typeof window !== "undefined" ? loadShipping() : { shippingMethod: null, shippingCost: 0 }),
  addToCart: (item) =>
    set((s) => {
      const key = (i: CartItem) => cartKey(i.productId, i.size, i.variantLabel)
      const existing = s.cart.find(i => key(i) === key(item))
      if (existing) {
        const next = {
          cart: s.cart.map(i => i === existing ? { ...i, quantity: i.quantity + item.quantity } : i),
        }
        saveCart(next.cart)
        return next
      }
      const next = { cart: [...s.cart, { ...item, quantity: item.quantity || 1 }] }
      saveCart(next.cart)
      return next
    }),
  removeFromCart: (productId, size, variantLabel) =>
    set((s) => {
      const targetKey = cartKey(productId, size, variantLabel)
      const next = { cart: s.cart.filter(i => cartKey(i.productId, i.size, i.variantLabel) !== targetKey) }
      saveCart(next.cart)
      return next
    }),
  updateQuantity: (productId, size, variantLabel, quantity) =>
    set((s) => {
      const targetKey = cartKey(productId, size, variantLabel)
      if (quantity <= 0) {
        const next = { cart: s.cart.filter(i => cartKey(i.productId, i.size, i.variantLabel) !== targetKey) }
        saveCart(next.cart)
        return next
      }
      const next = {
        cart: s.cart.map(i => cartKey(i.productId, i.size, i.variantLabel) === targetKey ? { ...i, quantity } : i),
      }
      saveCart(next.cart)
      return next
    }),
  clearCart: () => {
    saveCart([])
    set({ cart: [] })
  },
  cartCount: () => get().cart.reduce((sum, i) => sum + (i.quantity ?? 1), 0),
  cartTotal: () => get().cart.reduce((sum, i) => sum + i.price * (i.quantity ?? 1), 0),

  setShipping: (method, cost) => {
    set({ shippingMethod: method, shippingCost: cost })
    saveShipping(method, cost)
  },

  favorites: typeof window !== "undefined" ? loadFavs() : [],
  toggleFavorite: (productId) =>
    set((s) => {
      const next = {
        favorites: s.favorites.includes(productId)
          ? s.favorites.filter(id => id !== productId)
          : [...s.favorites, productId],
      }
      saveFavs(next.favorites)
      return next
    }),
  isFavorite: (productId) => get().favorites.includes(productId),

  filters: DEFAULT_FILTERS,
  setFilter: (key, value) =>
    set((s) => ({ filters: { ...s.filters, [key]: value } })),
  resetFilters: () => set({ filters: DEFAULT_FILTERS }),
}))


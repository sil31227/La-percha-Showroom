import { create } from "zustand"
import type { CartItem, Filters } from "@/lib/types"

const CART_KEY = "lapercha_cart"
const FAV_KEY = "lapercha_favs"

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

interface ShopStore {
  cart: CartItem[]
  addToCart: (item: CartItem) => void
  removeFromCart: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  cartCount: () => number
  cartTotal: () => number

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
  cart: [],
  addToCart: (item) =>
    set((s) => {
      const key = (i: CartItem) => `${i.productId}||${i.size}||${i.variantLabel || ""}`
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
  removeFromCart: (productId) =>
    set((s) => {
      const next = { cart: s.cart.filter(i => i.productId !== productId) }
      saveCart(next.cart)
      return next
    }),
  updateQuantity: (productId, quantity) =>
    set((s) => {
      if (quantity <= 0) {
        const next = { cart: s.cart.filter(i => i.productId !== productId) }
        saveCart(next.cart)
        return next
      }
      const next = {
        cart: s.cart.map(i => i.productId === productId ? { ...i, quantity } : i),
      }
      saveCart(next.cart)
      return next
    }),
  clearCart: () => {
    saveCart([])
    set({ cart: [] })
  },
  cartCount: () => get().cart.reduce((sum, i) => sum + (i.quantity || 1), 0),
  cartTotal: () => get().cart.reduce((sum, i) => sum + i.price * (i.quantity || 1), 0),

  favorites: [],
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

if (typeof window !== "undefined") {
  useShopStore.setState({ cart: loadCart(), favorites: loadFavs() })
}

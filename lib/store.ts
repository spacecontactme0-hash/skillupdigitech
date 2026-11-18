// Global state management with Zustand
import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { User, CartItem, Currency } from "./types"

interface AuthState {
  user: User | null
  token: string | null
  hydrated: boolean
  lastLogin: { email: string; name: string; role: User["role"] } | null
  setAuth: (user: User, token: string) => void
  clearAuth: () => void
  setHydrated: (value: boolean) => void
  clearLastLogin: () => void
  isAuthenticated: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      hydrated: false,
      lastLogin: null,
      setAuth: (user, token) =>
        set({
          user,
          token,
          hydrated: true,
          lastLogin: { email: user.email, name: user.name, role: user.role },
        }),
      clearAuth: () =>
        set((state) => ({
          user: null,
          token: null,
          hydrated: true,
          lastLogin: state.lastLogin,
        })),
      setHydrated: (value) => set({ hydrated: value }),
      clearLastLogin: () => set({ lastLogin: null }),
      isAuthenticated: () => !!get().token,
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        hydrated: state.hydrated,
        lastLogin: state.lastLogin,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true)
      },
    },
  ),
)

interface CartState {
  items: CartItem[]
  hydrated: boolean
  addToCart: (item: CartItem) => void
  removeFromCart: (courseId: string) => void
  clearCart: () => void
  getTotal: (currency: Currency) => number
  setHydrated: (value: boolean) => void
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      hydrated: false,
      addToCart: (item) => {
        const items = get().items
        const exists = items.find((i) => i.courseId === item.courseId)
        if (!exists) {
          set({ items: [...items, item] })
        }
      },
      removeFromCart: (courseId) => {
        set({ items: get().items.filter((i) => i.courseId !== courseId) })
      },
      clearCart: () => set({ items: [] }),
      getTotal: (currency) => {
        return get().items.reduce((total, item) => total + item.course.price[currency], 0)
      },
      setHydrated: (value) => set({ hydrated: value }),
    }),
    {
      name: "cart-storage",
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true)
      },
    },
  ),
)

interface PreferencesState {
  currency: Currency
  currencySelected: boolean
  hydrated: boolean
  setCurrency: (currency: Currency) => void
  setCurrencySelected: (selected: boolean) => void
  setHydrated: (value: boolean) => void
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      currency: "NGN",
      currencySelected: true,
      hydrated: false,
      setCurrency: (currency) => set({ currency }),
      setCurrencySelected: (selected) => set({ currencySelected: selected }),
      setHydrated: (value) => set({ hydrated: value }),
    }),
    {
      name: "preferences-storage",
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true)
      },
    },
  ),
)

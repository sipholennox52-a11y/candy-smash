'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { type Product } from '@/lib/products'
import { discountForCode, EARNED_CODE_KEY } from '@/lib/rewards'

export interface CartItem extends Product {
  qty: number
}

interface CartContextValue {
  items: CartItem[]
  count: number
  subtotal: number
  discountPercent: number
  discountAmount: number
  total: number
  code: string
  add: (product: Product) => void
  remove: (id: string) => void
  setQty: (id: string, qty: number) => void
  clear: () => void
  applyCode: (code: string) => boolean
  clearCode: () => void
}

const CART_KEY = 'sweetmatch:cart'
const CODE_KEY = 'sweetmatch:cart-code'

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [code, setCode] = useState('')
  const [hydrated, setHydrated] = useState(false)

  // Load persisted cart + any code earned in the game on mount.
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(CART_KEY)
      if (savedCart) setItems(JSON.parse(savedCart))
      const savedCode =
        localStorage.getItem(CODE_KEY) || localStorage.getItem(EARNED_CODE_KEY)
      if (savedCode && discountForCode(savedCode) > 0) {
        setCode(savedCode.toUpperCase())
      }
    } catch {
      // Ignore malformed storage.
    }
    setHydrated(true)
  }, [])

  // Persist cart changes.
  useEffect(() => {
    if (!hydrated) return
    localStorage.setItem(CART_KEY, JSON.stringify(items))
  }, [items, hydrated])

  useEffect(() => {
    if (!hydrated) return
    if (code) localStorage.setItem(CODE_KEY, code)
    else localStorage.removeItem(CODE_KEY)
  }, [code, hydrated])

  const add = useCallback((product: Product) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === product.id)
      if (existing) {
        return prev.map((i) =>
          i.id === product.id ? { ...i, qty: i.qty + 1 } : i,
        )
      }
      return [...prev, { ...product, qty: 1 }]
    })
  }, [])

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }, [])

  const setQty = useCallback((id: string, qty: number) => {
    setItems((prev) =>
      qty <= 0
        ? prev.filter((i) => i.id !== id)
        : prev.map((i) => (i.id === id ? { ...i, qty } : i)),
    )
  }, [])

  const clear = useCallback(() => setItems([]), [])

  const applyCode = useCallback((next: string) => {
    if (discountForCode(next) > 0) {
      setCode(next.trim().toUpperCase())
      return true
    }
    return false
  }, [])

  const clearCode = useCallback(() => setCode(''), [])

  const value = useMemo<CartContextValue>(() => {
    const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0)
    const discountPercent = discountForCode(code)
    const discountAmount = Math.round((subtotal * discountPercent) / 100)
    return {
      items,
      count: items.reduce((sum, i) => sum + i.qty, 0),
      subtotal,
      discountPercent,
      discountAmount,
      total: subtotal - discountAmount,
      code,
      add,
      remove,
      setQty,
      clear,
      applyCode,
      clearCode,
    }
  }, [items, code, add, remove, setQty, clear, applyCode, clearCode])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within a CartProvider')
  return ctx
}

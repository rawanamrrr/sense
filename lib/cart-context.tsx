"use client"

import type React from "react"
import { createContext, useContext, useReducer, useEffect, type ReactNode } from "react"
import { useAuth } from "@/lib/auth-context"

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  size: string
  volume: string
  image: string
  category: string
  productId: string 
  originalPrice?: number 
  isGiftPackage?: boolean
  selectedProduct?: {
    productId: string
    productName: string
    productImage: string
    productDescription: string
  }
  selectedProducts?: Array<{
    size: string
    volume: string
    selectedProducts: Array<{
      productId: string
      productName: string
      productImage: string
      productDescription: string
    }>
  }>
  packageDetails?: {
    totalSizes: number
    packagePrice: number
    sizes: Array<{
      size: string
      volume: string
      selectedProducts: Array<{
        productId: string
        productName: string
        productImage: string
        productDescription: string
      }>
    }>
  }
}

interface CartState {
  items: CartItem[]
  total: number
  count: number
  showNotification: boolean
  lastAddedItem: CartItem | null
}

type CartAction =
  | { type: "ADD_ITEM"; payload: Omit<CartItem, "quantity"> & { quantity?: number } }
  | { type: "REMOVE_ITEM"; payload: string }
  | { type: "UPDATE_QUANTITY"; payload: { id: string; quantity: number } }
  | { type: "CLEAR_CART" }
  | { type: "LOAD_CART"; payload: CartItem[] }
  | { type: "SHOW_NOTIFICATION"; payload: CartItem }
  | { type: "HIDE_NOTIFICATION" }

const CartContext = createContext<{
  state: CartState
  dispatch: React.Dispatch<CartAction>
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  hideNotification: () => void
} | null>(null)

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD_ITEM": {
      console.log("Cart reducer: ADD_ITEM called with payload:", action.payload)
      
      const existingItem = state.items.find((item) => item.id === action.payload.id)
      let newItems: CartItem[]
      const customQuantity = action.payload.quantity || 1

      if (existingItem) {
        console.log("Cart reducer: Updating existing item:", existingItem.id)
        newItems = state.items.map((item) =>
          item.id === action.payload.id ? { ...item, quantity: item.quantity + customQuantity } : item,
        )
      } else {
        console.log("Cart reducer: Adding new item:", action.payload.id)
        newItems = [...state.items, { ...action.payload, quantity: customQuantity }]
      }

      const newTotal = newItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
      const newCount = newItems.reduce((sum, item) => sum + item.quantity, 0)

      console.log("Cart reducer: New items count:", newItems.length)
      console.log("Cart reducer: New total:", newTotal)

      return {
        ...state,
        items: newItems,
        total: newTotal,
        count: newCount,
        showNotification: true,
        lastAddedItem: existingItem
          ? { ...existingItem, quantity: existingItem.quantity + customQuantity }
          : { ...action.payload, quantity: customQuantity },
      }
    }

    case "REMOVE_ITEM": {
      const newItems = state.items.filter((item) => item.id !== action.payload)
      const newTotal = newItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
      const newCount = newItems.reduce((sum, item) => sum + item.quantity, 0)

      return {
        ...state,
        items: newItems,
        total: newTotal,
        count: newCount,
      }
    }

    case "UPDATE_QUANTITY": {
      const newItems = state.items
        .map((item) => (item.id === action.payload.id ? { ...item, quantity: action.payload.quantity } : item))
        .filter((item) => item.quantity > 0)

      const newTotal = newItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
      const newCount = newItems.reduce((sum, item) => sum + item.quantity, 0)

      return {
        ...state,
        items: newItems,
        total: newTotal,
        count: newCount,
      }
    }

    case "CLEAR_CART":
      return {
        items: [],
        total: 0,
        count: 0,
        showNotification: false,
        lastAddedItem: null,
      }

    case "LOAD_CART": {
      const newTotal = action.payload.reduce((sum, item) => sum + item.price * item.quantity, 0)
      const newCount = action.payload.reduce((sum, item) => sum + item.quantity, 0)

      return {
        ...state,
        items: action.payload,
        total: newTotal,
        count: newCount,
      }
    }

    case "SHOW_NOTIFICATION":
      return {
        ...state,
        showNotification: true,
        lastAddedItem: action.payload,
      }

    case "HIDE_NOTIFICATION":
      return {
        ...state,
        showNotification: false,
        lastAddedItem: null,
      }

    default:
      return state
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { state: authState } = useAuth()
  const [state, dispatch] = useReducer(cartReducer, {
    items: [],
    total: 0,
    count: 0,
    showNotification: false,
    lastAddedItem: null,
  })

  // Get user-specific cart key
  const getCartKey = () => {
    if (authState.isAuthenticated && authState.user?.id) {
      return `sense_cart_${authState.user.id}`
    }
    return "sense_cart_guest"
  }

  // Load cart from localStorage on mount and when user changes
  useEffect(() => {
    const cartKey = getCartKey()
    const savedCart = localStorage.getItem(cartKey)
    if (savedCart) {
      try {
        const cartItems = JSON.parse(savedCart)
        dispatch({ type: "LOAD_CART", payload: cartItems })
      } catch (error) {
        console.error("Error loading cart:", error)
      }
    } else {
      // Clear cart if no saved cart for this user
      dispatch({ type: "CLEAR_CART" })
    }
  }, [authState.isAuthenticated, authState.user?.id])

  // Save cart to localStorage whenever items change
  useEffect(() => {
    const cartKey = getCartKey()
    localStorage.setItem(cartKey, JSON.stringify(state.items))
  }, [state.items, authState.isAuthenticated, authState.user?.id])

  // Auto-hide notification after 4 seconds
  useEffect(() => {
    if (state.showNotification) {
      const timer = setTimeout(() => {
        dispatch({ type: "HIDE_NOTIFICATION" })
      }, 4000)
      return () => clearTimeout(timer)
    }
  }, [state.showNotification])

  const addItem = (item: Omit<CartItem, "quantity"> & { quantity?: number }) => {
    dispatch({ type: "ADD_ITEM", payload: item })
  }

  const removeItem = (id: string) => {
    dispatch({ type: "REMOVE_ITEM", payload: id })
  }

  const updateQuantity = (id: string, quantity: number) => {
    dispatch({ type: "UPDATE_QUANTITY", payload: { id, quantity } })
  }

  const clearCart = () => {
    dispatch({ type: "CLEAR_CART" })
  }

  const hideNotification = () => {
    dispatch({ type: "HIDE_NOTIFICATION" })
  }

  return (
    <CartContext.Provider
      value={{
        state,
        dispatch,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        hideNotification,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}

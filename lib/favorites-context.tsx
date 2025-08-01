"use client"

import type React from "react"
import { createContext, useContext, useReducer, useEffect, type ReactNode } from "react"

interface FavoriteItem {
  id: string
  name: string
  price: number
  image: string
  category: string
}

interface FavoritesState {
  items: FavoriteItem[]
  count: number
}

type FavoritesAction =
  | { type: "ADD_FAVORITE"; payload: FavoriteItem }
  | { type: "REMOVE_FAVORITE"; payload: string }
  | { type: "CLEAR_FAVORITES" }
  | { type: "LOAD_FAVORITES"; payload: FavoriteItem[] }

const FavoritesContext = createContext<{
  state: FavoritesState
  dispatch: React.Dispatch<FavoritesAction>
  addToFavorites: (item: FavoriteItem) => void
  removeFromFavorites: (id: string) => void
  isFavorite: (id: string) => boolean
  clearFavorites: () => void
} | null>(null)

function favoritesReducer(state: FavoritesState, action: FavoritesAction): FavoritesState {
  switch (action.type) {
    case "ADD_FAVORITE":
      const existingItem = state.items.find((item) => item.id === action.payload.id)
      if (existingItem) {
        return state
      }
      const newItems = [...state.items, action.payload]
      return {
        items: newItems,
        count: newItems.length,
      }

    case "REMOVE_FAVORITE":
      const filteredItems = state.items.filter((item) => item.id !== action.payload)
      return {
        items: filteredItems,
        count: filteredItems.length,
      }

    case "CLEAR_FAVORITES":
      return {
        items: [],
        count: 0,
      }

    case "LOAD_FAVORITES":
      return {
        items: action.payload,
        count: action.payload.length,
      }

    default:
      return state
  }
}

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(favoritesReducer, {
    items: [],
    count: 0,
  })

  // Load favorites from localStorage on mount
  useEffect(() => {
    const savedFavorites = localStorage.getItem("sense_favorites")
    if (savedFavorites) {
      try {
        const favorites = JSON.parse(savedFavorites)
        dispatch({ type: "LOAD_FAVORITES", payload: favorites })
      } catch (error) {
        console.error("Error loading favorites:", error)
      }
    }
  }, [])

  // Save favorites to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem("sense_favorites", JSON.stringify(state.items))
  }, [state.items])

  const addToFavorites = (item: FavoriteItem) => {
    dispatch({ type: "ADD_FAVORITE", payload: item })
  }

  const removeFromFavorites = (id: string) => {
    dispatch({ type: "REMOVE_FAVORITE", payload: id })
  }

  const isFavorite = (id: string) => {
    return state.items.some((item) => item.id === id)
  }

  const clearFavorites = () => {
    dispatch({ type: "CLEAR_FAVORITES" })
  }

  return (
    <FavoritesContext.Provider
      value={{
        state,
        dispatch,
        addToFavorites,
        removeFromFavorites,
        isFavorite,
        clearFavorites,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  )
}

export function useFavorites() {
  const context = useContext(FavoritesContext)
  if (!context) {
    throw new Error("useFavorites must be used within a FavoritesProvider")
  }
  return context
}

"use client"

import type React from "react"
import { createContext, useContext, useReducer, useEffect, type ReactNode } from "react"

interface User {
  id: string
  email: string
  name: string
  role: "admin" | "user"
}

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
}

type AuthAction =
  | { type: "LOGIN_START" }
  | { type: "LOGIN_SUCCESS"; payload: { user: User; token: string } }
  | { type: "LOGIN_FAILURE" }
  | { type: "LOGOUT" }
  | { type: "SET_LOADING"; payload: boolean }

const AuthContext = createContext<{
  state: AuthState
  dispatch: React.Dispatch<AuthAction>
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  register: (email: string, password: string, name: string) => Promise<boolean>
  forgotPassword: (email: string) => Promise<boolean>
} | null>(null)

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "LOGIN_START":
      return { ...state, isLoading: true }
    case "LOGIN_SUCCESS":
      return {
        user: action.payload.user,
        token: action.payload.token,
        isLoading: false,
        isAuthenticated: true,
      }
    case "LOGIN_FAILURE":
      return {
        user: null,
        token: null,
        isLoading: false,
        isAuthenticated: false,
      }
    case "LOGOUT":
      return {
        user: null,
        token: null,
        isLoading: false,
        isAuthenticated: false,
      }
    case "SET_LOADING":
      return { ...state, isLoading: action.payload }
    default:
      return state
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    token: null,
    isLoading: true,
    isAuthenticated: false,
  })

  useEffect(() => {
    console.log("🔐 [Auth] Checking stored authentication...")

    // Check for stored auth data on mount
    const storedUser = localStorage.getItem("sense_user")
    const storedToken = localStorage.getItem("sense_token")

    console.log("🔍 [Auth] Stored user:", !!storedUser)
    console.log("🔍 [Auth] Stored token:", !!storedToken)

    if (storedUser && storedToken) {
      try {
        const user = JSON.parse(storedUser)
        console.log("✅ [Auth] Restored user session:", user.email, user.role)
        dispatch({ type: "LOGIN_SUCCESS", payload: { user, token: storedToken } })
      } catch (error) {
        console.error("❌ [Auth] Error parsing stored user data:", error)
        localStorage.removeItem("sense_user")
        localStorage.removeItem("sense_token")
      }
    } else {
      console.log("ℹ️ [Auth] No stored authentication found")
    }

    dispatch({ type: "SET_LOADING", payload: false })
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    console.log("🔐 [Auth] Attempting login for:", email)
    dispatch({ type: "LOGIN_START" })

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()
      console.log("📡 [Auth] Login response status:", response.status)

      if (response.ok) {
        console.log("✅ [Auth] Login successful:", data.user.email, data.user.role)

        // Store in localStorage
        localStorage.setItem("sense_user", JSON.stringify(data.user))
        localStorage.setItem("sense_token", data.token)

        console.log("💾 [Auth] Stored user data and token")

        dispatch({ type: "LOGIN_SUCCESS", payload: { user: data.user, token: data.token } })
        return true
      } else {
        console.error("❌ [Auth] Login failed:", data.error)
        dispatch({ type: "LOGIN_FAILURE" })
        return false
      }
    } catch (error) {
      console.error("❌ [Auth] Login error:", error)
      dispatch({ type: "LOGIN_FAILURE" })
      return false
    }
  }

  const register = async (email: string, password: string, name: string): Promise<boolean> => {
    console.log("🔐 [Auth] Attempting registration for:", email)
    dispatch({ type: "LOGIN_START" })

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, name }),
      })

      const data = await response.json()
      console.log("📡 [Auth] Registration response status:", response.status)

      if (response.ok) {
        console.log("✅ [Auth] Registration successful:", data.user.email)

        // Store in localStorage
        localStorage.setItem("sense_user", JSON.stringify(data.user))
        localStorage.setItem("sense_token", data.token)

        console.log("💾 [Auth] Stored user data and token")

        // Send welcome email with offers
        try {
          await fetch("/api/send-welcome-email", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, name }),
          })
        } catch (error) {
          console.error("❌ [Auth] Failed to send welcome email:", error)
        }

        dispatch({ type: "LOGIN_SUCCESS", payload: { user: data.user, token: data.token } })
        return true
      } else {
        console.error("❌ [Auth] Registration failed:", data.error)
        dispatch({ type: "LOGIN_FAILURE" })
        return false
      }
    } catch (error) {
      console.error("❌ [Auth] Registration error:", error)
      dispatch({ type: "LOGIN_FAILURE" })
      return false
    }
  }

  const forgotPassword = async (email: string): Promise<boolean> => {
    console.log("🔐 [Auth] Attempting password reset for:", email)

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()
      console.log("📡 [Auth] Password reset response status:", response.status)

      return response.ok
    } catch (error) {
      console.error("❌ [Auth] Password reset error:", error)
      return false
    }
  }

  const logout = () => {
    console.log("🚪 [Auth] Logging out user")
    localStorage.removeItem("sense_user")
    localStorage.removeItem("sense_token")
    dispatch({ type: "LOGOUT" })
  }

  return (
    <AuthContext.Provider value={{ state, dispatch, login, logout, register, forgotPassword }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

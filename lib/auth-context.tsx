"use client"

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

interface AuthContextType {
  state: AuthState
  dispatch: React.Dispatch<AuthAction>
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  register: (email: string, password: string, name: string) => Promise<boolean>
  forgotPassword: (email: string) => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | null>(null)

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

  const verifyToken = async (token: string): Promise<boolean> => {
    try {
      const response = await fetch("/api/auth/verify", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      return response.ok
    } catch (error) {
      console.error("Token verification failed:", error)
      return false
    }
  }

  const refreshToken = async (oldToken: string): Promise<{ user: User; token: string } | null> => {
    try {
      const response = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${oldToken}`,
        },
      })

      if (response.ok) {
        return await response.json()
      }
      return null
    } catch (error) {
      console.error("Token refresh failed:", error)
      return null
    }
  }

  useEffect(() => {
    const initializeAuth = async () => {
      const authData = localStorage.getItem("sense_auth")
      
      if (!authData) {
        dispatch({ type: "SET_LOADING", payload: false })
        return
      }

      try {
        const { user, token, expiresAt } = JSON.parse(authData)
        
        // Check if token needs refresh
        if (Date.now() > expiresAt) {
          const refreshed = await refreshToken(token)
          if (refreshed) {
            const newAuthData = {
              user: refreshed.user,
              token: refreshed.token,
              expiresAt: Date.now() + 3600 * 1000, // 1 hour expiration
            }
            localStorage.setItem("sense_auth", JSON.stringify(newAuthData))
            dispatch({ type: "LOGIN_SUCCESS", payload: refreshed })
            return
          }
          throw new Error("Token refresh failed")
        }

        // Verify existing token
        const isValid = await verifyToken(token)
        if (isValid) {
          dispatch({ type: "LOGIN_SUCCESS", payload: { user, token } })
        } else {
          throw new Error("Invalid token")
        }
      } catch (error) {
        console.error("Auth initialization error:", error)
        localStorage.removeItem("sense_auth")
        dispatch({ type: "LOGOUT" })
      } finally {
        dispatch({ type: "SET_LOADING", payload: false })
      }
    }

    initializeAuth()
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    dispatch({ type: "LOGIN_START" })

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        throw new Error(await response.text())
      }

      const data = await response.json()
      const authData = {
        user: data.user,
        token: data.token,
        expiresAt: Date.now() + 3600 * 1000, // 1 hour expiration
      }

      localStorage.setItem("sense_auth", JSON.stringify(authData))
      dispatch({ type: "LOGIN_SUCCESS", payload: { user: data.user, token: data.token } })
      return true
    } catch (error) {
      console.error("Login error:", error)
      dispatch({ type: "LOGIN_FAILURE" })
      return false
    }
  }

  const register = async (email: string, password: string, name: string): Promise<boolean> => {
    dispatch({ type: "LOGIN_START" })

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, name }),
      })

      if (!response.ok) {
        throw new Error(await response.text())
      }

      const data = await response.json()
      const authData = {
        user: data.user,
        token: data.token,
        expiresAt: Date.now() + 3600 * 1000, // 1 hour expiration
      }

      localStorage.setItem("sense_auth", JSON.stringify(authData))
      
      // Send welcome email (fire and forget)
      fetch("/api/send-welcome-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, name }),
      }).catch(error => console.error("Welcome email error:", error))

      dispatch({ type: "LOGIN_SUCCESS", payload: { user: data.user, token: data.token } })
      return true
    } catch (error) {
      console.error("Registration error:", error)
      dispatch({ type: "LOGIN_FAILURE" })
      return false
    }
  }

  const forgotPassword = async (email: string): Promise<boolean> => {
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })
      return response.ok
    } catch (error) {
      console.error("Password reset error:", error)
      return false
    }
  }

  const logout = () => {
    localStorage.removeItem("sense_auth")
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
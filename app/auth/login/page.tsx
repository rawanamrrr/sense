"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, ArrowLeft } from "lucide-react"
import { Navigation } from "@/components/navigation"
import { useAuth } from "@/lib/auth-context"

export default function LoginPage() {
  const { dispatch } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (error) setError("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  setError("")
  setLoading(true)

  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    })

    const data = await response.json()

    if (response.ok) {
      // Store auth data with the correct key that matches auth context
      const authData = {
        user: data.user,
        token: data.token,
        expiresAt: Date.now() + 3600 * 1000, // 1 hour expiration
      }
      localStorage.setItem("sense_auth", JSON.stringify(authData))

      // Update auth context
      dispatch({
        type: "LOGIN_SUCCESS",
        payload: {
          user: data.user,
          token: data.token,
        },
      })

      // Redirect based on role
      if (data.user.role === "admin") {
        router.push("/admin/dashboard")
      } else {
        router.push("/")
      }
    } else {
      // Show error message without redirecting
      setError(data.error || "Login failed. Please check your credentials and try again.")
    }
  } catch (error) {
    console.error("Login error:", error)
    setError("An error occurred during login. Please try again.")
  } finally {
    setLoading(false)
  }
}

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <section className="pt-32 pb-16">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-md mx-auto"
          >
            <Link href="/" className="inline-flex items-center text-gray-600 hover:text-black mb-6 transition-colors">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>

            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-light tracking-wider">Welcome Back</CardTitle>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "100px" }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  className="h-1 bg-gradient-to-r from-purple-400 to-pink-400 mx-auto my-4 rounded-full"
                />
                <p className="text-gray-600">Sign in to your account</p>
              </CardHeader>
              <CardContent>
                {error && (
                  <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
                    <Alert className="border-red-200 bg-red-50">
                      <AlertDescription className="text-red-600">{error}</AlertDescription>
                    </Alert>
                  </motion.div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      required
                      className="mt-1"
                      placeholder="Enter your email"
                    />
                  </div>

                  <div>
                    <Label htmlFor="password">Password</Label>
                    <div className="relative mt-1">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) => handleInputChange("password", e.target.value)}
                        required
                        placeholder="Enter your password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <Link
                      href="/auth/forgot-password"
                      className="text-sm text-gray-600 hover:text-black transition-colors"
                    >
                      Forgot password?
                    </Link>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-black text-white hover:bg-gray-800"
                    size="lg"
                    disabled={loading}
                  >
                    {loading ? "Signing in..." : "Sign In"}
                  </Button>
                </form>

                <div className="mt-6 text-center">
                  <p className="text-gray-600">
                    Don't have an account?{" "}
                    <Link href="/auth/register" className="text-black hover:underline font-medium">
                      Sign up
                    </Link>
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

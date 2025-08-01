"use client"

import type React from "react"

import { useState, useEffect, Suspense } from "react"
import { motion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Eye, EyeOff, CheckCircle } from "lucide-react"
import { Navigation } from "@/components/navigation"

function ResetPasswordForm() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  useEffect(() => {
    if (!token) {
      router.push("/auth/login")
    }
  }, [token, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (password.length < 6) {
      setError("Password must be at least 6 characters long")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, password }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        setTimeout(() => {
          router.push("/auth/login")
        }, 3000)
      } else {
        setError(data.error || "Failed to reset password")
      }
    } catch (error) {
      setError("An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <section className="pt-24 pb-16">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-md mx-auto"
          >
            <Link
              href="/auth/login"
              className="inline-flex items-center text-gray-600 hover:text-black mb-8 transition-colors"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Login
            </Link>

            <Card className="shadow-lg border-0">
              <CardHeader className="text-center pb-6">
                <Image
                  src="/logo-black.png"
                  alt="Sense Fragrances"
                  width={120}
                  height={80}
                  className="h-16 w-auto mx-auto mb-4"
                />
                <CardTitle className="text-2xl font-light tracking-wider">
                  {success ? "Password Reset!" : "Create New Password"}
                </CardTitle>
                <p className="text-gray-600">
                  {success ? "Your password has been successfully reset" : "Enter your new password below"}
                </p>
              </CardHeader>

              <CardContent>
                {success ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">
                      Your password has been successfully reset. You will be redirected to the login page shortly.
                    </p>
                    <Link href="/auth/login">
                      <Button className="bg-black text-white hover:bg-gray-800">Go to Login</Button>
                    </Link>
                  </div>
                ) : (
                  <>
                    {error && (
                      <Alert className="mb-6 border-red-200 bg-red-50">
                        <AlertDescription className="text-red-600">{error}</AlertDescription>
                      </Alert>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <Label htmlFor="password">New Password</Label>
                        <div className="relative">
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter new password"
                            required
                            autoComplete="new-password"
                            className="border-gray-300 focus:border-black pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Must be at least 6 characters</p>
                      </div>

                      <div>
                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                        <div className="relative">
                          <Input
                            id="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm new password"
                            required
                            autoComplete="new-password"
                            className="border-gray-300 focus:border-black pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      <Button
                        type="submit"
                        className="w-full bg-black text-white hover:bg-gray-800"
                        size="lg"
                        disabled={loading}
                      >
                        {loading ? "Resetting..." : "Reset Password"}
                      </Button>
                    </form>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  )
}

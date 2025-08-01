"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, User, Save } from "lucide-react"
import { Navigation } from "@/components/navigation"
import { useAuth } from "@/lib/auth-context"

export default function EditProfilePage() {
  const { state: authState, updateUser } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  useEffect(() => {
    if (!authState.isAuthenticated) {
      router.push("/auth/login")
      return
    }

    if (authState.user) {
      setFormData((prev) => ({
        ...prev,
        name: authState.user.name,
        email: authState.user.email,
      }))
    }
  }, [authState, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess(false)

    // Validate passwords if changing
    if (formData.newPassword) {
      if (!formData.currentPassword) {
        setError("Current password is required to change password")
        setLoading(false)
        return
      }

      if (formData.newPassword !== formData.confirmPassword) {
        setError("New passwords do not match")
        setLoading(false)
        return
      }

      if (formData.newPassword.length < 6) {
        setError("New password must be at least 6 characters long")
        setLoading(false)
        return
      }
    }

    try {
      const updateData: any = {
        name: formData.name,
        email: formData.email,
      }

      if (formData.newPassword) {
        updateData.currentPassword = formData.currentPassword
        updateData.newPassword = formData.newPassword
      }

      const response = await fetch("/api/auth/update-profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authState.token}`,
        },
        body: JSON.stringify(updateData),
      })

      if (response.ok) {
        const result = await response.json()

        // Update auth context with new user data
        updateUser({
          ...authState.user!,
          name: formData.name,
          email: formData.email,
        })

        setSuccess(true)
        setFormData((prev) => ({
          ...prev,
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        }))

        setTimeout(() => {
          setSuccess(false)
        }, 5000)
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to update profile")
      }
    } catch (error) {
      console.error("Update profile error:", error)
      setError("An error occurred while updating your profile")
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  if (!authState.isAuthenticated) {
    return null
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
            className="mb-8"
          >
            <Link
              href="/account"
              className="inline-flex items-center text-gray-600 hover:text-black transition-colors mb-6"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to My Account
            </Link>
            <h1 className="text-3xl font-light tracking-wider mb-2">Edit Profile</h1>
            <p className="text-gray-600">Update your account information</p>
          </motion.div>

          <div className="max-w-2xl mx-auto">
            {success && (
              <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
                <Alert className="border-green-200 bg-green-50">
                  <AlertDescription className="text-green-600">Profile updated successfully!</AlertDescription>
                </Alert>
              </motion.div>
            )}

            {error && (
              <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
                <Alert className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-600">{error}</AlertDescription>
                </Alert>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="mr-2 h-5 w-5" />
                    Profile Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="name">Full Name *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => handleChange("name", e.target.value)}
                          placeholder="Your full name"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="email">Email Address *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleChange("email", e.target.value)}
                          placeholder="your@email.com"
                          required
                        />
                      </div>
                    </div>

                    <div className="border-t pt-6">
                      <h3 className="text-lg font-medium mb-4">Change Password (Optional)</h3>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="currentPassword">Current Password</Label>
                          <Input
                            id="currentPassword"
                            type="password"
                            value={formData.currentPassword}
                            onChange={(e) => handleChange("currentPassword", e.target.value)}
                            placeholder="Enter current password"
                            autoComplete="current-password"
                          />
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="newPassword">New Password</Label>
                            <Input
                              id="newPassword"
                              type="password"
                              value={formData.newPassword}
                              onChange={(e) => handleChange("newPassword", e.target.value)}
                              placeholder="Enter new password"
                              autoComplete="new-password"
                            />
                          </div>

                          <div>
                            <Label htmlFor="confirmPassword">Confirm New Password</Label>
                            <Input
                              id="confirmPassword"
                              type="password"
                              value={formData.confirmPassword}
                              onChange={(e) => handleChange("confirmPassword", e.target.value)}
                              placeholder="Confirm new password"
                              autoComplete="new-password"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end space-x-4 pt-6">
                      <Link href="/account">
                        <Button type="button" variant="outline">
                          Cancel
                        </Button>
                      </Link>
                      <Button type="submit" className="bg-black text-white hover:bg-gray-800" disabled={loading}>
                        {loading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Updating...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  )
}

"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Plus, Trash2, Upload, X } from "lucide-react"
import { Navigation } from "@/components/navigation"
import { useAuth } from "@/lib/auth-context"

export default function AddProductPage() {
  const { state: authState } = useAuth()
  const router = useRouter()
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [uploadedImages, setUploadedImages] = useState<string[]>([])

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    longDescription: "",
    price: "",
    category: "",
    topNotes: [""],
    middleNotes: [""],
    baseNotes: [""],
    sizes: [{ size: "", volume: "", price: "" }],
  })

  useEffect(() => {
    console.log("🔍 [AddProduct] Checking authentication...")
    console.log("   Authenticated:", authState.isAuthenticated)
    console.log("   User role:", authState.user?.role)
    console.log("   Token present:", !!authState.token)

    if (!authState.isLoading && (!authState.isAuthenticated || authState.user?.role !== "admin")) {
      console.log("❌ [AddProduct] Access denied, redirecting to login")
      router.push("/auth/login")
    }
  }, [authState, router])

  if (authState.isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="pt-32 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!authState.isAuthenticated || authState.user?.role !== "admin") {
    return null
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      console.log("📸 [AddProduct] Uploading", files.length, "images")
      Array.from(files).forEach((file) => {
        const reader = new FileReader()
        reader.onload = (e) => {
          const result = e.target?.result as string
          setUploadedImages((prev) => [...prev, result])
          console.log("✅ [AddProduct] Image uploaded successfully")
        }
        reader.readAsDataURL(file)
      })
    }
  }

  const removeImage = (index: number) => {
    console.log("🗑️ [AddProduct] Removing image at index", index)
    setUploadedImages((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    console.log("📝 [AddProduct] Submitting product...")
    console.log("   Product name:", formData.name)
    console.log("   Category:", formData.category)
    console.log("   Price:", formData.price)
    console.log("   Images:", uploadedImages.length)
    console.log("   Token available:", !!authState.token)

    try {
      const product = {
        name: formData.name,
        description: formData.description,
        longDescription: formData.longDescription,
        // Keep exact decimal precision - don't use parseFloat
        price: formData.price,
        category: formData.category,
        sizes: formData.sizes.map((size) => ({
          size: size.size,
          volume: size.volume,
          // Keep exact decimal precision - don't use parseFloat
          price: size.price,
        })),
        images: uploadedImages.length > 0 ? uploadedImages : ["/placeholder.svg?height=600&width=400"],
        notes: {
          top: formData.topNotes.filter((note) => note.trim() !== ""),
          middle: formData.middleNotes.filter((note) => note.trim() !== ""),
          base: formData.baseNotes.filter((note) => note.trim() !== ""),
        },
      }

      console.log("📦 [AddProduct] Product data prepared:", {
        name: product.name,
        category: product.category,
        price: product.price,
        sizesCount: product.sizes.length,
        imagesCount: product.images.length,
      })

      const response = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authState.token}`,
        },
        body: JSON.stringify(product),
      })

      console.log("📡 [AddProduct] API response status:", response.status)

      if (response.ok) {
        const result = await response.json()
        console.log("✅ [AddProduct] Product created successfully:", result.product?.id)
        setSuccess(true)
        setTimeout(() => {
          router.push("/admin/dashboard")
        }, 2000)
      } else {
        const errorData = await response.json()
        console.error("❌ [AddProduct] API error:", errorData)
        setError(errorData.error || "Failed to add product")
      }
    } catch (error) {
      console.error("❌ [AddProduct] Network error:", error)
      setError("An error occurred while adding the product")
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleNotesChange = (type: "topNotes" | "middleNotes" | "baseNotes", index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [type]: prev[type].map((note, i) => (i === index ? value : note)),
    }))
  }

  const addNote = (type: "topNotes" | "middleNotes" | "baseNotes") => {
    setFormData((prev) => ({
      ...prev,
      [type]: [...prev[type], ""],
    }))
  }

  const removeNote = (type: "topNotes" | "middleNotes" | "baseNotes", index: number) => {
    setFormData((prev) => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index),
    }))
  }

  const handleSizeChange = (index: number, field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      sizes: prev.sizes.map((size, i) => (i === index ? { ...size, [field]: value } : size)),
    }))
  }

  const addSize = () => {
    setFormData((prev) => ({
      ...prev,
      sizes: [...prev.sizes, { size: "", volume: "", price: "" }],
    }))
  }

  const removeSize = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      sizes: prev.sizes.filter((_, i) => i !== index),
    }))
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
              href="/admin/dashboard"
              className="inline-flex items-center text-gray-600 hover:text-black transition-colors mb-6"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
            <h1 className="text-3xl font-light tracking-wider mb-2">Add New Product</h1>
            <p className="text-gray-600">Create a new fragrance for your catalog</p>
          </motion.div>

          <div className="max-w-4xl mx-auto">
            {success && (
              <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
                <Alert className="border-green-200 bg-green-50">
                  <AlertDescription className="text-green-600">
                    Product added successfully! Redirecting to dashboard...
                  </AlertDescription>
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
                  <CardTitle>Product Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Product Images */}
                    <div>
                      <Label>Product Images</Label>
                      <div className="mt-2">
                        <div className="flex items-center justify-center w-full">
                          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                              <Upload className="w-8 h-8 mb-4 text-gray-500" />
                              <p className="mb-2 text-sm text-gray-500">
                                <span className="font-semibold">Click to upload</span> product images
                              </p>
                              <p className="text-xs text-gray-500">PNG, JPG or JPEG (MAX. 5MB each)</p>
                            </div>
                            <input
                              type="file"
                              className="hidden"
                              multiple
                              accept="image/*"
                              onChange={handleImageUpload}
                            />
                          </label>
                        </div>

                        {uploadedImages.length > 0 && (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                            {uploadedImages.map((image, index) => (
                              <div key={index} className="relative">
                                <img
                                  src={image || "/placeholder.svg"}
                                  alt={`Product ${index + 1}`}
                                  className="w-full h-24 object-cover rounded-lg"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeImage(index)}
                                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="name">Product Name *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => handleChange("name", e.target.value)}
                          placeholder="e.g., Midnight Essence"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="category">Category *</Label>
                        <Select value={formData.category} onValueChange={(value) => handleChange("category", value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="men">Men's Collection</SelectItem>
                            <SelectItem value="women">Women's Collection</SelectItem>
                            <SelectItem value="packages">Gift Packages</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="description">Short Description *</Label>
                      <Input
                        id="description"
                        value={formData.description}
                        onChange={(e) => handleChange("description", e.target.value)}
                        placeholder="Brief description for product cards"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="longDescription">Long Description *</Label>
                      <Textarea
                        id="longDescription"
                        value={formData.longDescription}
                        onChange={(e) => handleChange("longDescription", e.target.value)}
                        placeholder="Detailed product description"
                        rows={4}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="price">Base Price (EGP) *</Label>
                      <Input
                        id="price"
                        type="text"
                        value={formData.price}
                        onChange={(e) => handleChange("price", e.target.value)}
                        placeholder="120.50"
                        pattern="[0-9]+(\.[0-9]{1,2})?"
                        title="Please enter a valid price (e.g., 120.50)"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">Enter exact price with up to 2 decimal places</p>
                    </div>

                    {/* Sizes Section */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <Label>Available Sizes *</Label>
                        <Button type="button" onClick={addSize} size="sm" variant="outline">
                          <Plus className="h-4 w-4 mr-1" />
                          Add Size
                        </Button>
                      </div>
                      <div className="space-y-3">
                        {formData.sizes.map((size, index) => (
                          <div key={index} className="grid grid-cols-4 gap-3 items-end">
                            <div>
                              <Label>Size Name</Label>
                              <Input
                                value={size.size}
                                onChange={(e) => handleSizeChange(index, "size", e.target.value)}
                                placeholder="Travel"
                                required
                              />
                            </div>
                            <div>
                              <Label>Volume</Label>
                              <Input
                                value={size.volume}
                                onChange={(e) => handleSizeChange(index, "volume", e.target.value)}
                                placeholder="15ml"
                                required
                              />
                            </div>
                            <div>
                              <Label>Price (EGP)</Label>
                              <Input
                                type="text"
                                value={size.price}
                                onChange={(e) => handleSizeChange(index, "price", e.target.value)}
                                placeholder="45.75"
                                pattern="[0-9]+(\.[0-9]{1,2})?"
                                title="Please enter a valid price (e.g., 45.75)"
                                required
                              />
                            </div>
                            <div>
                              {formData.sizes.length > 1 && (
                                <Button
                                  type="button"
                                  onClick={() => removeSize(index)}
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Fragrance Notes */}
                    <div className="grid md:grid-cols-3 gap-6">
                      {/* Top Notes */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <Label>Top Notes</Label>
                          <Button type="button" onClick={() => addNote("topNotes")} size="sm" variant="outline">
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {formData.topNotes.map((note, index) => (
                            <div key={index} className="flex items-center space-x-2">
                              <Input
                                value={note}
                                onChange={(e) => handleNotesChange("topNotes", index, e.target.value)}
                                placeholder="Bergamot"
                                className="flex-1"
                              />
                              {formData.topNotes.length > 1 && (
                                <Button
                                  type="button"
                                  onClick={() => removeNote("topNotes", index)}
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Middle Notes */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <Label>Middle Notes</Label>
                          <Button type="button" onClick={() => addNote("middleNotes")} size="sm" variant="outline">
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {formData.middleNotes.map((note, index) => (
                            <div key={index} className="flex items-center space-x-2">
                              <Input
                                value={note}
                                onChange={(e) => handleNotesChange("middleNotes", index, e.target.value)}
                                placeholder="Cedar"
                                className="flex-1"
                              />
                              {formData.middleNotes.length > 1 && (
                                <Button
                                  type="button"
                                  onClick={() => removeNote("middleNotes", index)}
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Base Notes */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <Label>Base Notes</Label>
                          <Button type="button" onClick={() => addNote("baseNotes")} size="sm" variant="outline">
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {formData.baseNotes.map((note, index) => (
                            <div key={index} className="flex items-center space-x-2">
                              <Input
                                value={note}
                                onChange={(e) => handleNotesChange("baseNotes", index, e.target.value)}
                                placeholder="Amber"
                                className="flex-1"
                              />
                              {formData.baseNotes.length > 1 && (
                                <Button
                                  type="button"
                                  onClick={() => removeNote("baseNotes", index)}
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end space-x-4 pt-6">
                      <Link href="/admin/dashboard">
                        <Button type="button" variant="outline">
                          Cancel
                        </Button>
                      </Link>
                      <Button type="submit" className="bg-black text-white hover:bg-gray-800" disabled={loading}>
                        {loading ? "Adding Product..." : "Add Product"}
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

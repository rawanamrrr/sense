"use client"

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
import { ArrowLeft, Plus, Trash2, Upload, X, Save, Package } from "lucide-react"
import { Navigation } from "@/components/navigation"
import { useAuth } from "@/lib/auth-context"

interface ProductSize {
  size: string
  volume: string
  originalPrice?: string
  discountedPrice?: string
}

interface GiftPackageSize {
  size: string
  volume: string
  productOptions: {
    productId: string
    productName: string
    productImage: string
    productDescription: string
  }[]
}

interface ProductOption {
  productId: string
  productName: string
  productImage: string
  productDescription: string
}

export default function AddProductPage() {
  const { state: authState } = useAuth()
  const router = useRouter()
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [availableProducts, setAvailableProducts] = useState<any[]>([])

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    longDescription: "",
    category: "men",
    topNotes: [""],
    middleNotes: [""],
    baseNotes: [""],
    sizes: [{ 
      size: "", 
      volume: "",
      originalPrice: "",
      discountedPrice: ""
    }],
    giftPackageSizes: [{
      size: "",
      volume: "",
      productOptions: [{
        productId: "",
        productName: "",
        productImage: "",
        productDescription: ""
      }]
    }],
    packagePrice: "",
    packageOriginalPrice: "",
    isActive: true,
    isNew: false,
    isBestseller: false,
    isGiftPackage: false
  })

  useEffect(() => {
    if (!authState.isLoading && (!authState.isAuthenticated || authState.user?.role !== "admin")) {
      router.push("/auth/login")
    }
  }, [authState, router])

  useEffect(() => {
    // Fetch available products for gift package options
    const fetchProducts = async () => {
      try {
        const response = await fetch("/api/products")
        if (response.ok) {
          const products = await response.json()
          setAvailableProducts(products.filter((p: any) => p.category !== "packages"))
        }
      } catch (error) {
        console.error("Error fetching products:", error)
      }
    }

    if (formData.category === "packages") {
      fetchProducts()
    }
  }, [formData.category])
  // Compress image to reduce payload size in production deployments
  const compressImage = (file: File, maxWidth = 1200, quality = 0.75): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const img = new Image()
        img.onload = () => {
          const scale = Math.min(1, maxWidth / img.width)
          const canvas = document.createElement('canvas')
          canvas.width = Math.round(img.width * scale)
          canvas.height = Math.round(img.height * scale)
          const ctx = canvas.getContext('2d')
          if (!ctx) {
            reject(new Error('Canvas not supported'))
            return
          }
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
          const mimeType = file.type && file.type.startsWith('image/') ? file.type : 'image/jpeg'
          const dataUrl = canvas.toDataURL(mimeType, quality)
          resolve(dataUrl)
        }
        img.onerror = () => reject(new Error('Failed to load image for compression'))
        img.src = reader.result as string
      }
      reader.onerror = () => reject(new Error('Failed to read file for compression'))
      reader.readAsDataURL(file)
    })
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      const processed: string[] = []
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) {
          setError('Please select only image files')
          continue
        }
        // Allow larger original files; we will compress below
        try {
          const dataUrl = await compressImage(file, 1200, 0.75)
          if (dataUrl && dataUrl.startsWith('data:image/')) {
            processed.push(dataUrl)
          }
        } catch (err) {
          console.error(err)
          setError('Error processing image file')
        }
      }
      if (processed.length > 0) {
        setUploadedImages(prev => [...prev, ...processed])
      }
    }
  }

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      // Validate images before submission
      const validImages = uploadedImages.filter(img => 
        img && typeof img === 'string' && img.startsWith('data:image/')
      )
      
      let product: any = {
        name: formData.name,
        description: formData.description,
        longDescription: formData.longDescription,
        category: formData.category,
        images: validImages.length > 0 ? validImages : ["/placeholder.svg?height=600&width=400"],
        notes: {
          top: formData.topNotes.filter(note => note.trim() !== ""),
          middle: formData.middleNotes.filter(note => note.trim() !== ""),
          base: formData.baseNotes.filter(note => note.trim() !== ""),
        },
        isActive: formData.isActive,
        isNew: formData.isNew,
        isBestseller: formData.isBestseller
      }

      if (formData.category === "packages") {
        // Gift package
        product.isGiftPackage = true
        product.packagePrice = parseFloat(formData.packagePrice)
        product.packageOriginalPrice = formData.packageOriginalPrice ? parseFloat(formData.packageOriginalPrice) : undefined
        product.giftPackageSizes = formData.giftPackageSizes.map((size) => ({
          size: size.size,
          volume: size.volume,
          productOptions: size.productOptions.filter(option => option.productId.trim() !== "")
        }))
      } else {
        // Regular product
        product.sizes = formData.sizes.map((size) => ({
          size: size.size,
          volume: size.volume,
          originalPrice: size.originalPrice ? parseFloat(size.originalPrice) : undefined,
          discountedPrice: size.discountedPrice ? parseFloat(size.discountedPrice) : undefined
        }))
      }

      console.log('Submitting product with images:', {
        imageCount: product.images.length,
        firstImageType: product.images[0]?.substring(0, 50) + '...',
        productName: product.name
      })

      const response = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authState.token}`,
        },
        body: JSON.stringify(product),
      })

      if (response.ok) {
        setSuccess(true)
        setTimeout(() => {
          router.push("/admin/dashboard")
        }, 2000)
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to add product")
      }
    } catch (error) {
      console.error("Error adding product:", error)
      setError("An error occurred while adding the product")
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleNotesChange = (type: "topNotes" | "middleNotes" | "baseNotes", index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [type]: prev[type].map((note, i) => (i === index ? value : note)),
    }))
  }

  const addNote = (type: "topNotes" | "middleNotes" | "baseNotes") => {
    setFormData(prev => ({
      ...prev,
      [type]: [...prev[type], ""],
    }))
  }

  const removeNote = (type: "topNotes" | "middleNotes" | "baseNotes", index: number) => {
    setFormData(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index),
    }))
  }

  const handleSizeChange = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      sizes: prev.sizes.map((size, i) => (i === index ? { ...size, [field]: value } : size)),
    }))
  }

  const addSize = () => {
    setFormData(prev => ({
      ...prev,
      sizes: [...prev.sizes, { 
        size: "", 
        volume: "",
        originalPrice: "",
        discountedPrice: ""
      }],
    }))
  }

  const removeSize = (index: number) => {
    setFormData(prev => ({
      ...prev,
      sizes: prev.sizes.filter((_, i) => i !== index),
    }))
  }

  // Gift package size management
  const handleGiftPackageSizeChange = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      giftPackageSizes: prev.giftPackageSizes.map((size, i) => 
        i === index ? { ...size, [field]: value } : size
      ),
    }))
  }

  const addGiftPackageSize = () => {
    setFormData(prev => ({
      ...prev,
      giftPackageSizes: [...prev.giftPackageSizes, {
        size: "",
        volume: "",
        productOptions: [{
          productId: "",
          productName: "",
          productImage: "",
          productDescription: ""
        }]
      }],
    }))
  }

  const removeGiftPackageSize = (index: number) => {
    setFormData(prev => ({
      ...prev,
      giftPackageSizes: prev.giftPackageSizes.filter((_, i) => i !== index),
    }))
  }

  // Product options management
  const handleProductOptionChange = (sizeIndex: number, optionIndex: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      giftPackageSizes: prev.giftPackageSizes.map((size, i) => {
        if (i === sizeIndex) {
          return {
            ...size,
            productOptions: size.productOptions.map((option, j) => 
              j === optionIndex ? { ...option, [field]: value } : option
            )
          }
        }
        return size
      }),
    }))
  }

  const addProductOption = (sizeIndex: number) => {
    setFormData(prev => ({
      ...prev,
      giftPackageSizes: prev.giftPackageSizes.map((size, i) => {
        if (i === sizeIndex) {
          return {
            ...size,
            productOptions: [...size.productOptions, {
              productId: "",
              productName: "",
              productImage: "",
              productDescription: ""
            }]
          }
        }
        return size
      }),
    }))
  }

  const removeProductOption = (sizeIndex: number, optionIndex: number) => {
    setFormData(prev => ({
      ...prev,
      giftPackageSizes: prev.giftPackageSizes.map((size, i) => {
        if (i === sizeIndex) {
          return {
            ...size,
            productOptions: size.productOptions.filter((_, j) => j !== optionIndex)
          }
        }
        return size
      }),
    }))
  }

  const handleProductToggle = (sizeIndex: number, product: any) => {
    setFormData(prev => ({
      ...prev,
      giftPackageSizes: prev.giftPackageSizes.map((size, i) => {
        if (i === sizeIndex) {
          const isCurrentlySelected = size.productOptions.some(option => option.productId === product.id);
          
          if (isCurrentlySelected) {
            // Remove the product if it's already selected
            return {
              ...size,
              productOptions: size.productOptions.filter(option => option.productId !== product.id)
            };
          } else {
            // Add the product if it's not selected
            return {
              ...size,
              productOptions: [...size.productOptions, {
                productId: product.id,
                productName: product.name,
                productImage: product.images?.[0] || "",
                productDescription: product.description || ""
              }]
            };
          }
        }
        return size;
      })
    }));
  };

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
                <Alert className="border-red-200 bg-green-50">
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
                              onError={(e) => {
                                console.error('File input error:', e)
                                setError('Error selecting files')
                              }}
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
                        <Select 
                          value={formData.category} 
                          onValueChange={(value) => handleChange("category", value)}
                          required
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="men">For Him</SelectItem>
                            <SelectItem value="women">For Her</SelectItem>
                            <SelectItem value="packages">Bundles</SelectItem>
                            <SelectItem value="outlet">Outlet Collection</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="description">Short Description *</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => handleChange("description", e.target.value)}
                        placeholder="Brief product description for product cards and listings"
                        rows={4}
                        required
                      />
                      <p className="text-sm text-gray-600 mt-1">
                        This short description will be displayed on product cards and listings
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="longDescription">Long Description *</Label>
                      <Textarea
                        id="longDescription"
                        value={formData.longDescription}
                        onChange={(e) => handleChange("longDescription", e.target.value)}
                        placeholder="Comprehensive product description for the product details page"
                        rows={6}
                        required
                      />
                      <p className="text-sm text-gray-600 mt-1">
                        This detailed description will be displayed on the product details page
                      </p>
                    </div>

                    {/* Gift Package Pricing - Only show when category is packages */}
                    {formData.category === "packages" && (
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <Label htmlFor="packagePrice">Package Price (EGP) *</Label>
                          <Input
                            id="packagePrice"
                            type="number"
                            step="0.01"
                            value={formData.packagePrice}
                            onChange={(e) => handleChange("packagePrice", e.target.value)}
                            placeholder="500.00"
                            required
                          />
                          <p className="text-sm text-gray-600 mt-1">
                            This is the total price for the entire gift package
                          </p>
                        </div>
                        <div>
                          <Label htmlFor="packageOriginalPrice">Original Price (EGP)</Label>
                          <Input
                            id="packageOriginalPrice"
                            type="number"
                            step="0.01"
                            value={formData.packageOriginalPrice || ""}
                            onChange={(e) => handleChange("packageOriginalPrice", e.target.value)}
                            placeholder="600.00"
                          />
                          <p className="text-sm text-gray-600 mt-1">
                            Original price before discount (optional)
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Gift Package Sizes Section - Only show when category is packages */}
                    {formData.category === "packages" && (
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <Label className="flex items-center">
                            <Package className="h-4 w-4 mr-2" />
                            Gift Package Sizes *
                          </Label>
                          <Button type="button" onClick={addGiftPackageSize} size="sm" variant="outline">
                            <Plus className="h-4 w-4 mr-1" />
                            Add Size
                          </Button>
                        </div>
                        <div className="space-y-6">
                          {formData.giftPackageSizes.map((size, sizeIndex) => (
                            <div key={sizeIndex} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                              <div className="grid md:grid-cols-2 gap-4 mb-4">
                                <div>
                                  <Label>Size Name</Label>
                                  <Input
                                    value={size.size}
                                    onChange={(e) => handleGiftPackageSizeChange(sizeIndex, "size", e.target.value)}
                                    placeholder="Travel"
                                    required
                                  />
                                </div>
                                <div>
                                  <Label>Volume</Label>
                                  <Input
                                    value={size.volume}
                                    onChange={(e) => handleGiftPackageSizeChange(sizeIndex, "volume", e.target.value)}
                                    placeholder="15ml"
                                    required
                                  />
                                </div>
                              </div>
                              
                              {/* Product Options for this size */}
                              <div className="mb-4">
                                <div className="flex items-center justify-between mb-3">
                                  <Label className="text-sm font-medium">Product Options</Label>
                                  <div className="text-xs text-gray-500">
                                    Select multiple products for this size
                                  </div>
                                </div>
                                
                                {/* Multi-Checkbox Product Selection */}
                                <div className="border border-gray-200 rounded-lg p-4 bg-white">
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {availableProducts.map((product) => {
                                      const isSelected = size.productOptions.some(option => option.productId === product.id)
                                      return (
                                        <label
                                          key={product.id}
                                          className={`flex items-center space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                            isSelected 
                                              ? 'border-green-500 bg-green-50' 
                                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                          }`}
                                        >
                                          <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => handleProductToggle(sizeIndex, product)}
                                            className="flex-shrink-0"
                                          />
                                          <div className="relative w-10 h-10 flex-shrink-0">
                                            <img
                                              src={product.images?.[0] || "/placeholder.svg"}
                                              alt={product.name}
                                              className="w-full h-full object-cover rounded"
                                            />
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <div className="font-medium text-sm truncate">{product.name}</div>
                                            <div className="text-gray-600 text-xs line-clamp-2">
                                              {product.description}
                                            </div>
                                          </div>
                                        </label>
                                      )
                                    })}
                                  </div>
                                  
                                  {/* Selected Products Summary */}
                                  {size.productOptions.length > 0 && (
                                    <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                      <div className="text-sm font-medium text-blue-800 mb-2">
                                        Selected Products: {size.productOptions.length}
                                      </div>
                                      <div className="flex flex-wrap gap-2">
                                        {size.productOptions.map((option, optionIndex) => (
                                          <div key={optionIndex} className="flex items-center space-x-2 bg-white px-2 py-1 rounded border">
                                            <div className="relative w-5 h-5">
                                              <img
                                                src={option.productImage || "/placeholder.svg"}
                                                alt={option.productName}
                                                className="w-full h-full object-cover rounded"
                                              />
                                            </div>
                                            <span className="text-xs font-medium">{option.productName}</span>
                                            <button
                                              type="button"
                                              onClick={() => removeProductOption(sizeIndex, optionIndex)}
                                              className="text-red-500 hover:text-red-700"
                                            >
                                              <X className="h-3 w-3" />
                                            </button>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex justify-end">
                                {formData.giftPackageSizes.length > 1 && (
                                  <Button
                                    type="button"
                                    onClick={() => removeGiftPackageSize(sizeIndex)}
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
                    )}

                    {/* Regular Product Sizes Section - Only show when category is NOT packages */}
                    {formData.category !== "packages" && (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <Label>Available Sizes *</Label>
                        <Button type="button" onClick={addSize} size="sm" variant="outline">
                          <Plus className="h-4 w-4 mr-1" />
                          Add Size
                        </Button>
                      </div>
                      <div className="space-y-4">
                        {formData.sizes.map((size, index) => (
                          <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                            <div className="grid md:grid-cols-4 gap-3 items-end">
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
                                <Label>Original Price (EGP)</Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={size.originalPrice}
                                  onChange={(e) => handleSizeChange(index, "originalPrice", e.target.value)}
                                  placeholder="200.00"
                                />
                              </div>
                              <div>
                                <Label>Discounted Price (EGP)</Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={size.discountedPrice}
                                  onChange={(e) => handleSizeChange(index, "discountedPrice", e.target.value)}
                                  placeholder="150.00"
                                />
                              </div>
                            </div>
                            <div className="flex justify-end mt-3">
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
                    )}

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

                    {/* Status Flags */}
                    <div className="flex items-center space-x-6 pt-4">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="active"
                          checked={formData.isActive}
                          onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                          className="h-4 w-4 text-black rounded"
                        />
                        <Label htmlFor="active" className="ml-2">Active</Label>
                      </div>

                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="new"
                          checked={formData.isNew}
                          onChange={(e) => setFormData({...formData, isNew: e.target.checked})}
                          className="h-4 w-4 text-black rounded"
                        />
                        <Label htmlFor="new" className="ml-2">New</Label>
                      </div>

                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="bestseller"
                          checked={formData.isBestseller}
                          onChange={(e) => setFormData({...formData, isBestseller: e.target.checked})}
                          className="h-4 w-4 text-black rounded"
                        />
                        <Label htmlFor="bestseller" className="ml-2">Bestseller</Label>
                      </div>
                    </div>

                    <div className="flex items-center justify-end space-x-4 pt-6">
                      <Link href="/admin/dashboard">
                        <Button type="button" variant="outline">
                          Cancel
                        </Button>
                      </Link>
                      <Button type="submit" className="bg-black text-white hover:bg-gray-800" disabled={loading}>
                        {loading ? (
                          <>
                            <Save className="h-4 w-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Add Product
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
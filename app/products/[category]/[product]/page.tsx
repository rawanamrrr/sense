"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Star, Heart, ShoppingCart, Truck, Shield, RotateCcw, ChevronDown } from "lucide-react"
import { useParams } from "next/navigation"
import { Navigation } from "@/components/navigation"
import { useCart } from "@/lib/cart-context"
import { useFavorites } from "@/lib/favorites-context"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/lib/auth-context"

interface ProductDetail {
  _id: string
  id: string
  name: string
  description: string
  longDescription: string
  price: number
  sizes: { size: string; volume: string; price: number }[]
  images: string[]
  rating: number
  reviews: number
  notes: { top: string[]; middle: string[]; base: string[] }
  category: "men" | "women" | "packages" | "outlet"
  isNew?: boolean
  isBestseller?: boolean
  beforeSalePrice?: number
  afterSalePrice?: number
}

interface Review {
  _id: string
  productId: string
  userId: string
  userName: string
  rating: number
  comment: string
  orderId: string
  createdAt: string
}

const categoryTitles = {
  men: "Men's",
  women: "Women's",
  packages: "Gift",
  outlet: "Outlet",
}

export default function ProductDetailPage() {
  const { category, product: productId } = useParams() as { category: string; product: string }
  const [product, setProduct] = useState<ProductDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedSize, setSelectedSize] = useState(0)
  const [selectedImage, setSelectedImage] = useState(0)
  const { dispatch } = useCart()
  const { addToFavorites, removeFromFavorites, isFavorite } = useFavorites()
  const [reviews, setReviews] = useState<Review[]>([])
  const { state: authState } = useAuth()
  const [showFullDescription, setShowFullDescription] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    if (category && productId) {
      fetchProduct()
    }
  }, [category, productId])

  const getBaseProductId = (id: string) => {
    return id.replace(/-[a-zA-Z0-9]+$/, '');
  }

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/products/${category}/${productId}`)
      if (response.ok) {
        const data = await response.json()
        setProduct(data)

        // Get base product ID (without size suffix)
        const baseProductId = getBaseProductId(data.id)
        console.log("Fetching reviews for base product ID:", baseProductId)
        
        // Fetch reviews for the BASE product ID
        const reviewsResponse = await fetch(`/api/reviews?productId=${baseProductId}`)
        if (reviewsResponse.ok) {
          const reviewsData = await reviewsResponse.json()
          console.log("Fetched reviews:", reviewsData.length)
          setReviews(reviewsData)
        } else {
          console.error("Failed to fetch reviews:", await reviewsResponse.text())
        }
      }
    } catch (error) {
      console.error("Error fetching product:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navigation />
        <div className="pt-24 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
            <p className="text-gray-600">Loading products...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-white">
        <Navigation />
        <div className="pt-24 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-light mb-4">Product not found</h1>
            <Link href="/products">
              <Button className="bg-black text-white hover:bg-gray-800">Browse All Products</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const selectedPrice = product.sizes[selectedSize]?.price || product.price

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      {/* Product Detail */}
      <section className="pt-24 pb-16">
        <div className="container mx-auto px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-8"
          >
            <Link
              href={`/products/${category}`}
              className="inline-flex items-center text-gray-600 hover:text-black transition-colors font-medium"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to {categoryTitles[category as keyof typeof categoryTitles]} Collection
            </Link>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Product Images */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-6"
            >
              <div className="relative rounded-xl overflow-hidden bg-gray-50">
                <div 
                  className="w-full h-80 lg:h-[500px] relative"
                  onMouseEnter={() => setIsHovered(true)}
                  onMouseLeave={() => setIsHovered(false)}
                >
                  <Image
                    src={product.images[selectedImage] || "/placeholder.svg?height=600&width=400"}
                    alt={product.name}
                    fill
                    className={`object-contain transition-all duration-300 ${isHovered ? 'scale-105' : 'scale-100'}`}
                  />
                </div>
                <div className="absolute top-4 left-4 space-y-2">
                  {product.isBestseller && (
                    <Badge className="bg-gradient-to-r from-amber-600 to-amber-800 text-white px-3 py-1 rounded-md font-medium">
                      Bestseller
                    </Badge>
                  )}
                  {product.isNew && (
                    <Badge className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-3 py-1 rounded-md font-medium">
                      New Arrival
                    </Badge>
                  )}
                 
                </div>
              </div>

              <div className="flex space-x-3 overflow-x-auto pb-2">
                {product.images.map((image, index) => (
                  <motion.button
                    key={index}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedImage(index)}
                    className={`flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden border transition-all duration-200 ${
                      selectedImage === index 
                        ? "border-2 border-black shadow-md" 
                        : "border-gray-200 hover:border-gray-400"
                    }`}
                  >
                    <Image
                      src={image || "/placeholder.svg?height=80&width=80"}
                      alt={`${product.name} ${index + 1}`}
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                    />
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* Product Info */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-8"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h1 className="text-3xl lg:text-4xl font-light tracking-tight mb-2">{product.name}</h1>
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-5 w-5 ${
                              i < Math.floor(product.rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-gray-600">
                        ({product.rating}) • {product.reviews} reviews
                      </span>
                    </div>
                  </div>
                  <div className="text-3xl font-light">
                    {product.beforeSalePrice && product.afterSalePrice ? (
                      <>
                        <span className="line-through text-gray-400 mr-2 text-2xl">EGP{product.beforeSalePrice}</span>
                        <span className="text-red-600 font-bold">EGP{product.afterSalePrice}</span>
                      </>
                    ) : product.afterSalePrice ? (
                      <span className="text-red-600 font-bold">EGP{product.afterSalePrice}</span>
                    ) : (
                      <>EGP{selectedPrice}</>
                    )}
                  </div>
                </div>

                <div className="mb-6">
                  <p className={`text-gray-700 ${showFullDescription ? '' : 'line-clamp-3'}`}>
                    {product.longDescription}
                  </p>
                  {!showFullDescription && (
                    <button 
                      onClick={() => setShowFullDescription(true)}
                      className="text-sm font-medium text-black mt-2 flex items-center"
                    >
                      Read more <ChevronDown className="ml-1 h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              <Separator />

              {/* Fragrance Notes */}
              {product.notes && (
                <div>
                  <h3 className="text-lg font-medium mb-4 text-gray-900">Fragrance Notes</h3>
                  <div className="space-y-4">
                    <div className="border-l-2 border-amber-500 pl-3 py-1">
                      <span className="text-sm font-medium text-gray-900">Top Notes:</span>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {product.notes.top.map((note, idx) => (
                          <span key={idx} className="bg-amber-50 text-amber-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                            {note}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="border-l-2 border-rose-500 pl-3 py-1">
                      <span className="text-sm font-medium text-gray-900">Middle Notes:</span>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {product.notes.middle.map((note, idx) => (
                          <span key={idx} className="bg-rose-50 text-rose-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                            {note}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="border-l-2 border-amber-800 pl-3 py-1">
                      <span className="text-sm font-medium text-gray-900">Base Notes:</span>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {product.notes.base.map((note, idx) => (
                          <span key={idx} className="bg-amber-100 text-amber-900 text-xs font-medium px-2.5 py-0.5 rounded-full">
                            {note}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <Separator />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Fixed Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-gray-200 z-40">
        <div className="container mx-auto px-4 md:px-6 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Size Selection */}
            <div className="w-full md:w-auto">
              <h3 className="text-sm font-medium mb-2 text-gray-900">Size: {product.sizes[selectedSize]?.size}</h3>
              <div className="flex space-x-2 overflow-x-auto pb-2">
                {product.sizes.map((size, index) => (
                  <motion.button
                    key={index}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedSize(index)}
                    className={`px-4 py-2 border rounded-lg text-center transition-all flex-shrink-0 ${
                      selectedSize === index
                        ? 'border-black bg-black text-white shadow-md'
                        : 'border-gray-200 hover:border-gray-400 bg-white'
                    }`}
                  >
                    <div className="font-medium">{size.size}</div>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Price and Add to Cart */}
            <div className="flex items-center justify-between md:justify-end space-x-4 w-full md:w-auto">
              <div className="text-xl font-light">
                {product.beforeSalePrice && product.afterSalePrice ? (
                  <>
                    <span className="line-through text-gray-400 mr-2 text-lg">EGP{product.beforeSalePrice}</span>
                    <span className="text-red-600 font-bold">EGP{product.afterSalePrice}</span>
                  </>
                ) : product.afterSalePrice ? (
                  <span className="text-red-600 font-bold">EGP{product.afterSalePrice}</span>
                ) : (
                  <>EGP{selectedPrice}</>
                )}
              </div>
              <div className="flex space-x-2">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center justify-center"
                  onClick={() => {
                    if (product) {
                      if (isFavorite(product.id)) {
                        removeFromFavorites(product.id)
                      } else {
                        addToFavorites({
                          id: product.id,
                          name: product.name,
                          price: selectedPrice,
                          image: product.images[0],
                          category: product.category,
                        })
                      }
                    }
                  }}
                  aria-label={isFavorite(product.id) ? "Remove from favorites" : "Add to favorites"}
                >
                  <Heart 
                    className={`h-5 w-5 ${
                      product && isFavorite(product.id) 
                        ? "text-red-500 fill-red-500" 
                        : "text-gray-700"
                    }`} 
                  />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-gradient-to-r from-gray-900 to-black text-white py-3 px-6 rounded-lg font-medium flex items-center justify-center shadow-md hover:shadow-lg transition-all"
                  onClick={() => {
                    dispatch({
                      type: "ADD_ITEM",
                      payload: {
                        id: `${product.id}-${selectedSize}`,
                        productId: product.id,
                        name: product.name,
                        price: selectedPrice,
                        size: product.sizes[selectedSize].size,
                        volume: product.sizes[selectedSize].volume,
                        image: product.images[0],
                        category: category,
                      },
                    })
                  }}
                  aria-label="Add to cart"
                >
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  Add to Cart
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <section className="py-16 bg-gradient-to-b from-white to-gray-50 pb-24">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-3xl font-light tracking-tight mb-2"
              >
                Customer Reviews
              </motion.h2>
              <div className="w-16 h-1 bg-amber-500 mx-auto rounded-full"></div>
            </div>

            {/* Reviews List */}
            <div className="space-y-8">
              {reviews.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
                  <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Star className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-600 max-w-md mx-auto">
                    No reviews yet for this fragrance.
                  </p>
                </div>
              ) : (
                reviews.map((review, index) => (
                  <motion.div
                    key={review._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
                  >
                    <div className="flex items-start mb-4">
                      <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16" />
                      <div className="ml-4 flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-gray-900">{review.userName}</h4>
                            <p className="text-sm text-gray-600">{new Date(review.createdAt).toLocaleDateString()}</p>
                          </div>
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-5 w-5 ${
                                  i < review.rating 
                                    ? "fill-yellow-400 text-yellow-400" 
                                    : "text-gray-300"
                                }`}
                              />
                            ))}
                            </div>
                          </div>
                        </div>
                      </div>
                      <p className="text-gray-700 leading-relaxed">{review.comment}</p>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-black text-white py-12">
          <div className="container mx-auto px-6">
            <div className="grid md:grid-cols-4 gap-8">
              <div className="space-y-4">
                <Image src="/logo-white.png" alt="Sense Fragrances" width={150} height={100} className="h-16 w-auto" />
                <p className="text-gray-400 text-sm">
                  Crafting exceptional fragrances that capture the essence of elegance.
                </p>
              </div>

              <div>
                <h3 className="font-medium mb-4">Navigation</h3>
                <div className="space-y-2 text-sm">
                  <Link href="/" className="block text-gray-400 hover:text-white transition-colors">
                    Home
                  </Link>
                  <Link href="/about" className="block text-gray-400 hover:text-white transition-colors">
                    About
                  </Link>
                  <Link href="/products" className="block text-gray-400 hover:text-white transition-colors">
                    Products
                  </Link>
                  <Link href="/contact" className="block text-gray-400 hover:text-white transition-colors">
                    Contact
                  </Link>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-4">Collections</h3>
                <div className="space-y-2 text-sm">
                  <Link href="/products/men" className="block text-gray-400 hover:text-white transition-colors">
                    Men's Fragrances
                  </Link>
                  <Link href="/products/women" className="block text-gray-400 hover:text-white transition-colors">
                    Women's Fragrances
                  </Link>
                  <Link href="/products/packages" className="block text-gray-400 hover:text-white transition-colors">
                    Gift Packages
                  </Link>
                  <Link href="/products/outlet" className="block text-gray-400 hover:text-white transition-colors">
                    Outlets
                  </Link>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-4">Contact</h3>
                <div className="space-y-2 text-sm text-gray-400">
                  <p>Email: info@sensefragrances.com</p>
                  <p>Phone: +1 (555) 123-4567</p>
                  <p>Follow us for updates</p>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
              <p>&copy; 2025 Sense Fragrances. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    )
  }
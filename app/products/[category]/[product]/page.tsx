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
  category: "men" | "women" | "packages"
  isNew?: boolean
  isBestseller?: boolean
}

const categoryTitles = {
  men: "Men's",
  women: "Women's",
  packages: "Gift",
}

export default function ProductDetailPage() {
  const { category, product: productId } = useParams() as { category: string; product: string }
  const [product, setProduct] = useState<ProductDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedSize, setSelectedSize] = useState(0)
  const [selectedImage, setSelectedImage] = useState(0)
  const { dispatch } = useCart()
  const [reviews, setReviews] = useState<any[]>([])
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    comment: "",
  })
  const [submittingReview, setSubmittingReview] = useState(false)
  const { state: authState } = useAuth()
  const [showFullDescription, setShowFullDescription] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    if (category && productId) {
      fetchProduct()
    }
  }, [category, productId])

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/products/${category}/${productId}`)
      if (response.ok) {
        const data = await response.json()
        setProduct(data)

        // Fetch reviews
        const reviewsResponse = await fetch(`/api/reviews?productId=${data.id}`)
        if (reviewsResponse.ok) {
          const reviewsData = await reviewsResponse.json()
          setReviews(reviewsData)
        }
      }
    } catch (error) {
      console.error("Error fetching product:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!authState.isAuthenticated) {
      alert("Please login to submit a review")
      return
    }

    setSubmittingReview(true)
    try {
      const token = localStorage.getItem("sense_token")
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId: product?.id,
          rating: reviewForm.rating,
          comment: reviewForm.comment,
          orderId: "review-" + Date.now(), // Temporary order ID for demo
        }),
      })

      if (response.ok) {
        const result = await response.json()
        setReviews([result.review, ...reviews])
        setReviewForm({ rating: 5, comment: "" })
        // Refresh product data to get updated rating
        fetchProduct()
      } else {
        const error = await response.json()
        alert(error.error || "Failed to submit review")
      }
    } catch (error) {
      console.error("Error submitting review:", error)
      alert("Failed to submit review")
    } finally {
      setSubmittingReview(false)
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
                  <div className="text-3xl font-light">EGP{selectedPrice}</div>
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

              <Separator />

              {/* Size Selection */}
              <div>
                <h3 className="text-lg font-medium mb-4 text-gray-900">Select Size</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {product.sizes.map((size, index) => (
                    <motion.button
                      key={index}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedSize(index)}
                      className={`p-3 border rounded-lg text-center transition-all ${
                        selectedSize === index
                          ? 'border-black bg-black text-white shadow-md'
                          : 'border-gray-200 hover:border-gray-400 bg-white'
                      }`}
                    >
                      <div className="font-medium">{size.size}</div>
                      <div className="text-sm text-gray-600 mt-1">{size.volume}</div>
                      <div className={`font-medium mt-1 ${selectedSize === index ? 'text-white' : 'text-gray-900'}`}>
                        EGP{size.price}
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Actions */}
              <div className="space-y-4">
                <div className="flex space-x-4">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 bg-gradient-to-r from-gray-900 to-black text-white py-3 px-6 rounded-lg font-medium flex items-center justify-center shadow-md hover:shadow-lg transition-all"
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
                  >
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    Add to Cart
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center justify-center"
                  >
                    <Heart className="h-5 w-5 text-gray-700" />
                  </motion.button>
                </div>
              </div>

              {/* Features */}
              <div className="grid grid-cols-3 gap-4 pt-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <Truck className="h-6 w-6 mx-auto mb-2 text-gray-600" />
                  <p className="text-xs text-gray-600 font-medium">Free Shipping</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <Shield className="h-6 w-6 mx-auto mb-2 text-gray-600" />
                  <p className="text-xs text-gray-600 font-medium">Authentic</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <RotateCcw className="h-6 w-6 mx-auto mb-2 text-gray-600" />
                  <p className="text-xs text-gray-600 font-medium">30-Day Return</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section className="py-16 bg-gradient-to-b from-white to-gray-50">
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

            {/* Review Form */}
            {authState.isAuthenticated && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-6 rounded-xl shadow-sm mb-10 border border-gray-100"
              >
                <h3 className="text-xl font-medium mb-6 text-gray-900">Share Your Experience</h3>
                <form onSubmit={handleSubmitReview} className="space-y-6">
                  <div>
                    <Label htmlFor="rating" className="text-gray-700 mb-3 block">Rating</Label>
                    <div className="flex items-center space-x-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                          className="focus:outline-none"
                        >
                          <Star
                            className={`h-8 w-8 ${
                              star <= reviewForm.rating 
                                ? "fill-yellow-400 text-yellow-400" 
                                : "text-gray-300 hover:text-yellow-300"
                            }`}
                          />
                        </button>
                      ))}
                      <span className="ml-4 text-gray-700 font-medium">
                        {reviewForm.rating} star{reviewForm.rating !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="comment" className="text-gray-700 mb-3 block">Your Review</Label>
                    <Textarea
                      id="comment"
                      value={reviewForm.comment}
                      onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                      placeholder="Share your thoughts on this fragrance..."
                      rows={4}
                      required
                      className="mt-2 bg-gray-50 border-gray-200 focus:border-gray-400"
                    />
                  </div>

                  <Button 
                    type="submit" 
                    disabled={submittingReview} 
                    className="bg-gradient-to-r from-gray-800 to-black text-white hover:from-gray-700 hover:to-gray-900 w-full py-6 text-base"
                  >
                    {submittingReview ? "Submitting..." : "Submit Review"}
                  </Button>
                </form>
              </motion.div>
            )}

            {/* Reviews List */}
            <div className="space-y-8">
              {reviews.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
                  <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Star className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-600 max-w-md mx-auto">
                    No reviews yet. Be the first to share your experience with this fragrance!
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
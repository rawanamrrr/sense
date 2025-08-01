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
import { ArrowLeft, Star, Heart, ShoppingCart, Truck, Shield, RotateCcw } from "lucide-react"
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
            <p className="text-gray-600">Loading product...</p>
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
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-8"
          >
            <Link
              href={`/products/${category}`}
              className="inline-flex items-center text-gray-600 hover:text-black transition-colors"
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
              className="space-y-4"
            >
              <div className="relative">
                <Image
                  src={product.images[selectedImage] || "/placeholder.svg?height=600&width=400"}
                  alt={product.name}
                  width={500}
                  height={600}
                  className="w-full h-96 lg:h-[500px] object-cover rounded-lg shadow-lg"
                />
                <div className="absolute top-4 left-4 space-y-2">
                  {product.isBestseller && <Badge className="bg-black text-white">Bestseller</Badge>}
                  {product.isNew && <Badge variant="secondary">New</Badge>}
                </div>
              </div>

              <div className="flex space-x-2 overflow-x-auto">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                      selectedImage === index ? "border-black" : "border-gray-200"
                    }`}
                  >
                    <Image
                      src={image || "/placeholder.svg?height=80&width=80"}
                      alt={`${product.name} ${index + 1}`}
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Product Info */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-6"
            >
              <div>
                <h1 className="text-3xl lg:text-4xl font-light tracking-wider mb-4">{product.name}</h1>

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

                <p className="text-gray-600 text-lg leading-relaxed mb-6">{product.longDescription}</p>
              </div>

              <Separator />

              {/* Fragrance Notes */}
              <div>
                <h3 className="text-lg font-medium mb-4">Fragrance Notes</h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-700">Top Notes:</span>
                    <p className="text-sm text-gray-600">{product.notes.top.join(", ")}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Middle Notes:</span>
                    <p className="text-sm text-gray-600">{product.notes.middle.join(", ")}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Base Notes:</span>
                    <p className="text-sm text-gray-600">{product.notes.base.join(", ")}</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Size Selection */}
              <div>
                <h3 className="text-lg font-medium mb-4">Size</h3>
                <RadioGroup
                  value={selectedSize.toString()}
                  onValueChange={(value) => setSelectedSize(Number.parseInt(value))}
                  className="space-y-3"
                >
                  {product.sizes.map((size, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <RadioGroupItem value={index.toString()} id={`size-${index}`} />
                      <Label
                        htmlFor={`size-${index}`}
                        className="flex-1 cursor-pointer flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                      >
                        <div>
                          <span className="font-medium">{size.size}</span>
                          <span className="text-gray-600 ml-2">({size.volume})</span>
                        </div>
                        <span className="font-medium">${size.price}</span>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <Separator />

              {/* Price and Actions */}
              <div className="space-y-4">
                <div className="text-3xl font-light">{selectedPrice}</div>

                <div className="flex space-x-4">
                  <Button
                    size="lg"
                    className="flex-1 bg-black text-white hover:bg-gray-800"
                    onClick={() => {
                      dispatch({
                        type: "ADD_ITEM",
                        payload: {
                          id: `${product.id}-${selectedSize}`,
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
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-black text-black hover:bg-black hover:text-white bg-transparent"
                  >
                    <Heart className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Features */}
              <div className="grid grid-cols-3 gap-4 pt-6">
                <div className="text-center">
                  <Truck className="h-6 w-6 mx-auto mb-2 text-gray-600" />
                  <p className="text-xs text-gray-600">Free Shipping</p>
                </div>
                <div className="text-center">
                  <Shield className="h-6 w-6 mx-auto mb-2 text-gray-600" />
                  <p className="text-xs text-gray-600">Authentic</p>
                </div>
                <div className="text-center">
                  <RotateCcw className="h-6 w-6 mx-auto mb-2 text-gray-600" />
                  <p className="text-xs text-gray-600">30-Day Return</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-light tracking-wider mb-8">Customer Reviews</h2>

            {/* Review Form */}
            {authState.isAuthenticated && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-6 rounded-lg shadow-sm mb-8"
              >
                <h3 className="text-lg font-medium mb-4">Write a Review</h3>
                <form onSubmit={handleSubmitReview} className="space-y-4">
                  <div>
                    <Label htmlFor="rating">Rating</Label>
                    <div className="flex items-center space-x-2 mt-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                          className="focus:outline-none"
                        >
                          <Star
                            className={`h-6 w-6 ${
                              star <= reviewForm.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                            }`}
                          />
                        </button>
                      ))}
                      <span className="ml-2 text-sm text-gray-600">
                        {reviewForm.rating} star{reviewForm.rating !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="comment">Your Review</Label>
                    <Textarea
                      id="comment"
                      value={reviewForm.comment}
                      onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                      placeholder="Share your experience with this fragrance..."
                      rows={4}
                      required
                      className="mt-2"
                    />
                  </div>

                  <Button type="submit" disabled={submittingReview} className="bg-black text-white hover:bg-gray-800">
                    {submittingReview ? "Submitting..." : "Submit Review"}
                  </Button>
                </form>
              </motion.div>
            )}

            {/* Reviews List */}
            <div className="space-y-6">
              {reviews.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">No reviews yet. Be the first to review this product!</p>
                </div>
              ) : (
                reviews.map((review, index) => (
                  <motion.div
                    key={review._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white p-6 rounded-lg shadow-sm"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium">{review.userName}</span>
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-gray-600">{new Date(review.createdAt).toLocaleDateString()}</p>
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
            <p>&copy; 2024 Sense Fragrances. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Star, Heart, ShoppingCart, Truck, Shield, RotateCcw, ChevronDown, X, Package, Instagram, Facebook, ChevronLeft, ChevronRight } from "lucide-react"
import { useParams } from "next/navigation"
import { Navigation } from "@/components/navigation"
import { useCart } from "@/lib/cart-context"
import { useFavorites } from "@/lib/favorites-context"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent } from "@/components/ui/card"
import { GiftPackageSelector } from "@/components/gift-package-selector"

interface ProductDetail {
  _id: string
  id: string
  name: string
  description: string
  longDescription: string
  sizes: { 
    size: string; 
    volume: string;
    originalPrice?: number;
    discountedPrice?: number;
  }[]
  images: string[]
  rating: number
  reviews: number
  notes: { top: string[]; middle: string[]; base: string[] }
  category: "men" | "women" | "packages" | "outlet"
  isNew?: boolean
  isBestseller?: boolean
  isActive?: boolean
  isGiftPackage?: boolean
  packagePrice?: number
  packageOriginalPrice?: number
  giftPackageSizes?: any[]
}

interface Review {
  _id: string
  productId: string
  originalProductId?: string
  userId: string
  userName: string
  rating: number
  comment: string
  orderId: string
  createdAt: string
}

const categoryTitles = {
  men: "For Him",
  women: "For Her",
  packages: "Bundles",
  outlet: "Outlet",
}

export default function ProductDetailPage() {
  const { category, product: productId } = useParams() as { category: string; product: string }
  const [product, setProduct] = useState<ProductDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedSize, setSelectedSize] = useState<number>(0)
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const { dispatch } = useCart()
  const { state: favoritesState, addToFavorites, removeFromFavorites } = useFavorites()
  const [reviews, setReviews] = useState<Review[]>([])
  const [relatedProducts, setRelatedProducts] = useState<ProductDetail[]>([])
  const { state: authState } = useAuth()
  const [selectedProduct, setSelectedProduct] = useState<ProductDetail | null>(null)
  const [showSizeSelector, setShowSizeSelector] = useState(false)
  const [selectedRelatedSize, setSelectedRelatedSize] = useState<any>(null)
  const [showGiftPackageSelector, setShowGiftPackageSelector] = useState(false)
  const [showRelatedGiftPackageSelector, setShowRelatedGiftPackageSelector] = useState(false)
  const touchStartXRef = useRef<number | null>(null)
  const lastScrollTimeRef = useRef<number>(0)

  const goToPrevImage = () => {
    setSelectedImage(prev => {
      if (!product || !product.images?.length) return 0
      return (prev - 1 + product.images.length) % product.images.length
    })
  }

  const goToNextImage = () => {
    setSelectedImage(prev => {
      if (!product || !product.images?.length) return 0
      return (prev + 1) % product.images.length
    })
  }

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    // Debounce to avoid skipping many images on trackpads
    const now = Date.now()
    if (now - lastScrollTimeRef.current < 200) return
    lastScrollTimeRef.current = now

    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      // Vertical scroll
      if (e.deltaY > 0) {
        goToNextImage()
      } else {
        goToPrevImage()
      }
      e.preventDefault()
    } else if (Math.abs(e.deltaX) > 0) {
      // Horizontal scroll
      if (e.deltaX > 0) {
        goToNextImage()
      } else {
        goToPrevImage()
      }
      e.preventDefault()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowRight') {
      goToNextImage()
    } else if (e.key === 'ArrowLeft') {
      goToPrevImage()
    }
  }

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    touchStartXRef.current = e.touches[0]?.clientX ?? null
  }

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    const startX = touchStartXRef.current
    if (startX == null) return
    const endX = e.changedTouches[0]?.clientX ?? startX
    const deltaX = endX - startX
    const threshold = 40
    if (Math.abs(deltaX) >= threshold) {
      if (deltaX < 0) {
        goToNextImage()
      } else {
        goToPrevImage()
      }
    }
    touchStartXRef.current = null
  }

  // Calculate the smallest price from all sizes
  const getSmallestPrice = (sizes: ProductDetail['sizes']) => {
    if (!sizes || sizes.length === 0) return 0
    
    const prices = sizes.map(size => size.discountedPrice || size.originalPrice || 0)
    return Math.min(...prices.filter(price => price > 0))
  }

  // Calculate the smallest original price from all sizes
  const getSmallestOriginalPrice = (sizes: ProductDetail['sizes']) => {
    if (!sizes || sizes.length === 0) return 0
    
    const prices = sizes.map(size => size.originalPrice || 0)
    return Math.min(...prices.filter(price => price > 0))
  }

  const isFavorite = (productId: string) => {
    return favoritesState.items.some(item => item.id === productId)
  }

  // Helper function to get the selected price
  const getSelectedPrice = () => {
    if (!product || !product.sizes || product.sizes.length === 0) return 0
    const selectedSizeObj = product.sizes[selectedSize]
    return selectedSizeObj?.discountedPrice || selectedSizeObj?.originalPrice || 0
  }

  const openSizeSelector = (product: any) => {
    setSelectedProduct(product)
    // Auto-select the size with smallest price
    const smallestPriceSize = getSizeWithSmallestPrice(product.sizes)
    setSelectedRelatedSize(smallestPriceSize)
    setShowSizeSelector(true)
    setQuantity(1)
  }

  // Function to get the size with smallest price
  const getSizeWithSmallestPrice = (sizes: ProductDetail['sizes']) => {
    if (!sizes || sizes.length === 0) return null
    
    let smallestPrice = Infinity
    let smallestSize = null
    
    sizes.forEach(size => {
      const price = size.discountedPrice || size.originalPrice || 0
      if (price < smallestPrice) {
        smallestPrice = price
        smallestSize = size
      }
    })
    
    return smallestSize
  }

  const addToCartFromRelated = (product: any, size: any) => {
    dispatch({
      type: "ADD_ITEM",
      payload: {
        id: `${product.id}-${size.size}`,
        productId: product.id,
        name: product.name,
        price: size.discountedPrice || size.originalPrice || 0,
        originalPrice: size.originalPrice,
        size: size.size,
        volume: size.volume,
        image: product.images[0],
        category: product.category,
        quantity: quantity
      },
    })
    setShowSizeSelector(false)
  }

  const fetchRelatedProducts = async () => {
    try {
      // Fetch products from the same category, excluding the current product
      const response = await fetch(`/api/products?category=${category}`)
      if (response.ok) {
        const data = await response.json()
        const filteredProducts = data
          .filter((p: ProductDetail) => p.id !== productId && p.isActive !== false)
          .sort((a: ProductDetail, b: ProductDetail) => b.rating - a.rating) // Sort by rating (highest first)
          .slice(0, 4) // Get only the 4 best reviewed products
        setRelatedProducts(filteredProducts)
      }
    } catch (error) {
      console.error("Error fetching related products:", error)
    }
  }
  const [showFullDescription, setShowFullDescription] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    if (category && productId) {
      fetchProduct()
      fetchRelatedProducts()
    }
  }, [category, productId])

  const getBaseProductId = (id: string) => {
    // For gift packages with timestamp suffixes like -1756667891815, remove only the timestamp
    // The pattern seems to be: baseId-timestamp where timestamp is all numbers
    if (id.match(/-[0-9]+$/)) {
      const baseId = id.replace(/-[0-9]+$/, '');
      console.log("Original ID:", id, "Base ID (timestamp removed):", baseId);
      return baseId;
    }
    
    // For other cases, don't modify the ID
    console.log("Original ID:", id, "Base ID (no change):", id);
    return id;
  }

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/products/${category}/${productId}`)
      if (response.ok) {
        const data = await response.json()
        setProduct(data)

        // Get base product ID (without size suffix)
        const baseProductId = getBaseProductId(data.id)
        console.log("Product data:", data)
        console.log("Product ID from API:", data.id)
        console.log("URL product ID:", productId)
        console.log("Fetching reviews for base product ID:", baseProductId)
        
        // Fetch reviews for the BASE product ID using the correct endpoint
        const reviewsResponse = await fetch(`/api/reviews/product/${baseProductId}`)
        if (reviewsResponse.ok) {
          const reviewsData = await reviewsResponse.json()
          console.log("Fetched reviews:", reviewsData.reviews?.length || 0)
          setReviews(reviewsData.reviews || [])
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
        <div className="pt-28 md:pt-24 flex items-center justify-center px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p className="text-gray-600 text-sm sm:text-base">Loading products...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-white">
        <Navigation />
        <div className="pt-28 md:pt-24 flex items-center justify-center px-4">
          <div className="text-center">
            <h1 className="text-xl sm:text-2xl font-light mb-4">Product not found</h1>
            <Link href="/products">
              <Button className="bg-black text-white hover:bg-gray-800 text-sm sm:text-base px-4 py-2">Browse All Products</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const selectedPrice = product.sizes[selectedSize || 0]?.discountedPrice || product.sizes[selectedSize || 0]?.originalPrice || 0

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      {/* Product Detail */}
      <section className="pt-28 md:pt-24 pb-20 sm:pb-16">
        <div className="container mx-auto px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-8"
          >
            <Link
              href={`/products/${category}`}
              className="inline-flex items-center text-gray-600 hover:text-black transition-colors font-medium text-sm sm:text-base"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to {categoryTitles[category as keyof typeof categoryTitles]} Collection
            </Link>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12">
            {/* Product Images */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-4 lg:space-y-6 order-1"
            >
              <div className="relative rounded-xl overflow-hidden bg-gray-50">
                <div 
                  className="w-full h-64 sm:h-80 lg:h-[500px] relative select-none"
                  onMouseEnter={() => setIsHovered(true)}
                  onMouseLeave={() => setIsHovered(false)}
                  onWheel={handleWheel}
                  onKeyDown={handleKeyDown}
                  onTouchStart={handleTouchStart}
                  onTouchEnd={handleTouchEnd}
                  tabIndex={0}
                  role="img"
                  aria-label="Product image gallery. Use scroll, swipe, or arrow keys to change image."
                >
                  <Image
                    src={product.images[selectedImage] || "/placeholder.svg"}
                    alt={product.name}
                    fill
                    className={`object-contain transition-all duration-300 ${isHovered ? 'scale-105' : 'scale-100'}`}
                  />
                  {product.images?.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={goToPrevImage}
                        className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 p-2 sm:p-3 rounded-full bg-white/90 backdrop-blur shadow hover:bg-white focus:outline-none focus:ring-2 focus:ring-black"
                        aria-label="Previous image"
                      >
                        <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6 text-gray-900" />
                      </button>
                      <button
                        type="button"
                        onClick={goToNextImage}
                        className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 p-2 sm:p-3 rounded-full bg-white/90 backdrop-blur shadow hover:bg-white focus:outline-none focus:ring-2 focus:ring-black"
                        aria-label="Next image"
                      >
                        <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6 text-gray-900" />
                      </button>
                    </>
                  )}
                </div>
                <div className="absolute top-3 left-3 lg:top-4 lg:left-4 space-y-2">
                  {product.isBestseller && (
                    <Badge className="bg-gradient-to-r from-amber-600 to-amber-800 text-white px-2 py-1 lg:px-3 lg:py-1 rounded-md font-medium text-xs lg:text-sm">
                      Bestseller
                    </Badge>
                  )}
                  {product.isNew && (
                    <Badge className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-2 py-1 lg:px-3 lg:py-1 rounded-md font-medium text-xs lg:text-sm">
                      New Arrival
                    </Badge>
                  )}
                 
                </div>
              </div>

              <div className="flex space-x-2 lg:space-x-3 overflow-x-auto pb-2 scrollbar-hide">
                {product.images.map((image, index) => (
                  <motion.button
                    key={index}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedImage(index)}
                    className={`flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-lg overflow-hidden border transition-all duration-200 ${
                      selectedImage === index 
                        ? "border-2 border-black shadow-md" 
                        : "border-gray-200 hover:border-gray-400"
                    }`}
                  >
                    <Image
                      src={image || "/placeholder.svg"}
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
              className="space-y-6 lg:space-y-8 order-2"
            >
              <div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 space-y-3 sm:space-y-0">
                  <div className="flex-1">
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-light tracking-tight mb-2">{product.name}</h1>
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 mb-4">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 sm:h-5 sm:w-5 ${
                              i < Math.floor(product.rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm sm:text-base text-gray-600">
                        ({product.rating}) • {product.reviews} reviews
                      </span>
                    </div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-light text-left">
                    {(() => {
                      if (product.isGiftPackage && product.packagePrice) {
                        const packagePrice = product.packagePrice;
                        const packageOriginalPrice = product.packageOriginalPrice || 0;
                        
                        if (packageOriginalPrice > 0 && packagePrice < packageOriginalPrice) {
                          return (
                            <div className="text-left space-y-2">
                              <div className="flex flex-col items-start">
                                <span className="text-gray-600 text-base sm:text-lg">Package Price:</span>
                                <div className="flex items-center space-x-3">
                                  <span className="line-through text-gray-400 text-lg sm:text-xl">EGP{packageOriginalPrice}</span>
                                  <span className="text-xl sm:text-2xl font-bold text-red-600">EGP{packagePrice}</span>
                                </div>
                                <span className="text-xs sm:text-sm text-green-600 font-medium bg-green-50 px-2 py-1 rounded-full">
                                  Save EGP{(packageOriginalPrice - packagePrice).toFixed(0)}
                                </span>
                              </div>
                            </div>
                          );
                        } else {
                          return (
                            <div className="text-left">
                              <span className="text-gray-600 text-base sm:text-lg">Package Price:</span>
                              <span className="text-xl sm:text-2xl font-bold ml-2 text-green-600">
                                EGP{packagePrice}
                              </span>
                            </div>
                          );
                        }
                      } else {
                        const selectedSizeObj = product.sizes[selectedSize] || product.sizes[0];
                        const selectedPrice = selectedSizeObj?.discountedPrice || selectedSizeObj?.originalPrice || 0;
                        const originalPrice = selectedSizeObj?.originalPrice || 0;
                        
                        if (originalPrice > 0 && selectedPrice < originalPrice) {
                          return (
                            <div className="flex items-center space-x-3">
                              <span className="line-through text-gray-400 text-lg sm:text-2xl">EGP{originalPrice}</span>
                              <span className="text-red-600 font-bold text-xl sm:text-2xl">EGP{selectedPrice}</span>
                            </div>
                          );
                        } else {
                          return <span className="text-xl sm:text-2xl">EGP{selectedPrice}</span>;
                        }
                      }
                    })()}
                  </div>
                </div>

                <div className="mb-6">
                  <p className={`text-gray-700 text-sm sm:text-base leading-relaxed ${showFullDescription ? '' : 'line-clamp-3'}`}>
                    {product.longDescription}
                  </p>
                  {!showFullDescription && (
                    <button 
                      onClick={() => setShowFullDescription(true)}
                      className="text-sm font-medium text-black mt-3 flex items-center hover:text-gray-700 transition-colors w-full sm:w-auto justify-center sm:justify-start"
                    >
                      Read more <ChevronDown className="ml-1 h-4 w-4" />
                    </button>
                  )}
                  
                  {/* Gift Package Info */}
                  {product.isGiftPackage && product.giftPackageSizes && (
                    <div className="mt-4 p-3 sm:p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-2 mb-3">
                        <Package className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
                        <h4 className="font-medium text-gray-900 text-sm sm:text-base">Gift Package Includes:</h4>
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        {product.giftPackageSizes.map((size, index) => (
                          <div key={index} className="text-xs sm:text-sm text-gray-600">
                            • {size.size} ({size.volume}) - {size.productOptions?.length || 0} product options
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-3">
                        Customize your package by selecting specific products for each size
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Fragrance Notes */}
              {product.notes && (
                <div>
                  <h3 className="text-base sm:text-lg font-medium mb-4 text-gray-900">Fragrance Notes</h3>
                  <div className="space-y-4">
                    <div className="border-l-2 border-rose-400 pl-3 py-1">
                      <span className="text-xs sm:text-sm font-medium text-gray-900">Top Notes:</span>
                      <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-2">
                        {product.notes.top.map((note, idx) => (
                          <span key={idx} className="bg-gradient-to-r from-rose-50 to-pink-50 text-rose-700 text-xs font-medium px-2 py-1 sm:px-3 sm:py-1.5 rounded-full border border-rose-200 shadow-sm">
                            {note}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="border-l-2 border-violet-500 pl-3 py-1">
                      <span className="text-xs sm:text-sm font-medium text-gray-900">Middle Notes:</span>
                      <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-2">
                        {product.notes.middle.map((note, idx) => (
                          <span key={idx} className="bg-gradient-to-r from-violet-50 to-purple-100 text-violet-700 text-xs font-medium px-2 py-1 sm:px-3 sm:py-1.5 rounded-full border border-violet-200 shadow-sm">
                            {note}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="border-l-2 border-indigo-600 pl-3 py-1">
                      <span className="text-xs sm:text-sm font-medium text-gray-900">Base Notes:</span>
                      <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-2">
                        {product.notes.base.map((note, idx) => (
                          <span key={idx} className="bg-gradient-to-r from-indigo-50 to-purple-100 text-indigo-800 text-xs font-medium px-2 py-1 sm:px-3 sm:py-1.5 rounded-full border border-indigo-200 shadow-sm">
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

      {/* Fixed Bottom Bar - Mobile Optimized */}
      <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-gray-200 z-40">
        <div className="container mx-auto px-3 md:px-6 py-2 md:py-4">
            {product.isGiftPackage ? (
            /* Gift Package Bottom Bar - Mobile Optimized */
            <div className="flex items-center justify-between gap-2 md:gap-4">
              <div className="flex items-center space-x-2 md:space-x-3 min-w-0 flex-1">
                <Package className="h-4 w-4 md:h-6 md:w-6 text-gray-600 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <h3 className="text-xs md:text-sm font-medium text-gray-900 truncate">Gift Package</h3>
                  <p className="text-xs text-gray-600 hidden md:block">Customize your package</p>
                  </div>
                </div>
                
              <div className="flex items-center space-x-2 md:space-x-4">
                <div className="text-right">
                    {(() => {
                      const packagePrice = product.packagePrice || 0;
                      const packageOriginalPrice = product.packageOriginalPrice || 0;
                      
                      if (packageOriginalPrice > 0 && packagePrice < packageOriginalPrice) {
                        return (
                        <div className="flex flex-col md:flex-row md:items-center md:space-x-2">
                          <span className="line-through text-gray-400 text-xs md:text-base">EGP{packageOriginalPrice}</span>
                          <span className="text-red-600 font-bold text-sm md:text-xl">EGP{packagePrice}</span>
                          </div>
                        );
                      } else {
                      return <span className="text-green-600 font-bold text-sm md:text-xl">EGP{packagePrice}</span>;
                      }
                    })()}
                  </div>
                
                <div className="flex space-x-1 md:space-x-2">
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.98 }}
                    className="p-2 md:p-3 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center justify-center"
                      onClick={() => {
                        if (product) {
                          if (isFavorite(product.id)) {
                            removeFromFavorites(product.id)
                          } else {
                                                    addToFavorites({
                          id: product.id,
                          name: product.name,
                          price: product.packagePrice || 0,
                          image: product.images[0],
                          category: product.category,
                          rating: product.rating,
                          isNew: product.isNew,
                          isBestseller: product.isBestseller,
                          sizes: product.giftPackageSizes || [],
                          isGiftPackage: true,
                          packagePrice: product.packagePrice,
                          packageOriginalPrice: product.packageOriginalPrice,
                          giftPackageSizes: product.giftPackageSizes,
                        })
                          }
                        }
                      }}
                      aria-label={isFavorite(product.id) ? "Remove from favorites" : "Add to favorites"}
                    >
                      <Heart 
                      className={`h-4 w-4 md:h-5 md:w-5 ${
                          product && isFavorite(product.id) 
                            ? "text-red-500 fill-red-500" 
                            : "text-gray-700"
                        }`} 
                      />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.98 }}
                    className="bg-gradient-to-r from-gray-900 to-black text-white py-2 px-3 md:py-3 md:px-6 rounded-lg font-medium flex items-center justify-center shadow-md hover:shadow-lg transition-all text-xs md:text-sm"
                      onClick={() => setShowGiftPackageSelector(true)}
                      aria-label="Customize Package"
                    >
                    <Package className="mr-1 md:mr-2 h-4 w-4 md:h-5 md:w-5" />
                    <span className="hidden sm:inline">Customize Package</span>
                    <span className="sm:hidden">Customize</span>
                    </motion.button>
                  </div>
                </div>
            </div>
          ) : (
            /* Regular Product Bottom Bar - Mobile Optimized */
            <div className="space-y-2 md:space-y-0">
              {/* Mobile: Compact single row layout */}
              <div className="flex md:hidden items-center justify-between gap-2">
                <div className="flex items-center space-x-2 min-w-0 flex-1">
                  <span className="text-xs font-medium text-gray-600 whitespace-nowrap">Size:</span>
                  <div className="flex space-x-1 overflow-x-auto scrollbar-hide min-w-0">
                    {product.sizes.map((size, index) => (
                      <motion.button
                        key={index}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedSize(index)}
                        className={`px-2 py-1 border rounded text-xs transition-all flex-shrink-0 ${
                          selectedSize === index
                            ? 'border-black bg-black text-white'
                            : 'border-gray-200 hover:border-gray-400 bg-white'
                        }`}
                      >
                        {size.size}
                      </motion.button>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center space-x-1">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-6 h-6 border border-gray-200 rounded flex items-center justify-center hover:bg-gray-50 transition-colors"
                    disabled={quantity <= 1}
                  >
                    <span className="text-gray-600 text-xs">-</span>
                  </motion.button>
                  <span className="w-8 text-center font-medium text-xs">{quantity}</span>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-6 h-6 border border-gray-200 rounded flex items-center justify-center hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-gray-600 text-xs">+</span>
                  </motion.button>
                </div>
              </div>

              {/* Mobile: Price and action buttons row */}
              <div className="flex md:hidden items-center justify-between gap-2">
                <div className="text-sm font-medium">
                  {(() => {
                    const selectedSizeObj = product.sizes[selectedSize];
                    const selectedPrice = selectedSizeObj?.discountedPrice || selectedSizeObj?.originalPrice || 0;
                    const originalPrice = selectedSizeObj?.originalPrice;
                    
                    if (originalPrice && selectedPrice < originalPrice) {
                      return (
                        <div className="flex items-center space-x-1">
                          <span className="line-through text-gray-400 text-xs">EGP{originalPrice}</span>
                          <span className="text-red-600 font-bold text-sm">EGP{selectedPrice}</span>
                        </div>
                      );
                    } else {
                      return <span className="text-sm">EGP{selectedPrice}</span>;
                    }
                  })()}
                </div>
                
                <div className="flex space-x-1">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center justify-center"
                    onClick={() => {
                      if (product) {
                        if (isFavorite(product.id)) {
                          removeFromFavorites(product.id)
                        } else {
                          addToFavorites({
                            id: product.id,
                            name: product.name,
                            price: getSelectedPrice(),
                            image: product.images[0],
                            category: product.category,
                            rating: product.rating,
                            isNew: product.isNew,
                            isBestseller: product.isBestseller,
                            sizes: product.sizes,
                          })
                        }
                      }
                    }}
                    aria-label={isFavorite(product.id) ? "Remove from favorites" : "Add to favorites"}
                  >
                    <Heart 
                      className={`h-4 w-4 ${
                        product && isFavorite(product.id) 
                          ? "text-red-500 fill-red-500" 
                          : "text-gray-700"
                      }`} 
                    />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    className="bg-gradient-to-r from-gray-900 to-black text-white py-2 px-4 rounded-lg font-medium flex items-center justify-center shadow-md hover:shadow-lg transition-all text-xs"
                    onClick={() => {
                      dispatch({
                        type: "ADD_ITEM",
                        payload: {
                          id: `${product.id}-${product.sizes[selectedSize].size}`,
                          productId: product.id,
                          name: product.name,
                          price: getSelectedPrice(),
                          size: product.sizes[selectedSize].size,
                          volume: product.sizes[selectedSize].volume,
                          image: product.images[0],
                          category: category,
                          quantity: quantity
                        },
                      })
                    }}
                    aria-label="Add to cart"
                  >
                    <ShoppingCart className="mr-1 h-4 w-4" />
                    Add to Cart
                  </motion.button>
                </div>
              </div>

              {/* Desktop: Original layout */}
              <div className="hidden md:flex md:items-center md:justify-between gap-4">
            {/* Size Selection */}
                <div className="w-auto">
              <h3 className="text-sm font-medium mb-2 text-gray-900">Size: {product.sizes[selectedSize]?.size}</h3>
              <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
                {product.sizes.map((size, index) => (
                  <motion.button
                    key={index}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedSize(index)}
                        className={`px-4 py-2 border rounded-lg text-center transition-all flex-shrink-0 text-base ${
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

            {/* Quantity Selection */}
                <div className="flex items-center space-x-3">
              <span className="text-sm font-medium text-gray-900">Quantity:</span>
              <div className="flex items-center space-x-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-8 h-8 border border-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
                  disabled={quantity <= 1}
                >
                  <span className="text-gray-600">-</span>
                </motion.button>
                <span className="w-12 text-center font-medium">{quantity}</span>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-8 h-8 border border-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
                >
                  <span className="text-gray-600">+</span>
                </motion.button>
              </div>
            </div>

            {/* Price and Add to Cart */}
                <div className="flex items-center justify-end space-x-4 w-auto">
                  <div className="text-xl font-light text-left">
                {(() => {
                  const selectedSizeObj = product.sizes[selectedSize];
                  const selectedPrice = selectedSizeObj?.discountedPrice || selectedSizeObj?.originalPrice || 0;
                  const originalPrice = selectedSizeObj?.originalPrice;
                  
                  if (originalPrice && selectedPrice < originalPrice) {
                    return (
                      <div className="flex items-center space-x-2">
                            <span className="line-through text-gray-400 text-lg">EGP{originalPrice}</span>
                            <span className="text-red-600 font-bold text-xl">EGP{selectedPrice}</span>
                      </div>
                    );
                  } else {
                        return <span className="text-xl">EGP{selectedPrice}</span>;
                  }
                })()}
              </div>
                  <div className="flex justify-end space-x-2">
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
                          price: getSelectedPrice(),
                          image: product.images[0],
                          category: product.category,
                          rating: product.rating,
                          isNew: product.isNew,
                          isBestseller: product.isBestseller,
                          sizes: product.sizes,
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
                        id: `${product.id}-${product.sizes[selectedSize].size}`,
                        productId: product.id,
                        name: product.name,
                        price: getSelectedPrice(),
                        size: product.sizes[selectedSize].size,
                        volume: product.sizes[selectedSize].volume,
                        image: product.images[0],
                        category: category,
                        quantity: quantity
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
          )}
        </div>
      </div>

              {/* Reviews Section */}
        <section className="py-12 sm:py-16 bg-gradient-to-b from-white to-gray-50">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8 sm:mb-12">
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-2xl sm:text-3xl font-light tracking-tight mb-2"
              >
                Customer Reviews
              </motion.h2>
              <div className="w-16 h-1 bg-amber-500 mx-auto rounded-full"></div>
            </div>

            {/* Reviews List */}
            <div className="space-y-6 sm:space-y-8">
              {reviews.length === 0 ? (
                <div className="text-center py-8 sm:py-12 bg-white rounded-xl shadow-sm border border-gray-100">
                  <div className="bg-gray-100 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Star className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-600 max-w-md mx-auto text-sm sm:text-base">
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
                    className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100"
                  >
                    <div className="flex items-start mb-4">
                      <div className="bg-gray-200 border-2 border-dashed rounded-xl w-12 h-12 sm:w-16 sm:h-16 flex-shrink-0" />
                      <div className="ml-3 sm:ml-4 flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                          <div>
                            <h4 className="font-medium text-gray-900 text-sm sm:text-base">{review.userName}</h4>
                            <p className="text-xs sm:text-sm text-gray-600">{new Date(review.createdAt).toLocaleDateString()}</p>
                          </div>
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 sm:h-5 sm:w-5 ${
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
                    <p className="text-gray-700 leading-relaxed text-sm sm:text-base">{review.comment}</p>
                  </motion.div>
                ))
              )}
            </div>
            </div>
          </div>
        </section>

        {/* Related Products Section */}
        <section className="py-12 sm:py-16 bg-gray-50 pb-24 sm:pb-28">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-8 sm:mb-12">
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-2xl sm:text-3xl font-light tracking-tight mb-2"
              >
                You Might Also Like
              </motion.h2>
              <div className="w-16 h-1 bg-amber-500 mx-auto rounded-full"></div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4 lg:gap-6">
              {relatedProducts.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <p className="text-gray-600">No related products found.</p>
                </div>
              ) : (
                relatedProducts.map((relatedProduct, index) => (
                  <motion.div
                    key={relatedProduct.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -10 }}
                    className="relative h-full"
                  >
                    <div className="group relative h-full">
                      {/* Favorite Button */}
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => {
                          e.stopPropagation()
                          if (isFavorite(relatedProduct.id)) {
                            removeFromFavorites(relatedProduct.id)
                          } else {
                            addToFavorites({
                              id: relatedProduct.id,
                              name: relatedProduct.name,
                              price: relatedProduct.isGiftPackage && relatedProduct.packagePrice 
                                ? relatedProduct.packagePrice 
                                : getSmallestPrice(relatedProduct.sizes),
                              image: relatedProduct.images[0],
                              category: relatedProduct.category,
                              rating: relatedProduct.rating,
                              isNew: relatedProduct.isNew,
                              isBestseller: relatedProduct.isBestseller,
                              sizes: relatedProduct.sizes,
                              // Add gift package fields
                              isGiftPackage: relatedProduct.isGiftPackage,
                              packagePrice: relatedProduct.packagePrice,
                              packageOriginalPrice: relatedProduct.packageOriginalPrice,
                              giftPackageSizes: relatedProduct.giftPackageSizes,
                            })
                          }
                        }}
                        className="absolute top-2 right-2 sm:top-4 sm:right-6 z-10 p-2 sm:p-2.5 bg-white/95 backdrop-blur-sm rounded-full shadow-lg hover:shadow-xl hover:bg-white transition-all duration-300"
                        aria-label={isFavorite(relatedProduct.id) ? "Remove from favorites" : "Add to favorites"}
                      >
                        <Heart 
                          className={`h-4 w-4 sm:h-5 sm:w-5 ${
                            isFavorite(relatedProduct.id) 
                              ? "text-red-500 fill-red-500" 
                              : "text-gray-700"
                          }`} 
                        />
                      </motion.button>
                      
                      {/* Badges */}
                      <div className="absolute top-2 left-2 sm:top-4 sm:left-4 z-10 space-y-1 sm:space-y-2">
                        {relatedProduct.isBestseller && (
                          <motion.div
                            initial={{ scale: 0 }}
                            whileInView={{ scale: 1 }}
                            transition={{ duration: 0.5, delay: index * 0.1 + 0.3 }}
                            viewport={{ once: true }}
                          >
                            <Badge className="bg-black text-white text-xs sm:text-sm px-2 py-1">Bestseller</Badge>
                          </motion.div>
                        )}
                        {relatedProduct.isNew && !relatedProduct.isBestseller && (
                          <motion.div
                            initial={{ scale: 0 }}
                            whileInView={{ scale: 1 }}
                            transition={{ duration: 0.5, delay: index * 0.1 + 0.3 }}
                            viewport={{ once: true }}
                          >
                            <Badge variant="secondary" className="text-xs sm:text-sm px-2 py-1">New</Badge>
                          </motion.div>
                        )}
                      </div>
                      
                      {/* Product Card */}
                      <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 h-full">
                        <CardContent className="p-0 h-full flex flex-col">
                          <div className="relative aspect-square flex-grow">
                            <Link href={`/products/${relatedProduct.category}/${relatedProduct.id}`} className="block relative w-full h-full">
                              <div className="relative w-full h-full group-hover:scale-105 transition-transform duration-500">
                                <Image
                                  src={relatedProduct.images[0] || "/placeholder.svg"}
                                  alt={relatedProduct.name}
                                  fill
                                  className="object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none"></div>
                              </div>
                              <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-3 md:p-4 text-white">
                                <div className="flex items-center mb-1">
                                  <div className="flex items-center">
                                    {[...Array(5)].map((_, i) => (
                                      <Star
                                        key={i}
                                        className={`h-3 w-3 sm:h-4 sm:w-4 ${
                                          i < Math.floor(relatedProduct.rating) 
                                            ? "fill-yellow-400 text-yellow-400" 
                                            : "text-gray-300"
                                        }`}
                                      />
                                    ))}
                                  </div>
                                  <span className="text-xs ml-1 sm:ml-2">
                                    ({relatedProduct.rating.toFixed(1)})
                                  </span>
                                </div>

                                <h3 className="text-xs sm:text-sm md:text-base lg:text-lg font-medium mb-1 line-clamp-2">
                                  {relatedProduct.name}
                                </h3>
                                
                                <div className="flex items-center justify-between">
                                  <div className="text-xs sm:text-sm md:text-base lg:text-lg font-light">
                                    {(() => {
                                      // Handle gift packages
                                      if (relatedProduct.isGiftPackage) {
                                        const packagePrice = relatedProduct.packagePrice || 0;
                                        const packageOriginalPrice = relatedProduct.packageOriginalPrice || 0;
                                        
                                        if (packageOriginalPrice > 0 && packagePrice < packageOriginalPrice) {
                                          return (
                                            <div className="flex items-center space-x-1 sm:mr-2">
                                              <span className="line-through text-gray-300 text-xs sm:text-sm md:text-base">EGP{packageOriginalPrice}</span>
                                              <span className="text-red-500 font-bold text-xs sm:text-sm md:text-base">EGP{packagePrice}</span>
                                            </div>
                                          );
                                        } else {
                                          return <span className="text-xs sm:text-sm md:text-base lg:text-lg">EGP{packagePrice}</span>;
                                        }
                                      }
                                      
                                      // Handle regular products
                                      const smallestPrice = getSmallestPrice(relatedProduct.sizes);
                                      const smallestOriginalPrice = getSmallestOriginalPrice(relatedProduct.sizes);
                                      
                                      if (smallestOriginalPrice > 0 && smallestPrice < smallestOriginalPrice) {
                                        return (
                                          <div className="flex flex-col sm:flex-row sm:items-center space-y-0.5 sm:space-y-0 sm:space-x-1 sm:mr-2">
                                            <span className="line-through text-gray-300 text-xs sm:text-sm md:text-base">EGP{smallestOriginalPrice}</span>
                                            <span className="text-red-500 font-bold text-xs sm:text-sm md:text-base">EGP{smallestPrice}</span>
                                          </div>
                                        );
                                      } else {
                                        return <span className="text-xs sm:text-sm md:text-base lg:text-lg">EGP{smallestPrice}</span>;
                                      }
                                    })()}
                                  </div>
                                  
                                  <button 
                                    className="p-1 sm:p-1.5 sm:p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors"
                                    onClick={(e) => {
                                      e.preventDefault()
                                      e.stopPropagation()
                                      if (relatedProduct.isGiftPackage) {
                                        setSelectedProduct(relatedProduct)
                                        setShowRelatedGiftPackageSelector(true)
                                      } else {
                                      openSizeSelector(relatedProduct)
                                      }
                                    }}
                                    aria-label="Add to cart"
                                  >
                                    <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5" />
                                  </button>
                                </div>
                              </div>
                            </Link>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* Gift Package Selector Modal for Related Products */}
        {showRelatedGiftPackageSelector && selectedProduct && (
          <GiftPackageSelector
            product={selectedProduct}
            isOpen={showRelatedGiftPackageSelector}
            onClose={() => setShowRelatedGiftPackageSelector(false)}
            onToggleFavorite={(product) => {
              if (isFavorite(product.id)) {
                removeFromFavorites(product.id)
              } else {
                addToFavorites({
                  id: product.id,
                  name: product.name,
                  price: product.packagePrice || 0,
                  image: product.images[0],
                  category: product.category,
                  rating: product.rating,
                  isNew: product.isNew || false,
                  isBestseller: product.isBestseller || false,
                  sizes: product.giftPackageSizes || [],
                  isGiftPackage: product.isGiftPackage,
                  packagePrice: product.packagePrice,
                  packageOriginalPrice: product.packageOriginalPrice,
                  giftPackageSizes: product.giftPackageSizes,
                })
              }
            }}
            isFavorite={isFavorite}
          />
        )}

        {/* Size Selector Modal for Related Products - Matching Home Page Style */}
        {showSizeSelector && selectedProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowSizeSelector(false)}
          >
            <motion.div 
              className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-medium">{selectedProduct.name}</h3>
                    <p className="text-gray-600 text-sm">Select your preferred size</p>
                  </div>
                  <div className="flex">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        if (isFavorite(selectedProduct.id)) {
                          removeFromFavorites(selectedProduct.id)
                        } else {
                          addToFavorites({
                            id: selectedProduct.id,
                            name: selectedProduct.name,
                            price: selectedRelatedSize ? (selectedRelatedSize.discountedPrice || selectedRelatedSize.originalPrice || 0) : getSmallestPrice(selectedProduct.sizes),
                            image: selectedProduct.images[0],
                            category: selectedProduct.category,
                            rating: selectedProduct.rating,
                            isNew: selectedProduct.isNew,
                            isBestseller: selectedProduct.isBestseller,
                            sizes: selectedProduct.sizes,
                          })
                        }
                      }}
                      className="mr-2 p-1.5 bg-white/80 backdrop-blur-sm rounded-full shadow-md hover:bg-gray-100 transition-colors"
                    >
                      <Heart 
                        className={`h-5 w-5 ${
                          isFavorite(selectedProduct.id) 
                            ? "text-red-500 fill-red-500" 
                            : "text-gray-700"
                        }`} 
                      />
                    </button>
                    <button 
                      onClick={() => setShowSizeSelector(false)}
                      className="text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center mb-6">
                  <div className="relative w-20 h-20 mr-4">
                    <Image
                      src={selectedProduct.images[0] || "/placeholder.svg"}
                      alt={selectedProduct.name}
                      fill
                      className="rounded-lg object-cover"
                    />
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm line-clamp-2">
                      {selectedProduct.description}
                    </p>
                    <div className="flex items-center mt-1">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < Math.floor(selectedProduct.rating) 
                                ? "fill-yellow-400 text-yellow-400" 
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-gray-600 ml-2">
                        ({selectedProduct.rating.toFixed(1)})
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="mb-6">
                  <h4 className="font-medium mb-3">Available Sizes</h4>
                  <div className="flex flex-wrap gap-3 justify-center">
                    {selectedProduct.sizes?.map((size) => (
                      <motion.button
                        key={size.size}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.98 }}
                        className={`border-2 rounded-xl p-3 text-center transition-all flex-shrink-0 min-w-[100px] ${
                          selectedRelatedSize?.size === size.size
                            ? 'border-black bg-black text-white shadow-md'
                            : 'border-gray-200 hover:border-gray-400'
                        }`}
                        onClick={() => setSelectedRelatedSize(size)}
                      >
                        <div className="font-medium">{size.size}</div>
                        <div className="text-xs mt-1">{size.volume}</div>
                        <div className="text-sm font-light mt-2">
                          {size.originalPrice && size.discountedPrice && 
                           size.discountedPrice < size.originalPrice ? (
                            <>
                              <span className="line-through text-gray-400">EGP{size.originalPrice}</span>
                              <br />
                              <span className="text-red-600">EGP{size.discountedPrice}</span>
                            </>
                          ) : (
                            <>EGP{size.discountedPrice || size.originalPrice || 0}</>
                          )}
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>
                
                {/* Quantity Selection */}
                <div className="mb-4">
                  <h4 className="font-medium mb-3">Quantity</h4>
                  <div className="flex items-center space-x-3">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-8 h-8 border border-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
                      disabled={quantity <= 1}
                    >
                      <span className="text-gray-600">-</span>
                    </motion.button>
                    <span className="w-12 text-center font-medium">{quantity}</span>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-8 h-8 border border-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-gray-600">+</span>
                    </motion.button>
                  </div>
                </div>

                <div className="flex justify-between items-center py-4 border-t border-gray-100">
                  <div>
                    <span className="text-gray-600">Total:</span>
                    <span className="text-xl font-medium ml-2">
                      {selectedRelatedSize ? (
                        selectedRelatedSize.originalPrice && selectedRelatedSize.discountedPrice && 
                        selectedRelatedSize.discountedPrice < selectedRelatedSize.originalPrice ? (
                          <>
                            <span className="line-through text-gray-400 mr-2 text-lg">EGP{selectedRelatedSize.originalPrice}</span>
                            <span className="text-red-600 font-bold">EGP{selectedRelatedSize.discountedPrice}</span>
                          </>
                        ) : (
                          <>EGP{selectedRelatedSize.discountedPrice || selectedRelatedSize.originalPrice || 0}</>
                        )
                      ) : (
                        <>EGP{getSmallestPrice(selectedProduct.sizes)}</>
                      )}
                    </span>
                  </div>
                  
                  <Button 
                    onClick={() => selectedRelatedSize && addToCartFromRelated(selectedProduct, selectedRelatedSize)} 
                    className="flex items-center bg-black hover:bg-gray-800 rounded-full px-6 py-5"
                    disabled={!selectedRelatedSize}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Add to Cart
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Gift Package Selector Modal */}
        {showGiftPackageSelector && product && (
          <GiftPackageSelector
            product={product}
            isOpen={showGiftPackageSelector}
            onClose={() => setShowGiftPackageSelector(false)}
            onToggleFavorite={(product) => {
              if (isFavorite(product.id)) {
                removeFromFavorites(product.id)
              } else {
                addToFavorites({
                  id: product.id,
                  name: product.name,
                  price: product.packagePrice || 0,
                  image: product.images[0],
                  category: product.category,
                  rating: product.rating,
                  isNew: product.isNew || false,
                  isBestseller: product.isBestseller || false,
                  sizes: product.giftPackageSizes || [],
                  // Add missing gift package fields
                  isGiftPackage: product.isGiftPackage,
                  packagePrice: product.packagePrice,
                  packageOriginalPrice: product.packageOriginalPrice,
                  giftPackageSizes: product.giftPackageSizes,
                })
              }
            }}
            isFavorite={isFavorite}
          />
        )}

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
                    For Him
                  </Link>
                  <Link href="/products/women" className="block text-gray-400 hover:text-white transition-colors">
                    For Her
                  </Link>
                  <Link href="/products/packages" className="block text-gray-400 hover:text-white transition-colors">
                    Bundles
                  </Link>
                  <Link href="/products/outlet" className="block text-gray-400 hover:text-white transition-colors">
                    Outlet Deals
                  </Link>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-4">Contact</h3>
                <div className="space-y-2 text-sm text-gray-400">
                  <p>Email: sensefragrances1@gmail.com</p>
                  <p className="mb-3">Follow us for updates</p>
                  <div className="flex space-x-3">
                    <Link
                      href="https://www.instagram.com/sensefragrances.eg?igsh=MXYxcTh5ZTlhZzMzNQ=="
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group"
                    >
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110 shadow-lg">
                        <Instagram className="h-4 w-4 text-white" />
                      </div>
                    </Link>
                    <Link
                      href="https://www.facebook.com/share/1JhHgi2Psu/?mibextid=wwXIfr"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group"
                    >
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110 shadow-lg">
                        <Facebook className="h-4 w-4 text-white" />
                      </div>
                    </Link>
                    <Link
                      href="https://www.tiktok.com/@sensefragrances.eg?_t=ZS-8zL3M6ji8HZ&_r=1"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group"
                    >
                      <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110 shadow-lg">
                        <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                        </svg>
                      </div>
                    </Link>
                  </div>
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
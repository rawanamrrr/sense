"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star, ShoppingCart, X, Heart, Sparkles, RefreshCw, Package, Instagram, Facebook } from "lucide-react"
import { useCart } from "@/lib/cart-context"
import { useFavorites } from "@/lib/favorites-context"
import { GiftPackageSelector } from "@/components/gift-package-selector"
import useEmblaCarousel from 'embla-carousel-react'

interface ProductSize {
  size: string
  volume: string
  originalPrice?: number
  discountedPrice?: number
}

interface Product {
  _id: string
  id: string
  name: string
  description: string
  longDescription: string
  images: string[]
  rating: number
  reviews: number
  category: "men" | "women" | "packages" | "outlet"
  sizes: ProductSize[]
  isActive: boolean
  isNew: boolean
  isBestseller: boolean
  // Gift package fields
  isGiftPackage?: boolean
  packagePrice?: number
  packageOriginalPrice?: number
  giftPackageSizes?: any[]
  notes?: {
    top: string[]
    middle: string[]
    base: string[]
  }
}

interface ProductsClientProps {
  initialProducts: Product[]
}

export default function ProductsClient({ initialProducts }: ProductsClientProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [loading, setLoading] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedSize, setSelectedSize] = useState<ProductSize | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [showSizeSelector, setShowSizeSelector] = useState(false)
  const [showGiftPackageSelector, setShowGiftPackageSelector] = useState(false)
  
  // Function to calculate the smallest price from all sizes
  const getSmallestPrice = (sizes: ProductSize[]) => {
    if (!sizes || sizes.length === 0) return 0
    
    const prices = sizes.map(size => size.discountedPrice || size.originalPrice || 0)
    return Math.min(...prices.filter(price => price > 0))
  }

  // Function to calculate the smallest original price from all sizes
  const getSmallestOriginalPrice = (sizes: ProductSize[]) => {
    if (!sizes || sizes.length === 0) return 0
    
    const prices = sizes.map(size => size.originalPrice || 0)
    return Math.min(...prices.filter(price => price > 0))
  }
  
  // Embla Carousel state
  const [emblaRefMen, emblaApiMen] = useEmblaCarousel({ 
    align: "start",
    containScroll: "trimSnaps",
    dragFree: true,
    loop: false
  })
  const [selectedIndexMen, setSelectedIndexMen] = useState(0)
  
  const [emblaRefWomen, emblaApiWomen] = useEmblaCarousel({ 
    align: "start",
    containScroll: "trimSnaps",
    dragFree: true,
    loop: false
  })
  const [selectedIndexWomen, setSelectedIndexWomen] = useState(0)
  
  const [emblaRefPackages, emblaApiPackages] = useEmblaCarousel({ 
    align: "start",
    containScroll: "trimSnaps",
    dragFree: true,
    loop: false
  })
  const [selectedIndexPackages, setSelectedIndexPackages] = useState(0)
  
  const [emblaRefOutlet, emblaApiOutlet] = useEmblaCarousel({ 
    align: "start",
    containScroll: "trimSnaps",
    dragFree: true,
    loop: false
  })
  const [selectedIndexOutlet, setSelectedIndexOutlet] = useState(0)

  const { dispatch: cartDispatch } = useCart()
  const { 
    addToFavorites, 
    removeFromFavorites, 
    isFavorite, 
    loading: favoritesLoading 
  } = useFavorites()

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/products?limit=20")
      if (response.ok) {
        const data = await response.json()
        setProducts(data)
      }
    } catch (error) {
      console.error("Error fetching products:", error)
    } finally {
      setLoading(false)
    }
  }

  const categorizedProducts = {
    men: products.filter((p) => p.category === "men" && p.isActive),
    women: products.filter((p) => p.category === "women" && p.isActive),
    packages: products.filter((p) => p.category === "packages" && p.isActive),
    outlet: products.filter((p) => p.category === "outlet" && p.isActive),
  }

  const openSizeSelector = (product: Product) => {
    // For gift packages, open the gift package selector instead
    if (product.isGiftPackage) {
      setSelectedProduct(product)
      setShowGiftPackageSelector(true)
    } else {
    setSelectedProduct(product)
    setSelectedSize(product.sizes.length > 0 ? product.sizes[0] : null)
    setQuantity(1)
    setShowSizeSelector(true)
    }
  }

  const closeSizeSelector = () => {
    setShowSizeSelector(false)
    setTimeout(() => {
      setSelectedProduct(null)
      setSelectedSize(null)
    }, 300)
  }

  const addToCart = () => {
    if (!selectedProduct || !selectedSize) return
    
    cartDispatch({
      type: "ADD_ITEM",
      payload: {
        id: `${selectedProduct.id}-${selectedSize.size}`,
        productId: selectedProduct.id,
        name: selectedProduct.name,
        price: selectedSize.discountedPrice || selectedSize.originalPrice || 0,
        originalPrice: selectedSize.originalPrice,
        size: selectedSize.size,
        volume: selectedSize.volume,
        image: selectedProduct.images[0],
        category: selectedProduct.category,
        quantity: quantity
      }
    })
    
    closeSizeSelector()
  }

  const toggleFavorite = async (product: any) => {
    try {
      if (isFavorite(product.id)) {
        await removeFromFavorites(product.id)
      } else {
        // For gift packages, use package price; for regular products, use smallest size price
        const price = product.isGiftPackage && product.packagePrice 
          ? product.packagePrice 
          : getSmallestPrice(product.sizes);
          
        await addToFavorites({
          id: product.id,
          name: product.name,
          price: price,
          image: product.images[0],
          category: product.category,
          rating: product.rating,
          isNew: product.isNew,
          isBestseller: product.isBestseller,
          sizes: product.sizes,
          // Add gift package fields
          isGiftPackage: product.isGiftPackage,
          packagePrice: product.packagePrice,
          packageOriginalPrice: product.packageOriginalPrice,
          giftPackageSizes: product.giftPackageSizes,
        })
      }
    } catch (error) {
      console.error("Error toggling favorite:", error)
    }
  }

  // Carousel scroll functions
  const scrollToMen = useCallback((index: number) => {
    if (!emblaApiMen) return
    emblaApiMen.scrollTo(index)
  }, [emblaApiMen])

  const scrollToWomen = useCallback((index: number) => {
    if (!emblaApiWomen) return
    emblaApiWomen.scrollTo(index)
  }, [emblaApiWomen])

  const scrollToPackages = useCallback((index: number) => {
    if (!emblaApiPackages) return
    emblaApiPackages.scrollTo(index)
  }, [emblaApiPackages])

  const scrollToOutlet = useCallback((index: number) => {
    if (!emblaApiOutlet) return
    emblaApiOutlet.scrollTo(index)
  }, [emblaApiOutlet])

  // Carousel event listeners
  useEffect(() => {
    if (!emblaApiMen) return
    emblaApiMen.on('select', () => {
      setSelectedIndexMen(emblaApiMen.selectedScrollSnap())
    })
  }, [emblaApiMen])

  useEffect(() => {
    if (!emblaApiWomen) return
    emblaApiWomen.on('select', () => {
      setSelectedIndexWomen(emblaApiWomen.selectedScrollSnap())
    })
  }, [emblaApiWomen])

  useEffect(() => {
    if (!emblaApiPackages) return
    emblaApiPackages.on('select', () => {
      setSelectedIndexPackages(emblaApiPackages.selectedScrollSnap())
    })
  }, [emblaApiPackages])

  useEffect(() => {
    if (!emblaApiOutlet) return
    emblaApiOutlet.on('select', () => {
      setSelectedIndexOutlet(emblaApiOutlet.selectedScrollSnap())
    })
  }, [emblaApiOutlet])

  if (loading || favoritesLoading) {
    return (
      <div className="pt-28 md:pt-24 flex items-center justify-center">
        <div className="text-center">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="h-12 w-12 border-t-2 border-b-2 border-purple-500 rounded-full mx-auto mb-4"
          />
          <p className="text-gray-600">Loading products...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Size Selector Modal */}
      {showSizeSelector && selectedProduct && (
        <>
          {/* Gift Package Selector */}
          {selectedProduct.isGiftPackage ? (
            <GiftPackageSelector
              product={selectedProduct}
              isOpen={showSizeSelector}
              onClose={closeSizeSelector}
              onToggleFavorite={toggleFavorite}
              isFavorite={isFavorite}
            />
          ) : (
            /* Regular Product Size Selector */
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={closeSizeSelector}
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
                      toggleFavorite(selectedProduct)
                    }}
                    className="mr-2 p-1.5 bg-white/80 backdrop-blur-sm rounded-full shadow-md hover:bg-gray-100 transition-colors"
                    aria-label={isFavorite(selectedProduct.id) ? "Remove from favorites" : "Add to favorites"}
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
                    onClick={closeSizeSelector}
                    className="text-gray-500 hover:text-gray-700 transition-colors"
                    aria-label="Close size selector"
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
                <div className="grid grid-cols-3 gap-3">
                  {selectedProduct.sizes.map((size) => (
                    <motion.button
                      key={size.size}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.98 }}
                      className={`border-2 rounded-xl p-3 text-center transition-all ${
                        selectedSize?.size === size.size
                          ? 'border-black bg-black text-white shadow-md'
                          : 'border-gray-200 hover:border-gray-400'
                      }`}
                      onClick={() => setSelectedSize(size)}
                      aria-label={`Select size ${size.size} - ${size.volume}`}
                    >
                      <div className="font-medium">{size.size}</div>
                      <div className="text-xs mt-1">{size.volume}</div>
                      <div className="text-xs mt-2">
                        {size.originalPrice && size.discountedPrice && size.discountedPrice < size.originalPrice ? (
                          <>
                            <span className="line-through text-gray-400 block">EGP{size.originalPrice}</span>
                            <span className="text-red-600 font-medium">EGP{size.discountedPrice}</span>
                          </>
                        ) : size.discountedPrice && size.discountedPrice < (size.originalPrice || 0) ? (
                          <span className="text-red-600 font-medium">EGP{size.discountedPrice}</span>
                        ) : (
                          <span className="font-medium">EGP{size.originalPrice || 0}</span>
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
                  {selectedSize ? (
                    <div>
                      {selectedSize.originalPrice && selectedSize.discountedPrice && selectedSize.discountedPrice < selectedSize.originalPrice ? (
                        <>
                          <span className="line-through text-gray-400 text-lg block">EGP{selectedSize.originalPrice}</span>
                          <span className="text-xl font-medium text-red-600">EGP{selectedSize.discountedPrice}</span>
                        </>
                      ) : selectedSize.discountedPrice && selectedSize.discountedPrice < (selectedSize.originalPrice || 0) ? (
                        <span className="text-xl font-medium text-red-600">EGP{selectedSize.discountedPrice}</span>
                      ) : (
                        <span className="text-xl font-medium">EGP{selectedSize.originalPrice || 0}</span>
                      )}
                    </div>
                  ) : (
                    <span className="text-xl font-medium text-gray-400">Select a size</span>
                  )}
                </div>
                
                <Button 
                  onClick={addToCart} 
                  className="flex items-center bg-black hover:bg-gray-800 rounded-full px-6 py-5"
                  disabled={!selectedSize}
                  aria-label="Add to cart"
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Add to Cart
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
          )}
        </>
      )}

      {/* Hero Section */}
      <section className="pt-40 md:pt-32 pb-16 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <div className="relative">
              <h1 className="text-5xl md:text-6xl font-light tracking-wider mb-6 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent" style={{ fontFamily: 'var(--font-playfair-display), var(--font-crimson-text), "Playfair Display", "Crimson Text", "Bodoni Moda", "Bodoni MT", Didot, serif' }}>
               Collections
              </h1>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "200px" }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="h-1 bg-gradient-to-r from-purple-400 to-pink-400 mx-auto my-6 rounded-full"
              />
            </div>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed mb-8">
              Discover our carefully curated fragrances, each crafted to capture unique moments and express individual
              personalities.
            </p>
            <Button
              onClick={fetchProducts}
              variant="outline"
              size="lg"
              className="border-gray-300 text-gray-600 hover:bg-gray-50 mx-auto"
            >
              <RefreshCw className="h-5 w-5 mr-2" />
              Refresh All Products
            </Button>
          </motion.div>
        </div>
      </section>

      {/* For Him Collection */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <h2 className="text-4xl font-light tracking-wider bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent" style={{ fontFamily: 'var(--font-playfair-display), var(--font-crimson-text), "Playfair Display", "Crimson Text", "Bodoni Moda", "Bodoni MT", Didot, serif' }}>
                    For Him
                  </h2>
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: "100%" }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    viewport={{ once: true }}
                    className="h-0.5 bg-gradient-to-r from-purple-400 to-pink-400 mt-2 rounded-full"
                  />
                </div>
                <div className="hidden sm:block text-sm text-gray-500 font-light tracking-wide">
                  Masculine & Sophisticated
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Button
                  onClick={fetchProducts}
                  variant="outline"
                  size="sm"
                  className="border-gray-300 text-gray-600 hover:bg-gray-50"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <Link href="/products/men">
                  <Button
                    variant="outline"
                    className="border-black text-black hover:bg-black hover:text-white bg-transparent"
                  >
                    View All
                  </Button>
                </Link>
              </div>
            </div>

            {/* Mobile Carousel */}
            <div className="md:hidden">
              <div className="overflow-hidden" ref={emblaRefMen}>
                <div className="flex">
                  {categorizedProducts.men.map((product, index) => (
                    <div key={product._id} className="flex-[0_0_80%] min-w-0 pl-4 relative h-full">
                      <div className="group relative h-full">
                        {/* Favorite Button */}
                        <button
                          onClick={async (e) => {
                            e.stopPropagation()
                            await toggleFavorite(product)
                          }}
                          className="absolute top-4 right-4 z-10 p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors"
                          aria-label={isFavorite(product.id) ? "Remove from favorites" : "Add to favorites"}
                        >
                          <Heart 
                            className={`h-5 w-5 ${
                              isFavorite(product.id) 
                                ? "text-red-500 fill-red-500" 
                                : "text-gray-700"
                            }`} 
                          />
                        </button>
                        
                        {/* Badges */}
                        <div className="absolute top-4 left-4 z-10 space-y-2">
                          {product.isBestseller && (
                            <Badge className="bg-black text-white">Bestseller</Badge>
                          )}
                          {product.isNew && !product.isBestseller && (
                            <Badge variant="secondary">New</Badge>
                          )}
                        </div>
                        
                        {/* Product Card - Mobile Carousel */}
                        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 h-full mr-4">
                          <CardContent className="p-0 h-full flex flex-col">
                            <Link href={`/products/${product.category}/${product.id}`} className="block relative aspect-square flex-grow">
                              <div className="relative w-full h-full group-hover:scale-105 transition-transform duration-500">
                                <Image
                                  src={product.images[0] || "/placeholder.svg"}
                                  alt={product.name}
                                  fill
                                  className="object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none"></div>
                              </div>
                              <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                                <div className="flex items-center mb-1">
                                  <div className="flex items-center">
                                    {[...Array(5)].map((_, i) => (
                                      <Star
                                        key={i}
                                        className={`h-4 w-4 ${
                                          i < Math.floor(product.rating) 
                                            ? "fill-yellow-400 text-yellow-400" 
                                            : "text-gray-300"
                                        }`}
                                      />
                                    ))}
                                  </div>
                                  <span className="text-xs ml-2">
                                    ({product.rating.toFixed(1)})
                                  </span>
                                </div>

                                <h3 className="text-lg font-medium mb-1">
                                  {product.name}
                                </h3>
                                
                                <div className="flex items-center justify-between">
                                  <div className="text-left">
                                    {(() => {
                                      // Handle gift packages
                                      if (product.isGiftPackage) {
                                        const packagePrice = product.packagePrice || 0;
                                        const packageOriginalPrice = product.packageOriginalPrice || 0;
                                        
                                        if (packageOriginalPrice > 0 && packagePrice < packageOriginalPrice) {
                                          return (
                                            <>
                                              <span className="line-through text-gray-300 text-sm block">EGP{packageOriginalPrice}</span>
                                              <span className="text-lg font-light text-red-400">EGP{packagePrice}</span>
                                            </>
                                          );
                                        } else {
                                          return <span className="text-lg font-light">EGP{packagePrice}</span>;
                                        }
                                      }
                                      
                                      // Handle regular products
                                      if (getSmallestOriginalPrice(product.sizes) > 0 && getSmallestPrice(product.sizes) < getSmallestOriginalPrice(product.sizes)) {
                                        return (
                                      <>
                                        <span className="line-through text-gray-300 text-sm block">EGP{getSmallestOriginalPrice(product.sizes)}</span>
                                        <span className="text-lg font-light text-red-400">EGP{getSmallestPrice(product.sizes)}</span>
                                      </>
                                        );
                                      } else {
                                        return <span className="text-lg font-light">EGP{getSmallestPrice(product.sizes)}</span>;
                                      }
                                    })()}
                                  </div>
                                  
                                  <button 
                                    className="p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors"
                                    onClick={(e) => {
                                      e.preventDefault()
                                      e.stopPropagation()
                                      openSizeSelector(product)
                                    }}
                                    aria-label="Add to cart"
                                  >
                                    <ShoppingCart className="h-5 w-5" />
                                  </button>
                                </div>
                              </div>
                            </Link>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-center mt-4 md:hidden">
                {categorizedProducts.men.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => scrollToMen(index)}
                    className={`w-2 h-2 mx-1 rounded-full transition-colors ${
                      index === selectedIndexMen ? 'bg-black' : 'bg-gray-300'
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            </div>

            {/* Desktop Grid */}
            <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {categorizedProducts.men.map((product, index) => (
                <motion.div
                  key={product._id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <div className="group relative h-full">
                    {/* Favorite Button */}
                    <button
                      onClick={async (e) => {
                        e.stopPropagation()
                        await toggleFavorite(product)
                      }}
                      className="absolute top-4 right-4 z-10 p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors"
                      aria-label={isFavorite(product.id) ? "Remove from favorites" : "Add to favorites"}
                    >
                      <Heart 
                        className={`h-5 w-5 ${
                          isFavorite(product.id) 
                            ? "text-red-500 fill-red-500" 
                            : "text-gray-700"
                        }`} 
                      />
                    </button>
                    
                    {/* Badges */}
                    <div className="absolute top-4 left-4 z-10 space-y-2">
                      {product.isBestseller && (
                        <Badge className="bg-black text-white">Bestseller</Badge>
                      )}
                      {product.isNew && !product.isBestseller && (
                        <Badge variant="secondary">New</Badge>
                      )}
                    </div>
                    
                    {/* Product Card - Desktop Grid */}
                    <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 h-full">
                      <CardContent className="p-0 h-full flex flex-col">
                        <Link href={`/products/${product.category}/${product.id}`} className="block relative aspect-square flex-grow">
                          <div className="relative w-full h-full group-hover:scale-105 transition-transform duration-500">
                            <Image
                              src={product.images[0] || "/placeholder.svg"}
                              alt={product.name}
                              fill
                              className="object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none"></div>
                          </div>
                          <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                            <div className="flex items-center mb-1">
                              <div className="flex items-center">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-4 w-4 ${
                                      i < Math.floor(product.rating) 
                                        ? "fill-yellow-400 text-yellow-400" 
                                        : "text-gray-300"
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-xs ml-2">
                                ({product.rating.toFixed(1)})
                              </span>
                            </div>

                            <h3 className="text-lg font-medium mb-1">
                              {product.name}
                            </h3>
                            
                            <div className="flex items-center justify-between">
                              <div className="text-left">
                                {(() => {
                                  // Handle gift packages
                                  if (product.isGiftPackage) {
                                    const packagePrice = product.packagePrice || 0;
                                    const packageOriginalPrice = product.packageOriginalPrice || 0;
                                    
                                    if (packageOriginalPrice > 0 && packagePrice < packageOriginalPrice) {
                                      return (
                                        <>
                                          <span className="line-through text-gray-300 text-sm block">EGP{packageOriginalPrice}</span>
                                          <span className="text-lg font-light text-red-400">EGP{packagePrice}</span>
                                        </>
                                      );
                                    } else {
                                      return <span className="text-lg font-light">EGP{packagePrice}</span>;
                                    }
                                  }
                                  
                                  // Handle regular products
                                  if (getSmallestOriginalPrice(product.sizes) > 0 && getSmallestPrice(product.sizes) < getSmallestOriginalPrice(product.sizes)) {
                                    return (
                                  <>
                                    <span className="line-through text-gray-300 text-sm block">EGP{getSmallestOriginalPrice(product.sizes)}</span>
                                    <span className="text-lg font-light text-red-400">EGP{getSmallestPrice(product.sizes)}</span>
                                  </>
                                    );
                                  } else {
                                    return <span className="text-lg font-light">EGP{getSmallestPrice(product.sizes)}</span>;
                                  }
                                })()}
                              </div>
                              
                              <button 
                                className={`p-2 backdrop-blur-sm rounded-full transition-colors ${
                                  product.isGiftPackage 
                                    ? "bg-gradient-to-r from-gray-800/30 to-black/30 hover:from-gray-800/50 hover:to-black/50" 
                                    : "bg-white/20 hover:bg-white/30"
                                }`}
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  openSizeSelector(product)
                                }}
                                aria-label={product.isGiftPackage ? "Customize Package" : "Add to cart"}
                              >
                                {product.isGiftPackage ? (
                                  <Package className="h-4 w-4 sm:h-5 sm:w-5" />
                                ) : (
                                  <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
                                )}
                              </button>
                            </div>
                          </div>
                        </Link>
                      </CardContent>
                    </Card>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* For Her Collection */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <h2 className="text-4xl font-light tracking-wider bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent" style={{ fontFamily: 'var(--font-playfair-display), var(--font-crimson-text), "Playfair Display", "Crimson Text", "Bodoni Moda", "Bodoni MT", Didot, serif' }}>
                    For Her
                  </h2>
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: "100%" }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    viewport={{ once: true }}
                    className="h-0.5 bg-gradient-to-r from-purple-400 to-pink-400 mt-2 rounded-full"
                  />
                </div>
                <div className="hidden sm:block text-sm text-gray-500 font-light tracking-wide">
                  Elegant & Captivating
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Button
                  onClick={fetchProducts}
                  variant="outline"
                  size="sm"
                  className="border-gray-300 text-gray-600 hover:bg-gray-50"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <Link href="/products/women">
                  <Button
                    variant="outline"
                    className="border-black text-black hover:bg-black hover:text-white bg-transparent"
                  >
                    View All
                  </Button>
                </Link>
              </div>
            </div>

            {/* Mobile Carousel */}
            <div className="md:hidden">
              <div className="overflow-hidden" ref={emblaRefWomen}>
                <div className="flex">
                  {categorizedProducts.women.map((product, index) => (
                    <div key={product._id} className="flex-[0_0_80%] min-w-0 pl-4 relative h-full">
                      <div className="group relative h-full">
                        {/* Favorite Button */}
                        <button
                          onClick={async (e) => {
                            e.stopPropagation()
                            await toggleFavorite(product)
                          }}
                          className="absolute top-4 right-4 z-10 p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors"
                          aria-label={isFavorite(product.id) ? "Remove from favorites" : "Add to favorites"}
                        >
                          <Heart 
                            className={`h-5 w-5 ${
                              isFavorite(product.id) 
                                ? "text-red-500 fill-red-500" 
                                : "text-gray-700"
                            }`} 
                          />
                        </button>
                        
                        {/* Badges */}
                        <div className="absolute top-4 left-4 z-10 space-y-2">
                          {product.isBestseller && (
                            <Badge className="bg-black text-white">Bestseller</Badge>
                          )}
                          {product.isNew && !product.isBestseller && (
                            <Badge variant="secondary">New</Badge>
                          )}
                        </div>
                        
                        {/* Product Card - Women Mobile */}
                        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 h-full mr-4">
                          <CardContent className="p-0 h-full flex flex-col">
                            <Link href={`/products/${product.category}/${product.id}`} className="block relative aspect-square flex-grow">
                              <div className="relative w-full h-full group-hover:scale-105 transition-transform duration-500">
                                <Image
                                  src={product.images[0] || "/placeholder.svg"}
                                  alt={product.name}
                                  fill
                                  className="object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none"></div>
                              </div>
                              <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                                <div className="flex items-center mb-1">
                                  <div className="flex items-center">
                                    {[...Array(5)].map((_, i) => (
                                      <Star
                                        key={i}
                                        className={`h-4 w-4 ${
                                          i < Math.floor(product.rating) 
                                            ? "fill-yellow-400 text-yellow-400" 
                                            : "text-gray-300"
                                        }`}
                                      />
                                    ))}
                                  </div>
                                  <span className="text-xs ml-2">
                                    ({product.rating.toFixed(1)})
                                  </span>
                                </div>

                                <h3 className="text-lg font-medium mb-1">
                                  {product.name}
                                </h3>
                                
                                <div className="flex items-center justify-between">
                                  <div className="text-left">
                                    {(() => {
                                      // Handle gift packages
                                      if (product.isGiftPackage) {
                                        const packagePrice = product.packagePrice || 0;
                                        const packageOriginalPrice = product.packageOriginalPrice || 0;
                                        
                                        if (packageOriginalPrice > 0 && packagePrice < packageOriginalPrice) {
                                          return (
                                            <>
                                              <span className="line-through text-gray-300 text-sm block">EGP{packageOriginalPrice}</span>
                                              <span className="text-lg font-light text-red-400">EGP{packagePrice}</span>
                                            </>
                                          );
                                        } else {
                                          return <span className="text-lg font-light">EGP{packagePrice}</span>;
                                        }
                                      }
                                      
                                      // Handle regular products
                                      if (getSmallestOriginalPrice(product.sizes) > 0 && getSmallestPrice(product.sizes) < getSmallestOriginalPrice(product.sizes)) {
                                        return (
                                      <>
                                        <span className="line-through text-gray-300 text-sm block">EGP{getSmallestOriginalPrice(product.sizes)}</span>
                                        <span className="text-lg font-light text-red-400">EGP{getSmallestPrice(product.sizes)}</span>
                                      </>
                                        );
                                      } else {
                                        return <span className="text-lg font-light">EGP{getSmallestPrice(product.sizes)}</span>;
                                      }
                                    })()}
                                  </div>
                                  
                                  <button 
                                    className="p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors"
                                    onClick={(e) => {
                                      e.preventDefault()
                                      e.stopPropagation()
                                      openSizeSelector(product)
                                    }}
                                    aria-label="Add to cart"
                                  >
                                    <ShoppingCart className="h-5 w-5" />
                                  </button>
                                </div>
                              </div>
                            </Link>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-center mt-4 md:hidden">
                {categorizedProducts.women.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => scrollToWomen(index)}
                    className={`w-2 h-2 mx-1 rounded-full transition-colors ${
                      index === selectedIndexWomen ? 'bg-black' : 'bg-gray-300'
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            </div>

            {/* Desktop Grid */}
            <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {categorizedProducts.women.map((product, index) => (
                <motion.div
                  key={product._id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <div className="group relative h-full">
                    {/* Favorite Button */}
                    <button
                      onClick={async (e) => {
                        e.stopPropagation()
                        await toggleFavorite(product)
                      }}
                      className="absolute top-4 right-4 z-10 p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors"
                      aria-label={isFavorite(product.id) ? "Remove from favorites" : "Add to favorites"}
                    >
                      <Heart 
                        className={`h-5 w-5 ${
                          isFavorite(product.id) 
                            ? "text-red-500 fill-red-500" 
                            : "text-gray-700"
                        }`} 
                      />
                    </button>
                    
                    {/* Badges */}
                    <div className="absolute top-4 left-4 z-10 space-y-2">
                      {product.isBestseller && (
                        <Badge className="bg-black text-white">Bestseller</Badge>
                      )}
                      {product.isNew && !product.isBestseller && (
                        <Badge variant="secondary">New</Badge>
                      )}
                    </div>
                    
                    {/* Product Card - Women Desktop */}
                    <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 h-full">
                      <CardContent className="p-0 h-full flex flex-col">
                        <Link href={`/products/${product.category}/${product.id}`} className="block relative aspect-square flex-grow">
                          <div className="relative w-full h-full group-hover:scale-105 transition-transform duration-500">
                            <Image
                              src={product.images[0] || "/placeholder.svg"}
                              alt={product.name}
                              fill
                              className="object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none"></div>
                          </div>
                          <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                            <div className="flex items-center mb-1">
                              <div className="flex items-center">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-4 w-4 ${
                                      i < Math.floor(product.rating) 
                                        ? "fill-yellow-400 text-yellow-400" 
                                        : "text-gray-300"
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-xs ml-2">
                                ({product.rating.toFixed(1)})
                              </span>
                            </div>

                            <h3 className="text-lg font-medium mb-1">
                              {product.name}
                            </h3>
                            
                            <div className="flex items-center justify-between">
                              <div className="text-left">
                                {(() => {
                                  // Handle gift packages
                                  if (product.isGiftPackage) {
                                    const packagePrice = product.packagePrice || 0;
                                    const packageOriginalPrice = product.packageOriginalPrice || 0;
                                    
                                    if (packageOriginalPrice > 0 && packagePrice < packageOriginalPrice) {
                                      return (
                                        <>
                                          <span className="line-through text-gray-300 text-sm block">EGP{packageOriginalPrice}</span>
                                          <span className="text-lg font-light text-red-400">EGP{packagePrice}</span>
                                        </>
                                      );
                                    } else {
                                      return <span className="text-lg font-light">EGP{packagePrice}</span>;
                                    }
                                  }
                                  
                                  // Handle regular products
                                  if (getSmallestOriginalPrice(product.sizes) > 0 && getSmallestPrice(product.sizes) < getSmallestOriginalPrice(product.sizes)) {
                                    return (
                                  <>
                                    <span className="line-through text-gray-300 text-sm block">EGP{getSmallestOriginalPrice(product.sizes)}</span>
                                    <span className="text-lg font-light text-red-400">EGP{getSmallestPrice(product.sizes)}</span>
                                  </>
                                    );
                                  } else {
                                    return <span className="text-lg font-light">EGP{getSmallestPrice(product.sizes)}</span>;
                                  }
                                })()}
                              </div>
                              
                              <button 
                                className={`p-2 backdrop-blur-sm rounded-full transition-colors ${
                                  product.isGiftPackage 
                                    ? "bg-gradient-to-r from-gray-800/30 to-black/30 hover:from-gray-800/50 hover:to-black/50" 
                                    : "bg-white/20 hover:bg-white/30"
                                }`}
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  openSizeSelector(product)
                                }}
                                aria-label={product.isGiftPackage ? "Customize Package" : "Add to cart"}
                              >
                                {product.isGiftPackage ? (
                                  <Package className="h-4 w-4 sm:h-5 sm:w-5" />
                                ) : (
                                  <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
                                )}
                              </button>
                            </div>
                          </div>
                        </Link>
                      </CardContent>
                    </Card>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Bundles */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <h2 className="text-4xl font-light tracking-wider bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent" style={{ fontFamily: 'var(--font-playfair-display), var(--font-crimson-text), "Playfair Display", "Crimson Text", "Bodoni Moda", "Bodoni MT", Didot, serif' }}>
                    Bundles
                  </h2>
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: "100%" }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    viewport={{ once: true }}
                    className="h-0.5 bg-gradient-to-r from-purple-400 to-pink-400 mt-2 rounded-full"
                  />
                </div>
                <div className="hidden sm:block text-sm text-gray-500 font-light tracking-wide">
                  Curated Collections
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Button
                  onClick={fetchProducts}
                  variant="outline"
                  size="sm"
                  className="border-gray-300 text-gray-600 hover:bg-gray-50"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <Link href="/products/packages">
                  <Button
                    variant="outline"
                    className="border-black text-black hover:bg-black hover:text-white bg-transparent"
                  >
                    View All
                  </Button>
                </Link>
              </div>
            </div>

            {/* Mobile Carousel */}
            <div className="md:hidden">
              <div className="overflow-hidden" ref={emblaRefPackages}>
                <div className="flex">
                  {categorizedProducts.packages.map((product, index) => (
                    <div key={product._id} className="flex-[0_0_80%] min-w-0 pl-4 relative h-full">
                      <div className="group relative h-full">
                        {/* Favorite Button */}
                        <button
                          onClick={async (e) => {
                            e.stopPropagation()
                            await toggleFavorite(product)
                          }}
                          className="absolute top-4 right-4 z-10 p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors"
                          aria-label={isFavorite(product.id) ? "Remove from favorites" : "Add to favorites"}
                        >
                          <Heart 
                            className={`h-5 w-5 ${
                              isFavorite(product.id) 
                                ? "text-red-500 fill-red-500" 
                                : "text-gray-700"
                            }`} 
                          />
                        </button>
                        
                        {/* Badges */}
                        <div className="absolute top-4 left-4 z-10 space-y-2">
                          {product.isBestseller && (
                            <Badge className="bg-black text-white">Bestseller</Badge>
                          )}
                          {product.isNew && !product.isBestseller && (
                            <Badge variant="secondary">New</Badge>
                          )}
                        </div>
                        
                        {/* Product Card - Packages Mobile */}
                        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 h-full mr-4">
                          <CardContent className="p-0 h-full flex flex-col">
                            <Link href={`/products/${product.category}/${product.id}`} className="block relative aspect-square flex-grow">
                              <div className="relative w-full h-full group-hover:scale-105 transition-transform duration-500">
                                <Image
                                  src={product.images[0] || "/placeholder.svg"}
                                  alt={product.name}
                                  fill
                                  className="object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none"></div>
                              </div>
                              <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                                <div className="flex items-center mb-1">
                                  <div className="flex items-center">
                                    {[...Array(5)].map((_, i) => (
                                      <Star
                                        key={i}
                                        className={`h-4 w-4 ${
                                          i < Math.floor(product.rating) 
                                            ? "fill-yellow-400 text-yellow-400" 
                                            : "text-gray-300"
                                        }`}
                                      />
                                    ))}
                                  </div>
                                  <span className="text-xs ml-2">
                                    ({product.rating.toFixed(1)})
                                  </span>
                                </div>

                                <h3 className="text-lg font-medium mb-1">
                                  {product.name}
                                </h3>
                                
                                <div className="flex items-center justify-between">
                                  <div className="text-left">
                                    {(() => {
                                      // Handle gift packages
                                      if (product.isGiftPackage) {
                                        const packagePrice = product.packagePrice || 0;
                                        const packageOriginalPrice = product.packageOriginalPrice || 0;
                                        
                                        if (packageOriginalPrice > 0 && packagePrice < packageOriginalPrice) {
                                          return (
                                            <>
                                              <span className="line-through text-gray-300 text-sm block">EGP{packageOriginalPrice}</span>
                                              <span className="text-lg font-light text-red-400">EGP{packagePrice}</span>
                                            </>
                                          );
                                        } else {
                                          return <span className="text-lg font-light">EGP{packagePrice}</span>;
                                        }
                                      }
                                      
                                      // Handle regular products
                                      if (getSmallestOriginalPrice(product.sizes) > 0 && getSmallestPrice(product.sizes) < getSmallestOriginalPrice(product.sizes)) {
                                        return (
                                      <>
                                        <span className="line-through text-gray-300 text-sm block">EGP{getSmallestOriginalPrice(product.sizes)}</span>
                                        <span className="text-lg font-light text-red-400">EGP{getSmallestPrice(product.sizes)}</span>
                                      </>
                                        );
                                      } else {
                                        return <span className="text-lg font-light">EGP{getSmallestPrice(product.sizes)}</span>;
                                      }
                                    })()}
                                  </div>
                                  
                                  <button 
                                    className="p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors"
                                    onClick={(e) => {
                                      e.preventDefault()
                                      e.stopPropagation()
                                      openSizeSelector(product)
                                    }}
                                    aria-label="Add to cart"
                                  >
                                    <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
                                  </button>
                                </div>
                              </div>
                            </Link>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-center mt-4 md:hidden">
                {categorizedProducts.packages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => scrollToPackages(index)}
                    className={`w-2 h-2 mx-1 rounded-full transition-colors ${
                      index === selectedIndexPackages ? 'bg-black' : 'bg-gray-300'
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            </div>

            {/* Desktop Grid */}
            <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {categorizedProducts.packages.map((product, index) => (
                <motion.div
                  key={product._id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <div className="group relative h-full">
                    {/* Favorite Button */}
                    <button
                      onClick={async (e) => {
                        e.stopPropagation()
                        await toggleFavorite(product)
                      }}
                      className="absolute top-4 right-4 z-10 p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors"
                      aria-label={isFavorite(product.id) ? "Remove from favorites" : "Add to favorites"}
                    >
                      <Heart 
                        className={`h-5 w-5 ${
                          isFavorite(product.id) 
                            ? "text-red-500 fill-red-500" 
                            : "text-gray-700"
                        }`} 
                      />
                    </button>
                    
                    {/* Badges */}
                    <div className="absolute top-4 left-4 z-10 space-y-2">
                      {product.isBestseller && (
                        <Badge className="bg-black text-white">Bestseller</Badge>
                      )}
                      {product.isNew && !product.isBestseller && (
                        <Badge variant="secondary">New</Badge>
                      )}
                    </div>
                    
                    {/* Product Card - Packages Desktop */}
                    <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 h-full">
                      <CardContent className="p-0 h-full flex flex-col">
                        <Link href={`/products/${product.category}/${product.id}`} className="block relative aspect-square flex-grow">
                          <div className="relative w-full h-full group-hover:scale-105 transition-transform duration-500">
                            <Image
                              src={product.images[0] || "/placeholder.svg"}
                              alt={product.name}
                              fill
                              className="object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none"></div>
                          </div>
                          <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                            <div className="flex items-center mb-1">
                              <div className="flex items-center">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-4 w-4 ${
                                      i < Math.floor(product.rating) 
                                        ? "fill-yellow-400 text-yellow-400" 
                                        : "text-gray-300"
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-xs ml-2">
                                ({product.rating.toFixed(1)})
                              </span>
                            </div>

                            <h3 className="text-lg font-medium mb-1">
                              {product.name}
                            </h3>
                            
                            <div className="flex items-center justify-between">
                              <div className="text-left">
                                {(() => {
                                  // Handle gift packages
                                  if (product.isGiftPackage) {
                                    const packagePrice = product.packagePrice || 0;
                                    const packageOriginalPrice = product.packageOriginalPrice || 0;
                                    
                                    if (packageOriginalPrice > 0 && packagePrice < packageOriginalPrice) {
                                      return (
                                        <>
                                          <span className="line-through text-gray-300 text-sm block">EGP{packageOriginalPrice}</span>
                                          <span className="text-lg font-light text-red-400">EGP{packagePrice}</span>
                                        </>
                                      );
                                    } else {
                                      return <span className="text-lg font-light">EGP{packagePrice}</span>;
                                    }
                                  }
                                  
                                  // Handle regular products
                                  if (getSmallestOriginalPrice(product.sizes) > 0 && getSmallestPrice(product.sizes) < getSmallestOriginalPrice(product.sizes)) {
                                    return (
                                  <>
                                    <span className="line-through text-gray-300 text-sm block">EGP{getSmallestOriginalPrice(product.sizes)}</span>
                                    <span className="text-lg font-light text-red-400">EGP{getSmallestPrice(product.sizes)}</span>
                                  </>
                                    );
                                  } else {
                                    return <span className="text-lg font-light">EGP{getSmallestPrice(product.sizes)}</span>;
                                  }
                                })()}
                              </div>
                              
                              <button 
                                className={`p-2 backdrop-blur-sm rounded-full transition-colors ${
                                  product.isGiftPackage 
                                    ? "bg-gradient-to-r from-gray-800/30 to-black/30 hover:from-gray-800/50 hover:to-black/50" 
                                    : "bg-white/20 hover:bg-white/30"
                                }`}
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  openSizeSelector(product)
                                }}
                                aria-label={product.isGiftPackage ? "Customize Package" : "Add to cart"}
                              >
                                {product.isGiftPackage ? (
                                  <Package className="h-4 w-4 sm:h-5 sm:w-5" />
                                ) : (
                                  <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
                                )}
                              </button>
                            </div>
                          </div>
                        </Link>
                      </CardContent>
                    </Card>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Outlet Collection */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <h2 className="text-4xl font-light tracking-wider bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent" style={{ fontFamily: 'var(--font-playfair-display), var(--font-crimson-text), "Playfair Display", "Crimson Text", "Bodoni Moda", "Bodoni MT", Didot, serif' }}>
                    Outlets
                  </h2>
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: "100%" }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    viewport={{ once: true }}
                    className="h-0.5 bg-gradient-to-r from-purple-400 to-pink-400 mt-2 rounded-full"
                  />
                </div>
                <div className="hidden sm:block text-sm text-gray-500 font-light tracking-wide">
                  Special Deals & Discounts
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Button
                  onClick={fetchProducts}
                  variant="outline"
                  size="sm"
                  className="border-gray-300 text-gray-600 hover:bg-gray-50"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <Link href="/products/outlet">
                  <Button
                    variant="outline"
                    className="border-black text-black hover:bg-black hover:text-white bg-transparent"
                  >
                    View All
                  </Button>
                </Link>
              </div>
            </div>

            {/* Mobile Carousel */}
            <div className="md:hidden">
              <div className="overflow-hidden" ref={emblaRefOutlet}>
                <div className="flex">
                  {categorizedProducts.outlet.map((product, index) => (
                    <div key={product._id} className="flex-[0_0_80%] min-w-0 pl-4 relative h-full">
                      <div className="group relative h-full">
                        {/* Favorite Button */}
                        <button
                          onClick={async (e) => {
                            e.stopPropagation()
                            await toggleFavorite(product)
                          }}
                          className="absolute top-4 right-4 z-10 p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors"
                          aria-label={isFavorite(product.id) ? "Remove from favorites" : "Add to favorites"}
                        >
                          <Heart 
                            className={`h-5 w-5 ${
                              isFavorite(product.id) 
                                ? "text-red-500 fill-red-500" 
                                : "text-gray-700"
                            }`} 
                          />
                        </button>
                        
                        {/* Badges */}
                        <div className="absolute top-4 left-4 z-10 space-y-2">
                          {product.isBestseller && (
                            <Badge className="bg-black text-white">Bestseller</Badge>
                          )}
                          {product.isNew && !product.isBestseller && (
                            <Badge variant="secondary">New</Badge>
                          )}
                        </div>
                        
                        {/* Product Card - Outlet Mobile */}
                        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 h-full mr-4">
                          <CardContent className="p-0 h-full flex flex-col">
                            <Link href={`/products/${product.category}/${product.id}`} className="block relative aspect-square flex-grow">
                              <div className="relative w-full h-full group-hover:scale-105 transition-transform duration-500">
                                <Image
                                  src={product.images[0] || "/placeholder.svg"}
                                  alt={product.name}
                                  fill
                                  className="object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none"></div>
                              </div>
                              <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                                <div className="flex items-center mb-1">
                                  <div className="flex items-center">
                                    {[...Array(5)].map((_, i) => (
                                      <Star
                                        key={i}
                                        className={`h-4 w-4 ${
                                          i < Math.floor(product.rating) 
                                            ? "fill-yellow-400 text-yellow-400" 
                                            : "text-gray-300"
                                        }`}
                                      />
                                    ))}
                                  </div>
                                  <span className="text-xs ml-2">
                                    ({product.rating.toFixed(1)})
                                  </span>
                                </div>

                                <h3 className="text-lg font-medium mb-1">
                                  {product.name}
                                </h3>
                                
                                <div className="flex items-center justify-between">
                                  <div className="text-left">
                                    {(() => {
                                      // Handle gift packages
                                      if (product.isGiftPackage) {
                                        const packagePrice = product.packagePrice || 0;
                                        const packageOriginalPrice = product.packageOriginalPrice || 0;
                                        
                                        if (packageOriginalPrice > 0 && packagePrice < packageOriginalPrice) {
                                          return (
                                            <>
                                              <span className="line-through text-gray-300 text-sm block">EGP{packageOriginalPrice}</span>
                                              <span className="text-lg font-light text-red-400">EGP{packagePrice}</span>
                                            </>
                                          );
                                        } else {
                                          return <span className="text-lg font-light">EGP{packagePrice}</span>;
                                        }
                                      }
                                      
                                      // Handle regular products
                                      if (getSmallestOriginalPrice(product.sizes) > 0 && getSmallestPrice(product.sizes) < getSmallestOriginalPrice(product.sizes)) {
                                        return (
                                      <>
                                        <span className="line-through text-gray-300 text-sm block">EGP{getSmallestOriginalPrice(product.sizes)}</span>
                                        <span className="text-lg font-light text-red-400">EGP{getSmallestPrice(product.sizes)}</span>
                                      </>
                                        );
                                      } else {
                                        return <span className="text-lg font-light">EGP{getSmallestPrice(product.sizes)}</span>;
                                      }
                                    })()}
                                  </div>
                                  
                                  <button 
                                    className="p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors"
                                    onClick={(e) => {
                                      e.preventDefault()
                                      e.stopPropagation()
                                      openSizeSelector(product)
                                    }}
                                    aria-label="Add to cart"
                                  >
                                    <ShoppingCart className="h-5 w-5" />
                                  </button>
                                </div>
                              </div>
                            </Link>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-center mt-4 md:hidden">
                {categorizedProducts.outlet.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => scrollToOutlet(index)}
                    className={`w-2 h-2 mx-1 rounded-full transition-colors ${
                      index === selectedIndexOutlet ? 'bg-black' : 'bg-gray-300'
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            </div>

            {/* Desktop Grid */}
            <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {categorizedProducts.outlet.map((product, index) => (
                <motion.div
                  key={product._id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <div className="group relative h-full">
                    {/* Favorite Button */}
                    <button
                      onClick={async (e) => {
                        e.stopPropagation()
                        await toggleFavorite(product)
                      }}
                      className="absolute top-4 right-4 z-10 p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors"
                      aria-label={isFavorite(product.id) ? "Remove from favorites" : "Add to favorites"}
                    >
                      <Heart 
                        className={`h-5 w-5 ${
                          isFavorite(product.id) 
                            ? "text-red-500 fill-red-500" 
                            : "text-gray-700"
                        }`} 
                      />
                    </button>
                    
                    {/* Badges */}
                    <div className="absolute top-4 left-4 z-10 space-y-2">
                      {product.isBestseller && (
                        <Badge className="bg-black text-white">Bestseller</Badge>
                      )}
                      {product.isNew && !product.isBestseller && (
                        <Badge variant="secondary">New</Badge>
                      )}
                    </div>
                    
                    {/* Product Card - Outlet Desktop */}
                    <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 h-full">
                      <CardContent className="p-0 h-full flex flex-col">
                        <Link href={`/products/${product.category}/${product.id}`} className="block relative aspect-square flex-grow">
                          <div className="relative w-full h-full group-hover:scale-105 transition-transform duration-500">
                            <Image
                              src={product.images[0] || "/placeholder.svg"}
                              alt={product.name}
                              fill
                              className="object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none"></div>
                          </div>
                          <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                            <div className="flex items-center mb-1">
                              <div className="flex items-center">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-4 w-4 ${
                                      i < Math.floor(product.rating) 
                                        ? "fill-yellow-400 text-yellow-400" 
                                        : "text-gray-300"
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-xs ml-2">
                                ({product.rating.toFixed(1)})
                              </span>
                            </div>

                            <h3 className="text-lg font-medium mb-1">
                              {product.name}
                            </h3>
                            
                            <div className="flex items-center justify-between">
                              <div className="text-left">
                                {(() => {
                                  // Handle gift packages
                                  if (product.isGiftPackage) {
                                    const packagePrice = product.packagePrice || 0;
                                    const packageOriginalPrice = product.packageOriginalPrice || 0;
                                    
                                    if (packageOriginalPrice > 0 && packagePrice < packageOriginalPrice) {
                                      return (
                                        <>
                                          <span className="line-through text-gray-300 text-sm block">EGP{packageOriginalPrice}</span>
                                          <span className="text-lg font-light text-red-400">EGP{packagePrice}</span>
                                        </>
                                      );
                                    } else {
                                      return <span className="text-lg font-light">EGP{packagePrice}</span>;
                                    }
                                  }
                                  
                                  // Handle regular products
                                  if (getSmallestOriginalPrice(product.sizes) > 0 && getSmallestPrice(product.sizes) < getSmallestOriginalPrice(product.sizes)) {
                                    return (
                                  <>
                                    <span className="line-through text-gray-300 text-sm block">EGP{getSmallestOriginalPrice(product.sizes)}</span>
                                    <span className="text-lg font-light text-red-400">EGP{getSmallestPrice(product.sizes)}</span>
                                  </>
                                    );
                                  } else {
                                    return <span className="text-lg font-light">EGP{getSmallestPrice(product.sizes)}</span>;
                                  }
                                })()}
                              </div>
                              
                              <button 
                                className={`p-2 backdrop-blur-sm rounded-full transition-colors ${
                                  product.isGiftPackage 
                                    ? "bg-gradient-to-r from-gray-800/30 to-black/30 hover:from-gray-800/50 hover:to-black/50" 
                                    : "bg-white/20 hover:bg-white/30"
                                }`}
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  openSizeSelector(product)
                                }}
                                aria-label={product.isGiftPackage ? "Customize Package" : "Add to cart"}
                              >
                                {product.isGiftPackage ? (
                                  <Package className="h-4 w-4 sm:h-5 sm:w-5" />
                                ) : (
                                  <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
                                )}
                              </button>
                            </div>
                          </div>
                        </Link>
                      </CardContent>
                    </Card>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Gift Package Selector Modal */}
      {showGiftPackageSelector && selectedProduct && (
        <GiftPackageSelector
          product={selectedProduct}
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
      <motion.footer 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 1.2 }}
        viewport={{ once: true, amount: 0.3 }}
        className="bg-black text-white py-12"
      >
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            <motion.div 
              className="space-y-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <Image src="/logo-white.png" alt="Sense Fragrances" width={150} height={100} className="h-16 w-auto" />
              <p className="text-gray-400 text-sm">
                Crafting exceptional fragrances that capture the essence of elegance.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
            >
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
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
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
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
            >
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
            </motion.div>
          </div>

          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
            className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400"
          >
            <p>&copy; 2025 Sense Fragrances. All rights reserved.</p>
          </motion.div>
        </div>
      </motion.footer>

      {/* Decorative floating elements */}
      <motion.div
        animate={{ y: [0, -15, 0], rotate: [0, 5, 0] }}
        transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        className="fixed bottom-8 left-8 z-10"
      >
        <Sparkles className="h-6 w-6 text-purple-400" />
      </motion.div>
      
      <motion.div
        animate={{ y: [0, 15, 0], rotate: [0, -5, 0] }}
        transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        className="fixed top-1/4 right-8 z-10"
      >
        <Sparkles className="h-4 w-4 text-pink-400" />
      </motion.div>
    </>
  )
}
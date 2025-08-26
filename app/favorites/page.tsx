"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Heart, ShoppingCart, Trash2, ArrowLeft, Star, X } from "lucide-react"
import { Navigation } from "@/components/navigation"
import { useFavorites } from "@/lib/favorites-context"
import { useCart } from "@/lib/cart-context"

interface FavoriteItem {
  id: string
  name: string
  price: number
  image: string
  category: string
  rating?: number
  isNew?: boolean
  isBestseller?: boolean
  sizes?: Array<{
    size: string
    volume: string
    originalPrice?: number
    discountedPrice?: number
  }>
}

export default function FavoritesPage() {
  const { state: favoritesState, removeFromFavorites, clearFavorites } = useFavorites()
  const { dispatch: cartDispatch } = useCart()
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<FavoriteItem | null>(null)
  const [showSizeSelector, setShowSizeSelector] = useState(false)
  const [selectedSize, setSelectedSize] = useState<any>(null)
  const [quantity, setQuantity] = useState(1)

  const addToCart = (item: FavoriteItem) => {
    cartDispatch({
      type: "ADD_ITEM",
      payload: {
        id: item.id,
        name: item.name,
        price: item.price,
        size: "Standard",
        volume: "50ml",
        image: item.image,
        category: item.category,
        productId: "",
        quantity: quantity
      },
    })
  }

  const openSizeSelector = (product: FavoriteItem) => {
    setSelectedProduct(product)
    setSelectedSize(null)
    setShowSizeSelector(true)
    setQuantity(1)
  }

  const closeSizeSelector = () => {
    setShowSizeSelector(false)
    setSelectedProduct(null)
    setSelectedSize(null)
  }

  const addToCartWithSize = (product: FavoriteItem, size: any) => {
    cartDispatch({
      type: "ADD_ITEM",
      payload: {
        id: `${product.id}-${size.size}`,
        productId: product.id,
        name: product.name,
        price: size.discountedPrice || size.originalPrice || 0,
        originalPrice: size.originalPrice,
        size: size.size,
        volume: size.volume,
        image: product.image,
        category: product.category,
        quantity: quantity
      },
    })
    setShowSizeSelector(false)
  }

  const handleClearFavorites = () => {
    clearFavorites()
    setShowClearConfirm(false)
  }

  // Helper function to get smallest price from sizes
  const getSmallestPrice = (sizes: any[]) => {
    if (!sizes || sizes.length === 0) return 0
    const prices = sizes.map(size => size.discountedPrice || size.originalPrice || 0)
    return Math.min(...prices.filter(price => price > 0))
  }

  // Helper function to get smallest original price from sizes
  const getSmallestOriginalPrice = (sizes: any[]) => {
    if (!sizes || sizes.length === 0) return 0
    const prices = sizes.map(size => size.originalPrice || 0)
    return Math.min(...prices.filter(price => price > 0))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      {/* Enhanced Size Selector Modal */}
      {showSizeSelector && selectedProduct && (
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
                      removeFromFavorites(selectedProduct.id)
                    }}
                    className="mr-2 p-1.5 bg-white/80 backdrop-blur-sm rounded-full shadow-md hover:bg-gray-100 transition-colors"
                    aria-label="Remove from favorites"
                  >
                    <Heart 
                      className="h-5 w-5 text-red-500 fill-red-500"
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
                    src={selectedProduct.image || "/placeholder.svg"}
                    alt={selectedProduct.name}
                    fill
                    className="rounded-lg object-cover"
                  />
                </div>
                <div>
                  <p className="text-gray-600 text-sm line-clamp-2">
                    Choose your preferred size
                  </p>
                  <div className="flex items-center mt-1">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < Math.floor(selectedProduct.rating || 4) 
                              ? "fill-yellow-400 text-yellow-400" 
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-gray-600 ml-2">
                      ({(selectedProduct.rating || 4).toFixed(1)})
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="mb-6">
                <h4 className="font-medium mb-3">Available Sizes</h4>
                <div className="grid grid-cols-3 gap-3">
                  {selectedProduct.sizes?.map((size) => (
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
                      <div className="text-xs mt-1 font-medium">
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
                  <div className="text-xl font-medium ml-2">
                    {selectedSize ? (
                      selectedSize.originalPrice && selectedSize.discountedPrice && 
                      selectedSize.discountedPrice < selectedSize.originalPrice ? (
                        <>
                          <span className="line-through text-gray-400 mr-2 text-lg">EGP{selectedSize.originalPrice}</span>
                          <span className="text-red-600 font-bold">EGP{selectedSize.discountedPrice}</span>
                        </>
                      ) : (
                        <>EGP{selectedSize.discountedPrice || selectedSize.originalPrice || 0}</>
                      )
                    ) : (
                      <>EGP{getSmallestPrice(selectedProduct.sizes || [])}</>
                    )}
                  </div>
                </div>
                
                <Button 
                  onClick={() => selectedSize && addToCartWithSize(selectedProduct, selectedSize)} 
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
      
      <section className="pt-24 pb-16">
        <div className="container mx-auto px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-8"
          >
            <Link href="/" className="inline-flex items-center text-gray-600 hover:text-black mb-6 transition-colors">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>

            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-light tracking-wider mb-2">My Favorites</h1>
                <p className="text-gray-600">
                  {favoritesState.count === 0
                    ? "You haven't added any favorites yet"
                    : `${favoritesState.count} item${favoritesState.count === 1 ? "" : "s"} in your favorites`}
                </p>
              </div>

              {favoritesState.count > 0 && (
                <div className="flex items-center space-x-4">
                  {!showClearConfirm ? (
                    <Button
                      variant="outline"
                      onClick={() => setShowClearConfirm(true)}
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear All
                    </Button>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">Are you sure?</span>
                      <Button size="sm" variant="outline" onClick={() => setShowClearConfirm(false)}>
                        Cancel
                      </Button>
                      <Button size="sm" onClick={handleClearFavorites} className="bg-red-600 hover:bg-red-700">
                        Clear All
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>

          {favoritesState.count === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="text-center py-16"
            >
              <Heart className="h-24 w-24 text-gray-300 mx-auto mb-6" />
              <h2 className="text-2xl font-light tracking-wider mb-4">No Favorites Yet</h2>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Start exploring our collection and add your favorite fragrances to this list for easy access.
              </p>
              <Link href="/products">
                <Button className="bg-black text-white hover:bg-gray-800">Explore Fragrances</Button>
              </Link>
            </motion.div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {favoritesState.items.map((item: FavoriteItem, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                >
                  <div className="group relative h-full">
                    {/* Remove from Favorites Button */}
                    <button
                      onClick={() => removeFromFavorites(item.id)}
                      className="absolute top-4 right-4 z-10 p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors"
                      aria-label="Remove from favorites"
                    >
                      <Heart className="h-5 w-5 text-red-500 fill-red-500" />
                    </button>
                    
                    {/* Badges */}
                    <div className="absolute top-4 left-4 z-10 space-y-2">
                      {item.isBestseller && (
                        <Badge className="bg-black text-white">Bestseller</Badge>
                      )}
                      {item.isNew && !item.isBestseller && (
                        <Badge variant="secondary">New</Badge>
                      )}
                    </div>
                    
                    {/* Product Card */}
                    <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 h-full">
                      <CardContent className="p-0 h-full flex flex-col">
                        <Link href={`/products/${item.category}/${item.id}`} className="block relative aspect-square flex-grow">
                          <Image
                            src={item.image || "/placeholder.svg"}
                            alt={item.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                            onError={(e) => {
                              console.error(`Failed to load image for ${item.name}:`, item.image);
                              console.error('Image error details:', e);
                              // Fallback to placeholder if image fails to load
                              const target = e.target as HTMLImageElement;
                              target.src = "/placeholder.svg";
                            }}
                            onLoad={() => {
                              console.log(`Successfully loaded image for ${item.name}:`, item.image);
                            }}
                            unoptimized={item.image?.startsWith('http')} // Don't optimize external URLs
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                          <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                            <div className="flex items-center mb-1">
                              <div className="flex items-center">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-4 w-4 ${
                                      i < Math.floor(item.rating || 4) 
                                        ? "fill-yellow-400 text-yellow-400" 
                                        : "text-gray-300"
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-xs ml-2">
                                ({(item.rating || 4).toFixed(1)})
                              </span>
                            </div>

                            <h3 className="text-lg font-medium mb-1">
                              {item.name}
                            </h3>
                            
                            <div className="flex items-center justify-between">
                              <div className="text-lg font-light">
                                {item.sizes && item.sizes.length > 0 ? (
                                  (() => {
                                    const smallestPrice = getSmallestPrice(item.sizes);
                                    const smallestOriginalPrice = getSmallestOriginalPrice(item.sizes);
                                    
                                    if (smallestOriginalPrice > 0 && smallestPrice < smallestOriginalPrice) {
                                      return (
                                        <>
                                          <span className="line-through text-gray-300 mr-2 text-base">EGP{smallestOriginalPrice}</span>
                                          <span className="text-red-500 font-bold">EGP{smallestPrice}</span>
                                        </>
                                      );
                                    } else {
                                      return <>EGP{smallestPrice}</>;
                                    }
                                  })()
                                ) : (
                                  <>EGP {item.price}</>
                                )}
                              </div>
                              
                              <button 
                                className="p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors"
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  if (item.sizes && item.sizes.length > 0) {
                                    openSizeSelector(item)
                                  } else {
                                    addToCart(item)
                                  }
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
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

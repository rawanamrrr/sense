"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Heart, ShoppingCart, Trash2, ArrowLeft, Star, X, Sparkles, Package } from "lucide-react"
import { Navigation } from "@/components/navigation"
import { useFavorites } from "@/lib/favorites-context"
import { useCart } from "@/lib/cart-context"
import { GiftPackageSelector } from "@/components/gift-package-selector"

interface FavoriteItem {
  id: string
  name: string
  price: number
  image: string
  category: string
  rating?: number
  isNew?: boolean
  isBestseller?: boolean
  // Gift package fields
  isGiftPackage?: boolean
  packagePrice?: number
  packageOriginalPrice?: number
  giftPackageSizes?: any[]
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
  const [showGiftPackageSelector, setShowGiftPackageSelector] = useState(false)

  const addToCart = (item: FavoriteItem) => {
    // For gift packages, we need to open the gift package selector instead of directly adding to cart
    if (item.isGiftPackage) {
      setSelectedProduct(item)
      setShowGiftPackageSelector(true)
      return
    }
    
    // For regular products without sizes, add directly to cart
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
        productId: item.id,
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
    // For gift packages, use package price; for regular products, use size price
    const price = product.isGiftPackage && product.packagePrice 
      ? product.packagePrice 
      : (size.discountedPrice || size.originalPrice || 0);
      
    cartDispatch({
      type: "ADD_ITEM",
      payload: {
        id: `${product.id}-${size.size}`,
        productId: product.id,
        name: product.name,
        price: price,
        originalPrice: product.isGiftPackage ? product.packageOriginalPrice : size.originalPrice,
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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
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
            className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl relative"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Purple transparent rectangles */}
            <motion.div 
              className="absolute -inset-4 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-lg -z-10"
              animate={{
                rotate: [0, 2, 0, -2, 0],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <motion.div 
              className="absolute -inset-2 bg-gradient-to-r from-purple-300/30 to-pink-300/30 rounded-lg -z-10"
              animate={{
                rotate: [0, -1, 0, 1, 0],
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            
            <div className="p-6 relative z-10">
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
                            selectedProduct.rating && selectedProduct.rating > 0 && i < Math.floor(selectedProduct.rating)
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-gray-600 ml-2">
                      ({selectedProduct.rating ? selectedProduct.rating.toFixed(1) : '0.0'})
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
                        {(() => {
                          // Handle gift packages - show package price instead of size price
                          if (selectedProduct?.isGiftPackage) {
                            const packagePrice = selectedProduct.packagePrice || 0;
                            const packageOriginalPrice = selectedProduct.packageOriginalPrice || 0;
                            
                            if (packageOriginalPrice > 0 && packagePrice < packageOriginalPrice) {
                              return (
                                <>
                                  <span className="line-through text-gray-400">EGP{packageOriginalPrice}</span>
                                  <br />
                                  <span className="text-red-600">EGP{packagePrice}</span>
                                </>
                              );
                            } else {
                              return <>EGP{packagePrice}</>;
                            }
                          }
                          
                          // Handle regular products with size pricing
                          if (size.originalPrice && size.discountedPrice && 
                              size.discountedPrice < size.originalPrice) {
                            return (
                              <>
                                <span className="line-through text-gray-400">EGP{size.originalPrice}</span>
                                <br />
                                <span className="text-red-600">EGP{size.discountedPrice}</span>
                              </>
                            );
                          } else {
                            return <>EGP{size.discountedPrice || size.originalPrice || 0}</>;
                          }
                        })()}
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
                    {(() => {
                      // Handle gift packages
                      if (selectedProduct?.isGiftPackage) {
                        const packagePrice = selectedProduct.packagePrice || 0;
                        const packageOriginalPrice = selectedProduct.packageOriginalPrice || 0;
                        
                        if (packageOriginalPrice > 0 && packagePrice < packageOriginalPrice) {
                          return (
                            <>
                              <span className="line-through text-gray-400 mr-2 text-lg">EGP{packageOriginalPrice}</span>
                              <span className="text-red-600 font-bold">EGP{packagePrice}</span>
                            </>
                          );
                        } else {
                          return <>EGP{packagePrice}</>;
                        }
                      }
                      
                      // Handle regular products with selected size
                      if (selectedSize) {
                        if (selectedSize.originalPrice && selectedSize.discountedPrice && 
                            selectedSize.discountedPrice < selectedSize.originalPrice) {
                          return (
                            <>
                              <span className="line-through text-gray-400 mr-2 text-lg">EGP{selectedSize.originalPrice}</span>
                              <span className="text-red-600 font-bold">EGP{selectedSize.discountedPrice}</span>
                            </>
                          );
                        } else {
                          return <>EGP{selectedSize.discountedPrice || selectedSize.originalPrice || 0}</>;
                        }
                      }
                      
                      // Fallback to smallest price from sizes
                      return <>EGP{getSmallestPrice(selectedProduct?.sizes || [])}</>;
                    })()}
                  </div>
                </div>
                
                <Button 
                  onClick={() => selectedSize && addToCartWithSize(selectedProduct, selectedSize)} 
                  className="flex items-center bg-black hover:bg-gray-800 rounded-full px-6 py-5 relative overflow-hidden group"
                  disabled={!selectedSize}
                  aria-label="Add to cart"
                >
                  <span className="relative z-10">
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Add to Cart
                  </span>
                  <motion.span 
                    className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100"
                    initial={{ x: "-100%" }}
                    whileHover={{ x: 0 }}
                    transition={{ duration: 0.4 }}
                  />
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
      
      <section className="pt-28 md:pt-24 pb-16">
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
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "100px" }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  className="h-1 bg-gradient-to-r from-purple-400 to-pink-400 mb-4 rounded-full"
                />
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
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="mb-8"
              >
                <div className="relative mx-auto mb-6 flex justify-center">
                  <div className="w-28 h-28 bg-gradient-to-r from-pink-50 to-purple-50 rounded-full flex items-center justify-center">
                    <Heart className="h-14 w-14 text-purple-400" />
                  </div>
                </div>
                <h2 className="text-2xl font-light tracking-wider mb-4 text-purple-700">No Favorites Yet</h2>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "100px" }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                  className="h-1 bg-gradient-to-r from-purple-400 to-pink-400 mx-auto my-6 rounded-full"
                />
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  Start exploring our collection and add your favorite fragrances to this list for easy access.
                </p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.7 }}
              >
                <Link href="/products">
                  <Button className="bg-black text-white hover:bg-gray-800 rounded-full px-8 py-6 relative overflow-hidden group">
                    <span className="relative z-10">Explore Fragrances</span>
                    <motion.span 
                      className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100"
                      initial={{ x: "-100%" }}
                      whileHover={{ x: 0 }}
                      transition={{ duration: 0.4 }}
                    />
                  </Button>
                </Link>
              </motion.div>
            </motion.div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {favoritesState.items.map((item: FavoriteItem, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                  whileHover={{ y: -10 }}
                  className="relative h-full"
                >
                  <div className="group relative h-full">
                    {/* Remove from Favorites Button */}
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => removeFromFavorites(item.id)}
                      className="absolute top-4 right-6 z-10 p-2.5 bg-white/95 backdrop-blur-sm rounded-full shadow-lg hover:shadow-xl hover:bg-white transition-all duration-300"
                      aria-label="Remove from favorites"
                    >
                      <Heart className="h-5 w-5 text-red-500 fill-red-500" />
                    </motion.button>
                    
                    {/* Badges */}
                    <div className="absolute top-4 left-4 z-10 space-y-2">
                      {item.isBestseller && (
                        <motion.div
                          initial={{ scale: 0 }}
                          whileInView={{ scale: 1 }}
                          transition={{ duration: 0.5, delay: index * 0.1 + 0.3 }}
                          viewport={{ once: true }}
                        >
                          <Badge className="bg-black text-white">Bestseller</Badge>
                        </motion.div>
                      )}
                      {item.isNew && !item.isBestseller && (
                        <motion.div
                          initial={{ scale: 0 }}
                          whileInView={{ scale: 1 }}
                          transition={{ duration: 0.5, delay: index * 0.1 + 0.3 }}
                          viewport={{ once: true }}
                        >
                          <Badge variant="secondary">New</Badge>
                        </motion.div>
                      )}
                    </div>
                    
                    {/* Product Card */}
                    <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 h-full relative overflow-hidden">
                      {/* Purple transparent rectangles */}
                      <motion.div 
                        className="absolute -inset-4 bg-gradient-to-r from-purple-400/10 to-pink-400/10 rounded-lg -z-10"
                        animate={{
                          rotate: [0, 0.5, 0, -0.5, 0],
                        }}
                        transition={{
                          duration: 8,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      />
                      <motion.div 
                        className="absolute -inset-2 bg-gradient-to-r from-purple-300/15 to-pink-300/15 rounded-lg -z-10"
                        animate={{
                          rotate: [0, -0.3, 0, 0.3, 0],
                        }}
                        transition={{
                          duration: 6,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      />
                      
                      <CardContent className="p-0 h-full flex flex-col relative z-10">
                        <Link href={`/products/${item.category}/${item.id}`} className="block relative aspect-square flex-grow">
                          <div className="relative w-full h-full group-hover:scale-105 transition-transform duration-500">
                            <Image
                              src={item.image || "/placeholder.svg"}
                              alt={item.name}
                              fill
                              className="object-cover"
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
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none"></div>
                          </div>
                          <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                                                        <div className="flex items-center mb-1">
                              <div className="flex items-center">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-4 w-4 ${
                                      item.rating && item.rating > 0 && i < Math.floor(item.rating)
                                        ? "fill-yellow-400 text-yellow-400" 
                                        : "text-gray-300"
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-xs ml-2">
                                ({item.rating ? item.rating.toFixed(1) : '0.0'})
                              </span>
                            </div>

                            <h3 className="text-lg font-medium mb-1">
                              {item.name}
                            </h3>
                            
                            <div className="flex items-center justify-between">
                              <div className="text-lg font-light">
                                {(() => {
                                  // Handle gift packages
                                  if (item.isGiftPackage) {
                                    const packagePrice = item.packagePrice || 0;
                                    const packageOriginalPrice = item.packageOriginalPrice || 0;
                                    
                                    if (packageOriginalPrice > 0 && packagePrice < packageOriginalPrice) {
                                      return (
                                        <>
                                          <span className="line-through text-gray-300 mr-2 text-base">EGP{packageOriginalPrice}</span>
                                          <span className="text-red-500 font-bold">EGP{packagePrice}</span>
                                        </>
                                      );
                                    } else {
                                      return <>EGP{packagePrice}</>;
                                    }
                                  }
                                  
                                  // Handle regular products with sizes
                                  if (item.sizes && item.sizes.length > 0) {
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
                                  }
                                  
                                  // Fallback to item price
                                  return <>EGP {item.price}</>;
                                })()}
                              </div>
                              
                              <button 
                                className="p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors"
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  
                                  if (item.isGiftPackage) {
                                    setSelectedProduct(item)
                                    setShowGiftPackageSelector(true)
                                  } else if (item.sizes && item.sizes.length > 0) {
                                    openSizeSelector(item)
                                  } else {
                                    addToCart(item)
                                  }
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
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Gift Package Selector Modal */}
      {showGiftPackageSelector && selectedProduct && (
        <GiftPackageSelector
          product={{
            _id: selectedProduct.id,
            id: selectedProduct.id,
            name: selectedProduct.name,
            description: selectedProduct.name,
            images: [selectedProduct.image],
            rating: selectedProduct.rating || 0,
            category: selectedProduct.category as any,
            isNew: selectedProduct.isNew || false,
            isBestseller: selectedProduct.isBestseller || false,
            isGiftPackage: selectedProduct.isGiftPackage,
            packagePrice: selectedProduct.packagePrice,
            packageOriginalPrice: selectedProduct.packageOriginalPrice,
            giftPackageSizes: selectedProduct.giftPackageSizes,
          }}
          isOpen={showGiftPackageSelector}
          onClose={() => setShowGiftPackageSelector(false)}
          onToggleFavorite={(product) => {
            if (favoritesState.items.some(item => item.id === product.id)) {
              removeFromFavorites(product.id)
            } else {
              // Add to favorites using the existing addToFavorites function
              // This will be handled by the favorites context
            }
          }}
          isFavorite={(productId: string) => favoritesState.items.some(item => item.id === productId)}
        />
      )}

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
    </div>
  )
}

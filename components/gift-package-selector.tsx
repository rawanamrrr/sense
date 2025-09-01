"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Star, ShoppingCart, X, Heart, Package } from "lucide-react"
import { useCart } from "@/lib/cart-context"
import { useFavorites } from "@/lib/favorites-context"

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

interface Product {
  _id: string
  id: string
  name: string
  description: string
  images: string[]
  rating: number
  category: string
  isGiftPackage?: boolean
  packagePrice?: number
  packageOriginalPrice?: number
  giftPackageSizes?: GiftPackageSize[]
  isNew?: boolean
  isBestseller?: boolean
}

interface GiftPackageSelectorProps {
  product: Product
  isOpen: boolean
  onClose: () => void
  onToggleFavorite: (product: Product) => void
  isFavorite: (id: string) => boolean
}

export function GiftPackageSelector({ 
  product, 
  isOpen, 
  onClose, 
  onToggleFavorite, 
  isFavorite 
}: GiftPackageSelectorProps) {
  // Change to support multiple products per size
  const [selectedProducts, setSelectedProducts] = useState<Record<string, string[]>>({})
  const [quantity, setQuantity] = useState(1)
  const { dispatch: cartDispatch } = useCart()

  // Initialize default product selections when component mounts
  useEffect(() => {
    if (product.giftPackageSizes) {
      const defaultSelections: Record<string, string[]> = {}
      product.giftPackageSizes.forEach(size => {
        if (size.productOptions.length > 0) {
          // Default to selecting the first product for each size
          defaultSelections[size.size] = [size.productOptions[0].productId]
        }
      })
      setSelectedProducts(defaultSelections)
    }
  }, [product.giftPackageSizes])

  if (!isOpen || !product.isGiftPackage) return null

  const handleProductToggle = (sizeName: string, productId: string) => {
    setSelectedProducts(prev => {
      const currentSelection = prev[sizeName] || []
      const isSelected = currentSelection.includes(productId)
      
      if (isSelected) {
        // Remove product if already selected
        const newSelection = currentSelection.filter(id => id !== productId)
        // Ensure at least one product is selected per size
        return {
          ...prev,
          [sizeName]: newSelection.length > 0 ? newSelection : [currentSelection[0]]
        }
      } else {
        // Add product to selection
        return {
          ...prev,
          [sizeName]: [...currentSelection, productId]
        }
      }
    })
  }

  const addToCart = () => {
    if (!product.packagePrice) return

    console.log("Adding gift package to cart:", product.name)
    console.log("Selected products:", selectedProducts)

    // Create a single cart item for the entire gift package
    const selectedProductsList = product.giftPackageSizes?.map(size => {
      const selectedProductIds = selectedProducts[size.size] || []
      const selectedProductsForSize = size.productOptions.filter(opt => 
        selectedProductIds.includes(opt.productId)
      )
      
      return {
        size: size.size,
        volume: size.volume,
        selectedProducts: selectedProductsForSize
      }
    }).filter((item): item is NonNullable<typeof item> => item.selectedProducts.length > 0) || []

    console.log("Selected products list:", selectedProductsList)

    if (selectedProductsList.length > 0) {
      const cartItem = {
        id: `${product.id}-gift-package-${Date.now()}`,
        productId: product.id,
        name: product.name,
        price: product.packagePrice,
        originalPrice: product.packagePrice,
        size: "Gift Package",
        volume: `${selectedProductsList.length} sizes`,
        image: product.images[0],
        category: product.category,
        quantity: quantity,
        isGiftPackage: true,
        selectedProducts: selectedProductsList,
        packageDetails: {
          totalSizes: selectedProductsList.length,
          packagePrice: product.packagePrice,
          sizes: selectedProductsList
        }
      }

      console.log("Dispatching cart item:", cartItem)
      
      cartDispatch({
        type: "ADD_ITEM",
        payload: cartItem
      })
    }
    
    onClose()
  }

  const getSelectedProducts = (sizeName: string) => {
    const productIds = selectedProducts[sizeName] || []
    return product.giftPackageSizes?.find(size => size.size === sizeName)?.productOptions.filter(opt => 
      productIds.includes(opt.productId)
    ) || []
  }

  const isAllSizesSelected = () => {
    if (!product.giftPackageSizes) return false
    return product.giftPackageSizes.every(size => 
      (selectedProducts[size.size] || []).length > 0
    )
  }

  const getTotalSelectedProducts = () => {
    return Object.values(selectedProducts).reduce((total, products) => total + products.length, 0)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div 
        className="bg-white rounded-2xl max-w-5xl w-full overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xl font-medium flex items-center">
                <Package className="h-5 w-5 mr-2" />
                {product.name}
              </h3>
              <p className="text-gray-600 text-sm">Customize your gift package by selecting products for each size</p>
            </div>
            <div className="flex">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onToggleFavorite(product)
                }}
                className="mr-2 p-1.5 bg-white/80 backdrop-blur-sm rounded-full shadow-md hover:bg-gray-100 transition-colors"
              >
                <Heart 
                  className={`h-5 w-5 ${
                    isFavorite(product.id) 
                      ? "text-red-500 fill-red-500" 
                      : "text-gray-700"
                  }`} 
                />
              </button>
              <button 
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          <div className="flex items-center mb-6">
            <div className="relative w-20 h-20 mr-4">
              <Image
                src={product.images[0] || "/placeholder.svg"}
                alt={product.name}
                fill
                className="rounded-lg object-cover"
              />
            </div>
            <div>
              <p className="text-gray-600 text-sm line-clamp-2">
                {product.description}
              </p>
              <div className="flex items-center mt-1">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        product.rating && product.rating > 0 && i < Math.floor(product.rating)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs text-gray-600 ml-2">
                  ({product.rating ? product.rating.toFixed(1) : '0.0'})
                </span>
              </div>
            </div>
          </div>

          {/* Package Price Display */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <span className="text-gray-600 text-lg">Package Price:</span>
              <span className="text-2xl font-bold ml-2 text-green-600">
                EGP{product.packagePrice || 0}
              </span>
              <p className="text-sm text-gray-500 mt-1">
                This price includes all sizes with your selected products
              </p>
            </div>
          </div>

          {/* All Package Sizes with Multi-Product Selection */}
          <div className="mb-6">
            <h4 className="font-medium mb-4 text-lg">Customize Your Package</h4>
            <div className="space-y-4">
              {product.giftPackageSizes?.map((size) => (
                <Card key={size.size} className="border border-gray-200">
                  <CardContent className="p-4">
                    <div className="mb-3">
                      <div className="flex items-center space-x-4">
                        <div className="text-center min-w-[80px]">
                          <div className="font-medium text-lg">{size.size}</div>
                          <div className="text-sm text-gray-600">{size.volume}</div>
                        </div>
                        <div className="text-sm text-gray-600">
                          Select one or more products for this size
                        </div>
                      </div>
                    </div>
                    
                    {/* Product Selection Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
                      {size.productOptions.map((option) => {
                        const isSelected = (selectedProducts[size.size] || []).includes(option.productId)
                        return (
                          <div
                            key={option.productId}
                            className={`flex items-center space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                              isSelected 
                                ? 'border-green-500 bg-green-50' 
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            }`}
                            onClick={() => handleProductToggle(size.size, option.productId)}
                          >
                            <Checkbox
                              checked={isSelected}
                              onChange={() => handleProductToggle(size.size, option.productId)}
                              className="flex-shrink-0"
                            />
                            <div className="relative w-12 h-12 flex-shrink-0">
                              <Image
                                src={option.productImage || "/placeholder.svg"}
                                alt={option.productName}
                                fill
                                className="rounded-lg object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm truncate">{option.productName}</div>
                              <div className="text-gray-600 text-xs line-clamp-2">
                                {option.productDescription}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    
                    {/* Selected Products Summary */}
                    {getSelectedProducts(size.size).length > 0 && (
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="text-sm font-medium text-blue-800 mb-2">
                          Selected for {size.size}: {getSelectedProducts(size.size).length} product{getSelectedProducts(size.size).length !== 1 ? 's' : ''}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {getSelectedProducts(size.size).map((product) => (
                            <div key={product.productId} className="flex items-center space-x-2 bg-white px-2 py-1 rounded border">
                              <div className="relative w-6 h-6">
                                <Image
                                  src={product.productImage || "/placeholder.svg"}
                                  alt={product.productName}
                                  fill
                                  className="rounded object-cover"
                                />
                              </div>
                              <span className="text-xs font-medium">{product.productName}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          
          {/* Selection Summary */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-center">
              <div className="text-blue-800 font-medium">
                Total Products Selected: {getTotalSelectedProducts()}
              </div>
              <div className="text-blue-600 text-sm">
                Across {product.giftPackageSizes?.length || 0} sizes
              </div>
            </div>
          </div>
          
          {/* Quantity Selection */}
          <div className="mb-6">
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
              <span className="text-gray-600">Total Package Price:</span>
              <span className="text-xl font-medium ml-2 text-green-600">
                EGP{(product.packagePrice || 0) * quantity}
              </span>
            </div>
            
            <Button 
              onClick={addToCart} 
              className="flex items-center bg-black hover:bg-gray-800 rounded-full px-6 py-5"
              disabled={!isAllSizesSelected()}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Add Package to Cart ({getTotalSelectedProducts()} products)
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  const [selectedProducts, setSelectedProducts] = useState<Record<string, string>>({})
  const [quantity, setQuantity] = useState(1)
  const { dispatch: cartDispatch } = useCart()

  // Initialize default product selections when component mounts
  useEffect(() => {
    if (product.giftPackageSizes) {
      const defaultSelections: Record<string, string> = {}
      product.giftPackageSizes.forEach(size => {
        if (size.productOptions.length > 0) {
          defaultSelections[size.size] = size.productOptions[0].productId
        }
      })
      setSelectedProducts(defaultSelections)
    }
  }, [product.giftPackageSizes])

  if (!isOpen || !product.isGiftPackage) return null

  const handleProductSelect = (sizeName: string, productId: string) => {
    setSelectedProducts(prev => ({
      ...prev,
      [sizeName]: productId
    }))
  }

  const addToCart = () => {
    if (!product.packagePrice) return

    console.log("Adding gift package to cart:", product.name)
    console.log("Selected products:", selectedProducts)

    // Create a single cart item for the entire gift package
    const selectedProductsList = product.giftPackageSizes?.map(size => {
      const selectedProductId = selectedProducts[size.size]
      const selectedProduct = size.productOptions.find(opt => opt.productId === selectedProductId)
      if (!selectedProduct) return null
      return {
        size: size.size,
        volume: size.volume,
        selectedProduct: selectedProduct
      }
    }).filter((item): item is NonNullable<typeof item> => item !== null) || []

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

  const getSelectedProduct = (sizeName: string) => {
    const productId = selectedProducts[sizeName]
    return product.giftPackageSizes?.find(size => size.size === sizeName)?.productOptions.find(opt => opt.productId === productId)
  }

  const isAllSizesSelected = () => {
    if (!product.giftPackageSizes) return false
    return product.giftPackageSizes.every(size => selectedProducts[size.size])
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div 
        className="bg-white rounded-2xl max-w-4xl w-full overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto"
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

          {/* All Package Sizes with Product Selection */}
          <div className="mb-6">
            <h4 className="font-medium mb-4 text-lg">Customize Your Package</h4>
            <div className="space-y-4">
              {product.giftPackageSizes?.map((size) => (
                <Card key={size.size} className="border border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="text-center min-w-[80px]">
                          <div className="font-medium text-lg">{size.size}</div>
                          <div className="text-sm text-gray-600">{size.volume}</div>
                        </div>
                        
                        <div className="flex-1">
                          <Label className="text-sm font-medium mb-2 block">Select Product:</Label>
                          <Select 
                            value={selectedProducts[size.size] || ""} 
                            onValueChange={(value) => handleProductSelect(size.size, value)}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Choose a product" />
                            </SelectTrigger>
                            <SelectContent>
                              {size.productOptions.map((option) => (
                                <SelectItem key={option.productId} value={option.productId}>
                                  <div className="flex items-center space-x-2">
                                    <div className="relative w-6 h-6">
                                      <Image
                                        src={option.productImage || "/placeholder.svg"}
                                        alt={option.productName}
                                        fill
                                        className="rounded object-cover"
                                      />
                                    </div>
                                    <span>{option.productName}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      {/* Selected Product Preview */}
                      {selectedProducts[size.size] && (
                        <div className="flex items-center space-x-3 min-w-[200px]">
                          <div className="relative w-12 h-12">
                            <Image
                              src={getSelectedProduct(size.size)?.productImage || "/placeholder.svg"}
                              alt={getSelectedProduct(size.size)?.productName || ""}
                              fill
                              className="rounded-lg object-cover"
                            />
                          </div>
                          <div className="text-sm">
                            <div className="font-medium">{getSelectedProduct(size.size)?.productName}</div>
                            <div className="text-gray-600 text-xs line-clamp-2">
                              {getSelectedProduct(size.size)?.productDescription}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
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
              Add Package to Cart
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

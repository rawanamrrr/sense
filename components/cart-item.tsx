"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Minus, Plus, Trash2, Heart } from "lucide-react"

interface CartItemProps {
  item: {
    id: string
    name: string
    price: number
    originalPrice?: number
    size: string
    volume: string
    quantity: number
    image?: string
  }
  onQuantityChange: (id: string, quantity: number) => void
  onRemove: (id: string) => void
  onMoveToWishlist?: (id: string) => void
}

export const CartItem = ({ 
  item, 
  onQuantityChange, 
  onRemove, 
  onMoveToWishlist 
}: CartItemProps) => {
  const [isRemoving, setIsRemoving] = useState(false)

  const handleRemove = () => {
    setIsRemoving(true)
    setTimeout(() => {
      onRemove(item.id)
    }, 300)
  }

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity === 0) {
      handleRemove()
    } else {
      onQuantityChange(item.id, newQuantity)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      animate={isRemoving ? { opacity: 0, x: -100 } : { opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -2 }}
    >
      <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden">
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
        <CardContent className="p-4 sm:p-6">
          {/* Mobile Layout */}
          <div className="block sm:hidden">
            <div className="flex items-center space-x-4 mb-4">
              <div className="relative w-16 h-16 flex-shrink-0">
                <Image
                  src={item.image || "/placeholder.svg?height=64&width=64"}
                  alt={item.name}
                  fill
                  className="object-cover rounded-lg"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm mb-1 truncate">{item.name}</h3>
                <p className="text-gray-600 text-xs mb-1">
                  {item.size} ({item.volume})
                </p>
                <div className="text-sm font-medium">
                  {item.originalPrice && item.originalPrice > item.price ? (
                    <>
                      <span className="line-through text-gray-400 mr-2">{item.originalPrice} EGP</span>
                      <span className="text-red-600 font-bold">{item.price} EGP</span>
                    </>
                  ) : (
                    <>{item.price} EGP</>
                  )}
                </div>
              </div>
            </div>

            {/* Mobile Quantity and Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuantityChange(item.quantity - 1)}
                  className="h-8 w-8 p-0 border-purple-200 hover:border-purple-400 hover:bg-purple-50"
                >
                  <Minus className="h-4 w-4 text-purple-600" />
                </Button>
                <span className="w-8 text-center text-sm font-medium text-purple-800">{item.quantity}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuantityChange(item.quantity + 1)}
                  className="h-8 w-8 p-0 border-purple-200 hover:border-purple-400 hover:bg-purple-50"
                >
                  <Plus className="h-4 w-4 text-purple-600" />
                </Button>
              </div>

              <div className="flex items-center space-x-2">
                <div className="text-right">
                  <p className="font-medium text-sm">{(item.price * item.quantity).toFixed(2)} EGP</p>
                </div>
                <div className="flex space-x-1">
                  {onMoveToWishlist && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onMoveToWishlist(item.id)}
                      className="h-8 w-8 p-0 text-gray-600 hover:text-red-600 hover:bg-red-50"
                    >
                      <Heart className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemove}
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden sm:flex sm:items-center sm:space-x-4">
            <div className="relative w-20 h-20 flex-shrink-0">
              <Image
                src={item.image || "/placeholder.svg?height=80&width=80"}
                alt={item.name}
                fill
                className="object-cover rounded-lg"
              />
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-lg mb-1">{item.name}</h3>
              <p className="text-gray-600 text-sm mb-2">
                {item.size} ({item.volume})
              </p>
              <div className="text-lg font-light">
                {item.originalPrice && item.originalPrice > item.price ? (
                  <>
                    <span className="line-through text-gray-400 mr-2 text-base">{item.originalPrice} EGP</span>
                    <span className="text-red-600 font-bold">{item.price} EGP</span>
                  </>
                ) : (
                  <>{item.price} EGP</>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuantityChange(item.quantity - 1)}
                className="h-8 w-8 p-0 border-purple-200 hover:border-purple-400 hover:bg-purple-50"
              >
                <Minus className="h-4 w-4 text-purple-600" />
              </Button>
              <span className="w-8 text-center text-purple-800 font-medium">{item.quantity}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuantityChange(item.quantity + 1)}
                className="h-8 w-8 p-0 border-purple-200 hover:border-purple-400 hover:bg-purple-50"
              >
                <Plus className="h-4 w-4 text-purple-600" />
              </Button>
            </div>

            <div className="text-right">
              <p className="font-medium text-lg mb-2">{(item.price * item.quantity).toFixed(2)} EGP</p>
              <div className="flex space-x-2">
                {onMoveToWishlist && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onMoveToWishlist(item.id)}
                    className="text-gray-600 hover:text-red-600 hover:bg-red-50"
                  >
                    <Heart className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRemove}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

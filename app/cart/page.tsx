"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ShoppingBag, ArrowLeft, Package, Truck, Sparkles } from "lucide-react"
import { Navigation } from "@/components/navigation"
import { useCart } from "@/lib/cart-context"
import { CheckoutProgress } from "@/components/checkout-progress"
import { CartItem } from "@/components/cart-item"

export default function CartPage() {
  const { state, dispatch } = useCart()
  

  const subtotal = state.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  
  const total = subtotal 

  const handleQuantityChange = (id: string, newQuantity: number) => {
    if (newQuantity === 0) {
      dispatch({ type: "REMOVE_ITEM", payload: id })
    } else {
      dispatch({ type: "UPDATE_QUANTITY", payload: { id, quantity: newQuantity } })
    }
  }

  if (state.items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <Navigation />
        <section className="pt-28 md:pt-24 pb-16">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="text-center py-16">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="mb-8"
              >
                <div className="relative mx-auto mb-6 flex justify-center">
                  <div className="w-20 h-20 bg-gradient-to-r from-pink-50 to-purple-50 rounded-full flex items-center justify-center">
                    <ShoppingBag className="h-10 w-10 text-purple-400" />
                  </div>
                </div>
                <h1 className="text-2xl sm:text-3xl font-light tracking-wider mb-4 text-purple-700">Your cart is empty</h1>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "100px" }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  className="h-1 bg-gradient-to-r from-purple-400 to-pink-400 mx-auto my-6 rounded-full"
                />
                <p className="text-gray-600 mb-8 text-sm sm:text-base">Discover our exquisite fragrances and add them to your cart.</p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.5 }}
              >
                <Link href="/products">
                  <Button className="bg-black text-white hover:bg-gray-800 rounded-full px-8 py-6 relative overflow-hidden group">
                    <span className="relative z-10">Continue Shopping</span>
                    <motion.span 
                      className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100"
                      initial={{ x: "-100%" }}
                      whileHover={{ x: 0 }}
                      transition={{ duration: 0.4 }}
                    />
                  </Button>
                </Link>
              </motion.div>
            </div>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Navigation />

      <section className="pt-28 md:pt-24 pb-16">
        <div className="container mx-auto px-4 sm:px-6">
          {/* Progress Indicator */}
          <CheckoutProgress currentStep={1} />
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-8"
          >
            <Link
              href="/products"
              className="inline-flex items-center text-gray-600 hover:text-black mb-6 transition-colors text-sm sm:text-base"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Continue Shopping
            </Link>
            <h1 className="text-2xl sm:text-3xl font-light tracking-wider mb-2">Shopping Cart</h1>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "100px" }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="h-1 bg-gradient-to-r from-purple-400 to-pink-400 mb-4 rounded-full"
            />
            <p className="text-gray-600 text-sm sm:text-base">
              {state.items.length} item{state.items.length !== 1 ? "s" : ""} in your cart
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                className="space-y-4"
              >
                {state.items.map((item) => (
                  <CartItem
                    key={item.id}
                    item={item}
                    onQuantityChange={handleQuantityChange}
                    onRemove={(id) => dispatch({ type: "REMOVE_ITEM", payload: id })}
                  />
                ))}
              </motion.div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
                <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 sticky top-24 relative overflow-hidden">
                  <motion.div 
                    className="absolute -inset-4 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-lg -z-10"
                    animate={{
                      rotate: [0, 1, 0, -1, 0],
                    }}
                    transition={{
                      duration: 6,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                  <motion.div 
                    className="absolute -inset-2 bg-gradient-to-r from-purple-300/30 to-pink-300/30 rounded-lg -z-10"
                    animate={{
                      rotate: [0, -0.5, 0, 0.5, 0],
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg sm:text-xl font-light flex items-center">
                      <Package className="mr-2 h-5 w-5 text-purple-600" />
                      Order Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Item Count */}
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>Items ({state.items.length})</span>
                      <span>{subtotal.toFixed(2)} EGP</span>
                    </div>

                    <Separator className="bg-gradient-to-r from-purple-200 to-pink-200" />

                    {/* Shipping Info */}
                    <div className="flex items-center justify-between text-sm">
                      <span>Shipping</span>
                      <span className="text-gray-600">Calculated at checkout</span>
                    </div>

                    {/* Free Shipping Banner */}
                    {subtotal < 2000 && (
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3">
                        <div className="flex items-center space-x-2">
                          <Truck className="h-4 w-4 text-blue-600" />
                          <span className="text-sm text-blue-800">
                            Add {(2000 - subtotal).toFixed(2)} EGP more for free shipping
                          </span>
                        </div>
                      </div>
                    )}

                    {subtotal >= 2000 && (
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-3">
                        <div className="flex items-center space-x-2">
                          <Package className="h-4 w-4 text-green-600" />
                          <span className="text-sm text-green-800">
                            Free shipping on this order!
                          </span>
                        </div>
                      </div>
                    )}

                    <Separator className="bg-gradient-to-r from-purple-200 to-pink-200" />

                    <div className="flex justify-between text-lg font-medium">
                      <span>Total</span>
                      <span>{total.toFixed(2)} EGP</span>
                    </div>

                    <Separator className="bg-gradient-to-r from-purple-200 to-pink-200" />

                    <Link href="/checkout">
                      <Button className="w-full bg-black text-white hover:bg-gray-800 text-base py-3 rounded-full relative overflow-hidden group" size="lg">
                        <span className="relative z-10">Proceed to Checkout</span>
                        <motion.span 
                          className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100"
                          initial={{ x: "-100%" }}
                          whileHover={{ x: 0 }}
                          transition={{ duration: 0.4 }}
                        />
                      </Button>
                    </Link>

                    {/* Additional Info */}
                    <div className="text-center text-xs sm:text-sm text-gray-600 space-y-1">
                      <p>Free shipping on orders over 2000 EGP</p>
                      <p>Secure checkout</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

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

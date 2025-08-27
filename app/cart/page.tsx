"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ShoppingBag, ArrowLeft, Package, Truck } from "lucide-react"
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
      <div className="min-h-screen bg-white">
        <Navigation />
        <section className="pt-24 pb-16">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="text-center py-16">
              <ShoppingBag className="h-16 w-16 mx-auto mb-6 text-gray-400" />
              <h1 className="text-2xl sm:text-3xl font-light tracking-wider mb-4">Your cart is empty</h1>
              <p className="text-gray-600 mb-8 text-sm sm:text-base">Discover our exquisite fragrances and add them to your cart.</p>
              <Link href="/products">
                <Button className="bg-black text-white hover:bg-gray-800">Continue Shopping</Button>
              </Link>
            </div>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      <section className="pt-24 pb-16">
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
                <Card className="border-0 shadow-lg sticky top-24">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg sm:text-xl font-light">Order Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Item Count */}
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>Items ({state.items.length})</span>
                      <span>{subtotal.toFixed(2)} EGP</span>
                    </div>

                    <Separator />

                    {/* Shipping Info */}
                    <div className="flex items-center justify-between text-sm">
                      <span>Shipping</span>
                      <span className="text-gray-600">Calculated at checkout</span>
                    </div>

                    {/* Free Shipping Banner */}
                    {subtotal < 2000 && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <div className="flex items-center space-x-2">
                          <Truck className="h-4 w-4 text-blue-600" />
                          <span className="text-sm text-blue-800">
                            Add {(2000 - subtotal).toFixed(2)} EGP more for free shipping
                          </span>
                        </div>
                      </div>
                    )}

                    {subtotal >= 2000 && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="flex items-center space-x-2">
                          <Package className="h-4 w-4 text-green-600" />
                          <span className="text-sm text-green-800">
                            Free shipping on this order!
                          </span>
                        </div>
                      </div>
                    )}

                    <Separator />

                    <div className="flex justify-between text-lg font-medium">
                      <span>Total</span>
                      <span>{total.toFixed(2)} EGP</span>
                    </div>

                    <Separator />

                    <Link href="/checkout">
                      <Button className="w-full bg-black text-white hover:bg-gray-800 text-base py-3" size="lg">
                        Proceed to Checkout
                      </Button>
                    </Link>

                    {/* Additional Info */}
                    <div className="text-center text-xs sm:text-sm text-gray-600 space-y-1">
                      <p>Free shipping on orders over 2000 EGP</p>
                      <p>30-day return policy</p>
                      <p>Secure checkout</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft, Tag } from "lucide-react"
import { Navigation } from "@/components/navigation"
import { useCart } from "@/lib/cart-context"

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
          <div className="container mx-auto px-6">
            <div className="text-center py-16">
              <ShoppingBag className="h-16 w-16 mx-auto mb-6 text-gray-400" />
              <h1 className="text-3xl font-light tracking-wider mb-4">Your cart is empty</h1>
              <p className="text-gray-600 mb-8">Discover our exquisite fragrances and add them to your cart.</p>
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
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-8"
          >
            <Link
              href="/products"
              className="inline-flex items-center text-gray-600 hover:text-black mb-6 transition-colors"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Continue Shopping
            </Link>
            <h1 className="text-3xl font-light tracking-wider mb-2">Shopping Cart</h1>
            <p className="text-gray-600">
              {state.items.length} item{state.items.length !== 1 ? "s" : ""} in your cart
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                className="space-y-4"
              >
                {state.items.map((item) => (
                  <Card key={item.id} className="border-0 shadow-sm">
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-4">
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
                            onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                            className="h-8 w-8 p-0"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                            className="h-8 w-8 p-0"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="text-right">
                          <p className="font-medium text-lg mb-2">{(item.price * item.quantity).toFixed(2)} EGP</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => dispatch({ type: "REMOVE_ITEM", payload: item.id })}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </motion.div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
                <Card className="border-0 shadow-lg sticky top-24">
                  <CardHeader>
                    <CardTitle className="text-xl font-light">Order Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>{subtotal.toFixed(2)} EGP</span>
                    </div>

                    <div className="flex justify-between">
                      <span>Shipping</span>
                      <span className="text-gray-600">Calculated at checkout</span>
                    </div>

                    

                    <Separator />

                    <div className="flex justify-between text-lg font-medium">
                      <span>Total</span>
                      <span>{total.toFixed(2)} EGP</span>
                    </div>

                    <Separator />

                  

                    <Link href="/checkout">
                      <Button className="w-full bg-black text-white hover:bg-gray-800" size="lg">
                        Proceed to Checkout
                      </Button>
                    </Link>

                    <div className="text-center text-sm text-gray-600">
                      <p>Free shipping on orders over 2000 EGP</p>
                      <p>30-day return policy</p>
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

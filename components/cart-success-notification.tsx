"use client"

import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { X, ShoppingCart, Check } from "lucide-react"
import { useCart } from "@/lib/cart-context"

export function CartSuccessNotification() {
  const { state, hideNotification } = useCart()

  return (
    <AnimatePresence>
      {state.showNotification && state.lastAddedItem && (
        <motion.div
          initial={{ opacity: 0, y: -100, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -100, scale: 0.9 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="fixed top-20 right-4 z-50 w-80"
        >
          <Card className="shadow-xl border-0 bg-white">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Check className="w-5 h-5 text-green-600" />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 mb-1">Added to cart!</p>
                      <div className="flex items-center space-x-3">
                        <Image
                          src={state.lastAddedItem.image || "/placeholder.svg"}
                          alt={state.lastAddedItem.name}
                          width={40}
                          height={40}
                          className="w-10 h-10 object-cover rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900 truncate">{state.lastAddedItem.name}</p>
                          <p className="text-xs text-gray-500">
                            {state.lastAddedItem.size} • {state.lastAddedItem.price} EGP
                          </p>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={hideNotification}
                      className="ml-2 flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center space-x-2 mt-3">
                    <Link href="/cart" onClick={hideNotification}>
                      <Button size="sm" className="bg-black text-white hover:bg-gray-800 text-xs px-3 py-1">
                        <ShoppingCart className="w-3 h-3 mr-1" />
                        View Cart ({state.count})
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={hideNotification}
                      className="text-xs px-3 py-1 border-gray-300 bg-transparent"
                    >
                      Continue Shopping
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

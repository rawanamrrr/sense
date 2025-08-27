"use client"

import React from "react"
import { useState } from "react"
import { motion } from "framer-motion"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tag, Shield, Truck, Package, ChevronDown, ChevronUp } from "lucide-react"

interface OrderSummaryProps {
  items: Array<{
    id: string
    name: string
    price: number
    originalPrice?: number
    size: string
    quantity: number
    image?: string
  }>
  subtotal: number
  shipping: number
  total: number
  discountCode: string
  setDiscountCode: (code: string) => void
  appliedDiscount: any
  discountError: string
  discountLoading: boolean
  onApplyDiscount: () => void
  onRemoveDiscount: () => void
  onSubmit: (e?: React.FormEvent<HTMLFormElement>) => void
  loading: boolean
  governorate: string
}

export const OrderSummary = ({
  items,
  subtotal,
  shipping,
  total,
  discountCode,
  setDiscountCode,
  appliedDiscount,
  discountError,
  discountLoading,
  onApplyDiscount,
  onRemoveDiscount,
  onSubmit,
  loading,
  governorate
}: OrderSummaryProps) => {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg sm:text-xl">Order Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Mobile Expandable Items */}
        <div className="sm:hidden">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center justify-between w-full p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <span className="text-sm font-medium">
              {items.length} item{items.length !== 1 ? 's' : ''} in cart
            </span>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-3 space-y-3 max-h-64 overflow-y-auto"
            >
              {items.map((item) => (
                <div key={item.id} className="flex items-center space-x-3 p-2 bg-white rounded border">
                  <div className="relative w-10 h-10 flex-shrink-0">
                    <Image
                      src={item.image || "/placeholder.svg?height=40&width=40"}
                      alt={item.name}
                      fill
                      className="object-cover rounded"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    <p className="text-xs text-gray-600">
                      {item.size} • Qty: {item.quantity}
                    </p>
                  </div>
                  <div className="text-sm font-medium text-right">
                    {item.originalPrice && item.originalPrice > item.price ? (
                      <>
                        <div className="line-through text-gray-400 text-xs">
                          {(item.originalPrice * item.quantity).toFixed(2)} EGP
                        </div>
                        <div className="text-red-600 font-bold">
                          {(item.price * item.quantity).toFixed(2)} EGP
                        </div>
                      </>
                    ) : (
                      <div>{(item.price * item.quantity).toFixed(2)} EGP</div>
                    )}
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </div>

        {/* Desktop Items */}
        <div className="hidden sm:block space-y-3 max-h-64 overflow-y-auto">
          {items.map((item) => (
            <div key={item.id} className="flex items-center space-x-3">
              <div className="relative w-12 h-12 flex-shrink-0">
                <Image
                  src={item.image || "/placeholder.svg?height=48&width=48"}
                  alt={item.name}
                  fill
                  className="object-cover rounded"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.name}</p>
                <p className="text-xs text-gray-600">
                  {item.size} • Qty: {item.quantity}
                </p>
              </div>
              <div className="text-sm font-medium text-right">
                {item.originalPrice && item.originalPrice > item.price ? (
                  <>
                    <div className="line-through text-gray-400 text-xs">
                      {(item.originalPrice * item.quantity).toFixed(2)} EGP
                    </div>
                    <div className="text-red-600 font-bold">
                      {(item.price * item.quantity).toFixed(2)} EGP
                    </div>
                  </>
                ) : (
                  <div>{(item.price * item.quantity).toFixed(2)} EGP</div>
                )}
              </div>
            </div>
          ))}
        </div>

        <Separator />

        {/* Discount Code */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Discount Code</Label>
          {!appliedDiscount ? (
            <div className="flex space-x-2">
              <Input
                value={discountCode}
                onChange={(e) => {
                  setDiscountCode(e.target.value.toUpperCase())
                }}
                placeholder="Enter discount code"
                className="flex-1 text-sm"
              />
              <Button
                type="button"
                onClick={onApplyDiscount}
                disabled={discountLoading || !discountCode.trim()}
                variant="outline"
                size="sm"
                className="whitespace-nowrap"
              >
                {discountLoading ? "..." : "Apply"}
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <Tag className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">{appliedDiscount.code}</span>
              </div>
              <Button
                type="button"
                onClick={onRemoveDiscount}
                variant="ghost"
                size="sm"
                className="text-green-600 hover:text-green-700"
              >
                Remove
              </Button>
            </div>
          )}
          
          {/* Discount Error Message */}
          {discountError && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="mt-2"
            >
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-600 text-sm">{discountError}</AlertDescription>
              </Alert>
            </motion.div>
          )}
        </div>

        <Separator />

        {/* Pricing */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{subtotal.toFixed(2)} EGP</span>
          </div>
          {appliedDiscount && (
            <div className="flex justify-between text-green-600">
              <span>
                Discount (
                {appliedDiscount.type === "percentage"
                  ? `${appliedDiscount.value}%`
                  : appliedDiscount.type === "buyXgetX"
                  ? `BUY ${appliedDiscount.buyX} GET ${appliedDiscount.getX}`
                  : `${appliedDiscount.value} EGP`}
                )
              </span>
              <span>-{appliedDiscount.discountAmount.toFixed(2)} EGP</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Shipping</span>
            <span>
              {!governorate ? "Not specified" : shipping === 0 ? "Free" : `${shipping} EGP`}
            </span>
          </div>
        </div>

        <Separator />

        <div className="flex justify-between text-lg font-medium">
          <span>Total</span>
          <span>{total.toFixed(2)} EGP</span>
        </div>

        <Button
          type="submit"
          className="w-full bg-black text-white hover:bg-gray-800 text-base py-3"
          size="lg"
          disabled={loading}
          onClick={onSubmit}
        >
          {loading ? "Processing..." : "Place Order"}
        </Button>

        {/* Security Features */}
        <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-4 pt-4 text-xs text-gray-600">
          <div className="flex items-center">
            <Shield className="h-4 w-4 mr-1" />
            <span>Secure Payment</span>
          </div>
          <div className="flex items-center">
            <Truck className="h-4 w-4 mr-1" />
            <span>Easy Returns</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

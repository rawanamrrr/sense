"use client"

import type React from "react"
import { useState } from "react"
import { motion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Truck, Shield, Tag } from "lucide-react"
import { Navigation } from "@/components/navigation"
import { useCart } from "@/lib/cart-context"
import { useAuth } from "@/lib/auth-context"

const egyptianGovernorates = [
  "Cairo",
  "Alexandria",
  "Giza",
  "Shubra El Kheima",
  "Port Said",
  "Suez",
  "Luxor",
  "Aswan",
  "Asyut",
  "Beheira",
  "Beni Suef",
  "Dakahlia",
  "Damietta",
  "Faiyum",
  "Gharbia",
  "Ismailia",
  "Kafr El Sheikh",
  "Matrouh",
  "Minya",
  "Monufia",
  "New Valley",
  "North Sinai",
  "Qalyubia",
  "Qena",
  "Red Sea",
  "Sharqia",
  "Sohag",
  "South Sinai",
]

// Shipping costs based on distance from Dakahlia (70-100 EGP range)
const getShippingCost = (governorate: string): number => {
  if (!governorate) return 0 // Return 0 if no governorate selected

  const shippingRates: { [key: string]: number } = {
    Dakahlia: 70, // Base governorate - lowest cost
    Gharbia: 75,
    "Kafr El Sheikh": 75,
    Damietta: 75,
    Sharqia: 80,
    Qalyubia: 80,
    Monufia: 80,
    Cairo: 85,
    Giza: 85,
    Beheira: 85,
    Alexandria: 90,
    Ismailia: 90,
    "Port Said": 90,
    Suez: 90,
    "Beni Suef": 90,
    Faiyum: 95,
    Minya: 95,
    Asyut: 95,
    Sohag: 95,
    Qena: 95,
    Luxor: 100,
    Aswan: 100,
    "Red Sea": 100,
    "New Valley": 100,
    Matrouh: 100,
    "North Sinai": 100,
    "South Sinai": 100,
  }

  return shippingRates[governorate] || 85
}

export default function CheckoutPage() {
  const { state: cartState, dispatch: cartDispatch } = useCart()
  const { state: authState } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [discountCode, setDiscountCode] = useState("")
  const [appliedDiscount, setAppliedDiscount] = useState<{
    getX: any
    buyX: any
    code: string
    discountAmount: number
    type: string
    value: number
  } | null>(null)
  const [discountLoading, setDiscountLoading] = useState(false)

  const [formData, setFormData] = useState({
    // Shipping Information
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    governorate: "",
    postalCode: "",

    // Payment Information
    paymentMethod: "cod",
  })

// Correct order of calculations:
const subtotal = cartState.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
const discountAmount = appliedDiscount?.discountAmount || 0;
const shipping = (subtotal - discountAmount) > 2000 ? 0 : getShippingCost(formData.governorate);
const total = subtotal + shipping - discountAmount;


  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const validateDiscountCode = async () => {
  if (!discountCode.trim()) return

  setDiscountLoading(true)
  try {
    const response = await fetch("/api/discount-codes/validate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        code: discountCode,
        orderAmount: subtotal,
        items: cartState.items.map(item => ({
          id: item.id,
          price: item.price,
          quantity: item.quantity
        }))
      }),
    })

    if (response.ok) {
      const result = await response.json()
      setAppliedDiscount({
        ...result,
        // Store free items info if available
        freeItems: result.freeItems || []
      })
      setError("")
    } else {
      const errorData = await response.json()
      setError(errorData.error)
      setAppliedDiscount(null)
    }
  } catch (error) {
    console.error("Discount validation error:", error)
    setError("Failed to validate discount code")
    setAppliedDiscount(null)
  } finally {
    setDiscountLoading(false)
  }
}

  const removeDiscount = () => {
    setAppliedDiscount(null);
    setDiscountCode("");
    setError("");
  };

  const validateForm = () => {
    const required = ["firstName", "lastName", "email", "phone", "address", "city", "governorate"]

    for (const field of required) {
      if (!formData[field as keyof typeof formData]) {
        setError(`Please fill in ${field.replace(/([A-Z])/g, " $1").toLowerCase()}`)
        return false
      }
    }

    // Validate Egyptian phone number
    const phoneRegex = /^(\+20|0)?1[0125][0-9]{8}$/
    if (!phoneRegex.test(formData.phone)) {
      setError("Please enter a valid Egyptian phone number")
      return false
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address")
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!validateForm()) return

    setLoading(true)

    try {
      const orderData = {
        items: cartState.items,
        total: total,
        shippingAddress: {
          name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          governorate: formData.governorate,
          postalCode: formData.postalCode,
        },
        paymentMethod: formData.paymentMethod,
        discountCode: appliedDiscount?.code,
        discountAmount: appliedDiscount?.discountAmount,
      }

      const token = localStorage.getItem("sense_token")
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(orderData),
      })

      if (response.ok) {
        const order = await response.json()

        // Send confirmation email
        try {
          await fetch("/api/send-order-confirmation", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              order: order.order,
              customerEmail: formData.email,
            }),
          })
        } catch (emailError) {
          console.error("Failed to send confirmation email:", emailError)
          // Don't fail the order if email fails
        }

        // Clear cart
        cartDispatch({ type: "CLEAR_CART" })
        // Redirect to success page
        router.push(`/checkout/success?orderId=${order.order.id}`)
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to place order")
      }
    } catch (error) {
      console.error("Checkout error:", error)
      setError("An error occurred while processing your order")
    } finally {
      setLoading(false)
    }
  }

  if (cartState.items.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        <Navigation />
        <section className="pt-32 pb-16">
          <div className="container mx-auto px-6">
            <div className="text-center py-16">
              <h1 className="text-3xl font-light tracking-wider mb-4">Your cart is empty</h1>
              <p className="text-gray-600 mb-8">Add some products to your cart before checkout.</p>
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
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <section className="pt-32 pb-16">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-8"
          >
            <Link
              href="/cart"
              className="inline-flex items-center text-gray-600 hover:text-black mb-6 transition-colors"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Cart
            </Link>
            <h1 className="text-3xl font-light tracking-wider mb-2">Checkout</h1>
            <p className="text-gray-600">Complete your order details below</p>
          </motion.div>

          {error && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-600">{error}</AlertDescription>
              </Alert>
            </motion.div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Checkout Form */}
              <div className="lg:col-span-2 space-y-6">
                {/* Shipping Information */}
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Truck className="mr-2 h-5 w-5" />
                        Shipping Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="firstName">First Name *</Label>
                          <Input
                            id="firstName"
                            value={formData.firstName}
                            onChange={(e) => handleInputChange("firstName", e.target.value)}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="lastName">Last Name *</Label>
                          <Input
                            id="lastName"
                            value={formData.lastName}
                            onChange={(e) => handleInputChange("lastName", e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="email">Email Address *</Label>
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => handleInputChange("email", e.target.value)}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="phone">Phone Number *</Label>
                          <Input
                            id="phone"
                            value={formData.phone}
                            onChange={(e) => handleInputChange("phone", e.target.value)}
                            placeholder="+20 1XX XXX XXXX"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="address">Street Address *</Label>
                        <Input
                          id="address"
                          value={formData.address}
                          onChange={(e) => handleInputChange("address", e.target.value)}
                          required
                        />
                      </div>

                      <div className="grid md:grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="city">City *</Label>
                          <Input
                            id="city"
                            value={formData.city}
                            onChange={(e) => handleInputChange("city", e.target.value)}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="governorate">Governorate *</Label>
                          <Select
                            value={formData.governorate}
                            onValueChange={(value) => handleInputChange("governorate", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select governorate" />
                            </SelectTrigger>
                            <SelectContent>
                              {egyptianGovernorates.map((gov) => (
                                <SelectItem key={gov} value={gov}>
                                  {gov}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="postalCode">Postal Code</Label>
                          <Input
                            id="postalCode"
                            value={formData.postalCode}
                            onChange={(e) => handleInputChange("postalCode", e.target.value)}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Payment Information */}
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: 0.1 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Truck className="mr-2 h-5 w-5" />
                        Payment Method
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <RadioGroup
                        value={formData.paymentMethod}
                        onValueChange={(value) => handleInputChange("paymentMethod", value)}
                      >
                        <div className="flex items-center space-x-2 p-4 border rounded-lg">
                          <RadioGroupItem value="cod" id="cod" />
                          <Label htmlFor="cod" className="flex-1 cursor-pointer">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">Cash on Delivery</p>
                                <p className="text-sm text-gray-600">Pay when you receive your order</p>
                              </div>
                              <Truck className="h-5 w-5 text-gray-400" />
                            </div>
                          </Label>
                        </div>
                      </RadioGroup>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8 }}
                >
                  <Card className="sticky top-24">
                    <CardHeader>
                      <CardTitle>Order Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Order Items */}
                      <div className="space-y-3">
                        {cartState.items.map((item) => (
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
                            <p className="text-sm font-medium">{(item.price * item.quantity).toFixed(2)} EGP</p>
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
                              onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                              placeholder="Enter discount code"
                              className="flex-1"
                            />
                            <Button
                              type="button"
                              onClick={validateDiscountCode}
                              disabled={discountLoading || !discountCode.trim()}
                              variant="outline"
                              size="sm"
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
                              onClick={removeDiscount}
                              variant="ghost"
                              size="sm"
                              className="text-green-600 hover:text-green-700"
                            >
                              Remove
                            </Button>
                          </div>
                        )}
                      </div>

                      <Separator />

                      {/* Pricing */}
                      <div className="space-y-2">
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
                            {!formData.governorate ? "Not specified" : shipping === 0 ? "Free" : `${shipping} EGP`}
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
                        className="w-full bg-black text-white hover:bg-gray-800"
                        size="lg"
                        disabled={loading}
                      >
                        {loading ? "Processing..." : "Place Order"}
                      </Button>

                      {/* Security Features */}
                      <div className="flex items-center justify-center space-x-4 pt-4 text-xs text-gray-600">
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
                </motion.div>
              </div>
            </div>
          </form>
        </div>
      </section>
    </div>
  )
}

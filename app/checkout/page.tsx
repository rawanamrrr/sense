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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Truck, CreditCard, MapPin, Sparkles } from "lucide-react"
import { Navigation } from "@/components/navigation"
import { useCart } from "@/lib/cart-context"
import { useAuth } from "@/lib/auth-context"
import { CheckoutProgress } from "@/components/checkout-progress"
import { OrderSummary } from "@/components/order-summary"

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
  const [discountError, setDiscountError] = useState("")
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
  setDiscountError("") // Clear previous discount errors
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
      setDiscountError("")
    } else {
      const errorData = await response.json()
      setDiscountError(errorData.error)
      setAppliedDiscount(null)
      // Clear the discount code input on error so user can easily retry
      setDiscountCode("")
    }
  } catch (error) {
    console.error("Discount validation error:", error)
    setDiscountError("Failed to validate discount code")
    setAppliedDiscount(null)
  } finally {
    setDiscountLoading(false)
  }
}

  const removeDiscount = () => {
    setAppliedDiscount(null);
    setDiscountCode("");
    setDiscountError("");
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

      const token = authState.token
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
          <div className="container mx-auto px-4 sm:px-6">
            <div className="text-center py-16">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="mb-8"
              >
                <h1 className="text-2xl sm:text-3xl font-light tracking-wider mb-4">Your cart is empty</h1>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "100px" }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  className="h-1 bg-gradient-to-r from-purple-400 to-pink-400 mx-auto my-6 rounded-full"
                />
                <p className="text-gray-600 mb-8">Add some products to your cart before checkout.</p>
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

      <section className="pt-32 pb-16">
        <div className="container mx-auto px-4 sm:px-6">
          {/* Progress Indicator */}
          <CheckoutProgress currentStep={2} />
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-8"
          >
            <Link
              href="/cart"
              className="inline-flex items-center text-gray-600 hover:text-black mb-6 transition-colors text-sm sm:text-base"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Cart
            </Link>
            <h1 className="text-2xl sm:text-3xl font-light tracking-wider mb-2">Checkout</h1>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "100px" }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="h-1 bg-gradient-to-r from-purple-400 to-pink-400 mb-4 rounded-full"
            />
            <p className="text-gray-600 text-sm sm:text-base">Complete your order details below</p>
          </motion.div>

          {error && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-600">{error}</AlertDescription>
              </Alert>
            </motion.div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="grid lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              {/* Checkout Form */}
              <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                {/* Shipping Information */}
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8 }}
                >
                  <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden">
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
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center text-lg sm:text-xl">
                        <MapPin className="mr-2 h-5 w-5 text-purple-600" />
                        Shipping Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="firstName" className="text-sm font-medium">First Name *</Label>
                          <Input
                            id="firstName"
                            value={formData.firstName}
                            onChange={(e) => handleInputChange("firstName", e.target.value)}
                            required
                            className="mt-1 border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                          />
                        </div>
                        <div>
                          <Label htmlFor="lastName" className="text-sm font-medium">Last Name *</Label>
                          <Input
                            id="lastName"
                            value={formData.lastName}
                            onChange={(e) => handleInputChange("lastName", e.target.value)}
                            required
                            className="mt-1 border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="email" className="text-sm font-medium">Email Address *</Label>
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => handleInputChange("email", e.target.value)}
                            required
                            className="mt-1 border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                          />
                        </div>
                        <div>
                          <Label htmlFor="phone" className="text-sm font-medium">Phone Number *</Label>
                          <Input
                            id="phone"
                            value={formData.phone}
                            onChange={(e) => handleInputChange("phone", e.target.value)}
                            placeholder="+20 1XX XXX XXXX"
                            required
                            className="mt-1 border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="address" className="text-sm font-medium">Street Address *</Label>
                        <Input
                          id="address"
                          value={formData.address}
                          onChange={(e) => handleInputChange("address", e.target.value)}
                          required
                          className="mt-1 border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="city" className="text-sm font-medium">City *</Label>
                          <Input
                            id="city"
                            value={formData.city}
                            onChange={(e) => handleInputChange("city", e.target.value)}
                            required
                            className="mt-1 border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                          />
                        </div>
                        <div>
                          <Label htmlFor="governorate" className="text-sm font-medium">Governorate *</Label>
                          <Select
                            value={formData.governorate}
                            onValueChange={(value) => handleInputChange("governorate", value)}
                          >
                            <SelectTrigger className="mt-1 border-gray-200 focus:border-purple-500 focus:ring-purple-500">
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
                          <Label htmlFor="postalCode" className="text-sm font-medium">Postal Code</Label>
                          <Input
                            id="postalCode"
                            value={formData.postalCode}
                            onChange={(e) => handleInputChange("postalCode", e.target.value)}
                            className="mt-1 border-gray-200 focus:border-purple-500 focus:ring-purple-500"
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
                  <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden">
                    <motion.div 
                      className="absolute -inset-4 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-lg -z-10"
                      animate={{
                        rotate: [0, -2, 0, 2, 0],
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
                        rotate: [0, 1, 0, -1, 0],
                      }}
                      transition={{
                        duration: 6,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center text-lg sm:text-xl">
                        <CreditCard className="mr-2 h-5 w-5 text-purple-600" />
                        Payment Method
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <RadioGroup
                        value={formData.paymentMethod}
                        onValueChange={(value) => handleInputChange("paymentMethod", value)}
                      >
                        <div className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-purple-300 transition-all duration-300">
                          <RadioGroupItem value="cod" id="cod" className="text-purple-600" />
                          <Label htmlFor="cod" className="flex-1 cursor-pointer">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-sm sm:text-base">Cash on Delivery</p>
                                <p className="text-xs sm:text-sm text-gray-600">Pay when you receive your order</p>
                              </div>
                              <Truck className="h-5 w-5 text-purple-400" />
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
                  <div className="sticky top-24">
                    <OrderSummary
                      items={cartState.items}
                      subtotal={subtotal}
                      shipping={shipping}
                      total={total}
                      discountCode={discountCode}
                      setDiscountCode={setDiscountCode}
                      appliedDiscount={appliedDiscount}
                      discountError={discountError}
                      discountLoading={discountLoading}
                      onApplyDiscount={validateDiscountCode}
                      onRemoveDiscount={removeDiscount}
                      onSubmit={(e) => handleSubmit(e as React.FormEvent<HTMLFormElement>)}
                      loading={loading}
                      governorate={formData.governorate}
                    />
                  </div>
                </motion.div>
              </div>
            </div>
          </form>
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

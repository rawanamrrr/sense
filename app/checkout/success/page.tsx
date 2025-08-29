"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Package, Truck, Mail } from "lucide-react"
import { Navigation } from "@/components/navigation"

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get("orderId")
  const [orderDetails, setOrderDetails] = useState<any>(null)

  useEffect(() => {
    if (orderId) {
      // In a real app, you'd fetch order details from the API
      setOrderDetails({
        id: orderId,
        estimatedDelivery: "3-5 business days",
        trackingNumber: `SF${Date.now()}`,
      })
    }
  }, [orderId])

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      <section className="pt-28 md:pt-24 pb-16">
        <div className="container mx-auto px-6">
          <div className="max-w-2xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="mb-8"
            >
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-6" />
              <h1 className="text-3xl font-light tracking-wider mb-4">Order Confirmed!</h1>
              <p className="text-gray-600 text-lg">
                Thank you for your purchase. Your order has been successfully placed.
              </p>
            </motion.div>

            {orderDetails && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <Card className="border-0 shadow-lg mb-8">
                  <CardHeader>
                    <CardTitle>Order Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4 text-left">
                      <div>
                        <p className="text-sm text-gray-600">Order Number</p>
                        <p className="font-medium">{orderDetails.id}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Estimated Delivery</p>
                        <p className="font-medium">{orderDetails.estimatedDelivery}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="grid md:grid-cols-3 gap-6 mb-8"
            >
              <Card className="border-0 shadow-sm">
                <CardContent className="p-6 text-center">
                  <Mail className="h-8 w-8 mx-auto mb-3 text-blue-500" />
                  <h3 className="font-medium mb-2">Confirmation Email</h3>
                  <p className="text-sm text-gray-600">We've sent you an email with your order details</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardContent className="p-6 text-center">
                  <Package className="h-8 w-8 mx-auto mb-3 text-orange-500" />
                  <h3 className="font-medium mb-2">Processing</h3>
                  <p className="text-sm text-gray-600">Your order is being prepared for shipment</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardContent className="p-6 text-center">
                  <Truck className="h-8 w-8 mx-auto mb-3 text-green-500" />
                  <h3 className="font-medium mb-2">Shipping</h3>
                  <p className="text-sm text-gray-600">Free shipping on your order</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="space-y-4"
            >
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/account">
                  <Button
                    variant="outline"
                    className="border-black text-black hover:bg-black hover:text-white bg-transparent"
                  >
                    Track Your Order
                  </Button>
                </Link>
                <Link href="/products">
                  <Button className="bg-black text-white hover:bg-gray-800">Continue Shopping</Button>
                </Link>
              </div>

              <p className="text-sm text-gray-600">
                Need help? Contact us at{" "}
                <a href="mailto:support@sensefragrances.com" className="text-black hover:underline">
                  support@sensefragrances.com
                </a>
              </p>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  )
}

"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Package, ShoppingCart, User, MapPin, ArrowLeft, Eye } from "lucide-react"
import { Navigation } from "@/components/navigation"
import { useAuth } from "@/lib/auth-context"
import { useOrders } from "@/lib/order-context"

export default function UserDashboard() {
  const { state: authState } = useAuth()
  const { getUserOrders } = useOrders()
  const router = useRouter()
  const [userOrders, setUserOrders] = useState<any[]>([])

  useEffect(() => {
    if (!authState.isAuthenticated) {
      router.push("/auth/login")
    } else if (authState.user) {
      setUserOrders(getUserOrders(authState.user.id))
    }
  }, [authState, router, getUserOrders])

  if (!authState.isAuthenticated) {
    return null
  }

  const totalSpent = userOrders.reduce((sum, order) => sum + order.total, 0)
  const totalOrders = userOrders.length

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <section className="pt-24 pb-16">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-8"
          >
            <Link href="/" className="inline-flex items-center text-gray-600 hover:text-black transition-colors mb-6">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-light tracking-wider mb-2">My Dashboard</h1>
                <p className="text-gray-600">Welcome back, {authState.user?.name}</p>
              </div>
              <Link href="/products">
                <Button className="bg-black text-white hover:bg-gray-800">
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Continue Shopping
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Orders</p>
                      <p className="text-2xl font-light">{totalOrders}</p>
                    </div>
                    <Package className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Spent</p>
                      <p className="text-2xl font-light">${totalSpent.toFixed(2)}</p>
                    </div>
                    <ShoppingCart className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Account Status</p>
                      <p className="text-2xl font-light">Active</p>
                    </div>
                    <User className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Profile Information */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="mr-2 h-5 w-5" />
                    Profile Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-medium">{authState.user?.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium">{authState.user?.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Account Type</p>
                    <Badge variant="secondary">{authState.user?.role}</Badge>
                  </div>
                  <Separator />
                  <Button variant="outline" className="w-full bg-transparent">
                    Edit Profile
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Order History */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="lg:col-span-2"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Package className="mr-2 h-5 w-5" />
                    Order History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {userOrders.length === 0 ? (
                    <div className="text-center py-8">
                      <Package className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                      <p className="text-gray-600 mb-4">No orders yet</p>
                      <Link href="/products">
                        <Button className="bg-black text-white hover:bg-gray-800">Start Shopping</Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {userOrders.map((order) => (
                        <div key={order.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <p className="font-medium">Order #{order.id}</p>
                              <p className="text-sm text-gray-600">{new Date(order.createdAt).toLocaleDateString()}</p>
                            </div>
                            <div className="text-right">
                              <Badge
                                variant={
                                  order.status === "delivered"
                                    ? "default"
                                    : order.status === "shipped"
                                      ? "secondary"
                                      : order.status === "cancelled"
                                        ? "destructive"
                                        : "outline"
                                }
                              >
                                {order.status}
                              </Badge>
                              <p className="text-sm font-medium mt-1">${order.total.toFixed(2)}</p>
                            </div>
                          </div>

                          <div className="space-y-2">
                            {order.items.map((item: any, index: number) => (
                              <div key={index} className="flex items-center space-x-3">
                                <Image
                                  src={item.image || "/placeholder.svg"}
                                  alt={item.name}
                                  width={40}
                                  height={40}
                                  className="w-10 h-10 object-cover rounded"
                                />
                                <div className="flex-1">
                                  <p className="text-sm font-medium">{item.name}</p>
                                  <p className="text-xs text-gray-600">
                                    {item.size} ({item.volume}) × {item.quantity}
                                  </p>
                                </div>
                                <p className="text-sm font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                              </div>
                            ))}
                          </div>

                          <Separator className="my-3" />

                          <div className="flex items-center justify-between">
                            <div className="flex items-center text-sm text-gray-600">
                              <MapPin className="h-4 w-4 mr-1" />
                              {order.shippingAddress.city}, {order.shippingAddress.country}
                            </div>
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4 mr-1" />
                              View Details
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  )
}

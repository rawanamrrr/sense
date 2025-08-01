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
import { Package, ShoppingCart, User, MapPin, ArrowLeft, Eye, Edit, Star, RefreshCw } from "lucide-react"
import { Navigation } from "@/components/navigation"
import { useAuth } from "@/lib/auth-context"

export default function MyAccountPage() {
  const { state: authState } = useAuth()
  const router = useRouter()
  const [userOrders, setUserOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (!authState.isAuthenticated) {
      router.push("/auth/login")
      return
    }

    // Redirect admin users to admin dashboard
    if (authState.user?.role === "admin") {
      router.push("/admin/dashboard")
      return
    }

    if (authState.token) {
      fetchOrders()

      // Set up polling for live updates every 30 seconds
      const interval = setInterval(() => {
        fetchOrders(true) // Silent refresh
      }, 30000)

      return () => clearInterval(interval)
    }
  }, [authState, router])

  const fetchOrders = async (silent = false) => {
    if (!silent) {
      setRefreshing(true)
    }

    try {
      const response = await fetch("/api/orders", {
        headers: {
          Authorization: `Bearer ${authState.token}`,
        },
      })

      if (response.ok) {
        const orders = await response.json()
        setUserOrders(orders)
      }
    } catch (error) {
      console.error("Error fetching orders:", error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    fetchOrders()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-100 text-green-800"
      case "shipped":
        return "bg-blue-100 text-blue-800"
      case "processing":
        return "bg-yellow-100 text-yellow-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "Order Placed"
      case "processing":
        return "Processing"
      case "shipped":
        return "Shipped"
      case "delivered":
        return "Delivered"
      case "cancelled":
        return "Cancelled"
      default:
        return status
    }
  }

  if (!authState.isAuthenticated || authState.user?.role === "admin") {
    return null
  }

  const totalSpent = userOrders.reduce((sum, order) => sum + order.total, 0)
  const totalOrders = userOrders.length
  const activeOrders = userOrders.filter((order) => ["pending", "processing", "shipped"].includes(order.status)).length

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
            <Link href="/" className="inline-flex items-center text-gray-600 hover:text-black transition-colors mb-6">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-light tracking-wider mb-2">My Account</h1>
                <p className="text-gray-600">Welcome back, {authState.user?.name}</p>
              </div>
              <div className="flex items-center space-x-3">
                <Button
                  onClick={handleRefresh}
                  variant="outline"
                  size="sm"
                  disabled={refreshing}
                  className="bg-transparent"
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                  {refreshing ? "Updating..." : "Refresh"}
                </Button>
                <Link href="/products">
                  <Button className="bg-black text-white hover:bg-gray-800">
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Continue Shopping
                  </Button>
                </Link>
              </div>
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
                      <p className="text-sm text-gray-600">Active Orders</p>
                      <p className="text-2xl font-light">{activeOrders}</p>
                    </div>
                    <ShoppingCart className="h-8 w-8 text-orange-600" />
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
                      <p className="text-sm text-gray-600">Total Spent</p>
                      <p className="text-2xl font-light">{totalSpent.toFixed(2)} EGP</p>
                    </div>
                    <User className="h-8 w-8 text-green-600" />
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
                  <Separator />
                  <Link href="/account/edit">
                    <Button variant="outline" className="w-full bg-transparent">
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Profile
                    </Button>
                  </Link>
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
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center">
                      <Package className="mr-2 h-5 w-5" />
                      Order History
                    </CardTitle>
                    {userOrders.length > 0 && (
                      <div className="text-sm text-gray-500">Last updated: {new Date().toLocaleTimeString()}</div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading orders...</p>
                    </div>
                  ) : userOrders.length === 0 ? (
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
                        <div key={order.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <p className="font-medium">Order #{order.id}</p>
                              <p className="text-sm text-gray-600">{new Date(order.createdAt).toLocaleDateString()}</p>
                            </div>
                            <div className="text-right">
                              <Badge className={`mb-2 ${getStatusColor(order.status)}`}>
                                {getStatusText(order.status)}
                              </Badge>
                              <p className="text-sm font-medium">{order.total.toFixed(2)} EGP</p>
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
                                <p className="text-sm font-medium">{(item.price * item.quantity).toFixed(2)} EGP</p>
                              </div>
                            ))}
                          </div>

                          <Separator className="my-3" />

                          <div className="flex items-center justify-between">
                            <div className="flex items-center text-sm text-gray-600">
                              <MapPin className="h-4 w-4 mr-1" />
                              {order.shippingAddress.city}, {order.shippingAddress.governorate}
                            </div>
                            <div className="flex items-center space-x-2">
                              {order.status === "delivered" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-yellow-600 border-yellow-600 hover:bg-yellow-50 bg-transparent"
                                >
                                  <Star className="h-4 w-4 mr-1" />
                                  Rate & Review
                                </Button>
                              )}
                              <Button size="sm" variant="outline" className="bg-transparent">
                                <Eye className="h-4 w-4 mr-1" />
                                View Details
                              </Button>
                            </div>
                          </div>

                          {/* Live Status Indicator */}
                          {["pending", "processing", "shipped"].includes(order.status) && (
                            <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                              <div className="flex items-center">
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse mr-2"></div>
                                <span className="text-blue-700">
                                  {order.status === "pending" && "Your order is being prepared"}
                                  {order.status === "processing" && "Your order is being processed"}
                                  {order.status === "shipped" && "Your order is on its way"}
                                </span>
                              </div>
                            </div>
                          )}
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

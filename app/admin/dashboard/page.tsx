"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Package,
  ShoppingCart,
  Users,
  TrendingUp,
  Plus,
  Eye,
  Edit,
  Trash2,
  ArrowLeft,
  RefreshCw,
  Percent,
  Gift,
} from "lucide-react"
import { Navigation } from "@/components/navigation"
import { useAuth } from "@/lib/auth-context"

interface Product {
  _id: string
  id: string
  name: string
  price: number
  category: string
  images: string[]
  isActive: boolean
  isNew: boolean
  isBestseller: boolean
  createdAt: string
}

interface Order {
  discountAmount: number
  _id: string
  id: string
  total: number
  subtotal: number
  shipping: number
  status: string
  createdAt: string
  shippingAddress: {
    name: string
    governorate: string 
  }
  items: Array<{
    name: string
    quantity: number
    price: number
  }>
}

interface DiscountCode {
  _id: string
  code: string
  type: "percentage" | "fixed"
  value: number
  minOrderAmount?: number
  maxUses?: number
  currentUses: number
  isActive: boolean
  expiresAt?: string
  createdAt: string
}

interface Offer {
  _id: string
  title: string
  description: string
  discountCode?: string
  isActive: boolean
  priority: number
  expiresAt?: string
  createdAt: string
}

function getShippingCost(governorate: string): number {
  const shippingRates: { [key: string]: number } = {
    Dakahlia: 70,
    Cairo: 75,
    Giza: 75,
    Alexandria: 80,
    Qalyubia: 75,
    Sharqia: 75,
    Gharbia: 75,
    "Kafr El Sheikh": 80,
    Damietta: 80,
    "Port Said": 85,
    Ismailia: 85,
    Suez: 90,
    Beheira: 85,
    Monufia: 80,
    "Beni Suef": 90,
    Faiyum: 90,
    Minya: 95,
    Asyut: 95,
    Sohag: 100,
    Qena: 100,
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


export default function AdminDashboard() {
  const { state: authState } = useAuth()
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>([])
  const [offers, setOffers] = useState<Offer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [refreshing, setRefreshing] = useState(false)

  // Discount code form
  const [discountForm, setDiscountForm] = useState({
    code: "",
    type: "percentage" as "percentage" | "fixed",
    value: "",
    minOrderAmount: "",
    maxUses: "",
    expiresAt: "",
  })

  // Offer form
  const [offerForm, setOfferForm] = useState({
    title: "",
    description: "",
    discountCode: "",
    priority: "",
    expiresAt: "",
  })

  useEffect(() => {
    if (!authState.isAuthenticated || authState.user?.role !== "admin") {
      router.push("/auth/login")
      return
    }

    fetchData()
  }, [authState, router])

  const fetchData = async () => {
    console.log("🔄 [Dashboard] Fetching admin data...")
    setLoading(true)
    setError("")

    try {
      const token = localStorage.getItem("sense_token")
      console.log("🔐 [Dashboard] Token present:", !!token)

      if (!token) {
        throw new Error("No authentication token found")
      }

      // Fetch products
      console.log("🧴 [Dashboard] Fetching products...")
      const productsResponse = await fetch("/api/products", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!productsResponse.ok) {
        throw new Error(`Products fetch failed: ${productsResponse.status}`)
      }

      const productsData = await productsResponse.json()
      console.log("✅ [Dashboard] Products fetched:", productsData.length)
      setProducts(productsData)

      // Fetch orders
      console.log("📦 [Dashboard] Fetching orders...")
      const ordersResponse = await fetch("/api/orders", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!ordersResponse.ok) {
        throw new Error(`Orders fetch failed: ${ordersResponse.status}`)
      }

      const ordersData = await ordersResponse.json()
      console.log("✅ [Dashboard] Orders fetched:", ordersData.length)
      setOrders(ordersData)

      // Fetch discount codes
      const discountResponse = await fetch("/api/discount-codes", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (discountResponse.ok) {
        const discountData = await discountResponse.json()
        setDiscountCodes(discountData)
      }

      // Fetch offers
      const offersResponse = await fetch("/api/offers", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (offersResponse.ok) {
        const offersData = await offersResponse.json()
        setOffers(offersData)
      }
    } catch (error) {
      console.error("❌ [Dashboard] Error fetching data:", error)
      setError(error instanceof Error ? error.message : "Failed to fetch data")
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchData()
    setRefreshing(false)
  }

  const handleStatusUpdate = async (orderId: string, status: string) => {
    try {
      const token = localStorage.getItem("sense_token")
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      })

      if (response.ok) {
        // Update local state
        setOrders(orders.map((order) => (order.id === orderId ? { ...order, status } : order)))
        console.log("✅ [Dashboard] Order status updated:", orderId, status)
      } else {
        console.error("❌ [Dashboard] Failed to update order status")
      }
    } catch (error) {
      console.error("❌ [Dashboard] Error updating order status:", error)
    }
  }

  const handleCreateDiscountCode = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem("sense_token")
      const response = await fetch("/api/discount-codes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          code: discountForm.code,
          type: discountForm.type,
          value: Number.parseFloat(discountForm.value),
          minOrderAmount: discountForm.minOrderAmount ? Number.parseFloat(discountForm.minOrderAmount) : undefined,
          maxUses: discountForm.maxUses ? Number.parseInt(discountForm.maxUses) : undefined,
          expiresAt: discountForm.expiresAt || undefined,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        setDiscountCodes([result.discountCode, ...discountCodes])
        setDiscountForm({
          code: "",
          type: "percentage",
          value: "",
          minOrderAmount: "",
          maxUses: "",
          expiresAt: "",
        })
      }
    } catch (error) {
      console.error("Error creating discount code:", error)
    }
  }

  const handleCreateOffer = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem("sense_token")
      const response = await fetch("/api/offers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: offerForm.title,
          description: offerForm.description,
          discountCode: offerForm.discountCode || undefined,
          priority: offerForm.priority ? Number.parseInt(offerForm.priority) : 0,
          expiresAt: offerForm.expiresAt || undefined,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        setOffers([result.offer, ...offers])
        setOfferForm({
          title: "",
          description: "",
          discountCode: "",
          priority: "",
          expiresAt: "",
        })
      }
    } catch (error) {
      console.error("Error creating offer:", error)
    }
  }

  if (!authState.isAuthenticated || authState.user?.role !== "admin") {
    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="pt-32 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  // Calculate revenue without shipping costs
  const totalRevenue = orders.reduce((sum, order) => {
    const itemsTotal = order.items.reduce((itemSum, item) => itemSum + item.price * item.quantity, 0)
    return sum + itemsTotal
  }, 0)

  const pendingOrders = orders.filter((order) => order.status === "pending").length
  const totalProducts = products.length
  const activeProducts = products.filter((p) => p.isActive).length

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
                <h1 className="text-3xl font-light tracking-wider mb-2">Admin Dashboard</h1>
                <p className="text-gray-600">Welcome back, {authState.user?.name}</p>
              </div>
              <div className="flex items-center space-x-4">
                <Button onClick={handleRefresh} variant="outline" disabled={refreshing} className="bg-transparent">
                  <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
                <Link href="/admin/products/add">
                  <Button className="bg-black text-white hover:bg-gray-800">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Product
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>

          {error && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-600">{error}</AlertDescription>
              </Alert>
            </motion.div>
          )}

          {/* Stats Cards */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Revenue</p>
                      <p className="text-2xl font-light">{totalRevenue.toFixed(2)} EGP</p>
                      <p className="text-xs text-gray-500">Excluding shipping</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-green-600" />
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
                      <p className="text-sm text-gray-600">Total Orders</p>
                      <p className="text-2xl font-light">{orders.length}</p>
                    </div>
                    <ShoppingCart className="h-8 w-8 text-blue-600" />
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
                      <p className="text-sm text-gray-600">Pending Orders</p>
                      <p className="text-2xl font-light">{pendingOrders}</p>
                    </div>
                    <Package className="h-8 w-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Active Products</p>
                      <p className="text-2xl font-light">
                        {activeProducts}/{totalProducts}
                      </p>
                    </div>
                    <Users className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            <Tabs defaultValue="products" className="space-y-6">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="products">Products</TabsTrigger>
                <TabsTrigger value="orders">Orders</TabsTrigger>
                <TabsTrigger value="discounts">Discount Codes</TabsTrigger>
                <TabsTrigger value="offers">Offers</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
              </TabsList>

              <TabsContent value="products">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Products Catalog ({products.length})</CardTitle>
                      <Link href="/admin/products/add">
                        <Button size="sm" className="bg-black text-white hover:bg-gray-800">
                          <Plus className="mr-2 h-4 w-4" />
                          Add Product
                        </Button>
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {products.length === 0 ? (
                      <div className="text-center py-8">
                        <Package className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                        <p className="text-gray-600 mb-4">No products found</p>
                        <Link href="/admin/products/add">
                          <Button className="bg-black text-white hover:bg-gray-800">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Your First Product
                          </Button>
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {products.map((product) => (
                          <div key={product._id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center space-x-4">
                              <div className="relative w-16 h-16 flex-shrink-0">
                                <Image
                                  src={product.images[0] || "/placeholder.svg?height=64&width=64"}
                                  alt={product.name}
                                  fill
                                  className="object-cover rounded"
                                />
                              </div>
                              <div>
                                <p className="font-medium">{product.name}</p>
                                <p className="text-sm text-gray-600 capitalize">{product.category}</p>
                                <p className="text-sm font-medium">{product.price} EGP</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {product.isNew && <Badge variant="secondary">New</Badge>}
                              {product.isBestseller && <Badge className="bg-black text-white">Bestseller</Badge>}
                              <Badge variant={product.isActive ? "default" : "secondary"}>
                                {product.isActive ? "Active" : "Inactive"}
                              </Badge>
                              <Button size="sm" variant="outline">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 hover:text-red-700 bg-transparent"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="orders">
  <Card>
    <CardHeader>
      <CardTitle>Recent Orders ({orders.length})</CardTitle>
    </CardHeader>
    <CardContent>
      {orders.length === 0 ? (
        <div className="text-center py-8">
          <ShoppingCart className="h-12 w-12 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-600">No orders found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const subtotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
            const shipping = subtotal > 2000 ? 0 : getShippingCost(order.shippingAddress.governorate)
            const discount = order.discountAmount || 0
            const total = subtotal - discount + shipping
            return (
              <div key={order._id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-4">
                    <div>
                      <p className="font-medium">Order #{order.id}</p>
                      <p className="text-sm text-gray-600">{order.shippingAddress.name}</p>
                      <p className="text-sm text-gray-600">{new Date(order.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-600">
                        {order.items.length} item(s) • {total.toFixed(2)} EGP
                      </p>
                      <p className="text-xs text-gray-500">
                        {order.items.map((item) => `${item.name} (${item.quantity})`).join(", ")}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                    className="border rounded px-3 py-1 text-sm"
                  >
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
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
                  <Link href={`/admin/orders/${order.id}`}>
                    <Button size="sm" variant="outline">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </CardContent>
  </Card>
</TabsContent>


              <TabsContent value="discounts">
                <div className="grid lg:grid-cols-2 gap-6">
                  {/* Create Discount Code */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Percent className="mr-2 h-5 w-5" />
                        Create Discount Code
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleCreateDiscountCode} className="space-y-4">
                        <div>
                          <Label htmlFor="code">Discount Code *</Label>
                          <Input
                            id="code"
                            value={discountForm.code}
                            onChange={(e) => setDiscountForm({ ...discountForm, code: e.target.value })}
                            placeholder="SAVE20"
                            required
                          />
                          <p className="text-xs text-gray-500 mt-1">Code will be stored in uppercase</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="type">Type *</Label>
                            <Select
                              value={discountForm.type}
                              onValueChange={(value: "percentage" | "fixed") =>
                                setDiscountForm({ ...discountForm, type: value })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="percentage">Percentage</SelectItem>
                                <SelectItem value="fixed">Fixed Amount</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label htmlFor="value">
                              Value * {discountForm.type === "percentage" ? "(%)" : "(EGP)"}
                            </Label>
                            <Input
                              id="value"
                              type="number"
                              value={discountForm.value}
                              onChange={(e) => setDiscountForm({ ...discountForm, value: e.target.value })}
                              placeholder={discountForm.type === "percentage" ? "20" : "100"}
                              required
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="minOrderAmount">Min Order Amount (EGP)</Label>
                            <Input
                              id="minOrderAmount"
                              type="number"
                              value={discountForm.minOrderAmount}
                              onChange={(e) => setDiscountForm({ ...discountForm, minOrderAmount: e.target.value })}
                              placeholder="500"
                            />
                          </div>

                          <div>
                            <Label htmlFor="maxUses">Max Uses</Label>
                            <Input
                              id="maxUses"
                              type="number"
                              value={discountForm.maxUses}
                              onChange={(e) => setDiscountForm({ ...discountForm, maxUses: e.target.value })}
                              placeholder="100"
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="expiresAt">Expires At</Label>
                          <Input
                            id="expiresAt"
                            type="datetime-local"
                            value={discountForm.expiresAt}
                            onChange={(e) => setDiscountForm({ ...discountForm, expiresAt: e.target.value })}
                          />
                        </div>

                        <Button type="submit" className="w-full bg-black text-white hover:bg-gray-800">
                          Create Discount Code
                        </Button>
                      </form>
                    </CardContent>
                  </Card>

                  {/* Discount Codes List */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Active Discount Codes ({discountCodes.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {discountCodes.length === 0 ? (
                        <div className="text-center py-8">
                          <Percent className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                          <p className="text-gray-600">No discount codes created yet</p>
                        </div>
                      ) : (
                        <div className="space-y-4 max-h-96 overflow-y-auto">
                          {discountCodes.map((code) => (
                            <div key={code._id} className="p-4 border rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-mono font-medium">{code.code}</span>
                                <Badge variant={code.isActive ? "default" : "secondary"}>
                                  {code.isActive ? "Active" : "Inactive"}
                                </Badge>
                              </div>
                              <div className="text-sm text-gray-600 space-y-1">
                                <p>{code.type === "percentage" ? `${code.value}% off` : `${code.value} EGP off`}</p>
                                {code.minOrderAmount && <p>Min order: {code.minOrderAmount} EGP</p>}
                                {code.maxUses && (
                                  <p>
                                    Uses: {code.currentUses}/{code.maxUses}
                                  </p>
                                )}
                                {code.expiresAt && <p>Expires: {new Date(code.expiresAt).toLocaleDateString()}</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="offers">
                <div className="grid lg:grid-cols-2 gap-6">
                  {/* Create Offer */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Gift className="mr-2 h-5 w-5" />
                        Create Offer
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleCreateOffer} className="space-y-4">
                        <div>
                          <Label htmlFor="title">Offer Title *</Label>
                          <Input
                            id="title"
                            value={offerForm.title}
                            onChange={(e) => setOfferForm({ ...offerForm, title: e.target.value })}
                            placeholder="🎉 Special Weekend Sale!"
                            required
                          />
                        </div>

                        <div>
                          <Label htmlFor="description">Description *</Label>
                          <Textarea
                            id="description"
                            value={offerForm.description}
                            onChange={(e) => setOfferForm({ ...offerForm, description: e.target.value })}
                            placeholder="Get 20% off on all fragrances this weekend only!"
                            rows={3}
                            required
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="discountCode">Discount Code (Optional)</Label>
                            <Input
                              id="discountCode"
                              value={offerForm.discountCode}
                              onChange={(e) => setOfferForm({ ...offerForm, discountCode: e.target.value })}
                              placeholder="WEEKEND20"
                            />
                          </div>

                          <div>
                            <Label htmlFor="priority">Priority</Label>
                            <Input
                              id="priority"
                              type="number"
                              value={offerForm.priority}
                              onChange={(e) => setOfferForm({ ...offerForm, priority: e.target.value })}
                              placeholder="1"
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="offerExpiresAt">Expires At</Label>
                          <Input
                            id="offerExpiresAt"
                            type="datetime-local"
                            value={offerForm.expiresAt}
                            onChange={(e) => setOfferForm({ ...offerForm, expiresAt: e.target.value })}
                          />
                        </div>

                        <Button type="submit" className="w-full bg-black text-white hover:bg-gray-800">
                          Create Offer
                        </Button>
                      </form>
                    </CardContent>
                  </Card>

                  {/* Offers List */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Active Offers ({offers.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {offers.length === 0 ? (
                        <div className="text-center py-8">
                          <Gift className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                          <p className="text-gray-600">No offers created yet</p>
                        </div>
                      ) : (
                        <div className="space-y-4 max-h-96 overflow-y-auto">
                          {offers.map((offer) => (
                            <div key={offer._id} className="p-4 border rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium">{offer.title}</span>
                                <Badge variant={offer.isActive ? "default" : "secondary"}>
                                  {offer.isActive ? "Active" : "Inactive"}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600 mb-2">{offer.description}</p>
                              <div className="text-xs text-gray-500 space-y-1">
                                {offer.discountCode && <p>Code: {offer.discountCode}</p>}
                                <p>Priority: {offer.priority}</p>
                                {offer.expiresAt && <p>Expires: {new Date(offer.expiresAt).toLocaleDateString()}</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="analytics">
                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Revenue Analytics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between">
                          <span>Total Revenue (Excluding Shipping)</span>
                          <span className="font-medium">{totalRevenue.toFixed(2)} EGP</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Average Order Value</span>
                          <span className="font-medium">
                            {orders.length > 0 ? (totalRevenue / orders.length).toFixed(2) : "0"} EGP
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Orders</span>
                          <span className="font-medium">{orders.length}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Product Analytics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between">
                          <span>Total Products</span>
                          <span className="font-medium">{totalProducts}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Active Products</span>
                          <span className="font-medium">{activeProducts}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>New Products</span>
                          <span className="font-medium">{products.filter((p) => p.isNew).length}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

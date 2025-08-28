"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Package, User, MapPin, CreditCard, Calendar, Phone, Mail } from "lucide-react"
import { Navigation } from "@/components/navigation"
import { useAuth } from "@/lib/auth-context"

interface OrderDetails {
  _id: string
  id: string
  userId: string
  items: Array<{
    id: string
    name: string
    price: number
    size: string
    volume: string
    image: string
    category: string
    quantity: number
  }>
  total: number
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled"
  shippingAddress: {
    name: string
    email: string
    phone: string
    address: string
    city: string
    governorate: string
    postalCode: string
  }
  paymentMethod: "cod" | "visa" | "mastercard"
  paymentDetails?: {
    cardNumber: string
    cardName: string
  }
  discountCode?: string
  discountAmount?: number
  createdAt: string
  updatedAt: string
}

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
}

const statusOptions = [
  { value: "pending", label: "Pending" },
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
]

export default function AdminOrderDetailsPage() {
  const { orderId } = useParams() as { orderId: string }
  const { state: authState } = useAuth()
  const router = useRouter()
  const [order, setOrder] = useState<OrderDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    if (!authState.isLoading && (!authState.isAuthenticated || authState.user?.role !== "admin")) {
      router.push("/auth/login")
      return
    }
    if (authState.isAuthenticated && authState.user?.role === "admin") {
      fetchOrderDetails()
    }
  }, [authState, orderId, router])

  const fetchOrderDetails = async () => {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${authState.token}` },
      })
      if (response.ok) {
        const data = await response.json()
        setOrder(data)
      } else setError("Failed to fetch order details")
    } catch (error) {
      console.error("Error fetching order:", error)
      setError("An error occurred while fetching order details")
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (newStatus: string) => {
    setUpdating(true)
    setError("")
    setSuccess("")
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authState.token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      })
      if (response.ok) {
        setOrder((prev) => (prev ? { ...prev, status: newStatus as any } : null))
        setSuccess("Order status updated successfully")
        setTimeout(() => setSuccess(""), 3000)
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to update order status")
      }
    } catch (error) {
      console.error("Error updating order:", error)
      setError("An error occurred while updating order status")
    } finally {
      setUpdating(false)
    }
  }

  if (authState.isLoading || loading) {
    return <div className="min-h-screen bg-gray-50"><Navigation /><div className="pt-32 flex justify-center"><div><div className="animate-spin h-12 w-12 border-b-2 border-black rounded-full mx-auto mb-4"></div><p className="text-gray-600">Loading order details...</p></div></div></div>
  }

  if (!authState.isAuthenticated || authState.user?.role !== "admin") return null

  if (!order) {
    return <div className="min-h-screen bg-gray-50"><Navigation /><div className="pt-32 flex justify-center"><div className="text-center"><h1 className="text-2xl font-light mb-4">Order not found</h1><Link href="/admin/dashboard"><Button className="bg-black text-white">Back to Dashboard</Button></Link></div></div></div>
  }

  const subtotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const shipping = subtotal > 2000 ? 0 : getShippingCost(order.shippingAddress.governorate)
  const discount = order.discountAmount || 0
  const total = subtotal - discount + shipping

  return <div className="min-h-screen bg-gray-50">
    <Navigation />
    <section className="pt-32 pb-16">
      <div className="container mx-auto px-6">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="mb-8">
          <Link href="/admin/dashboard" className="inline-flex items-center text-gray-600 hover:text-black mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
          </Link>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-light tracking-wider mb-2">Order Details</h1>
              <p className="text-gray-600">Order #{order.id}</p>
            </div>
            <Badge className={`px-3 py-1 text-sm font-medium ${statusColors[order.status]}`}>
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </Badge>
          </div>
        </motion.div>

        {error && <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6"><Alert className="border-red-200 bg-red-50"><AlertDescription className="text-red-600">{error}</AlertDescription></Alert></motion.div>}
        {success && <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6"><Alert className="border-green-200 bg-green-50"><AlertDescription className="text-green-600">{success}</AlertDescription></Alert></motion.div>}

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader><CardTitle className="flex items-center"><Package className="mr-2 h-5 w-5" />Order Items ({order.items.length})</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex space-x-4 p-4 border rounded-lg">
                      <Image src={item.image || "/placeholder.svg?height=80&width=80"} alt={item.name} width={80} height={80} className="rounded-lg object-cover" />
                      <div className="flex-1">
                        <h3 className="font-medium text-lg">{item.name}</h3>
                        <p className="text-gray-600">{item.size} ({item.volume}) • Quantity: {item.quantity}</p>
                        <p className="text-sm text-gray-500">Category: {item.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-lg">{item.price} EGP</p>
                        <p className="text-sm text-gray-600">Total: {(item.price * item.quantity).toFixed(2)} EGP</p>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator className="my-6" />

                <div className="space-y-2">
                  <div className="flex justify-between"><span>Subtotal</span><span>{subtotal.toFixed(2)} EGP</span></div>
                  {order.discountCode && <div className="flex justify-between text-green-600"><span>Discount ({order.discountCode})</span><span>-{discount.toFixed(2)} EGP</span></div>}
                  <div className="flex justify-between"><span>Shipping</span><span>{shipping === 0 ? "Free" : `${shipping} EGP`}</span></div>
                  <Separator />
                  <div className="flex justify-between text-lg font-medium"><span>Total</span><span>{total.toFixed(2)} EGP</span></div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Side Info Cards */}
          <div className="space-y-6">
            <Card><CardHeader><CardTitle>Update Status</CardTitle></CardHeader><CardContent>
              <Select value={order.status} onValueChange={updateOrderStatus} disabled={updating}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{statusOptions.map((option) => (<SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>))}</SelectContent>
              </Select>
              {updating && <p className="text-sm text-gray-600 mt-2">Updating status...</p>}
            </CardContent></Card>

            <Card><CardHeader><CardTitle className="flex items-center"><User className="mr-2 h-5 w-5" />Customer Information</CardTitle></CardHeader><CardContent className="space-y-3">
              <div className="flex items-center space-x-2"><User className="h-4 w-4 text-gray-500" /><span className="text-sm">{order.shippingAddress.name}</span></div>
              <div className="flex items-center space-x-2"><Mail className="h-4 w-4 text-gray-500" /><span className="text-sm">{order.shippingAddress.email}</span></div>
              <div className="flex items-center space-x-2"><Phone className="h-4 w-4 text-gray-500" /><span className="text-sm">{order.shippingAddress.phone}</span></div>
            </CardContent></Card>

            <Card><CardHeader><CardTitle className="flex items-center"><MapPin className="mr-2 h-5 w-5" />Shipping Address</CardTitle></CardHeader><CardContent><div className="text-sm space-y-1">
              <p>{order.shippingAddress.address}</p><p>{order.shippingAddress.city}, {order.shippingAddress.governorate}</p>{order.shippingAddress.postalCode && <p>Postal Code: {order.shippingAddress.postalCode}</p>}
            </div></CardContent></Card>

            <Card><CardHeader><CardTitle className="flex items-center"><CreditCard className="mr-2 h-5 w-5" />Payment Information</CardTitle></CardHeader><CardContent><div className="space-y-2">
              <div className="flex justify-between"><span className="text-sm text-gray-600">Method</span><span className="text-sm font-medium">{order.paymentMethod === "cod" ? "Cash on Delivery" : order.paymentMethod.toUpperCase()}</span></div>
              {order.paymentDetails && <><div className="flex justify-between"><span className="text-sm text-gray-600">Card Name</span><span className="text-sm">{order.paymentDetails.cardName}</span></div><div className="flex justify-between"><span className="text-sm text-gray-600">Card Number</span><span className="text-sm">****{order.paymentDetails.cardNumber}</span></div></>}
            </div></CardContent></Card>

            <Card><CardHeader><CardTitle className="flex items-center"><Calendar className="mr-2 h-5 w-5" />Order Timeline</CardTitle></CardHeader><CardContent><div className="space-y-2">
              <div className="flex justify-between"><span className="text-sm text-gray-600">Created</span><span className="text-sm">{new Date(order.createdAt).toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-sm text-gray-600">Last Updated</span><span className="text-sm">{new Date(order.updatedAt).toLocaleString()}</span></div>
            </div></CardContent></Card>
          </div>
        </div>
      </div>
    </section>
  </div>
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

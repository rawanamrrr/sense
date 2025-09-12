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
  Menu,
  X,
} from "lucide-react"
import { Navigation } from "@/components/navigation"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"

interface ProductSize {
  size: string
  volume: string
  originalPrice?: number
  discountedPrice?: number
}

interface Product {
  _id: string
  id: string
  name: string
  description: string
  longDescription?: string
  images: string[]
  rating: number
  reviews: number
  category: "men" | "women" | "packages"
  isActive: boolean
  isNew: boolean
  isBestseller: boolean
  createdAt: string
  sizes: ProductSize[]
  // Gift package fields
  isGiftPackage?: boolean
  packagePrice?: number
  packageOriginalPrice?: number
  giftPackageSizes?: any[]
  notes?: {
    top: string[]
    middle: string[]
    base: string[]
  }
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
    phone?: string
    secondaryPhone: string
  }
  items: Array<{
    name: string
    quantity: number
    price: number
  }>
}

type DiscountType = "percentage" | "fixed" | "buyXgetX";

interface DiscountCode {
  _id: string
  code: string
  type: DiscountType
  value: number
  minOrderAmount?: number
  maxUses?: number
  currentUses: number
  isActive: boolean
  expiresAt?: string
  createdAt: string
  buyX?: number
  getX?: number
}

interface Offer {
  _id: string
  title?: string | null
  description: string
  discountCode?: string
  isActive: boolean
  priority: number
  expiresAt?: string
  createdAt: string
}

// Function to calculate the smallest price from all sizes
function getSmallestPrice(sizes: ProductSize[]) {
  if (!sizes || sizes.length === 0) return 0
  
  const prices = sizes.map(size => size.discountedPrice || size.originalPrice || 0)
  return Math.min(...prices.filter(price => price > 0))
}

// Function to calculate the smallest original price from all sizes
function getSmallestOriginalPrice(sizes: ProductSize[]) {
  if (!sizes || sizes.length === 0) return 0
  
  const prices = sizes.map(size => size.originalPrice || 0)
  return Math.min(...prices.filter(price => price > 0))
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

const getMinPrice = (product: Product): number => {
  // For gift packages, use package price
  if (product.isGiftPackage && product.packagePrice) {
    return product.packagePrice;
  }
  // For regular products, use the smallest price from all sizes
  return getSmallestPrice(product.sizes);
};

const formatDate = (dateString: string) => {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }
  return new Date(dateString).toLocaleDateString(undefined, options)
}

const formatDateForInput = (dateString: string) => {
  const date = new Date(dateString)
  const offset = date.getTimezoneOffset()
  const adjustedDate = new Date(date.getTime() - offset * 60 * 1000)
  return adjustedDate.toISOString().slice(0, 16)
}

// Add this helper function to get the auth token
const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  
  const authData = localStorage.getItem("sense_auth");
  if (!authData) return null;
  
  try {
    const parsedData = JSON.parse(authData);
    return parsedData.token || null;
  } catch (error) {
    console.error("Error parsing auth data:", error);
    return null;
  }
};

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
  const [updatingOrderStatus, setUpdatingOrderStatus] = useState<string | null>(null)

  // Discount code form
  const [discountForm, setDiscountForm] = useState({
    code: "",
    type: "percentage" as DiscountType,
    value: "",
    minOrderAmount: "",
    maxUses: "",
    expiresAt: "",
    buyX: "",
    getX: ""
  })

  // Offer form
  const [offerForm, setOfferForm] = useState({
    title: "",
    description: "",
    discountCode: "",
    priority: "",
    expiresAt: "",
  })

  // Discount code management
  const [editingDiscount, setEditingDiscount] = useState<DiscountCode | null>(null)

  // Offer management
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null)

  useEffect(() => {
    // Check if we're still loading auth state
    if (authState.isLoading) {
      return;
    }

    // Redirect if not authenticated or not admin
    if (!authState.isAuthenticated || authState.user?.role !== "admin") {
      router.push("/auth/login");
      return;
    }

    fetchData();
  }, [authState.isAuthenticated, authState.isLoading, authState.user, router]);

  const fetchData = async () => {
    setLoading(true)
    setError("")

    try {
      const token = getAuthToken();

      if (!token) {
        throw new Error("No authentication token found")
      }

      // Fetch products
      const productsResponse = await fetch("/api/products", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!productsResponse.ok) {
        throw new Error(`Products fetch failed: ${productsResponse.status}`)
      }

      const productsData = await productsResponse.json()
      setProducts(productsData)

      // Fetch orders
      const ordersResponse = await fetch("/api/orders", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!ordersResponse.ok) {
        throw new Error(`Orders fetch failed: ${ordersResponse.status}`)
      }

      const ordersData = await ordersResponse.json()
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
      console.error("Error fetching data:", error)
      setError(error instanceof Error ? error.message : "Failed to fetch data")
      // If there's an auth error, redirect to login
      if (error instanceof Error && error.message.includes("authentication")) {
        router.push("/auth/login");
      }
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
      setUpdatingOrderStatus(orderId)
      const token = getAuthToken();
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      })

      if (response.ok) {
        const result = await response.json()
        // Update the order with the response data
        setOrders(orders.map((order) => (order.id === orderId ? { ...order, ...result.order } : order)))
        
        // Show success message
        toast.success(`Order ${orderId} status updated to ${status}`)
        
        // Show email notification info
        if (status === 'delivered') {
          toast.info("Review reminder emails sent to customer")
        } else {
          toast.info("Order update email sent to customer")
        }
        
        // Refresh data to get latest information
        await fetchData()
      } else {
        const errorData = await response.json()
        toast.error(`Failed to update order status: ${errorData.error}`)
        console.error("Error updating order status:", errorData.error)
      }
    } catch (error) {
      toast.error("Failed to update order status")
      console.error("Error updating order status:", error)
    } finally {
      setUpdatingOrderStatus(null)
    }
  }

  const handleCreateDiscountCode = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const token = getAuthToken();
      
      const discountData: any = {
        code: discountForm.code,
        type: discountForm.type,
        value: Number.parseFloat(discountForm.value),
        minOrderAmount: discountForm.minOrderAmount ? Number.parseFloat(discountForm.minOrderAmount) : undefined,
        maxUses: discountForm.maxUses ? Number.parseInt(discountForm.maxUses) : undefined,
        expiresAt: discountForm.expiresAt || undefined,
      }

      if (discountForm.type === "buyXgetX") {
        discountData.buyX = Number.parseInt(discountForm.buyX)
        discountData.getX = Number.parseInt(discountForm.getX)
      }

      const response = await fetch("/api/discount-codes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(discountData),
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
          buyX: "",
          getX: ""
        })
      }
    } catch (error) {
      console.error("Error creating discount code:", error)
    }
  }

  const handleEditDiscount = (code: DiscountCode) => {
    setEditingDiscount(code)
    setDiscountForm({
      code: code.code,
      type: code.type,
      value: code.value.toString(),
      minOrderAmount: code.minOrderAmount?.toString() || "",
      maxUses: code.maxUses?.toString() || "",
      expiresAt: code.expiresAt ? formatDateForInput(code.expiresAt) : "",
      buyX: code.buyX?.toString() || "",
      getX: code.getX?.toString() || ""
    })
  }

  const handleUpdateDiscountCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingDiscount) return

    try {
      const token = getAuthToken();
      
      const discountData: any = {
        code: discountForm.code.toUpperCase(),
        type: discountForm.type,
        value: Number.parseFloat(discountForm.value),
        minOrderAmount: discountForm.minOrderAmount ? Number.parseFloat(discountForm.minOrderAmount) : undefined,
        maxUses: discountForm.maxUses ? Number.parseInt(discountForm.maxUses) : undefined,
        expiresAt: discountForm.expiresAt || undefined,
        isActive: editingDiscount.isActive,
      }

      if (discountForm.type === "buyXgetX") {
        discountData.buyX = Number.parseInt(discountForm.buyX)
        discountData.getX = Number.parseInt(discountForm.getX)
      }

      const response = await fetch(`/api/discount-codes?id=${editingDiscount._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(discountData),
      })

      if (response.ok) {
        const result = await response.json()
        setDiscountCodes(
          discountCodes.map((code) => (code._id === editingDiscount._id ? result.discountCode : code))
        )
        setEditingDiscount(null)
        setDiscountForm({
          code: "",
          type: "percentage",
          value: "",
          minOrderAmount: "",
          maxUses: "",
          expiresAt: "",
          buyX: "",
          getX: ""
        })
      }
    } catch (error) {
      console.error("Error updating discount code:", error)
    }
  }

  const handleDeleteDiscountCode = async (codeId: string) => {
    if (!confirm("Are you sure you want to delete this discount code? This action cannot be undone.")) return

    try {
      const token = getAuthToken();
      const response = await fetch(`/api/discount-codes?id=${codeId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        setDiscountCodes(discountCodes.filter((code) => code._id !== codeId))
      }
    } catch (error) {
      console.error("Error deleting discount code:", error)
    }
  }

  const handleToggleDiscountStatus = async (code: DiscountCode) => {
    try {
      const token = getAuthToken();
      const response = await fetch(`/api/discount-codes?id=${code._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          isActive: !code.isActive,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        setDiscountCodes(
          discountCodes.map((c) => (c._id === code._id ? result.discountCode : c))
        )
      }
    } catch (error) {
      console.error("Error toggling discount status:", error)
    }
  }

  const handleCreateOffer = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const token = getAuthToken();
      const response = await fetch("/api/offers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: offerForm.title ? offerForm.title.trim() : null,
          description: offerForm.description,
          discountCode: offerForm.discountCode || undefined,
          priority: offerForm.priority ? Number.parseInt(offerForm.priority) : 0,
          expiresAt: offerForm.expiresAt || undefined,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        setOffers([result.offer, ...offers])
        // Refresh data to get latest information
        await fetchData()
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

  const handleEditOffer = (offer: Offer) => {
    setEditingOffer(offer)
    setOfferForm({
      title: offer.title || "",
      description: offer.description,
      discountCode: offer.discountCode || "",
      priority: offer.priority.toString(),
      expiresAt: offer.expiresAt ? formatDateForInput(offer.expiresAt) : "",
    })
  }

  const handleUpdateOffer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingOffer) return

    try {
      const token = getAuthToken();
      const response = await fetch(`/api/offers?id=${editingOffer._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: offerForm.title ? offerForm.title.trim() : null,
          description: offerForm.description,
          discountCode: offerForm.discountCode || undefined,
          priority: offerForm.priority ? Number.parseInt(offerForm.priority) : 0,
          expiresAt: offerForm.expiresAt || undefined,
          isActive: editingOffer.isActive,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        setOffers(offers.map(offer => offer._id === editingOffer._id ? result.offer : offer))
        setEditingOffer(null)
        // Refresh data to get latest information
        await fetchData()
        setOfferForm({
          title: "",
          description: "",
          discountCode: "",
          priority: "",
          expiresAt: "",
        })
      }
    } catch (error) {
      console.error("Error updating offer:", error)
    }
  }

  const handleDeleteOffer = async (offerId: string) => {
    if (!confirm("Are you sure you want to delete this offer? This action cannot be undone.")) return

    try {
      const token = getAuthToken();
      const response = await fetch(`/api/offers?id=${offerId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        setOffers(offers.filter(offer => offer._id !== offerId))
      }
    } catch (error) {
      console.error("Error deleting offer:", error)
    }
  }

  const handleToggleOfferStatus = async (offer: Offer) => {
    try {
      const token = getAuthToken();
      const response = await fetch(`/api/offers?id=${offer._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          isActive: !offer.isActive,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        setOffers(offers.map(o => o._id === offer._id ? result.offer : o))
      }
    } catch (error) {
      console.error("Error toggling offer status:", error)
    }
  }

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product? This action cannot be undone.")) return

    try {
      const token = getAuthToken();
      
      const response = await fetch(`/api/products?id=${productId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const result = await response.json()

      if (response.ok) {
        setProducts(products.filter(p => p._id !== productId))
      } else {
        setError(result.error || "Failed to delete product")
      }
    } catch (error) {
      console.error("Error deleting product:", error)
      setError("An error occurred while deleting the product")
    }
  }

  const handleUpdateProduct = async (productId: string, updatedData: Partial<Product>) => {
    try {
      const token = getAuthToken();
      const response = await fetch(`/api/products/${productId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatedData),
      })

      if (response.ok) {
        setProducts(products.map(product => 
          product._id === productId ? { ...product, ...updatedData } : product
        ))
      }
    } catch (error) {
      console.error("Error updating product:", error)
    }
  };

  if (authState.isLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="pt-32 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!authState.isAuthenticated || authState.user?.role !== "admin") {
    return null
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
        <div className="container mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-6 sm:mb-8"
          >
            <Link href="/" className="inline-flex items-center text-gray-600 hover:text-black transition-colors mb-4 sm:mb-6">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
            
            {/* Mobile-optimized header */}
            <div className="space-y-4 sm:space-y-0 sm:flex sm:items-center sm:justify-between">
              <div className="text-center sm:text-left">
                <h1 className="text-2xl sm:text-3xl font-light tracking-wider mb-2">Admin Dashboard</h1>
                <p className="text-gray-600 text-sm sm:text-base">Welcome back, {authState.user?.name}</p>
              </div>
              
              {/* Mobile-friendly button layout */}
              <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-4">
                <Button 
                  onClick={handleRefresh} 
                  variant="outline" 
                  disabled={refreshing} 
                  className="bg-transparent w-full sm:w-auto text-sm"
                  size="sm"
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
                <Link href="/admin/products/add" className="w-full sm:w-auto">
                  <Button className="bg-black text-white hover:bg-gray-800 w-full sm:w-auto text-sm" size="sm">
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

          {/* Mobile-optimized Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
            >
              <Card>
                <CardContent className="p-3 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div className="mb-2 sm:mb-0">
                      <p className="text-xs sm:text-sm text-gray-600">Total Revenue</p>
                      <p className="text-lg sm:text-2xl font-light">{totalRevenue.toFixed(0)} EGP</p>
                      <p className="text-xs text-gray-500 hidden sm:block">Excluding shipping</p>
                    </div>
                    <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-green-600 self-end sm:self-auto" />
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
                <CardContent className="p-3 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div className="mb-2 sm:mb-0">
                      <p className="text-xs sm:text-sm text-gray-600">Total Orders</p>
                      <p className="text-lg sm:text-2xl font-light">{orders.length}</p>
                    </div>
                    <ShoppingCart className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 self-end sm:self-auto" />
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
                <CardContent className="p-3 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div className="mb-2 sm:mb-0">
                      <p className="text-xs sm:text-sm text-gray-600">Pending Orders</p>
                      <p className="text-lg sm:text-2xl font-light">{pendingOrders}</p>
                    </div>
                    <Package className="h-6 w-6 sm:h-8 sm:w-8 text-orange-600 self-end sm:self-auto" />
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
                <CardContent className="p-3 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div className="mb-2 sm:mb-0">
                      <p className="text-xs sm:text-sm text-gray-600">Active Products</p>
                      <p className="text-lg sm:text-2xl font-light">
                        {activeProducts}/{totalProducts}
                      </p>
                    </div>
                    <Users className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600 self-end sm:self-auto" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Main Content with mobile-optimized tabs */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            <Tabs defaultValue="products" className="space-y-6">
              {/* Mobile-scrollable tabs */}
              <div className="overflow-x-auto">
                <TabsList className="inline-flex h-10 items-center justify-start rounded-md bg-muted p-1 text-muted-foreground min-w-max">
                  <TabsTrigger value="products" className="whitespace-nowrap text-xs sm:text-sm px-3 py-1.5">Products</TabsTrigger>
                  <TabsTrigger value="orders" className="whitespace-nowrap text-xs sm:text-sm px-3 py-1.5">Orders</TabsTrigger>
                  <TabsTrigger value="discounts" className="whitespace-nowrap text-xs sm:text-sm px-3 py-1.5">Discounts</TabsTrigger>
                  <TabsTrigger value="offers" className="whitespace-nowrap text-xs sm:text-sm px-3 py-1.5">Offers</TabsTrigger>
                  <TabsTrigger value="analytics" className="whitespace-nowrap text-xs sm:text-sm px-3 py-1.5">Analytics</TabsTrigger>
              </TabsList>
              </div>

              <TabsContent value="products">
                <Card>
                  <CardHeader className="p-4 sm:p-6">
                    <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
                      <CardTitle className="text-lg sm:text-xl">Products Catalog ({products.length})</CardTitle>
                      <Link href="/admin/products/add" className="w-full sm:w-auto">
                        <Button size="sm" className="bg-black text-white hover:bg-gray-800 w-full sm:w-auto">
                          <Plus className="mr-2 h-4 w-4" />
                          Add Product
                        </Button>
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6">
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
                          <motion.div 
                            key={product._id} 
                            className="p-4 sm:p-5 border rounded-xl bg-white shadow-sm hover:shadow-lg transition-all duration-200 relative overflow-hidden"
                            whileHover={{ y: -5 }}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            viewport={{ once: true }}
                          >
                            {/* Enhanced Gift Package Background Effects */}
                            {product.isGiftPackage && (
                              <>
                                <motion.div 
                                  className="absolute -inset-4 bg-gradient-to-r from-purple-400/10 to-pink-400/10 rounded-lg -z-10"
                                  animate={{
                                    rotate: [0, 0.5, 0, -0.5, 0],
                                  }}
                                  transition={{
                                    duration: 8,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                  }}
                                />
                                <motion.div 
                                  className="absolute -inset-2 bg-gradient-to-r from-purple-300/15 to-pink-300/15 rounded-lg -z-10"
                                  animate={{
                                    rotate: [0, -0.3, 0, 0.3, 0],
                                  }}
                                  transition={{
                                    duration: 6,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                  }}
                                />
                              </>
                            )}
                            {/* Enhanced Mobile Layout */}
                            <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-start sm:justify-between">
                              {/* Product Image and Info - Mobile Optimized */}
                              <div className="flex flex-col sm:flex-row sm:items-start space-y-3 sm:space-y-0 sm:space-x-4 flex-1">
                                {/* Product Image with Enhanced Mobile Sizing */}
                                <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 mx-auto sm:mx-0">
                                <Image
                                    src={product.images[0] || "/placeholder.svg"}
                                  alt={product.name}
                                  fill
                                    className="object-cover rounded-xl shadow-sm"
                                  />
                                  {/* Enhanced Gift Package Indicator */}
                                  {product.isGiftPackage && (
                                    <motion.div 
                                      className="absolute -top-2 -right-2 bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 text-white text-xs px-3 py-1.5 rounded-full shadow-lg border-2 border-white"
                                      initial={{ scale: 0, rotate: -180 }}
                                      whileInView={{ scale: 1, rotate: 0 }}
                                      transition={{ duration: 0.6, type: "spring" }}
                                      viewport={{ once: true }}
                                      whileHover={{ scale: 1.1, rotate: 5 }}
                                    >
                                      <Gift className="h-3.5 w-3.5" />
                                    </motion.div>
                                  )}
                              </div>
                                
                                {/* Product Details - Mobile First Layout */}
                                <div className="flex-1 min-w-0 space-y-3 text-center sm:text-left">
                                  {/* Product Name and Category */}
                                  <div className="space-y-2">
                                    <p className="font-bold text-lg sm:text-xl text-gray-900 leading-tight">{product.name}</p>
                                    <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-3">
                                      <p className="text-sm text-gray-600 capitalize font-medium">{product.category}</p>
                                      {product.isGiftPackage && (
                                        <motion.div
                                          initial={{ scale: 0, x: -20 }}
                                          whileInView={{ scale: 1, x: 0 }}
                                          transition={{ duration: 0.5, delay: 0.2 }}
                                          viewport={{ once: true }}
                                          whileHover={{ scale: 1.05 }}
                                        >
                                          <Badge variant="secondary" className="text-xs bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border-purple-200 font-semibold px-3 py-1">
                                            🎁 Gift Package
                                          </Badge>
                                        </motion.div>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {/* Enhanced Price Display - Mobile Optimized */}
                                  <div className="text-lg sm:text-xl">
                                   {(() => {
                                      // Handle gift packages
                                      if (product.isGiftPackage) {
                                        const packagePrice = product.packagePrice || 0;
                                        const packageOriginalPrice = product.packageOriginalPrice || 0;
                                        
                                        if (packageOriginalPrice > 0 && packagePrice < packageOriginalPrice) {
                                          return (
                                            <motion.div 
                                              className="flex flex-col items-center sm:items-start space-y-1"
                                              initial={{ opacity: 0, y: 10 }}
                                              whileInView={{ opacity: 1, y: 0 }}
                                              transition={{ duration: 0.5, delay: 0.3 }}
                                              viewport={{ once: true }}
                                            >
                                              <motion.span 
                                                className="text-base text-gray-400 line-through font-medium"
                                                initial={{ opacity: 0, x: -10 }}
                                                whileInView={{ opacity: 1, x: 0 }}
                                                transition={{ duration: 0.4, delay: 0.4 }}
                                                viewport={{ once: true }}
                                              >
                                                EGP {packageOriginalPrice.toFixed(0)}
                                              </motion.span>
                                              <motion.span 
                                                className="text-red-600 font-bold text-xl"
                                                initial={{ opacity: 0, x: -10 }}
                                                whileInView={{ opacity: 1, x: 0 }}
                                                transition={{ duration: 0.4, delay: 0.5 }}
                                                viewport={{ once: true }}
                                              >
                                                EGP {packagePrice.toFixed(0)}
                                              </motion.span>
                                              <motion.span 
                                                className="text-xs text-green-600 font-semibold bg-green-50 px-2 py-1 rounded-full"
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                whileInView={{ opacity: 1, scale: 1 }}
                                                transition={{ duration: 0.4, delay: 0.6 }}
                                                viewport={{ once: true }}
                                                whileHover={{ scale: 1.05 }}
                                              >
                                                Save EGP {(packageOriginalPrice - packagePrice).toFixed(0)}
                                              </motion.span>
                                            </motion.div>
                                          );
                                        } else {
                                          return (
                                            <motion.span 
                                              className="text-gray-900 font-bold text-xl"
                                              initial={{ opacity: 0, y: 10 }}
                                              whileInView={{ opacity: 1, y: 0 }}
                                              transition={{ duration: 0.5, delay: 0.3 }}
                                              viewport={{ once: true }}
                                            >
                                              EGP {packagePrice.toFixed(0)}
                                            </motion.span>
                                          );
                                        }
                                      }
                                      
                                      // Handle regular products
                                     const smallestPrice = getSmallestPrice(product.sizes);
                                     const smallestOriginalPrice = getSmallestOriginalPrice(product.sizes);
                                     
                                     if (smallestOriginalPrice > 0 && smallestPrice < smallestOriginalPrice) {
                                       return (
                                          <motion.div 
                                            className="flex flex-col items-center sm:items-start space-y-1"
                                            initial={{ opacity: 0, y: 10 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.5, delay: 0.3 }}
                                            viewport={{ once: true }}
                                          >
                                            <motion.span 
                                              className="text-base text-gray-400 line-through font-medium"
                                              initial={{ opacity: 0, x: -10 }}
                                              whileInView={{ opacity: 1, x: 0 }}
                                              transition={{ duration: 0.4, delay: 0.4 }}
                                              viewport={{ once: true }}
                                            >
                                              EGP {smallestOriginalPrice.toFixed(0)}
                                            </motion.span>
                                            <motion.span 
                                              className="text-red-600 font-bold text-xl"
                                              initial={{ opacity: 0, x: -10 }}
                                              whileInView={{ opacity: 1, x: 0 }}
                                              transition={{ duration: 0.4, delay: 0.5 }}
                                              viewport={{ once: true }}
                                            >
                                              EGP {smallestPrice.toFixed(0)}
                                            </motion.span>
                                            <motion.span 
                                              className="text-xs text-green-600 font-semibold bg-green-50 px-2 py-1 rounded-full"
                                              initial={{ opacity: 0, scale: 0.8 }}
                                              whileInView={{ opacity: 1, scale: 1 }}
                                              transition={{ duration: 0.4, delay: 0.6 }}
                                              viewport={{ once: true }}
                                              whileHover={{ scale: 1.05 }}
                                            >
                                              Save EGP {(smallestOriginalPrice - smallestPrice).toFixed(0)}
                                            </motion.span>
                                          </motion.div>
                                       );
                                     } else {
                                        return (
                                          <motion.span 
                                            className="text-gray-900 font-bold text-xl"
                                            initial={{ opacity: 0, y: 10 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.5, delay: 0.3 }}
                                            viewport={{ once: true }}
                                          >
                                            EGP {smallestPrice.toFixed(0)}
                                          </motion.span>
                                        );
                                     }
                                   })()}
                                  </div>
                                  
                                  {/* Enhanced Mobile Badges - Better Spacing */}
                                  <div className="flex flex-wrap justify-center sm:justify-start gap-2 sm:hidden">
                                    {product.isNew && (
                                      <Badge variant="secondary" className="text-xs bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border-green-200 font-semibold px-3 py-1.5">
                                        ✨ New
                                      </Badge>
                                    )}
                                    {product.isBestseller && (
                                      <Badge className="bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-700 border-yellow-200 text-xs font-semibold px-3 py-1.5">
                                        🏆 Bestseller
                                      </Badge>
                                    )}
                                    <Badge 
                                      variant={product.isActive ? "default" : "secondary"} 
                                      className={`text-xs font-semibold px-3 py-1.5 ${
                                        product.isActive 
                                          ? "bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border-green-200" 
                                          : "bg-gradient-to-r from-gray-100 to-slate-100 text-gray-600 border-gray-200"
                                      }`}
                                    >
                                      {product.isActive ? "✅ Active" : "❌ Inactive"}
                                    </Badge>
                              </div>
                            </div>
                              </div>
                              
                              {/* Desktop Badges and Actions - Enhanced */}
                              <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:space-x-4">
                                {/* Desktop Badges - Hidden on Mobile */}
                                <div className="hidden sm:flex items-center space-x-2">
                              {product.isNew && <Badge variant="secondary">New</Badge>}
                              {product.isBestseller && <Badge className="bg-black text-white">Bestseller</Badge>}
                              <Badge variant={product.isActive ? "default" : "secondary"}>
                                {product.isActive ? "Active" : "Inactive"}
                              </Badge>
                                </div>
                                
                                {/* Enhanced Action Buttons - Mobile Optimized */}
                                <div className="flex justify-center sm:justify-end space-x-3">
                                  <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.4, delay: 0.7 }}
                                    viewport={{ once: true }}
                                    whileHover={{ scale: 1.05 }}
                                  >
                              <Link href={`/products/${product.category}/${product.id}`}>
                                      <Button size="sm" variant="outline" className="h-12 w-12 p-0 sm:h-10 sm:w-10 rounded-xl border-2 hover:border-blue-300 hover:bg-blue-50 transition-all">
                                        <Eye className="h-5 w-5 sm:h-4 sm:w-4 text-blue-600" />
                                </Button>
                              </Link>
                                  </motion.div>
                                  <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.4, delay: 0.8 }}
                                    viewport={{ once: true }}
                                    whileHover={{ scale: 1.05 }}
                                  >
                              <Link href={`/admin/products/edit?id=${product._id}`}>
                                      <Button size="sm" variant="outline" className="h-12 w-12 p-0 sm:h-10 sm:w-10 rounded-xl border-2 hover:border-green-300 hover:bg-green-50 transition-all">
                                        <Edit className="h-5 w-5 sm:h-4 sm:w-4 text-green-600" />
                                </Button>
                              </Link>
                                  </motion.div>
                                  <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.4, delay: 0.9 }}
                                    viewport={{ once: true }}
                                    whileHover={{ scale: 1.05 }}
                                  >
                              <Button
                                size="sm"
                                variant="outline"
                                      className="h-12 w-12 p-0 sm:h-10 sm:w-10 rounded-xl border-2 border-red-200 hover:border-red-400 hover:bg-red-50 transition-all"
                                onClick={() => handleDeleteProduct(product._id)}
                              >
                                      <Trash2 className="h-5 w-5 sm:h-4 sm:w-4 text-red-600" />
                              </Button>
                                  </motion.div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="orders">
                <Card>
                  <CardHeader className="p-4 sm:p-6">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg sm:text-xl">Recent Orders ({orders.length})</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6">
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
                            <div key={order._id} className="p-3 sm:p-4 border rounded-lg">
                              {/* Mobile-optimized order layout */}
                              <div className="space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between">
                                <div className="flex-1 space-y-2 sm:space-y-0">
                                  <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4">
                                    <div className="mb-2 sm:mb-0">
                                      <p className="font-medium text-sm sm:text-base">Order #{order.id}</p>
                                      <p className="text-xs sm:text-sm text-gray-600">{order.shippingAddress.name}</p>
                                      {order.shippingAddress.phone && (
                                        <p className="text-xs sm:text-sm text-gray-600">{order.shippingAddress.phone}{order.shippingAddress.secondaryPhone ? ` / ${order.shippingAddress.secondaryPhone}` : ""}</p>
                                      )}
                                      <p className="text-xs sm:text-sm text-gray-600">{new Date(order.createdAt).toLocaleString()}</p>
                                    </div>
                                  <div className="flex-1">
                                      <p className="text-xs sm:text-sm text-gray-600">
                                        {order.items.length} item(s) • {total.toFixed(0)} EGP
                                    </p>
                                      <p className="text-xs text-gray-500 truncate sm:truncate-none">
                                      {order.items.map((item) => `${item.name} (${item.quantity})`).join(", ")}
                                    </p>
                                  </div>
                                </div>
                              </div>
                                
                                {/* Mobile-friendly controls */}
                                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                                <select
                                  value={order.status}
                                  onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                                  disabled={updatingOrderStatus === order.id}
                                    className="border rounded px-2 py-1 text-xs sm:text-sm w-full sm:w-auto"
                                >
                                  <option value="pending">Pending</option>
                                  <option value="processing">Processing</option>
                                  <option value="shipped">Shipped</option>
                                  <option value="delivered">Delivered</option>
                                  <option value="cancelled">Cancelled</option>
                                </select>
                                  
                                  <div className="flex items-center justify-between sm:space-x-2">
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
                                      className="text-xs"
                                >
                                  {order.status}
                                </Badge>
                                <Link href={`/admin/orders/${order.id}`}>
                                      <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                                        <Eye className="h-3 w-3" />
                                  </Button>
                                </Link>
                                  </div>
                                </div>
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
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Discount Code Form */}
                  <Card>
                    <CardHeader className="p-4 sm:p-6">
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center text-lg">
                          <Percent className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                          {editingDiscount ? "Edit Discount Code" : "Create Discount Code"}
                        </CardTitle>
                        {editingDiscount && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingDiscount(null)
                              setDiscountForm({
                                code: "",
                                type: "percentage",
                                value: "",
                                minOrderAmount: "",
                                maxUses: "",
                                expiresAt: "",
                                buyX: "",
                                getX: ""
                              })
                            }}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6">
                      <form
                        onSubmit={editingDiscount ? handleUpdateDiscountCode : handleCreateDiscountCode}
                        className="space-y-4"
                      >
                        <div>
                          <Label htmlFor="code" className="text-sm">Discount Code *</Label>
                          <Input
                            id="code"
                            value={discountForm.code}
                            onChange={(e) => setDiscountForm({ ...discountForm, code: e.target.value })}
                            placeholder="SAVE20"
                            required
                            className="mt-1"
                          />
                          <p className="text-xs text-gray-500 mt-1">Code will be stored in uppercase</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="type" className="text-sm">Type *</Label>
                            <Select
                              value={discountForm.type}
                              onValueChange={(value: DiscountType) =>
                                setDiscountForm({ ...discountForm, type: value })
                              }
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="percentage">Percentage</SelectItem>
                                <SelectItem value="fixed">Fixed Amount</SelectItem>
                                <SelectItem value="buyXgetX">Buy X Get X</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {(discountForm.type === "percentage" || discountForm.type === "fixed") && (
                            <div>
                              <Label htmlFor="value" className="text-sm">
                                Value * {discountForm.type === "percentage" ? "(%)" : "(EGP)"}
                              </Label>
                              <Input
                                id="value"
                                type="number"
                                value={discountForm.value}
                                onChange={(e) => setDiscountForm({ ...discountForm, value: e.target.value })}
                                placeholder={discountForm.type === "percentage" ? "20" : "100"}
                                required
                                className="mt-1"
                              />
                            </div>
                          )}
                        </div>

                        {discountForm.type === "buyXgetX" && (
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="buyX" className="text-sm">Buy Quantity *</Label>
                              <Input
                                id="buyX"
                                type="number"
                                value={discountForm.buyX}
                                onChange={(e) => setDiscountForm({ ...discountForm, buyX: e.target.value })}
                                placeholder="2"
                                required
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label htmlFor="getX" className="text-sm">Get Quantity *</Label>
                              <Input
                                id="getX"
                                type="number"
                                value={discountForm.getX}
                                onChange={(e) => setDiscountForm({ ...discountForm, getX: e.target.value })}
                                placeholder="1"
                                required
                                className="mt-1"
                              />
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="minOrderAmount" className="text-sm">Min Order Amount (EGP)</Label>
                            <Input
                              id="minOrderAmount"
                              type="number"
                              value={discountForm.minOrderAmount}
                              onChange={(e) => setDiscountForm({ ...discountForm, minOrderAmount: e.target.value })}
                              placeholder="500"
                              className="mt-1"
                            />
                          </div>

                          <div>
                            <Label htmlFor="maxUses" className="text-sm">Max Uses</Label>
                            <Input
                              id="maxUses"
                              type="number"
                              value={discountForm.maxUses}
                              onChange={(e) => setDiscountForm({ ...discountForm, maxUses: e.target.value })}
                              placeholder="100"
                              className="mt-1"
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="expiresAt" className="text-sm">Expires At</Label>
                          <Input
                            id="expiresAt"
                            type="datetime-local"
                            value={discountForm.expiresAt}
                            onChange={(e) => setDiscountForm({ ...discountForm, expiresAt: e.target.value })}
                            className="mt-1"
                          />
                        </div>

                        <Button type="submit" className="w-full bg-black text-white hover:bg-gray-800">
                          {editingDiscount ? "Update Discount Code" : "Create Discount Code"}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>

                  {/* Discount Codes List */}
                  <Card>
                    <CardHeader className="p-4 sm:p-6">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Discount Codes ({discountCodes.length})</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6">
                      {discountCodes.length === 0 ? (
                        <div className="text-center py-8">
                          <Percent className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                          <p className="text-gray-600">No discount codes created yet</p>
                        </div>
                      ) : (
                        <div className="space-y-4 max-h-[400px] sm:max-h-[600px] overflow-y-auto">
                          {discountCodes.map((code) => (
                            <div key={code._id} className="p-3 sm:p-4 border rounded-lg">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 space-y-2 sm:space-y-0">
                                <span className="font-mono font-medium text-sm sm:text-base">{code.code}</span>
                                <div className="flex items-center space-x-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleToggleDiscountStatus(code)}
                                    className={`${code.isActive ? "text-green-600" : "text-gray-500"} text-xs`}
                                  >
                                    {code.isActive ? "Active" : "Inactive"}
                                  </Button>
                                  <Badge variant={code.isActive ? "default" : "secondary"} className="text-xs">
                                    {code.type === "percentage" 
                                      ? `${code.value}%` 
                                      : code.type === "fixed" 
                                        ? `${code.value} EGP` 
                                        : `Buy ${code.buyX} Get ${code.getX}`}
                                  </Badge>
                                </div>
                              </div>
                              <div className="text-xs sm:text-sm text-gray-600 space-y-1">
                                {code.minOrderAmount && <p>Min order: {code.minOrderAmount} EGP</p>}
                                {code.maxUses && (
                                  <p>
                                    Uses: {code.currentUses}/{code.maxUses}
                                  </p>
                                )}
                                {code.expiresAt && <p>Expires: {formatDate(code.expiresAt)}</p>}
                                <p>Created: {formatDate(code.createdAt)}</p>
                              </div>
                              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 mt-3">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditDiscount(code)}
                                  className="w-full sm:w-auto text-xs"
                                >
                                  <Edit className="h-3 w-3 mr-2" />
                                  Edit
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700 w-full sm:w-auto text-xs"
                                  onClick={() => handleDeleteDiscountCode(code._id)}
                                >
                                  <Trash2 className="h-3 w-3 mr-2" />
                                  Delete
                                </Button>
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
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Create/Edit Offer Form */}
                  <Card>
                    <CardHeader className="p-4 sm:p-6">
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center text-lg">
                          <Gift className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                          {editingOffer ? "Edit Offer" : "Create Offer"}
                        </CardTitle>
                        {editingOffer && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingOffer(null)
                              setOfferForm({
                                title: "",
                                description: "",
                                discountCode: "",
                                priority: "",
                                expiresAt: "",
                              })
                            }}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6">
                      <form onSubmit={editingOffer ? handleUpdateOffer : handleCreateOffer} className="space-y-4">
                        <div>
                          <Label htmlFor="title" className="text-sm">Offer Title</Label>
                          <Input
                            id="title"
                            value={offerForm.title}
                            onChange={(e) => setOfferForm({ ...offerForm, title: e.target.value })}
                            placeholder="🎉 Special Weekend Sale!"
                            className="mt-1"
                          />
                        </div>

                        <div>
                          <Label htmlFor="description" className="text-sm">Description *</Label>
                          <Textarea
                            id="description"
                            value={offerForm.description}
                            onChange={(e) => setOfferForm({ ...offerForm, description: e.target.value })}
                            placeholder="Get 20% off on all fragrances this weekend only!"
                            rows={3}
                            required
                            className="mt-1"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="discountCode" className="text-sm">Discount Code (Optional)</Label>
                            <Input
                              id="discountCode"
                              value={offerForm.discountCode}
                              onChange={(e) => setOfferForm({ ...offerForm, discountCode: e.target.value })}
                              placeholder="WEEKEND20"
                              className="mt-1"
                            />
                          </div>

                          <div>
                            <Label htmlFor="priority" className="text-sm">Priority</Label>
                            <Input
                              id="priority"
                              type="number"
                              value={offerForm.priority}
                              onChange={(e) => setOfferForm({ ...offerForm, priority: e.target.value })}
                              placeholder="1"
                              className="mt-1"
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="offerExpiresAt" className="text-sm">Expires At</Label>
                          <Input
                            id="offerExpiresAt"
                            type="datetime-local"
                            value={offerForm.expiresAt}
                            onChange={(e) => setOfferForm({ ...offerForm, expiresAt: e.target.value })}
                            className="mt-1"
                          />
                        </div>

                        <Button type="submit" className="w-full bg-black text-white hover:bg-gray-800">
                          {editingOffer ? "Update Offer" : "Create Offer"}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>

                  {/* Offers List */}
                  <Card>
                    <CardHeader className="p-4 sm:p-6">
                      <CardTitle className="text-lg">Active Offers ({offers.length})</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6">
                      {offers.length === 0 ? (
                        <div className="text-center py-8">
                          <Gift className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                          <p className="text-gray-600">No offers created yet</p>
                        </div>
                      ) : (
                        <div className="space-y-4 max-h-[400px] sm:max-h-96 overflow-y-auto">
                          {offers.map((offer) => (
                            offer && (
                              <div key={offer._id} className="p-3 sm:p-4 border rounded-lg">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 space-y-2 sm:space-y-0">
                                  <span className="font-medium text-sm sm:text-base">{offer.title || "Untitled Offer"}</span>
                                  <div className="flex items-center space-x-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleToggleOfferStatus(offer)}
                                      className={`${offer.isActive ? "text-green-600" : "text-gray-500"} text-xs`}
                                    >
                                      {offer.isActive ? "Active" : "Inactive"}
                                    </Button>
                                    <Badge variant={offer.isActive ? "default" : "secondary"} className="text-xs">
                                      Priority: {offer.priority}
                                    </Badge>
                                  </div>
                                </div>
                                <p className="text-xs sm:text-sm text-gray-600 mb-2">{offer.description}</p>
                                <div className="text-xs text-gray-500 space-y-1">
                                  {offer.discountCode && <p>Code: {offer.discountCode}</p>}
                                  {offer.expiresAt && <p>Expires: {formatDate(offer.expiresAt)}</p>}
                                  <p>Created: {formatDate(offer.createdAt)}</p>
                                </div>
                                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 mt-3">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEditOffer(offer)}
                                    className="w-full sm:w-auto text-xs"
                                  >
                                    <Edit className="h-3 w-3 mr-2" />
                                    Edit
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-red-600 hover:text-red-700 w-full sm:w-auto text-xs"
                                    onClick={() => handleDeleteOffer(offer._id)}
                                  >
                                    <Trash2 className="h-3 w-3 mr-2" />
                                    Delete
                                  </Button>
                                </div>
                              </div>
                            )
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="analytics">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader className="p-4 sm:p-6">
                      <CardTitle className="text-lg">Revenue Analytics</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6">
                      <div className="space-y-4">
                        <div className="flex justify-between text-sm">
                          <span>Total Revenue (Excluding Shipping)</span>
                          <span className="font-medium">{totalRevenue.toFixed(0)} EGP</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Average Order Value</span>
                          <span className="font-medium">
                            {orders.length > 0 ? (totalRevenue / orders.length).toFixed(0) : "0"} EGP
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Total Orders</span>
                          <span className="font-medium">{orders.length}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="p-4 sm:p-6">
                      <CardTitle className="text-lg">Product Analytics</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6">
                      <div className="space-y-4">
                        <div className="flex justify-between text-sm">
                          <span>Total Products</span>
                          <span className="font-medium">{totalProducts}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Active Products</span>
                          <span className="font-medium">{activeProducts}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>New Products</span>
                          <span className="font-medium">{products.filter((p) => p.isNew).length}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Bestsellers</span>
                          <span className="font-medium">{products.filter((p) => p.isBestseller).length}</span>
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
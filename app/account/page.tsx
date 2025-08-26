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
import { Package, ShoppingCart, User, MapPin, ArrowLeft, Eye, Edit, Star, RefreshCw, X } from "lucide-react"
import { Navigation } from "@/components/navigation"
import { useAuth } from "@/lib/auth-context"

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

export default function MyAccountPage() {
  const { state: authState } = useAuth()
  const router = useRouter()
  const [userOrders, setUserOrders] = useState<any[]>([])
  const [userReviews, setUserReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [reviewModalOpen, setReviewModalOpen] = useState(false)
  const [currentOrder, setCurrentOrder] = useState<any>(null)
  const [currentItem, setCurrentItem] = useState<any>(null)
  const [rating, setRating] = useState(0)
  const [reviewText, setReviewText] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [orderDetailsOpen, setOrderDetailsOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'orders' | 'reviews'>('orders')

  useEffect(() => {
    // Wait for auth state to be fully loaded before making decisions
    if (authState.isLoading) {
      return
    }

    if (!authState.isAuthenticated) {
      router.push("/auth/login")
      return
    }

    if (authState.user?.role === "admin") {
      router.push("/admin/dashboard")
      return
    }

    // Use the helper function to get the token
    const token = getAuthToken();
    if (token) {
      fetchOrders(token)
      fetchUserReviews(token)
      const interval = setInterval(() => {
        fetchOrders(token, true)
        fetchUserReviews(token, true)
      }, 30000)
      return () => clearInterval(interval)
    }
  }, [authState.isLoading, authState.isAuthenticated, authState.user?.role, router])

  const fetchOrders = async (token: string, silent = false) => {
    if (!silent) setRefreshing(true)

    try {
      const response = await fetch("/api/orders", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const orders = await response.json()
        setUserOrders(orders)
      } else if (response.status === 401) {
        // Token might be expired, redirect to login
        console.error("Authentication failed, redirecting to login")
        router.push("/auth/login")
      }
    } catch (error) {
      console.error("Error fetching orders:", error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const fetchUserReviews = async (token: string, silent = false) => {
    if (!silent) setRefreshing(true)

    try {
      const response = await fetch(`/api/reviews?userId=${authState.user?.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      
      if (response.ok) {
        const data = await response.json()
        setUserReviews(data || [])
      } else if (response.status === 401) {
        // Token might be expired, redirect to login
        console.error("Authentication failed, redirecting to login")
        router.push("/auth/login")
      }
    } catch (error) {
      console.error("Error fetching reviews:", error)
    }
  }

  const handleRefresh = () => {
    const token = getAuthToken();
    if (token) {
      fetchOrders(token)
      fetchUserReviews(token)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered": return "bg-green-100 text-green-800"
      case "shipped": return "bg-blue-100 text-blue-800"
      case "processing": return "bg-yellow-100 text-yellow-800"
      case "cancelled": return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending": return "Order Placed"
      case "processing": return "Processing"
      case "shipped": return "Shipped"
      case "delivered": return "Delivered"
      case "cancelled": return "Cancelled"
      default: return status
    }
  }

  const handleReviewClick = (order: any, item: any) => {
    setCurrentOrder(order)
    setCurrentItem(item)
    setReviewModalOpen(true)
    setRating(item.review?.rating || 0)
    setReviewText(item.review?.comment || "")
    setSubmitError(null)
  }

  const handleViewDetails = (order: any) => {
    setSelectedOrder(order)
    setOrderDetailsOpen(true)
  }

  const submitReview = async () => {
    if (!currentOrder || !currentItem) {
      setSubmitError("Missing required data for review")
      return
    }

    const token = getAuthToken();
    if (!token) {
      setSubmitError("Authentication token not found")
      return
    }

    const productId = currentItem.productId || currentItem.id
    if (!productId) {
      setSubmitError("Product information is incomplete")
      return
    }

    const orderId = currentOrder._id || currentOrder.id
    if (!orderId) {
      setSubmitError("Order information is incomplete")
      return
    }

    setSubmitting(true)
    setSubmitError(null)
    
    try {
      const response = await fetch("/api/reviews/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: productId,
          orderId: orderId,
          rating: rating,
          comment: reviewText,
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || data.message || "Failed to submit review")
      }

      // Update local state
      const updatedOrders = userOrders.map(order => {
        const currentOrderId = order._id || order.id
        if (currentOrderId === orderId) {
          const updatedItems = order.items.map((item: any) => {
            if (item.id === productId) {
              return {
                ...item,
                reviewed: true,
                review: { 
                  rating: rating, 
                  comment: reviewText,
                  userName: authState.user?.name || authState.user?.email 
                }
              }
            }
            return item
          })
          return { ...order, items: updatedItems }
        }
        return order
      })
      
      setUserOrders(updatedOrders)
      setReviewModalOpen(false)
      fetchUserReviews(token) // Refresh reviews after submission
      
    } catch (error: any) {
      console.error("Review submission error:", error)
      setSubmitError(error.message || "An error occurred while submitting your review")
    } finally {
      setSubmitting(false)
    }
  }

  // Show loading state while auth is being initialized
  if (authState.isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <section className="pt-32 pb-16">
          <div className="container mx-auto px-6">
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
              <p className="text-gray-600">Loading account...</p>
            </div>
          </div>
        </section>
      </div>
    )
  }

  if (!authState.isAuthenticated || authState.user?.role === "admin") {
    return null
  }

  const totalSpent = userOrders.reduce((sum, order) => sum + (order.total || 0), 0)
  const totalOrders = userOrders.length
  const activeOrders = userOrders.filter((order) => 
    ["pending", "processing", "shipped"].includes(order.status)
  ).length

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
                      My Activity
                    </CardTitle>
                    {userOrders.length > 0 && (
                      <div className="text-sm text-gray-500">Last updated: {new Date().toLocaleTimeString()}</div>
                    )}
                  </div>
                  <div className="flex border-b mt-4">
                    <button
                      className={`px-4 py-2 font-medium ${activeTab === 'orders' ? 'text-black border-b-2 border-black' : 'text-gray-500'}`}
                      onClick={() => setActiveTab('orders')}
                    >
                      Orders
                    </button>
                    <button
                      className={`px-4 py-2 font-medium ${activeTab === 'reviews' ? 'text-black border-b-2 border-black' : 'text-gray-500'}`}
                      onClick={() => setActiveTab('reviews')}
                    >
                      Reviews
                    </button>
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading...</p>
                    </div>
                  ) : activeTab === 'orders' ? (
                    userOrders.length === 0 ? (
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
                                <p className="text-sm font-medium">{(order.total || 0).toFixed(2)} EGP</p>
                              </div>
                            </div>

                            <div className="space-y-2">
                              {order.items?.map((item: any, index: number) => (
                                <div key={index} className="flex items-center justify-between">
                                  <div className="flex items-center space-x-3">
                                    <Image
                                      src={item.image || "/placeholder.svg"}
                                      alt={item.name}
                                      width={40}
                                      height={40}
                                      className="w-10 h-10 object-cover rounded"
                                    />
                                    <div>
                                      <p className="text-sm font-medium">{item.name}</p>
                                      <p className="text-xs text-gray-600">
                                        {item.size} ({item.volume}) × {item.quantity}
                                      </p>
                                      {item.review && (
                                        <div className="flex items-center mt-1">
                                          {[...Array(5)].map((_, i) => (
                                            <Star
                                              key={i}
                                              className={`h-3 w-3 ${i < item.review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                                            />
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center">
                                    <p className="text-sm font-medium mr-4">{((item.price || 0) * (item.quantity || 1)).toFixed(2)} EGP</p>
                                    {order.status === "delivered" && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="text-yellow-600 border-yellow-600 hover:bg-yellow-50 bg-transparent"
                                        onClick={() => handleReviewClick(order, item)}
                                      >
                                        <Star className="h-4 w-4 mr-1" />
                                        {item.review ? "Edit Review" : "Rate"}
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>

                            <Separator className="my-3" />

                            <div className="flex items-center justify-between">
                              <div className="flex items-center text-sm text-gray-600">
                                <MapPin className="h-4 w-4 mr-1" />
                                {order.shippingAddress?.city || 'N/A'}, {order.shippingAddress?.governorate || 'N/A'}
                              </div>
                              <div>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="bg-transparent"
                                  onClick={() => handleViewDetails(order)}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  View Details
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  ) : (
                    <div className="space-y-4">
                      {userReviews.length === 0 ? (
                        <div className="text-center py-8">
                          <Star className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                          <p className="text-gray-600 mb-4">No reviews yet</p>
                          <p className="text-sm text-gray-500">Your product reviews will appear here</p>
                        </div>
                      ) : (
                        userReviews.map((review) => (
                          <div key={review._id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-start">
                              <div className="flex-1">
                                <div className="flex items-center mb-2">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`h-5 w-5 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                                    />
                                  ))}
                                  <span className="ml-2 text-sm text-gray-500">
                                    {new Date(review.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                                {review.comment && (
                                  <p className="text-gray-700 mb-3">{review.comment}</p>
                                )}
                                {review.productId && (
                                  <div className="flex items-center">
                                    <div className="text-sm text-gray-600">
                                      Reviewed product: {review.productName || 'Product #' + review.productId}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {reviewModalOpen && currentOrder && currentItem && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-lg shadow-xl w-full max-w-md"
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Rate Product</h3>
                <button 
                  onClick={() => setReviewModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="flex items-center mb-6">
                <Image
                  src={currentItem.image || "/placeholder.svg"}
                  alt={currentItem.name}
                  width={60}
                  height={60}
                  className="w-16 h-16 object-cover rounded mr-4"
                />
                <div>
                  <p className="font-medium">{currentItem.name}</p>
                  <p className="text-sm text-gray-600">
                    {currentItem.size} ({currentItem.volume})
                  </p>
                  <p className="text-sm">Order #{currentOrder.id}</p>
                </div>
              </div>
              
              <div className="mb-6">
                <p className="mb-2 font-medium">Your Rating</p>
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className="text-2xl focus:outline-none"
                    >
                      <Star
                        className={`h-8 w-8 ${
                          star <= rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="mb-6">
                <p className="mb-2 font-medium">Your Review (Optional)</p>
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Share your experience with this product..."
                  className="w-full h-32 p-3 border rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              </div>

              {submitError && (
                <p className="text-red-500 text-sm mb-4">{submitError}</p>
              )}
              
              <Button
                onClick={submitReview}
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-white"
                disabled={submitting || rating === 0}
              >
                {submitting 
                  ? "Submitting..." 
                  : rating === 0 
                    ? "Select Rating" 
                    : "Submit Review"}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {orderDetailsOpen && selectedOrder && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Order Details #{selectedOrder.id}</h3>
                <button 
                  onClick={() => setOrderDetailsOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="font-medium mb-2">Shipping Information</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-gray-600">Name:</span> {selectedOrder.shippingAddress?.name || 'N/A'}</p>
                    <p><span className="text-gray-600">Phone:</span> {selectedOrder.shippingAddress?.phone || 'N/A'}</p>
                    <p><span className="text-gray-600">Address:</span> {selectedOrder.shippingAddress?.street || 'N/A'}</p>
                    <p><span className="text-gray-600">City:</span> {selectedOrder.shippingAddress?.city || 'N/A'}</p>
                    <p><span className="text-gray-600">Governorate:</span> {selectedOrder.shippingAddress?.governorate || 'N/A'}</p>
                    <p><span className="text-gray-600">Postal Code:</span> {selectedOrder.shippingAddress?.postalCode || 'N/A'}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Order Summary</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-gray-600">Order Date:</span> {new Date(selectedOrder.createdAt).toLocaleString()}</p>
                    <p><span className="text-gray-600">Status:</span> 
                      <Badge className={`ml-2 ${getStatusColor(selectedOrder.status)}`}>
                        {getStatusText(selectedOrder.status)}
                      </Badge>
                    </p>
                    <p><span className="text-gray-600">Payment Method:</span> {selectedOrder.paymentMethod || 'N/A'}</p>
                    <p><span className="text-gray-600">Shipping Method:</span> Standard Delivery</p>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg">
                <div className="p-4 bg-gray-50 border-b">
                  <h4 className="font-medium">Order Items</h4>
                </div>
                <div className="divide-y">
                  {selectedOrder.items?.map((item: any, index: number) => (
                    <div key={index} className="p-4 flex items-start">
                      <Image
                        src={item.image || "/placeholder.svg"}
                        alt={item.name}
                        width={60}
                        height={60}
                        className="w-16 h-16 object-cover rounded mr-4"
                      />
                      <div className="flex-1">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-gray-600">
                          {item.size} ({item.volume}) × {item.quantity}
                        </p>
                        {item.review && (
                          <div className="flex items-center mt-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-3 w-3 ${i < item.review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{((item.price || 0) * (item.quantity || 1)).toFixed(2)} EGP</p>
                        <p className="text-sm text-gray-600">{(item.price || 0).toFixed(2)} EGP each</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Subtotal:</span>
                  <span>{selectedOrder.items?.reduce((sum: number, item: any) => sum + (item.price || 0) * (item.quantity || 1), 0).toFixed(2)} EGP</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Shipping:</span>
                  <span>
                    {selectedOrder.items?.reduce((sum: number, item: any) => sum + (item.price || 0) * (item.quantity || 1), 0) > 2000
                      ? "Free"
                      : `${getShippingCost(selectedOrder.shippingAddress?.governorate || '')} EGP`}
                  </span>
                </div>
                {selectedOrder.discountAmount > 0 && (
                  <div className="flex justify-between text-green-600 mb-2">
                    <span>Discount</span>
                    <span>-{selectedOrder.discountAmount.toFixed(2)} EGP</span>
                  </div>
                )}
                <div className="flex justify-between font-medium text-lg">
                  <span>Total:</span>
                  <span>{(selectedOrder.total || 0).toFixed(2)} EGP</span>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}
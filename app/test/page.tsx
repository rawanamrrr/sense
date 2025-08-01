"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Navigation } from "@/components/navigation"
import { useAuth } from "@/lib/auth-context"

export default function TestPage() {
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const { state: authState } = useAuth()

  const testAPI = async () => {
    setLoading(true)
    try {
      // Test products API
      const productsResponse = await fetch("/api/products")
      const productsData = await productsResponse.json()
      setProducts(productsData)
      console.log("Products:", productsData)

      // Test orders API if authenticated
      if (authState.token) {
        const ordersResponse = await fetch("/api/orders", {
          headers: {
            Authorization: `Bearer ${authState.token}`,
          },
        })
        const ordersData = await ordersResponse.json()
        setOrders(ordersData)
        console.log("Orders:", ordersData)
      }
    } catch (error) {
      console.error("Test error:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    testAPI()
  }, [authState.token])

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <section className="pt-24 pb-16">
        <div className="container mx-auto px-6">
          <h1 className="text-3xl font-light tracking-wider mb-8">API Test Page</h1>

          <div className="grid md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Products API Test</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4">Products found: {products.length}</p>
                <Button onClick={testAPI} disabled={loading}>
                  {loading ? "Testing..." : "Test APIs"}
                </Button>
                <div className="mt-4 max-h-40 overflow-y-auto">
                  <pre className="text-xs bg-gray-100 p-2 rounded">{JSON.stringify(products, null, 2)}</pre>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Authentication Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p>Authenticated: {authState.isAuthenticated ? "Yes" : "No"}</p>
                  <p>User: {authState.user?.email || "None"}</p>
                  <p>Role: {authState.user?.role || "None"}</p>
                  <p>Token: {authState.token ? "Present" : "None"}</p>
                  <p>Orders found: {orders.length}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  )
}

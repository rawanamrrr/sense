"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Database, RefreshCw, CheckCircle, XCircle, AlertTriangle } from "lucide-react"
import { Navigation } from "@/components/navigation"

interface TestResult {
  success: boolean
  message?: string
  tests?: any
  error?: string
  timestamp: string
}

export default function DebugPage() {
  const [testResult, setTestResult] = useState<TestResult | null>(null)
  const [loading, setLoading] = useState(false)

  const runDatabaseTest = async () => {
    setLoading(true)
    console.log("🧪 [Debug] Starting database test...")

    try {
      const response = await fetch("/api/test-db")
      const result = await response.json()

      console.log("📊 [Debug] Test result:", result)
      setTestResult(result)
    } catch (error) {
      console.error("❌ [Debug] Test failed:", error)
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      })
    } finally {
      setLoading(false)
    }
  }

  const testProductsAPI = async () => {
    console.log("🧴 [Debug] Testing products API...")
    try {
      const response = await fetch("/api/products")
      const products = await response.json()
      console.log("✅ [Debug] Products API response:", products.length, "products")
      alert(`Products API: ${products.length} products found`)
    } catch (error) {
      console.error("❌ [Debug] Products API failed:", error)
      alert("Products API failed: " + (error instanceof Error ? error.message : "Unknown error"))
    }
  }

  const testOrdersAPI = async () => {
    console.log("📦 [Debug] Testing orders API...")
    const token = localStorage.getItem("sense_token")

    if (!token) {
      alert("Please login first to test orders API")
      return
    }

    try {
      const response = await fetch("/api/orders", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const orders = await response.json()
      console.log("✅ [Debug] Orders API response:", orders.length, "orders")
      alert(`Orders API: ${orders.length} orders found`)
    } catch (error) {
      console.error("❌ [Debug] Orders API failed:", error)
      alert("Orders API failed: " + (error instanceof Error ? error.message : "Unknown error"))
    }
  }

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
            <h1 className="text-3xl font-light tracking-wider mb-2">Database Debug Console</h1>
            <p className="text-gray-600">Test database connections and API endpoints</p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Test Controls */}
            <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Database className="mr-2 h-5 w-5" />
                    Database Tests
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    onClick={runDatabaseTest}
                    disabled={loading}
                    className="w-full bg-black text-white hover:bg-gray-800"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Running Tests...
                      </>
                    ) : (
                      <>
                        <Database className="mr-2 h-4 w-4" />
                        Run Database Test
                      </>
                    )}
                  </Button>

                  <div className="grid grid-cols-2 gap-4">
                    <Button onClick={testProductsAPI} variant="outline" className="bg-transparent">
                      Test Products API
                    </Button>
                    <Button onClick={testOrdersAPI} variant="outline" className="bg-transparent">
                      Test Orders API
                    </Button>
                  </div>

                  <div className="text-sm text-gray-600 space-y-2">
                    <p>
                      <strong>Environment:</strong> {process.env.NODE_ENV || "development"}
                    </p>
                    <p>
                      <strong>MongoDB URI:</strong> {process.env.MONGODB_URI ? "✅ Configured" : "❌ Missing"}
                    </p>
                    <p>
                      <strong>JWT Secret:</strong> {process.env.JWT_SECRET ? "✅ Configured" : "❌ Missing"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Test Results */}
            <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    {testResult?.success ? (
                      <CheckCircle className="mr-2 h-5 w-5 text-green-600" />
                    ) : testResult?.success === false ? (
                      <XCircle className="mr-2 h-5 w-5 text-red-600" />
                    ) : (
                      <AlertTriangle className="mr-2 h-5 w-5 text-gray-400" />
                    )}
                    Test Results
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!testResult ? (
                    <div className="text-center py-8 text-gray-500">
                      <Database className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>Run a test to see results</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Alert
                        className={testResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}
                      >
                        <AlertDescription className={testResult.success ? "text-green-600" : "text-red-600"}>
                          {testResult.success ? "✅ All tests passed!" : `❌ Tests failed: ${testResult.error}`}
                        </AlertDescription>
                      </Alert>

                      {testResult.tests && (
                        <div className="space-y-4">
                          {/* Collections */}
                          <div>
                            <h4 className="font-medium mb-2">Collections</h4>
                            <div className="flex flex-wrap gap-2">
                              {testResult.tests.collections.available.map((collection: string) => (
                                <Badge key={collection} variant="secondary">
                                  {collection}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          {/* Products Stats */}
                          {testResult.tests.queries.products && (
                            <div>
                              <h4 className="font-medium mb-2">Products</h4>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <p>Total: {testResult.tests.queries.products.stats.total}</p>
                                  <p>Active: {testResult.tests.queries.products.stats.active}</p>
                                </div>
                                <div>
                                  <p>Men: {testResult.tests.queries.products.stats.byCategory.men}</p>
                                  <p>Women: {testResult.tests.queries.products.stats.byCategory.women}</p>
                                  <p>Packages: {testResult.tests.queries.products.stats.byCategory.packages}</p>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Orders Stats */}
                          {testResult.tests.queries.orders && (
                            <div>
                              <h4 className="font-medium mb-2">Orders</h4>
                              <div className="text-sm">
                                <p>Total: {testResult.tests.queries.orders.stats.total}</p>
                                <p>Pending: {testResult.tests.queries.orders.stats.byStatus.pending}</p>
                                <p>Processing: {testResult.tests.queries.orders.stats.byStatus.processing}</p>
                                <p>Shipped: {testResult.tests.queries.orders.stats.byStatus.shipped}</p>
                                <p>Delivered: {testResult.tests.queries.orders.stats.byStatus.delivered}</p>
                              </div>
                            </div>
                          )}

                          {/* Sample Data */}
                          {testResult.tests.queries.products?.samples && (
                            <div>
                              <h4 className="font-medium mb-2">Sample Products</h4>
                              <div className="space-y-1 text-sm">
                                {testResult.tests.queries.products.samples.map((product: any) => (
                                  <div key={product._id} className="flex justify-between">
                                    <span>{product.name}</span>
                                    <span className="text-gray-500">${product.price}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="text-xs text-gray-500 pt-4 border-t">
                            <p>Test completed: {new Date(testResult.timestamp).toLocaleString()}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Instructions */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-8"
          >
            <Card>
              <CardHeader>
                <CardTitle>Debug Instructions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-2">Database Issues</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Check MongoDB connection string</li>
                      <li>• Verify database name is "sense_fragrances"</li>
                      <li>• Run the seeding script if collections are empty</li>
                      <li>• Check network connectivity to MongoDB</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">API Issues</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Check browser console for errors</li>
                      <li>• Verify JWT token is present for protected routes</li>
                      <li>• Check API route logs in server console</li>
                      <li>• Test with different user roles (admin/user)</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Quick Fixes</h4>
                  <div className="text-sm text-gray-600 space-y-2">
                    <p>
                      <strong>Products not showing:</strong> Run database test, check if products exist and are active
                    </p>
                    <p>
                      <strong>Orders not saving:</strong> Check authentication token and API logs
                    </p>
                    <p>
                      <strong>Images not displaying:</strong> Verify image URLs and upload process
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

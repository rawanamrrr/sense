"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star } from "lucide-react"
import { Navigation } from "@/components/navigation"

interface Product {
  _id: string
  id: string
  name: string
  description: string
  price: number
  images: string[]
  rating: number
  reviews: number
  category: "men" | "women" | "packages"
  isNew?: boolean
  isBestseller?: boolean
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/products")
      if (response.ok) {
        const data = await response.json()
        setProducts(data)
      }
    } catch (error) {
      console.error("Error fetching products:", error)
    } finally {
      setLoading(false)
    }
  }

  const categorizedProducts = {
    men: products.filter((p) => p.category === "men"),
    women: products.filter((p) => p.category === "women"),
    packages: products.filter((p) => p.category === "packages"),
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navigation />
        <div className="pt-24 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
            <p className="text-gray-600">Loading products...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      {/* Hero Section */}
      <section className="pt-24 pb-16 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h1 className="text-4xl md:text-5xl font-light tracking-wider mb-6">Our Collections</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Discover our carefully curated fragrances, each crafted to capture unique moments and express individual
              personalities.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Men's Collection */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-light tracking-wider">Men's Collection</h2>
              <Link href="/products/men">
                <Button
                  variant="outline"
                  className="border-black text-black hover:bg-black hover:text-white bg-transparent"
                >
                  View All
                </Button>
              </Link>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {categorizedProducts.men.slice(0, 4).map((product, index) => (
                <motion.div
                  key={product._id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Link href={`/products/men/${product.id}`}>
                    <Card className="group cursor-pointer border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                      <CardContent className="p-0">
                        <div className="relative overflow-hidden">
                          <Image
                            src={product.images[0] || "/placeholder.svg?height=400&width=300"}
                            alt={product.name}
                            width={300}
                            height={400}
                            className="w-full h-80 object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute top-4 left-4 space-y-2">
                            {product.isBestseller && <Badge className="bg-black text-white">Bestseller</Badge>}
                            {product.isNew && <Badge variant="secondary">New</Badge>}
                          </div>
                          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors duration-300" />
                        </div>

                        <div className="p-6">
                          <div className="flex items-center mb-2">
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${
                                    i < Math.floor(product.rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-sm text-gray-600 ml-2">({product.rating})</span>
                          </div>

                          <h3 className="text-xl font-medium mb-2 group-hover:text-gray-600 transition-colors">
                            {product.name}
                          </h3>
                          <p className="text-gray-600 text-sm mb-4 line-clamp-2">{product.description}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-2xl font-light">${product.price}</span>
                            <Button
                              size="sm"
                              className="bg-black text-white hover:bg-gray-800 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                            >
                              View Details
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Women's Collection */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-light tracking-wider">Women's Collection</h2>
              <Link href="/products/women">
                <Button
                  variant="outline"
                  className="border-black text-black hover:bg-black hover:text-white bg-transparent"
                >
                  View All
                </Button>
              </Link>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {categorizedProducts.women.slice(0, 4).map((product, index) => (
                <motion.div
                  key={product._id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Link href={`/products/women/${product.id}`}>
                    <Card className="group cursor-pointer border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                      <CardContent className="p-0">
                        <div className="relative overflow-hidden">
                          <Image
                            src={product.images[0] || "/placeholder.svg?height=400&width=300"}
                            alt={product.name}
                            width={300}
                            height={400}
                            className="w-full h-80 object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute top-4 left-4 space-y-2">
                            {product.isBestseller && <Badge className="bg-black text-white">Bestseller</Badge>}
                            {product.isNew && <Badge variant="secondary">New</Badge>}
                          </div>
                          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors duration-300" />
                        </div>

                        <div className="p-6">
                          <div className="flex items-center mb-2">
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${
                                    i < Math.floor(product.rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-sm text-gray-600 ml-2">({product.rating})</span>
                          </div>

                          <h3 className="text-xl font-medium mb-2 group-hover:text-gray-600 transition-colors">
                            {product.name}
                          </h3>
                          <p className="text-gray-600 text-sm mb-4 line-clamp-2">{product.description}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-2xl font-light">${product.price}</span>
                            <Button
                              size="sm"
                              className="bg-black text-white hover:bg-gray-800 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                            >
                              View Details
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Gift Packages */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-light tracking-wider">Gift Packages</h2>
              <Link href="/products/packages">
                <Button
                  variant="outline"
                  className="border-black text-black hover:bg-black hover:text-white bg-transparent"
                >
                  View All
                </Button>
              </Link>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {categorizedProducts.packages.slice(0, 4).map((product, index) => (
                <motion.div
                  key={product._id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Link href={`/products/packages/${product.id}`}>
                    <Card className="group cursor-pointer border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                      <CardContent className="p-0">
                        <div className="relative overflow-hidden">
                          <Image
                            src={product.images[0] || "/placeholder.svg?height=400&width=300"}
                            alt={product.name}
                            width={300}
                            height={400}
                            className="w-full h-80 object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute top-4 left-4 space-y-2">
                            {product.isBestseller && <Badge className="bg-black text-white">Bestseller</Badge>}
                            {product.isNew && <Badge variant="secondary">New</Badge>}
                          </div>
                          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors duration-300" />
                        </div>

                        <div className="p-6">
                          <div className="flex items-center mb-2">
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${
                                    i < Math.floor(product.rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-sm text-gray-600 ml-2">({product.rating})</span>
                          </div>

                          <h3 className="text-xl font-medium mb-2 group-hover:text-gray-600 transition-colors">
                            {product.name}
                          </h3>
                          <p className="text-gray-600 text-sm mb-4 line-clamp-2">{product.description}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-2xl font-light">${product.price}</span>
                            <Button
                              size="sm"
                              className="bg-black text-white hover:bg-gray-800 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                            >
                              View Details
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white py-12">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <Image src="/logo-white.png" alt="Sense Fragrances" width={150} height={100} className="h-16 w-auto" />
              <p className="text-gray-400 text-sm">
                Crafting exceptional fragrances that capture the essence of elegance.
              </p>
            </div>

            <div>
              <h3 className="font-medium mb-4">Navigation</h3>
              <div className="space-y-2 text-sm">
                <Link href="/" className="block text-gray-400 hover:text-white transition-colors">
                  Home
                </Link>
                <Link href="/about" className="block text-gray-400 hover:text-white transition-colors">
                  About
                </Link>
                <Link href="/products" className="block text-gray-400 hover:text-white transition-colors">
                  Products
                </Link>
                <Link href="/contact" className="block text-gray-400 hover:text-white transition-colors">
                  Contact
                </Link>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-4">Collections</h3>
              <div className="space-y-2 text-sm">
                <Link href="/products/men" className="block text-gray-400 hover:text-white transition-colors">
                  Men's Fragrances
                </Link>
                <Link href="/products/women" className="block text-gray-400 hover:text-white transition-colors">
                  Women's Fragrances
                </Link>
                <Link href="/products/packages" className="block text-gray-400 hover:text-white transition-colors">
                  Gift Packages
                </Link>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-4">Contact</h3>
              <div className="space-y-2 text-sm text-gray-400">
                <p>Email: info@sensefragrances.com</p>
                <p>Phone: +1 (555) 123-4567</p>
                <p>Follow us for updates</p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2024 Sense Fragrances. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

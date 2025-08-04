"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Star, ShoppingCart, X } from "lucide-react"
import { useParams } from "next/navigation"
import { Navigation } from "@/components/navigation"
import { useCart } from "@/lib/cart-context"

interface ProductSize {
  size: string
  volume: string
  price: number
}

interface Product {
  _id: string
  id: string
  name: string
  description: string
  images: string[]
  rating: number
  reviews: number
  category: "men" | "women" | "packages"
  isNew?: boolean
  isBestseller?: boolean
  sizes: ProductSize[]
}

const categoryTitles = {
  men: "Men's Collection",
  women: "Women's Collection",
  packages: "Gift Packages",
}

export default function CategoryPage() {
  const { category } = useParams() as { category: string }
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedSize, setSelectedSize] = useState<ProductSize | null>(null)
  const [showSizeSelector, setShowSizeSelector] = useState(false)
  
  const { dispatch: cartDispatch } = useCart()

  useEffect(() => {
    if (category) {
      fetchProducts()
    }
  }, [category])

  const fetchProducts = async () => {
    try {
      const response = await fetch(`/api/products?category=${category}`)
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

  const openSizeSelector = (product: Product) => {
    setSelectedProduct(product)
    setSelectedSize(product.sizes.length > 0 ? product.sizes[0] : null)
    setShowSizeSelector(true)
  }

  const closeSizeSelector = () => {
    setShowSizeSelector(false)
    setTimeout(() => {
      setSelectedProduct(null)
      setSelectedSize(null)
    }, 300)
  }

  const addToCart = () => {
    if (!selectedProduct || !selectedSize) return
    
    cartDispatch({
      type: "ADD_ITEM",
      payload: {
        id: `${selectedProduct.id}-${selectedSize.size}`,
        productId: selectedProduct.id,
        name: selectedProduct.name,
        price: selectedSize.price,
        size: selectedSize.size,
        volume: selectedSize.volume,
        image: selectedProduct.images[0],
        category: selectedProduct.category
      }
    })
    
    closeSizeSelector()
  }

  const getMinPrice = (sizes: ProductSize[]) => {
    if (sizes.length === 0) return 0
    return Math.min(...sizes.map(size => size.price))
  }

  if (!categoryTitles[category as keyof typeof categoryTitles]) {
    return <div>Category not found</div>
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

      {/* Enhanced Size Selector Modal */}
      {showSizeSelector && selectedProduct && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={closeSizeSelector}
        >
          <motion.div 
            className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-medium">{selectedProduct.name}</h3>
                  <p className="text-gray-600 text-sm">Select your preferred size</p>
                </div>
                <button 
                  onClick={closeSizeSelector}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="flex items-center mb-6">
                <div className="relative w-20 h-20 mr-4">
                  <Image
                    src={selectedProduct.images[0] || "/placeholder.svg"}
                    alt={selectedProduct.name}
                    fill
                    className="rounded-lg object-cover"
                  />
                </div>
                <div>
                  <p className="text-gray-600 text-sm line-clamp-2">
                    {selectedProduct.description}
                  </p>
                  <div className="flex items-center mt-1">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < Math.floor(selectedProduct.rating) 
                              ? "fill-yellow-400 text-yellow-400" 
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-gray-600 ml-2">
                      ({selectedProduct.rating.toFixed(1)})
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="mb-6">
                <h4 className="font-medium mb-3">Available Sizes</h4>
                <div className="grid grid-cols-3 gap-3">
                  {selectedProduct.sizes.map((size) => (
                    <motion.button
                      key={size.size}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.98 }}
                      className={`border-2 rounded-xl p-3 text-center transition-all ${
                        selectedSize?.size === size.size
                          ? 'border-black bg-black text-white shadow-md'
                          : 'border-gray-200 hover:border-gray-400'
                      }`}
                      onClick={() => setSelectedSize(size)}
                    >
                      <div className="font-medium">{size.size}</div>
                      <div className="text-xs mt-1">{size.volume}</div>
                      <div className="text-sm font-light mt-2">EGP{size.price}</div>
                    </motion.button>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-between items-center py-4 border-t border-gray-100">
                <div>
                  <span className="text-gray-600">Total:</span>
                  <span className="text-xl font-medium ml-2">
                    EGP{selectedSize?.price || getMinPrice(selectedProduct.sizes)}
                  </span>
                </div>
                
                <Button 
                  onClick={addToCart} 
                  className="flex items-center bg-black hover:bg-gray-800 rounded-full px-6 py-5"
                  disabled={!selectedSize}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Add to Cart
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Hero Section */}
      <section className="pt-24 pb-16 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <Link
              href="/products"
              className="inline-flex items-center text-gray-600 hover:text-black mb-8 transition-colors"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Collections
            </Link>
            <h1 className="text-4xl md:text-5xl font-light tracking-wider mb-6">
              {categoryTitles[category as keyof typeof categoryTitles]}
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Discover our carefully crafted fragrances, each designed to capture unique moments and express individual
              personalities.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          {products.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-600 text-lg">No products found in this category.</p>
              <Link href="/products">
                <Button className="mt-4 bg-black text-white hover:bg-gray-800">Browse All Collections</Button>
              </Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {products.map((product, index) => {
                const minPrice = getMinPrice(product.sizes)
                
                return (
                  <motion.div
                    key={product._id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: index * 0.1 }}
                    viewport={{ once: true }}
                  >
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
                            <span className="text-sm text-gray-600 ml-2">({product.rating.toFixed(1)})</span>
                          </div>

                          <Link href={`/products/${category}/${product.id}`}>
                            <h3 className="text-xl font-medium mb-2 hover:text-gray-600 transition-colors">
                              {product.name}
                            </h3>
                          </Link>
                          
                          <p className="text-gray-600 text-sm mb-4 line-clamp-2">{product.description}</p>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-2xl font-light">EGP{minPrice}</span>
                            
                            <div className="flex space-x-2">
                              <Button asChild variant="outline" size="sm">
                                <Link href={`/products/${category}/${product.id}`}>Details</Link>
                              </Button>
                              <Button 
                                size="sm" 
                                className="bg-black text-white hover:bg-gray-800"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  openSizeSelector(product)
                                }}
                              >
                                <ShoppingCart className="h-4 w-4 mr-1" />
                                Add
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          )}
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
"use client"

import { useState, useEffect, useMemo } from "react"
import { motion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Star, ShoppingCart, X, Heart, Search } from "lucide-react"
import { useParams } from "next/navigation"
import { Navigation } from "@/components/navigation"
import { useCart } from "@/lib/cart-context"
import { useFavorites } from "@/lib/favorites-context"

interface ProductSize {
  size: string
  volume: string
  price: number
  originalPrice?: number
  discountedPrice?: number
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

const sortOptions = [
  { value: "default", label: "Recommended" },
  { value: "priceLow", label: "Price: Low to High" },
  { value: "priceHigh", label: "Price: High to Low" },
  { value: "rating", label: "Highest Rated" },
  { value: "newest", label: "Newest Arrivals" },
  { value: "bestsellers", label: "Bestsellers" },
]

export default function CategoryPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { category } = useParams() as { category: string }
  
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedSize, setSelectedSize] = useState<ProductSize | null>(null)
  const [showSizeSelector, setShowSizeSelector] = useState(false)
  
  // Initialize state from URL params
  const initialSearch = searchParams.get('search') || ""
  const initialSort = searchParams.get('sort') || "default"
  
  const [searchQuery, setSearchQuery] = useState(initialSearch)
  const [sortOption, setSortOption] = useState(initialSort)

  const { dispatch: cartDispatch } = useCart()
  const { addToFavorites, removeFromFavorites, isFavorite } = useFavorites()

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams()
    if (searchQuery) params.set('search', searchQuery)
    if (sortOption !== 'default') params.set('sort', sortOption)
    
    router.replace(`${pathname}?${params.toString()}`)
  }, [searchQuery, sortOption, pathname, router])

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
        price: selectedSize.discountedPrice || selectedSize.price,
        originalPrice: selectedSize.originalPrice,
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
    return Math.min(...sizes.map(size => size.discountedPrice || size.price))
  }

  const clearFilters = () => {
    setSearchQuery("")
    setSortOption("default")
  }

  // Filter + Sort logic
  const filteredAndSortedProducts = useMemo(() => {
    let result = products.filter((p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase())
    )

    switch (sortOption) {
      case "priceLow":
        result = [...result].sort((a, b) => getMinPrice(a.sizes) - getMinPrice(b.sizes))
        break
      case "priceHigh":
        result = [...result].sort((a, b) => getMinPrice(b.sizes) - getMinPrice(a.sizes))
        break
      case "rating":
        result = [...result].sort((a, b) => b.rating - a.rating)
        break
      case "newest":
        result = [...result].sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0))
        break
      case "bestsellers":
        result = [...result].sort((a, b) => (b.isBestseller ? 1 : 0) - (a.isBestseller ? 1 : 0))
        break
      default:
        // Recommended order (default)
        result.sort((a, b) => {
          // Bestsellers first
          if (a.isBestseller && !b.isBestseller) return -1
          if (!a.isBestseller && b.isBestseller) return 1
          
          // New arrivals next
          if (a.isNew && !b.isNew) return -1
          if (!a.isNew && b.isNew) return 1
          
          // Then by rating
          return b.rating - a.rating
        })
    }
    return result
  }, [products, searchQuery, sortOption])

  const hasFilters = searchQuery || sortOption !== "default"

  if (!categoryTitles[category as keyof typeof categoryTitles]) {
    return <div className="min-h-screen bg-white flex items-center justify-center p-4">Category not found</div>
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
                <div className="flex">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (isFavorite(selectedProduct.id)) {
                        removeFromFavorites(selectedProduct.id)
                      } else {
                        addToFavorites({
                          id: selectedProduct.id,
                          name: selectedProduct.name,
                          price: getMinPrice(selectedProduct.sizes),
                          image: selectedProduct.images[0],
                          category: selectedProduct.category,
                        })
                      }
                    }}
                    className="mr-2 p-1.5 bg-white/80 backdrop-blur-sm rounded-full shadow-md hover:bg-gray-100 transition-colors"
                  >
                    <Heart 
                      className={`h-5 w-5 ${
                        isFavorite(selectedProduct.id) 
                          ? "text-red-500 fill-red-500" 
                          : "text-gray-700"
                      }`} 
                    />
                  </button>
                  <button 
                    onClick={closeSizeSelector}
                    className="text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
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
                      <div className="text-sm font-light mt-2">
                        {size.discountedPrice ? (
                          <>
                            <span className="line-through text-gray-400 mr-1">EGP{size.originalPrice}</span>
                            <span className="text-red-600">EGP{size.discountedPrice}</span>
                          </>
                        ) : (
                          <>EGP{size.price}</>
                        )}
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-between items-center py-4 border-t border-gray-100">
                <div>
                  <span className="text-xl font-medium ml-2">
                    {selectedSize?.discountedPrice 
                      ? `EGP${selectedSize.discountedPrice}` 
                      : `EGP${selectedSize?.price || getMinPrice(selectedProduct.sizes)}`
                    }
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
      <section className="pt-24 pb-8 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-8"
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

          {/* Search & Sort Controls */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              />
              {(searchQuery || hasFilters) && (
                <button
                  onClick={clearFilters}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>

            <div className="flex gap-2 w-full md:w-auto">
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="w-full md:w-48 border border-gray-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              {hasFilters && (
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="whitespace-nowrap"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-12">
        <div className="container mx-auto px-6">
          {filteredAndSortedProducts.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-600 text-lg">
                {searchQuery 
                  ? "No products match your search. Try different keywords."
                  : "No products found in this category."
                }
              </p>
              <Link href="/products">
                <Button className="mt-4 bg-black text-white hover:bg-gray-800">Browse All Collections</Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-6">
                <p className="text-sm text-gray-600">
                  Showing {filteredAndSortedProducts.length} {filteredAndSortedProducts.length === 1 ? 'item' : 'items'}
                  {searchQuery && ` for "${searchQuery}"`}
                </p>
                {hasFilters && (
                  <button 
                    onClick={clearFilters}
                    className="text-sm text-gray-600 hover:text-black underline"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredAndSortedProducts.map((product, index) => {
                  const minPrice = getMinPrice(product.sizes)
                  
                  return (
                    <motion.div
                      key={product._id}
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.8, delay: index * 0.1 }}
                      viewport={{ once: true }}
                    >
                      <div className="group relative h-full">
                        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 h-full relative">
                          {/* Favorite Button - Fixed in top-right corner */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              e.preventDefault()
                              if (isFavorite(product.id)) {
                                removeFromFavorites(product.id)
                              } else {
                                addToFavorites({
                                  id: product.id,
                                  name: product.name,
                                  price: minPrice,
                                  image: product.images[0],
                                  category: product.category,
                                })
                              }
                            }}
                            className="absolute top-4 right-4 z-20 p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors"
                          >
                            <Heart 
                              className={`h-5 w-5 ${
                                isFavorite(product.id) 
                                  ? "text-red-500 fill-red-500" 
                                  : "text-gray-700"
                              }`} 
                            />
                          </button>
                          
                          {/* Badges - Fixed in top-left corner */}
                          <div className="absolute top-4 left-4 z-20 flex flex-col items-start gap-2">
                            {product.isBestseller && (
                              <Badge className="bg-black text-white">Bestseller</Badge>
                            )}
                            {product.isNew && !product.isBestseller && (
                              <Badge variant="secondary">New</Badge>
                            )}
                          </div>

                          <CardContent className="p-0 h-full flex flex-col">
                            <Link 
                              href={`/products/${category}/${product.id}`} 
                              className="block relative aspect-square flex-grow"
                            >
                              <Image
                                src={product.images[0] || "/placeholder.svg"}
                                alt={product.name}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                              <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                                <div className="flex items-center mb-1">
                                  <div className="flex items-center">
                                    {[...Array(5)].map((_, i) => (
                                      <Star
                                        key={i}
                                        className={`h-4 w-4 ${
                                          i < Math.floor(product.rating) 
                                            ? "fill-yellow-400 text-yellow-400" 
                                            : "text-gray-300"
                                        }`}
                                      />
                                    ))}
                                  </div>
                                  <span className="text-xs ml-2">
                                    ({product.rating.toFixed(1)})
                                  </span>
                                </div>

                                <h3 className="text-lg font-medium mb-1">
                                  {product.name}
                                </h3>
                                
                                <div className="flex items-center justify-between">
                                  <span className="text-lg font-light">
                                    EGP{minPrice}
                                  </span>
                                  
                                  <button 
                                    className="p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors"
                                    onClick={(e) => {
                                      e.preventDefault()
                                      e.stopPropagation()
                                      openSizeSelector(product)
                                    }}
                                  >
                                    <ShoppingCart className="h-5 w-5" />
                                  </button>
                                </div>
                              </div>
                            </Link>
                          </CardContent>
                        </Card>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </>
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
            <p>&copy; 2025 Sense Fragrances. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
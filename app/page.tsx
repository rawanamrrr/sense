"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowRight, Sparkles, Star, ShoppingCart, Heart, X } from "lucide-react"
import { Navigation } from "@/components/navigation"
import { Badge } from "@/components/ui/badge"
import { useFavorites } from "@/lib/favorites-context"
import { useCart } from "@/lib/cart-context"
import useEmblaCarousel from 'embla-carousel-react'

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
  category: "men" | "women" | "packages" | "outlet"
  isNew?: boolean
  isBestseller?: boolean
  sizes: ProductSize[]
}

export default function HomePage() {
  const [scrollY, setScrollY] = useState(0)
  const { scrollYProgress } = useScroll()
  const [favorites, setFavorites] = useState<any[]>([])
  const [bestSellers, setBestSellers] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const { addToFavorites, removeFromFavorites, isFavorite } = useFavorites()
  const { dispatch: cartDispatch } = useCart()
  const collectionsRef = useRef<HTMLElement>(null)
  
  // Size selector state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedSize, setSelectedSize] = useState<ProductSize | null>(null)
  const [showSizeSelector, setShowSizeSelector] = useState(false)
  const [showIntro, setShowIntro] = useState(false)

  // Embla Carousel state
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    align: "start",
    containScroll: "trimSnaps",
    dragFree: true,
    loop: false
  })
  const [selectedIndex, setSelectedIndex] = useState(0)

  const logoScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.8])
  const logoY = useTransform(scrollYProgress, [0, 0.2], [0, -20])

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    // Check if the user has already seen the intro
    const hasSeenIntro = sessionStorage.getItem('hasSeenIntro');
    
    if (!hasSeenIntro) {
      setShowIntro(true);
      
      // Auto-hide intro after 4 seconds
      const timer = setTimeout(() => {
        setShowIntro(false);
        sessionStorage.setItem('hasSeenIntro', 'true');
      }, 4000);
      
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    const fetchFavorites = async () => {
      const token = localStorage.getItem("token")
      if (!token) return

      try {
        const res = await fetch("/api/favorites", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (res.ok) {
          const data = await res.json()
          setFavorites(data)
        }
      } catch (err) {
        console.error("Error fetching favorites", err)
      }
    }

    fetchFavorites()
  }, [])

  useEffect(() => {
    const fetchBestSellers = async () => {
      try {
        setLoading(true)
        setError("")
        
        const res = await fetch("/api/products")
        if (!res.ok) {
          throw new Error(`Failed to fetch products: ${res.status}`)
        }

        const products: Product[] = await res.json()
        const bestSellerProducts = products.filter(product => product.isBestseller)
        
        if (bestSellerProducts.length === 0) {
          console.warn("No products marked as best sellers found")
        }
        
        setBestSellers(bestSellerProducts)
      } catch (err) {
        console.error("Error:", err)
        setError("Failed to load best sellers. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchBestSellers()
  }, [])

  const scrollTo = useCallback((index: number) => {
    if (!emblaApi) return
    emblaApi.scrollTo(index)
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return

    emblaApi.on('select', () => {
      setSelectedIndex(emblaApi.selectedScrollSnap())
    })
  }, [emblaApi])

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
    if (!sizes || sizes.length === 0) return 0
    return Math.min(...sizes.map(size => size.price))
  }

  const handleFavoriteClick = (e: React.MouseEvent, product: Product) => {
    e.preventDefault()
    e.stopPropagation()
    const minPrice = getMinPrice(product.sizes)
    
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
  }

  const scrollToCollections = () => {
    collectionsRef.current?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'start'
    })
  }

  const products = [
    {
      id: "mens",
      title: "Men's Collection",
      description: "Bold and sophisticated fragrances for the modern gentleman",
      image: "/placeholder.svg?height=400&width=300",
      category: "men",
    },
    {
      id: "womens",
      title: "Women's Collection",
      description: "Elegant and captivating scents for the refined woman",
      image: "/placeholder.svg?height=400&width=300",
      category: "women",
    },
    {
      id: "packages",
      title: "Gift Packages",
      description: "Curated collections perfect for any special occasion",
      image: "/placeholder.svg?height=400&width=300",
      category: "packages",
    },
    {
      id: "outlet",
      title: "Outlet Collection",
      description: "Special deals and discounted fragrances",
      image: "/placeholder.svg?height=400&width=300",
      category: "outlet",
    },
  ]

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      {/* Elegant Intro Animation */}
      <AnimatePresence>
        {showIntro && (
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ 
              opacity: 0,
              transition: { duration: 0.8, ease: "easeInOut" }
            }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black"
          >
            <motion.div 
              className="absolute inset-0 overflow-hidden"
              initial={{ scale: 1.1 }}
              animate={{ 
                scale: 1,
                transition: { duration: 2, ease: "easeOut" }
              }}
            >
              
              
              
            </motion.div>

            <div className="relative z-10 text-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ 
                  opacity: 1, 
                  scale: 1,
                  transition: { duration: 1.2 }
                }}
                className="mb-8"
              >
                <Image 
                  src="/Logo-white-nobg.png" 
                  alt="Sense Fragrances" 
                  width={300} 
                  height={150} 
                  className="mx-auto filter brightness-125"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ 
                  opacity: 1,
                  transition: { duration: 1, delay: 0.5 }
                }}
                className="mt-4"
              >
                <div className="h-px w-24 bg-white/60 mx-auto mb-4" />
                <p className="text-white/80 text-sm font-light tracking-widest">SIGNATURE SCENTS</p>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Size Selector Modal */}
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
      <motion.section 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5 }}
        className="relative h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white overflow-hidden"
      >
        {/* Animated background elements */}
        <motion.div 
          className="absolute inset-0 z-0"
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 8, ease: "easeOut" }}
        >
          
        </motion.div>

        <div className="text-center space-y-8 z-10">
          <motion.div 
            initial={{ opacity: 0, y: 30, scale: 1.2 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          >
            <Image src="/Logo-black-nobg.png" alt="Sense Fragrances" width={500} height={300} className="mx-auto mb-8" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.5, delay: 0.3, ease: "easeOut" }}
            className="space-y-4"
          >
            <motion.h1 
              className="text-4xl md:text-6xl font-light tracking-wider text-gray-900"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.5 }}
            >
              Discover Your
            </motion.h1>
            <motion.h2 
              className="text-4xl md:text-6xl font-light tracking-wider text-gray-900"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.8 }}
            >
              Signature Scent
            </motion.h2>
            <motion.p 
              className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.5, delay: 1.2 }}
            >
              Experience the art of fine fragrance with our carefully curated collection of premium perfumes that tell
              your unique story.
            </motion.p>
          </motion.div>
          
          {/* Explore Collections Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.5 }}
          >
            <Button
              onClick={scrollToCollections}
              className="bg-black text-white hover:bg-gray-800 rounded-full px-8 py-6 text-lg relative overflow-hidden group"
            >
              <span className="relative z-10">Explore Collections</span>
              <ArrowRight className="ml-2 h-5 w-5 relative z-10" />
              <motion.span 
                className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100"
                initial={{ x: "-100%" }}
                whileHover={{ x: 0 }}
                transition={{ duration: 0.4 }}
              />
            </Button>
          </motion.div>
        </div>

        <motion.div
          animate={{ y: [0, -15, 0], rotate: [0, 5, 0] }}
          transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10"
        >
          <Sparkles className="h-6 w-6 text-gray-400" />
        </motion.div>
      </motion.section>

      {/* Best Sellers Section */}
      <motion.section 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 1.2 }}
        viewport={{ once: true, amount: 0.3 }}
        className="py-20 bg-white overflow-hidden"
      >
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-light tracking-wider mb-4">Our Best Sellers</h2>
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: "100px" }}
              transition={{ duration: 0.8, delay: 0.5 }}
              viewport={{ once: true }}
              className="h-1 bg-gradient-to-r from-purple-400 to-pink-400 mx-auto my-6 rounded-full"
            />
            <p className="text-gray-600 max-w-2xl mx-auto">
              Discover the fragrances our customers love the most
            </p>
          </motion.div>

          {error ? (
            <div className="text-center py-12">
              <p className="text-red-600">{error}</p>
            </div>
          ) : loading ? (
            <div className="flex justify-center items-center h-64">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="h-12 w-12 border-t-2 border-b-2 border-purple-500 rounded-full"
              />
            </div>
          ) : bestSellers.length > 0 ? (
            <>
              {/* Mobile Carousel */}
              <div className="md:hidden">
                <div className="overflow-hidden" ref={emblaRef}>
                  <div className="flex">
                    {bestSellers.map((product, index) => {
                      const minPrice = getMinPrice(product.sizes)
                      
                      return (
                        <motion.div 
                          key={product._id} 
                          className="flex-[0_0_80%] min-w-0 pl-4 relative h-full"
                          initial={{ opacity: 0, x: 50 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.6, delay: index * 0.1 }}
                          viewport={{ once: true }}
                        >
                          <div className="group relative h-full">
                            {/* Favorite Button */}
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={(e) => handleFavoriteClick(e, product)}
                              className="absolute top-4 right-4 z-10 p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors"
                            >
                              <Heart 
                                className={`h-5 w-5 ${
                                  isFavorite(product.id) 
                                    ? "text-red-500 fill-red-500" 
                                    : "text-gray-700"
                                }`} 
                              />
                            </motion.button>
                            
                            {/* Badges */}
                            <div className="absolute top-4 left-4 z-10 space-y-2">
                              {product.isBestseller && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  whileInView={{ scale: 1 }}
                                  transition={{ duration: 0.5, delay: index * 0.1 + 0.3 }}
                                  viewport={{ once: true }}
                                >
                                  <Badge className="bg-black text-white">Bestseller</Badge>
                                </motion.div>
                              )}
                              {product.isNew && !product.isBestseller && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  whileInView={{ scale: 1 }}
                                  transition={{ duration: 0.5, delay: index * 0.1 + 0.3 }}
                                  viewport={{ once: true }}
                                >
                                  <Badge variant="secondary">New</Badge>
                                </motion.div>
                              )}
                            </div>
                            
                            {/* Product Card */}
                            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 h-full mr-4">
                              <CardContent className="p-0 h-full flex flex-col">
                                <Link href={`/products/${product.category}/${product.id}`} className="block relative aspect-square flex-grow">
                                  <Image
                                    src={product.images[0] || "/placeholder.svg?height=400&width=300"}
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
                                      
                                      <motion.button 
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        className="p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors"
                                        onClick={(e) => {
                                          e.preventDefault()
                                          e.stopPropagation()
                                          openSizeSelector(product)
                                        }}
                                      >
                                        <ShoppingCart className="h-5 w-5" />
                                      </motion.button>
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
                </div>
                <div className="flex justify-center mt-4 md:hidden">
                  {bestSellers.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => scrollTo(index)}
                      className={`w-2 h-2 mx-1 rounded-full transition-colors ${
                        index === selectedIndex ? 'bg-black' : 'bg-gray-300'
                      }`}
                      aria-label={`Go to slide ${index + 1}`}
                    />
                  ))}
                </div>
              </div>

              {/* Desktop Grid */}
              <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {bestSellers.map((product, index) => {
                  const minPrice = getMinPrice(product.sizes)
                  
                  return (
                    <motion.div
                      key={product._id}
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.8, delay: index * 0.1 }}
                      viewport={{ once: true }}
                      whileHover={{ y: -10 }}
                      className="relative h-full"
                    >
                      <div className="group relative h-full">
                        {/* Favorite Button */}
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => handleFavoriteClick(e, product)}
                          className="absolute top-4 right-4 z-10 p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors"
                        >
                          <Heart 
                            className={`h-5 w-5 ${
                              isFavorite(product.id) 
                                ? "text-red-500 fill-red-500" 
                                : "text-gray-700"
                            }`} 
                          />
                        </motion.button>
                        
                        {/* Badges */}
                        <div className="absolute top-4 left-4 z-10 space-y-2">
                          {product.isBestseller && (
                            <motion.div
                              initial={{ scale: 0 }}
                              whileInView={{ scale: 1 }}
                              transition={{ duration: 0.5, delay: index * 0.1 + 0.3 }}
                              viewport={{ once: true }}
                            >
                              <Badge className="bg-black text-white">Bestseller</Badge>
                            </motion.div>
                          )}
                          {product.isNew && !product.isBestseller && (
                            <motion.div
                              initial={{ scale: 0 }}
                              whileInView={{ scale: 1 }}
                              transition={{ duration: 0.5, delay: index * 0.1 + 0.3 }}
                              viewport={{ once: true }}
                            >
                              <Badge variant="secondary">New</Badge>
                            </motion.div>
                          )}
                        </div>
                        
                        {/* Product Card */}
                        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 h-full">
                          <CardContent className="p-0 h-full flex flex-col">
                            <Link href={`/products/${product.category}/${product.id}`} className="block relative aspect-square flex-grow">
                              <Image
                                src={product.images[0] || "/placeholder.svg?height=400&width=300"}
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
                                  
                                  <motion.button 
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    className="p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors"
                                    onClick={(e) => {
                                      e.preventDefault()
                                      e.stopPropagation()
                                      openSizeSelector(product)
                                    }}
                                  >
                                    <ShoppingCart className="h-5 w-5" />
                                  </motion.button>
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
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">No best sellers found. Check back soon!</p>
            </div>
          )}
        </div>
      </motion.section>

      {/* Products Section - Collections */}
      <motion.section 
        ref={collectionsRef} 
        id="collections"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 1.2 }}
        viewport={{ once: true, amount: 0.3 }}
        className="py-20 bg-gray-50 overflow-hidden"
      >
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-light tracking-wider mb-4">Our Collections</h2>
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: "100px" }}
              transition={{ duration: 0.8, delay: 0.5 }}
              viewport={{ once: true }}
              className="h-1 bg-gradient-to-r from-purple-400 to-pink-400 mx-auto my-6 rounded-full"
            />
            <p className="text-gray-600 max-w-2xl mx-auto">
              Discover our four distinctive fragrance collections, each crafted to capture the essence of elegance and
              sophistication.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {products.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                viewport={{ once: true }}
                whileHover={{ y: -10 }}
              >
                <Link href={`/products/${product.category}`}>
                  <Card className="group cursor-pointer border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                    <CardContent className="p-0">
                      <div className="relative overflow-hidden">
                        <Image
                          src={product.image || "/placeholder.svg"}
                          alt={product.title}
                          width={300}
                          height={400}
                          className="w-full h-80 object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors duration-300" />
                        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                          <motion.h3 
                            className="text-xl font-medium mb-2"
                            initial={{ y: 20, opacity: 0 }}
                            whileInView={{ y: 0, opacity: 1 }}
                            transition={{ duration: 0.5, delay: index * 0.2 + 0.3 }}
                            viewport={{ once: true }}
                          >
                            {product.title}
                          </motion.h3>
                          <motion.p 
                            className="text-sm opacity-90"
                            initial={{ y: 20, opacity: 0 }}
                            whileInView={{ y: 0, opacity: 1 }}
                            transition={{ duration: 0.5, delay: index * 0.2 + 0.5 }}
                            viewport={{ once: true }}
                          >
                            {product.description}
                          </motion.p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* About Preview Section */}
      <motion.section 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 1.2 }}
        viewport={{ once: true, amount: 0.3 }}
        className="py-20 bg-white overflow-hidden"
      >
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-light tracking-wider mb-6">The Art of Fragrance</h2>
              <motion.p 
                className="text-gray-600 mb-6 leading-relaxed"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                viewport={{ once: true }}
              >
                At Sense Fragrances, we believe that every scent tells a story. Our master perfumers craft each
                fragrance with precision and passion, using only the finest ingredients sourced from around the world.
              </motion.p>
              <motion.p 
                className="text-gray-600 mb-8 leading-relaxed"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                viewport={{ once: true }}
              >
                From the first spritz to the lasting impression, our perfumes are designed to evoke emotions, create
                memories, and express your unique personality.
              </motion.p>
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                viewport={{ once: true }}
              >
                <Link href="/about">
                  <Button
                    variant="outline"
                    className="border-black text-black hover:bg-black hover:text-white bg-transparent rounded-full px-6 py-5 group relative overflow-hidden"
                  >
                    <span className="relative z-10">Learn More About Us</span>
                    <ArrowRight className="ml-2 h-4 w-4 relative z-10" />
                    <motion.span 
                      className="absolute inset-0 bg-black opacity-0 group-hover:opacity-100"
                      initial={{ x: "-100%" }}
                      whileHover={{ x: 0 }}
                      transition={{ duration: 0.4 }}
                    />
                  </Button>
                </Link>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30, scale: 1.1 }}
              whileInView={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="relative"
            >
              <Image
                src="/placeholder.svg?height=500&width=400"
                alt="Perfume crafting"
                width={400}
                height={500}
                className="w-full h-96 object-cover rounded-lg shadow-lg"
              />
              <motion.div 
                className="absolute -inset-4 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-lg -z-10"
                animate={{
                  rotate: [0, 5, 0, -5, 0],
                }}
                transition={{
                  duration: 10,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Footer */}
      <motion.footer 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 1.2 }}
        viewport={{ once: true, amount: 0.3 }}
        className="bg-black text-white py-12"
      >
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            <motion.div 
              className="space-y-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <Image src="/logo-white.png" alt="Sense Fragrances" width={150} height={100} className="h-16 w-auto" />
              <p className="text-gray-400 text-sm">
                Crafting exceptional fragrances that capture the essence of elegance.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
            >
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
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
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
                <Link href="/products/outlet" className="block text-gray-400 hover:text-white transition-colors">
                  Outlet Deals
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
            >
              <h3 className="font-medium mb-4">Contact</h3>
              <div className="space-y-2 text-sm text-gray-400">
                <p>Email: info@sensefragrances.com</p>
                <p>Phone: +1 (555) 123-4567</p>
                <p>Follow us for updates</p>
              </div>
            </motion.div>
          </div>

          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
            className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400"
          >
            <p>&copy; 2025 Sense Fragrances. All rights reserved.</p>
          </motion.div>
        </div>
      </motion.footer>
    </div>
  )
}
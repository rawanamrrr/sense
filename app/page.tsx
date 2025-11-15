"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowRight, Sparkles, Star, ShoppingCart, Heart, X, Instagram, Facebook, Package, ChevronLeft, ChevronRight } from "lucide-react"
import { Navigation } from "@/components/navigation"
import { Badge } from "@/components/ui/badge"
import { useFavorites } from "@/lib/favorites-context"
import { useCart } from "@/lib/cart-context"
import { GiftPackageSelector } from "@/components/gift-package-selector"
import { StarRating } from "@/lib/star-rating"
import useEmblaCarousel from 'embla-carousel-react'

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
  images: string[]
  rating: number
  reviews: number
  category: "men" | "women" | "packages" | "outlet"
  isNew?: boolean
  isBestseller?: boolean
  sizes: ProductSize[]
  isGiftPackage?: boolean
  packagePrice?: number
  packageOriginalPrice?: number
  giftPackageSizes?: any[]
  longDescription?: string
  isActive?: boolean
  notes?: {
    top: string[]
    middle: string[]
    base: string[]
  }
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
  const videoRef = useRef<HTMLVideoElement>(null)
  
  // Size selector state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedSize, setSelectedSize] = useState<ProductSize | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [showSizeSelector, setShowSizeSelector] = useState(false)
  const [showIntro, setShowIntro] = useState(false)

  // Embla Carousel state for mobile
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    align: "start",
    containScroll: "trimSnaps",
    dragFree: true,
    loop: false
  })
  const [selectedIndex, setSelectedIndex] = useState(0)

  const scrollTo = useCallback((index: number) => {
    if (!emblaApi) return
    emblaApi.scrollTo(index)
  }, [emblaApi])

  // Embla Carousel state for desktop
  const [emblaRefDesktop, emblaApiDesktop] = useEmblaCarousel({ 
    align: "start",
    containScroll: "trimSnaps",
    dragFree: true,
    loop: false
  })
  const [selectedIndexDesktop, setSelectedIndexDesktop] = useState(0)
  
  // State for showing/hiding collection text
  const [showCollectionText, setShowCollectionText] = useState<{[key: string]: boolean}>({})

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
    // Force video to play on mobile
    const forceVideoPlay = () => {
      if (videoRef.current) {
        videoRef.current.play().catch(e => {
          console.log("Video play failed:", e);
        });
      }
    };

    // Try to play immediately
    forceVideoPlay();

    // Try again after a short delay
    const timer = setTimeout(forceVideoPlay, 1000);

    // Try when user interacts with the page
    document.addEventListener('click', forceVideoPlay);
    document.addEventListener('touchstart', forceVideoPlay);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', forceVideoPlay);
      document.removeEventListener('touchstart', forceVideoPlay);
    };
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
        
        const res = await fetch("/api/products?isBestseller=true&limit=16")
        if (!res.ok) {
          throw new Error(`Failed to fetch products: ${res.status}`)
        }

        const products: Product[] = await res.json()
        
        if (products.length === 0) {
          console.warn("No products marked as best sellers found")
        }
        
        setBestSellers(products)
      } catch (err) {
        console.error("Error:", err)
        setError("Failed to load best sellers. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchBestSellers()
  }, [])

  const scrollToDesktop = useCallback((index: number) => {
    if (!emblaApiDesktop) return
    emblaApiDesktop.scrollTo(index)
  }, [emblaApiDesktop])

  const scrollPrevDesktop = useCallback(() => {
    if (!emblaApiDesktop) return
    emblaApiDesktop.scrollPrev()
  }, [emblaApiDesktop])

  const scrollNextDesktop = useCallback(() => {
    if (!emblaApiDesktop) return
    emblaApiDesktop.scrollNext()
  }, [emblaApiDesktop])

  useEffect(() => {
    if (!emblaApi) return

    emblaApi.on('select', () => {
      setSelectedIndex(emblaApi.selectedScrollSnap())
    })
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApiDesktop) return

    emblaApiDesktop.on('select', () => {
      setSelectedIndexDesktop(emblaApiDesktop.selectedScrollSnap())
    })
  }, [emblaApiDesktop])

  const openSizeSelector = (product: Product) => {
    // For gift packages, we don't need to set selectedSize since it's handled differently
    if (product.isGiftPackage) {
      setSelectedProduct(product)
      setShowSizeSelector(true)
    } else {
      setSelectedProduct(product)
      setSelectedSize(product.sizes.length > 0 ? product.sizes[0] : null)
      setQuantity(1)
      setShowSizeSelector(true)
    }
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
        price: selectedSize.discountedPrice || selectedSize.originalPrice || 0,
        originalPrice: selectedSize.originalPrice,
        size: selectedSize.size,
        volume: selectedSize.volume,
        image: selectedProduct.images[0],
        category: selectedProduct.category,
        quantity: quantity
      }
    })
    
    closeSizeSelector()
  }

  // Function to calculate the smallest price from all sizes
  const getSmallestPrice = (sizes: ProductSize[]) => {
    if (!sizes || sizes.length === 0) return 0
    
    const prices = sizes.map(size => size.discountedPrice || size.originalPrice || 0)
    return Math.min(...prices.filter(price => price > 0))
  }

  // Function to calculate the smallest original price from all sizes
  const getSmallestOriginalPrice = (sizes: ProductSize[]) => {
    if (!sizes || sizes.length === 0) return 0
    
    const prices = sizes.map(size => size.originalPrice || 0)
    return Math.min(...prices.filter(price => price > 0))
  }

  const getMinPrice = (product: Product) => {
    return getSmallestPrice(product.sizes);
  }

  const handleFavoriteClick = (e: React.MouseEvent, product: Product) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (isFavorite(product.id)) {
      removeFromFavorites(product.id)
    } else {
      // Handle gift packages differently
      if (product.isGiftPackage) {
        addToFavorites({
          id: product.id,
          name: product.name,
          price: product.packagePrice || 0,
          image: product.images[0],
          category: product.category,
          rating: product.rating,
          isNew: product.isNew,
          isBestseller: product.isBestseller,
          sizes: product.giftPackageSizes || [],
          isGiftPackage: true,
          packagePrice: product.packagePrice,
          packageOriginalPrice: product.packageOriginalPrice,
          giftPackageSizes: product.giftPackageSizes,
        })
      } else {
        // Handle regular products
        const minPrice = getMinPrice(product)
        addToFavorites({
          id: product.id,
          name: product.name,
          price: minPrice,
          image: product.images[0],
          category: product.category,
          rating: product.rating,
          isNew: product.isNew,
          isBestseller: product.isBestseller,
          sizes: product.sizes,
        })
      }
    }
  }

  const scrollToCollections = () => {
    collectionsRef.current?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'start'
    })
  }

  const handleCollectionClick = (productId: string, category: string) => {
    // Show text first
    setShowCollectionText(prev => ({
      ...prev,
      [productId]: true
    }))
    
    // Navigate after a delay to allow text animation
    setTimeout(() => {
      window.location.href = `/products/${category}`
    }, 1500) // 1.5 second delay to show text animation
  }

  const products = [
    {
      id: "mens",
      title: "For Him",
      description: "Bold and sophisticated fragrances for the modern gentleman",
      image: "/for-him.jpg?height=400&width=300",
      category: "men",
    },
    {
      id: "womens",
      title: "For Her",
      description: "Elegant and captivating scents for the refined woman",
      image: "/For her .jpg?height=400&width=300",
      category: "women",
    },
    {
      id: "packages",
      title: "Bundles",
      description: "Curated gift sets and bundles for every occasion",
      image: "/Bundles.jpeg?height=400&width=300",
      category: "packages",
    },
    {
      id: "outlet",
      title: "Outlets",
      description: "Limited-time offers and last-chance favorites",
      image: "/Outlet.jpg",
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
                  src="/logo-white-nobg.png" 
                  alt="Sense Fragrances" 
                  width={300} 
                  height={150} 
                  priority
                  className="mx-auto filter brightness-125"
                  style={{ width: 'auto', height: 'auto' }}
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
        <>
          {/* Gift Package Selector */}
          {selectedProduct.isGiftPackage ? (
            <GiftPackageSelector
              product={selectedProduct}
              isOpen={showSizeSelector}
              onClose={closeSizeSelector}
              onToggleFavorite={(product) => {
                if (isFavorite(product.id)) {
                  removeFromFavorites(product.id)
                } else {
                  addToFavorites({
                    id: product.id,
                    name: product.name,
                    price: product.packagePrice || 0,
                    image: product.images[0],
                    category: product.category,
                    rating: product.rating,
                    isNew: product.isNew,
                    isBestseller: product.isBestseller,
                    sizes: product.giftPackageSizes || [],
                    isGiftPackage: true,
                    packagePrice: product.packagePrice,
                    packageOriginalPrice: product.packageOriginalPrice,
                    giftPackageSizes: product.giftPackageSizes,
                  })
                }
              }}
              isFavorite={isFavorite}
            />
          ) : (
            /* Regular Product Size Selector */
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
                              price: getSmallestPrice(selectedProduct.sizes),
                              image: selectedProduct.images[0],
                              category: selectedProduct.category,
                              rating: selectedProduct.rating,
                              isNew: selectedProduct.isNew || false,
                              isBestseller: selectedProduct.isBestseller || false,
                              sizes: selectedProduct.sizes || [],
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
                    <StarRating rating={selectedProduct.rating || 0} />
                                         <span className="text-xs text-gray-600 ml-2">
                       ({selectedProduct.rating ? selectedProduct.rating.toFixed(1) : '0.0'})
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
                            {size.originalPrice && size.discountedPrice && 
                             size.discountedPrice < size.originalPrice ? (
                              <>
                                <span className="line-through text-gray-400">EGP{size.originalPrice}</span>
                                <br />
                                <span className="text-red-600">EGP{size.discountedPrice}</span>
                              </>
                            ) : (
                              <>EGP{size.discountedPrice || size.originalPrice || 0}</>
                            )}
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Quantity Selection */}
                  <div className="mb-4">
                    <h4 className="font-medium mb-3">Quantity</h4>
                    <div className="flex items-center space-x-3">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-8 h-8 border border-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
                        disabled={quantity <= 1}
                      >
                        <span className="text-gray-600">-</span>
                      </motion.button>
                      <span className="w-12 text-center font-medium">{quantity}</span>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setQuantity(quantity + 1)}
                        className="w-8 h-8 border border-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
                      >
                        <span className="text-gray-600">+</span>
                      </motion.button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center py-4 border-t border-gray-100">
                    <div>
                      <span className="text-gray-600">Total:</span>
                      <span className="text-xl font-medium ml-2">
                        {selectedSize ? (
                          selectedSize.originalPrice && selectedSize.discountedPrice && 
                          selectedSize.discountedPrice < selectedSize.originalPrice ? (
                            <>
                              <span className="line-through text-gray-400 mr-2 text-lg">EGP{selectedSize.originalPrice}</span>
                              <span className="text-red-600 font-bold">EGP{selectedSize.discountedPrice}</span>
                            </>
                          ) : (
                            <>EGP{selectedSize.discountedPrice || selectedSize.originalPrice || 0}</>
                          )
                        ) : (
                          <>EGP{getSmallestPrice(selectedProduct.sizes)}</>
                        )}
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
        </>
      )}

      {/* Hero Section */}
      <motion.section 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5 }}
        className="relative h-screen flex items-center justify-center overflow-hidden"
      >
        {/* Video Background - Full Screen */}
        <motion.div 
          className="absolute inset-0 z-0"
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 8, ease: "easeOut" }}
        >
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            poster="/video-poster.jpg"
            disablePictureInPicture
            controls={false}
            style={{ 
              WebkitUserSelect: 'none',
              userSelect: 'none',
            }}
          >
            <source src="/video_background_small.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          <div className="absolute inset-0 bg-black/50" />
        </motion.div>

        {/* Logo Over Video */}
        <motion.div 
          className="text-center z-10"
          initial={{ opacity: 0, y: 30, scale: 1.2 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        >
          <Image 
            src="/logo-white-nobg.png" 
            alt="Sense Fragrances" 
            width={500} 
            height={300} 
            priority
            className="mx-auto" 
            style={{ width: 'auto', height: 'auto' }}
          />
        </motion.div>
      </motion.section>

      {/* Text Content Section - Below Video */}
      <motion.section 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 1.2 }}
        viewport={{ once: true, amount: 0.3 }}
        className="py-20 bg-gradient-to-b from-gray-50 to-white overflow-hidden"
      >
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="text-center space-y-4"
          >
            <motion.h1 
              className="text-4xl md:text-6xl font-light tracking-wider text-gray-900"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.3 }}
              viewport={{ once: true }}
            >
              Discover Your
            </motion.h1>
            <motion.h2 
              className="text-4xl md:text-6xl font-light tracking-wider text-gray-900"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.5 }}
              viewport={{ once: true }}
            >
              Signature Scent
            </motion.h2>
            <motion.p 
              className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 1.5, delay: 0.7 }}
              viewport={{ once: true }}
            >
              Experience the art of fine fragrance with our carefully curated collection of premium perfumes that tell
              your unique story.
            </motion.p>
            
            {/* Explore Collections Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.0 }}
              viewport={{ once: true }}
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
          </motion.div>
        </div>
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
                      const minPrice = getMinPrice(product)
                      
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
                              className="absolute top-4 right-6 z-10 p-2.5 bg-white/95 backdrop-blur-sm rounded-full shadow-lg hover:shadow-xl hover:bg-white transition-all duration-300"
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
                                  <div className="relative w-full h-full group-hover:scale-105 transition-transform duration-500">
                                    <Image
                                      src={product.images[0] || "/placeholder.svg"}
                                      alt={product.name}
                                      fill
                                      className="object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none"></div>
                                  </div>
                                  <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                                    <div className="flex items-center mb-1">
                                      <StarRating rating={product.rating || 0} />
                                      <span className="text-xs ml-2">
                                        ({product.rating ? product.rating.toFixed(1) : '0.0'})
                                      </span>
                                    </div>

                                    <h3 className="text-lg font-medium mb-1">
                                      {product.name}
                                    </h3>
                                    
                                    <div className="flex items-center justify-between">
                                      <div className="text-lg font-light">
                                        {(() => {
                                          // Handle gift packages
                                          if (product.isGiftPackage) {
                                            const packagePrice = product.packagePrice || 0;
                                            const packageOriginalPrice = product.packageOriginalPrice || 0;
                                            
                                            if (packageOriginalPrice > 0 && packagePrice < packageOriginalPrice) {
                                              return (
                                                <>
                                                  <span className="line-through text-gray-300 mr-2 text-base">EGP{packageOriginalPrice}</span>
                                                  <span className="text-red-500 font-bold">EGP{packagePrice}</span>
                                                </>
                                              );
                                            } else {
                                              return <>EGP{packagePrice}</>;
                                            }
                                          }
                                          
                                          // Handle regular products
                                          const smallestPrice = getSmallestPrice(product.sizes);
                                          const smallestOriginalPrice = getSmallestOriginalPrice(product.sizes);
                                          
                                          if (smallestOriginalPrice > 0 && smallestPrice < smallestOriginalPrice) {
                                            return (
                                              <>
                                                <span className="line-through text-gray-300 mr-2 text-base">EGP{smallestOriginalPrice}</span>
                                                <span className="text-red-500 font-bold">EGP{smallestPrice}</span>
                                              </>
                                            );
                                          } else {
                                            return <>EGP{smallestPrice}</>;
                                          }
                                        })()}
                                      </div>
                                      
                                      <motion.button 
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        className="p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors"
                                        onClick={(e) => {
                                          e.preventDefault()
                                          e.stopPropagation()
                                          openSizeSelector(product)
                                        }}
                                        aria-label="Add to cart"
                                      >
                                        <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
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

              {/* Desktop Carousel */}
              <div className="hidden md:block relative">
                <div className="relative">
                  {/* Left Arrow */}
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={scrollPrevDesktop}
                    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 p-3 bg-white border border-gray-200 rounded-full shadow-lg hover:shadow-xl hover:bg-gray-50 transition-all duration-300 z-10"
                    aria-label="Previous products"
                  >
                    <ChevronLeft className="h-6 w-6 text-gray-700" />
                  </motion.button>

                  {/* Right Arrow */}
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={scrollNextDesktop}
                    className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 p-3 bg-white border border-gray-200 rounded-full shadow-lg hover:shadow-xl hover:bg-gray-50 transition-all duration-300 z-10"
                    aria-label="Next products"
                  >
                    <ChevronRight className="h-6 w-6 text-gray-700" />
                  </motion.button>

                  <div className="overflow-hidden" ref={emblaRefDesktop}>
                    <div className="flex">
                      {bestSellers.map((product, index) => {
                        const minPrice = getMinPrice(product)
                        
                        return (
                          <motion.div 
                            key={product._id} 
                            className="flex-[0_0_25%] min-w-0 pl-4 relative h-full"
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
                                className="absolute top-4 right-6 z-10 p-2.5 bg-white/95 backdrop-blur-sm rounded-full shadow-lg hover:shadow-xl hover:bg-white transition-all duration-300"
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
                                    <div className="relative w-full h-full group-hover:scale-105 transition-transform duration-500">
                                      <Image
                                        src={product.images[0] || "/placeholder.svg"}
                                        alt={product.name}
                                        fill
                                        className="object-cover"
                                      />
                                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none"></div>
                                    </div>
                                    <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                                      <div className="flex items-center mb-1">
                                        <StarRating rating={product.rating || 0} />
                                        <span className="text-xs ml-2">
                                          ({product.rating ? product.rating.toFixed(1) : '0.0'})
                                        </span>
                                      </div>

                                      <h3 className="text-lg font-medium mb-1">
                                        {product.name}
                                      </h3>
                                      
                                      <div className="flex items-center justify-between">
                                        <div className="text-lg font-light">
                                          {(() => {
                                            // Handle gift packages
                                            if (product.isGiftPackage) {
                                              const packagePrice = product.packagePrice || 0;
                                              const packageOriginalPrice = product.packageOriginalPrice || 0;
                                              
                                              if (packageOriginalPrice > 0 && packagePrice < packageOriginalPrice) {
                                                return (
                                                  <>
                                                    <span className="line-through text-gray-300 mr-2 text-base">EGP{packageOriginalPrice}</span>
                                                    <span className="text-red-500 font-bold">EGP{packagePrice}</span>
                                                  </>
                                                );
                                              } else {
                                                return <>EGP{packagePrice}</>;
                                              }
                                            }
                                            
                                            // Handle regular products
                                            const smallestPrice = getSmallestPrice(product.sizes);
                                            const smallestOriginalPrice = getSmallestOriginalPrice(product.sizes);
                                            
                                            if (smallestOriginalPrice > 0 && smallestPrice < smallestOriginalPrice) {
                                              return (
                                                <>
                                                  <span className="line-through text-gray-300 mr-2 text-base">EGP{smallestOriginalPrice}</span>
                                                  <span className="text-red-500 font-bold">EGP{smallestPrice}</span>
                                                </>
                                              );
                                            } else {
                                              return <>EGP{smallestPrice}</>;
                                            }
                                          })()}
                                        </div>
                                        
                                        <motion.button 
                                          whileHover={{ scale: 1.1 }}
                                          whileTap={{ scale: 0.9 }}
                                          className="p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors"
                                          onClick={(e) => {
                                            e.preventDefault()
                                            e.stopPropagation()
                                            openSizeSelector(product)
                                          }}
                                          aria-label="Add to cart"
                                        >
                                          <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
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
                </div>
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
                <Card 
                  className="group cursor-pointer border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
                  onClick={() => handleCollectionClick(product.id, product.category)}
                >
                  <CardContent className="p-0">
                    <div className="relative overflow-hidden">
                      <Image
                        src={product.image || "/placeholder.svg"}
                        alt="Product Collection"
                        width={300}
                        height={500}
                        className="w-full h-auto object-contain group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300" />
                      
                      {/* Text overlay - only shown when clicked */}
                      <AnimatePresence>
                        {showCollectionText[product.id] && (
                          <motion.div 
                            className="absolute bottom-0 left-0 right-0 p-6 text-white bg-gradient-to-t from-black/80 to-transparent"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            transition={{ duration: 0.5 }}
                          >
                            <motion.h3 
                              className="text-xl font-medium mb-2"
                              initial={{ y: 10, opacity: 0 }}
                              animate={{ y: 0, opacity: 1 }}
                              transition={{ duration: 0.3, delay: 0.1 }}
                            >
                              {product.title}
                            </motion.h3>
                            <motion.p 
                              className="text-sm opacity-90"
                              initial={{ y: 10, opacity: 0 }}
                              animate={{ y: 0, opacity: 1 }}
                              transition={{ duration: 0.3, delay: 0.2 }}
                            >
                              {product.description}
                            </motion.p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </CardContent>
                </Card>
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
                src="/Gifts.jpg?height=500&width=400"
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
              <Image 
                src="/logo-white.png" 
                alt="Sense Fragrances" 
                width={150} 
                height={100} 
                className="h-16 w-auto" 
              />
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
                  For Him
                </Link>
                <Link href="/products/women" className="block text-gray-400 hover:text-white transition-colors">
                  For Her
                </Link>
                <Link href="/products/packages" className="block text-gray-400 hover:text-white transition-colors">
                  Bundles
                </Link>
                <Link href="/products/outlet" className="block text-gray-400 hover:text-white transition-colors">
                  Outlets
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
                <p>Email: sensefragrances1@gmail.com</p>
                <p className="mb-3">Follow us for updates</p>
                <div className="flex space-x-3">
                  <Link
                    href="https://www.instagram.com/sensefragrances.eg?igsh=MXYxcTh5ZTlhZzMzNQ=="
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110 shadow-lg">
                      <Instagram className="h-4 w-4 text-white" />
                    </div>
                  </Link>
                  <Link
                    href="https://www.facebook.com/share/1JhHgi2Psu/?mibextid=wwXIfr"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group"
                  >
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110 shadow-lg">
                      <Facebook className="h-4 w-4 text-white" />
                    </div>
                  </Link>
                  <Link
                    href="https://www.tiktok.com/@sensefragrances.eg?_t=ZS-8zL3M6ji8HZ&_r=1"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group"
                  >
                    <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110 shadow-lg">
                      <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                      </svg>
                    </div>
                  </Link>
                </div>
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
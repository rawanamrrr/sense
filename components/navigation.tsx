"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Menu, X, ShoppingCart, User, Heart, LogOut, Settings, ChevronDown } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useCart } from "@/lib/cart-context"
import { useFavorites } from "@/lib/favorites-context"
import { OffersBanner } from "@/components/offers-banner"

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [productsOpen, setProductsOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const { state: authState, logout } = useAuth()
  const { state: cartState } = useCart()
  const { state: favoritesState } = useFavorites()
  const pathname = usePathname()

  // Check if we're on the home page
  const isHomePage = pathname === "/"

  // Handle scroll effect for transparency (only on home page)
  useEffect(() => {
    if (!isHomePage) return

    const handleScroll = () => {
      const scrollPosition = window.scrollY
      // Make header transparent for first 100vh (video section), then add background
      setIsScrolled(scrollPosition > window.innerHeight * 0.8)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [isHomePage])

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      
      // Don't close if clicking inside the mobile navigation or products dropdown
      if (target.closest('.mobile-navigation') || target.closest('.products-dropdown')) {
        return
      }
      
      setIsOpen(false)
      setShowUserMenu(false)
    }

    if (isOpen || showUserMenu) {
      document.addEventListener("click", handleClickOutside)
      return () => document.removeEventListener("click", handleClickOutside)
    }
  }, [isOpen, showUserMenu])

  const handleLogout = () => {
    logout()
    setShowUserMenu(false)
  }

  // Helper function to check if a link is active
  const isActiveLink = (href: string) => {
    if (href === "/") {
      return pathname === "/"
    }
    return pathname.startsWith(href)
  }

  // Determine header styling based on page and scroll position
  const getHeaderStyling = () => {
    if (!isHomePage) {
      // On non-home pages, always have background
      return 'bg-white/95 backdrop-blur-sm border-b border-gray-200'
    }
    
    // On home page, transparent when not scrolled, background when scrolled
    return isScrolled ? 'bg-white/95 backdrop-blur-sm border-b border-gray-200' : 'bg-transparent'
  }

  // Determine logo based on page and scroll position
  const getLogo = () => {
    if (!isHomePage) {
      // On non-home pages, use black logo
      return "/Logo-icon-blacks-nobg.png"
    }
    
    // On home page, white logo when not scrolled (over video), black when scrolled
    return isScrolled ? "/Logo-icon-blacks-nobg.png" : "/Logo-icon-white-nobg.png"
  }

  // Determine text colors based on page and scroll position
  const getTextColors = (isActive: boolean = false) => {
    if (!isHomePage) {
      // On non-home pages, use dark colors
      return isActive ? 'text-purple-600' : 'text-gray-700 hover:text-black'
    }
    
    // On home page, use white when not scrolled, dark when scrolled
    if (isScrolled) {
      return isActive ? 'text-purple-600' : 'text-gray-700 hover:text-black'
    } else {
      return isActive ? 'text-white' : 'text-white/90 hover:text-white'
    }
  }

  // Determine logo text colors
  const getLogoTextColors = () => {
    if (!isHomePage) {
      return {
        main: 'text-gray-900 group-hover:text-black',
        sub: 'text-gray-600'
      }
    }
    
    if (isScrolled) {
      return {
        main: 'text-gray-900 group-hover:text-black',
        sub: 'text-gray-600'
      }
    } else {
      return {
        main: 'text-white group-hover:text-gray-200',
        sub: 'text-gray-300'
      }
    }
  }

  // Determine active link indicator color
  const getActiveIndicatorColor = () => {
    if (!isHomePage) {
      return 'bg-gradient-to-r from-purple-400 to-pink-400'
    }
    return isScrolled ? 'bg-gradient-to-r from-purple-400 to-pink-400' : 'bg-white'
  }

  // Determine icon colors
  const getIconColors = (isActive: boolean = false) => {
    if (!isHomePage) {
      return isActive ? 'text-purple-600' : 'text-gray-700 hover:text-black'
    }
    
    if (isScrolled) {
      return isActive ? 'text-purple-600' : 'text-gray-700 hover:text-black'
    } else {
      return isActive ? 'text-white' : 'text-white/90 hover:text-white'
    }
  }

  // Determine button styling
  const getButtonStyling = () => {
    if (!isHomePage) {
      return {
        signIn: 'text-gray-700 hover:text-black hover:bg-gray-100',
        signUp: 'bg-black text-white hover:bg-gray-800'
      }
    }
    
    if (isScrolled) {
      return {
        signIn: 'text-gray-700 hover:text-black hover:bg-gray-100',
        signUp: 'bg-black text-white hover:bg-gray-800'
      }
    } else {
      return {
        signIn: 'text-white/90 hover:text-white hover:bg-white/10',
        signUp: 'bg-white text-black hover:bg-gray-100'
      }
    }
  }

  // Determine mobile menu styling
  const getMobileMenuStyling = () => {
    if (!isHomePage) {
      return 'border-t border-gray-200 bg-white'
    }
    
    return isScrolled ? 'border-t border-gray-200 bg-white' : 'border-t border-white/20 bg-black/80 backdrop-blur-md'
  }

  // Show loading state while auth is initializing
  if (authState.isLoading) {
    return (
      <nav className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${getHeaderStyling()}`}>
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Simplified loading navigation */}
            <div className={`h-8 w-8 rounded animate-pulse ${
              !isHomePage || isScrolled ? 'bg-gray-200' : 'bg-white/20'
            }`}></div>
            <div className="flex items-center space-x-4">
              <div className={`h-5 w-5 rounded animate-pulse ${
                !isHomePage || isScrolled ? 'bg-gray-200' : 'bg-white/20'
              }`}></div>
              <div className={`h-5 w-5 rounded animate-pulse ${
                !isHomePage || isScrolled ? 'bg-gray-200' : 'bg-white/20'
              }`}></div>
            </div>
          </div>
        </div>
      </nav>
    )
  }

  const logoColors = getLogoTextColors()
  const buttonStyling = getButtonStyling()

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${getHeaderStyling()}`}>
        {/* Promotional Banner - Now shows offers */}
        <div className="bg-black text-white">
          <OffersBanner />
        </div>

        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-3 group">
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
                className="relative animate-spin-slow"
                style={{ animationDuration: '10s' }}
              >
                <Image
                  src={getLogo()}
                  alt="Sense Icon"
                  width={32}
                  height={32}
                  className="h-12 w-12"
                  priority
                />
              </motion.div>
              <motion.div 
                initial={{ opacity: 0.8 }} 
                whileHover={{ opacity: 1 }} 
                className="flex flex-col font-serif"
              >
                <span className={`text-xl font-normal tracking-[0.15em] transition-colors uppercase ${logoColors.main}`}>
                  Sense
                </span>
                <span className={`text-[10px] font-light tracking-[0.3em] mt-0.5 uppercase transition-colors ${logoColors.sub}`}>
                  Fragrances
                </span>
              </motion.div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link 
                href="/" 
                className={`relative px-3 py-2 transition-colors ${getTextColors(isActiveLink("/"))}`}
              >
                Home
                {isActiveLink("/") && (
                  <div className={`absolute bottom-0 left-0 right-0 h-0.5 rounded-full ${getActiveIndicatorColor()}`} />
                )}
              </Link>
              <Link 
                href="/about" 
                className={`relative px-3 py-2 transition-colors ${getTextColors(isActiveLink("/about"))}`}
              >
                About
                {isActiveLink("/about") && (
                  <div className={`absolute bottom-0 left-0 right-0 h-0.5 rounded-full ${getActiveIndicatorColor()}`} />
                )}
              </Link>
              <div className="relative group">
                <Link 
                  href="/products" 
                  className={`relative px-3 py-2 transition-colors ${getTextColors(isActiveLink("/products"))}`}
                >
                  Products
                  {isActiveLink("/products") && (
                    <div className={`absolute bottom-0 left-0 right-0 h-0.5 rounded-full ${getActiveIndicatorColor()}`} />
                  )}
                </Link>
                <div className="absolute top-full left-0 mt-2 w-48 bg-white shadow-lg rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <div className="py-2">
                    <Link
                      href="/products/men"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-black transition-colors"
                    >
                      Men's Collection
                    </Link>
                    <Link
                      href="/products/women"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-black transition-colors"
                    >
                      Women's Collection
                    </Link>
                                         <Link
                       href="/products/packages"
                       className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-black transition-colors"
                     >
                       Gift Packages
                     </Link>
                     <Link
                       href="/products/outlet"
                       className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-black transition-colors"
                     >
                       Outlet Collection
                     </Link>
                   </div>
                </div>
              </div>
              <Link 
                href="/contact" 
                className={`relative px-3 py-2 transition-colors ${getTextColors(isActiveLink("/contact"))}`}
              >
                Contact
                {isActiveLink("/contact") && (
                  <div className={`absolute bottom-0 left-0 right-0 h-0.5 rounded-full ${getActiveIndicatorColor()}`} />
                )}
              </Link>
            </div>

            {/* Right Side Icons */}
            <div className="flex items-center space-x-4">
              {/* Favorites */}
              <Link 
                href="/favorites" 
                className={`relative p-2 transition-colors ${getIconColors(isActiveLink("/favorites"))}`}
              >
                <Heart className="h-5 w-5" />
                {favoritesState.count > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs">
                    {favoritesState.count}
                  </Badge>
                )}
                                 {isActiveLink("/favorites") && (
                   <div className={`absolute inset-0 rounded-xl ${
                     !isHomePage || isScrolled ? 'bg-black/3' : 'bg-white/20'
                   }`} />
                 )}
              </Link>

              {/* Cart */}
              <Link 
                href="/cart" 
                className={`relative p-2 transition-colors ${getIconColors(isActiveLink("/cart"))}`}
              >
                <ShoppingCart className="h-5 w-5" />
                {cartState.count > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs">
                    {cartState.count}
                  </Badge>
                )}
                                 {isActiveLink("/cart") && (
                   <div className={`absolute inset-0 rounded-xl ${
                     !isHomePage || isScrolled ? 'bg-black/3' : 'bg-white/20'
                   }`} />
                 )}
              </Link>

              {/* User Menu */}
              {authState.isAuthenticated ? (
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowUserMenu(!showUserMenu)
                    }}
                    className={`p-2 transition-colors ${getIconColors()}`}
                  >
                    <User className="h-5 w-5" />
                  </button>

                  <AnimatePresence>
                    {showUserMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 top-full mt-2 w-48 bg-white shadow-lg rounded-lg border border-gray-200"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="py-2">
                          <div className="px-4 py-2 border-b border-gray-100">
                            <p className="text-sm font-medium text-gray-900">{authState.user?.name}</p>
                            <p className="text-xs text-gray-500">{authState.user?.email}</p>
                          </div>

                          {authState.user?.role !== "admin" && (
                            <Link
                              href="/account"
                              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                              onClick={() => setShowUserMenu(false)}
                            >
                              <Settings className="h-4 w-4 mr-2" />
                              My Account
                            </Link>
                          )}

                          {authState.user?.role === "admin" && (
                            <Link
                              href="/admin/dashboard"
                              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                              onClick={() => setShowUserMenu(false)}
                            >
                              <Settings className="h-4 w-4 mr-2" />
                              Admin Dashboard
                            </Link>
                          )}

                          <button
                            onClick={handleLogout}
                            className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <LogOut className="h-4 w-4 mr-2" />
                            Sign Out
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="hidden md:flex items-center space-x-2">
                  <Link href="/auth/login">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className={`transition-all ${buttonStyling.signIn}`}
                    >
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/auth/register">
                    <Button 
                      size="sm" 
                      className={`transition-all ${buttonStyling.signUp}`}
                    >
                      Sign Up
                    </Button>
                  </Link>
                </div>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setIsOpen(!isOpen)
                }}
                className={`md:hidden p-2 transition-colors ${getIconColors()}`}
              >
                {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>

                     {/* Mobile Navigation */}
           <AnimatePresence>
             {isOpen && (
               <motion.div
                 initial={{ opacity: 0, height: 0 }}
                 animate={{ opacity: 1, height: "auto" }}
                 exit={{ opacity: 0, height: 0 }}
                 transition={{ duration: 0.3 }}
                                  className={`md:hidden mobile-navigation ${getMobileMenuStyling()}`}
                 onClick={(e) => e.stopPropagation()}
                 onMouseDown={(e) => e.stopPropagation()}
               >
                 <div className="py-4 space-y-4">
                  <Link
                    href="/"
                    className={`relative block px-4 py-3 transition-colors rounded-lg ${getTextColors(isActiveLink("/"))}`}
                    onClick={() => setIsOpen(false)}
                  >
                                         {isActiveLink("/") && (
                       <div className={`absolute inset-0 rounded-xl ${
                         !isHomePage || isScrolled ? 'bg-black/3' : 'bg-white/20'
                       }`} />
                     )}
                    <span className="relative z-10">Home</span>
                  </Link>
                  <Link
                    href="/about"
                    className={`relative block px-4 py-3 transition-colors rounded-lg ${getTextColors(isActiveLink("/about"))}`}
                    onClick={() => setIsOpen(false)}
                  >
                                         {isActiveLink("/about") && (
                       <div className={`absolute inset-0 rounded-xl ${
                         !isHomePage || isScrolled ? 'bg-black/3' : 'bg-white/20'
                       }`} />
                     )}
                    <span className="relative z-10">About</span>
                  </Link>
                                                                           <div className="space-y-2 products-dropdown">
                      <div className="flex items-center justify-between">
                        <Link
                          href="/products"
                          className={`relative flex-1 px-4 py-3 transition-colors rounded-lg ${getTextColors(isActiveLink("/products"))}`}
                          onClick={() => setIsOpen(false)}
                        >
                                                     {isActiveLink("/products") && (
                             <div className={`absolute inset-0 rounded-xl ${
                               !isHomePage || isScrolled ? 'bg-black/3' : 'bg-white/20'
                             }`} />
                           )}
                          <span className="relative z-10">All Products</span>
                        </Link>
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            setProductsOpen(!productsOpen)
                          }}
                          className={`p-2 transition-colors ${
                            !isHomePage || isScrolled ? 'text-gray-600 hover:text-black' : 'text-white/60 hover:text-white'
                          }`}
                        >
                          <ChevronDown className={`h-4 w-4 transition-transform ${productsOpen ? 'rotate-180' : ''}`} />
                        </button>
                      </div>
                     
                     {/* Product Collections - Collapsible */}
                     <AnimatePresence>
                       {productsOpen && (
                         <motion.div
                           initial={{ opacity: 0, height: 0 }}
                           animate={{ opacity: 1, height: "auto" }}
                           exit={{ opacity: 0, height: 0 }}
                           transition={{ duration: 0.2 }}
                           className="ml-4 space-y-1 overflow-hidden"
                         >
                           <Link
                             href="/products/men"
                             className={`relative block px-4 py-2 text-sm transition-colors rounded-lg ${
                               !isHomePage || isScrolled 
                                 ? `text-gray-600 hover:text-black ${isActiveLink("/products/men") ? "text-purple-600" : ""}`
                                 : `text-white/70 hover:text-white ${isActiveLink("/products/men") ? "text-white" : ""}`
                             }`}
                             onClick={() => setIsOpen(false)}
                           >
                             {isActiveLink("/products/men") && (
                               <div className={`absolute inset-0 rounded-xl ${
                                 !isHomePage || isScrolled ? 'bg-black/3' : 'bg-white/20'
                               }`} />
                             )}
                             <span className="relative z-10">Men's Collection</span>
                           </Link>
                           <Link
                             href="/products/women"
                             className={`relative block px-4 py-2 text-sm transition-colors rounded-lg ${
                               !isHomePage || isScrolled 
                                 ? `text-gray-600 hover:text-black ${isActiveLink("/products/women") ? "text-purple-600" : ""}`
                                 : `text-white/70 hover:text-white ${isActiveLink("/products/women") ? "text-white" : ""}`
                             }`}
                             onClick={() => setIsOpen(false)}
                           >
                             {isActiveLink("/products/women") && (
                               <div className={`absolute inset-0 rounded-xl ${
                                 !isHomePage || isScrolled ? 'bg-black/3' : 'bg-white/20'
                               }`} />
                             )}
                             <span className="relative z-10">Women's Collection</span>
                           </Link>
                           <Link
                             href="/products/packages"
                             className={`relative block px-4 py-2 text-sm transition-colors rounded-lg ${
                               !isHomePage || isScrolled 
                                 ? `text-gray-600 hover:text-black ${isActiveLink("/products/packages") ? "text-purple-600" : ""}`
                                 : `text-white/70 hover:text-white ${isActiveLink("/products/packages") ? "text-white" : ""}`
                             }`}
                             onClick={() => setIsOpen(false)}
                           >
                             {isActiveLink("/products/packages") && (
                               <div className={`absolute inset-0 rounded-xl ${
                                 !isHomePage || isScrolled ? 'bg-black/3' : 'bg-white/20'
                               }`} />
                             )}
                             <span className="relative z-10">Gift Packages</span>
                           </Link>
                           <Link
                             href="/products/outlet"
                             className={`relative block px-4 py-2 text-sm transition-colors rounded-lg ${
                               !isHomePage || isScrolled 
                                 ? `text-gray-600 hover:text-black ${isActiveLink("/products/outlet") ? "text-purple-600" : ""}`
                                 : `text-white/70 hover:text-white ${isActiveLink("/products/outlet") ? "text-white" : ""}`
                             }`}
                             onClick={() => setIsOpen(false)}
                           >
                             {isActiveLink("/products/outlet") && (
                               <div className={`absolute inset-0 rounded-xl ${
                                 !isHomePage || isScrolled ? 'bg-black/3' : 'bg-white/20'
                               }`} />
                             )}
                             <span className="relative z-10">Outlet Collection</span>
                           </Link>
                         </motion.div>
                       )}
                     </AnimatePresence>
                   </div>
                  <Link
                    href="/contact"
                    className={`relative block px-4 py-3 transition-colors rounded-lg ${getTextColors(isActiveLink("/contact"))}`}
                    onClick={() => setIsOpen(false)}
                  >
                                         {isActiveLink("/contact") && (
                       <div className={`absolute inset-0 rounded-xl ${
                         !isHomePage || isScrolled ? 'bg-black/3' : 'bg-white/20'
                       }`} />
                     )}
                    <span className="relative z-10">Contact</span>
                  </Link>

                  

                  {!authState.isAuthenticated ? (
                    <div className={`flex flex-col space-y-2 pt-4 ${
                      !isHomePage || isScrolled ? 'border-t border-gray-200' : 'border-t border-white/20'
                    }`}>
                      <Link 
                        href="/auth/login" 
                        onClick={() => setIsOpen(false)}
                        className={`relative block ${
                          isActiveLink("/auth/login") ? "opacity-100" : ""
                        }`}
                      >
                                                 {isActiveLink("/auth/login") && (
                           <div className={`absolute inset-0 rounded-xl ${
                             !isHomePage || isScrolled ? 'bg-black/3' : 'bg-white/20'
                           }`} />
                         )}
                        <Button 
                          variant="ghost" 
                          className={`w-full justify-start relative z-10 transition-all ${buttonStyling.signIn}`}
                        >
                          Sign In
                        </Button>
                      </Link>
                      <Link 
                        href="/auth/register" 
                        onClick={() => setIsOpen(false)}
                        className={`relative block ${
                          isActiveLink("/auth/register") ? "opacity-100" : ""
                        }`}
                      >
                                                 {isActiveLink("/auth/register") && (
                           <div className={`absolute inset-0 rounded-xl ${
                             !isHomePage || isScrolled ? 'bg-black/3' : 'bg-white/20'
                           }`} />
                         )}
                        <Button className={`w-full relative z-10 transition-all ${buttonStyling.signUp}`}>
                          Sign Up
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className={`pt-4 space-y-2 ${
                      !isHomePage || isScrolled ? 'border-t border-gray-200' : 'border-t border-white/20'
                    }`}>
                      <p className={`text-sm font-medium ${
                        !isHomePage || isScrolled ? 'text-gray-900' : 'text-white'
                      }`}>{authState.user?.name}</p>
                      {authState.user?.role !== "admin" && (
                        <Link
                          href="/account"
                          className={`relative block px-4 py-3 transition-colors rounded-lg ${getTextColors(isActiveLink("/account"))}`}
                          onClick={() => setIsOpen(false)}
                        >
                                                     {isActiveLink("/account") && (
                             <div className={`absolute inset-0 rounded-xl ${
                               !isHomePage || isScrolled ? 'bg-black/3' : 'bg-white/20'
                             }`} />
                           )}
                          <span className="relative z-10">My Account</span>
                        </Link>
                      )}
                      {authState.user?.role === "admin" && (
                        <Link
                          href="/admin/dashboard"
                          className={`relative block px-4 py-3 transition-colors rounded-lg ${getTextColors(isActiveLink("/admin/dashboard"))}`}
                          onClick={() => setIsOpen(false)}
                        >
                                                     {isActiveLink("/admin/dashboard") && (
                             <div className={`absolute inset-0 rounded-xl ${
                               !isHomePage || isScrolled ? 'bg-black/3' : 'bg-white/20'
                             }`} />
                           )}
                          <span className="relative z-10">Admin Dashboard</span>
                        </Link>
                      )}
                      <button
                        onClick={() => {
                          handleLogout()
                          setIsOpen(false)
                        }}
                        className={`block w-full text-left transition-colors ${
                          !isHomePage || isScrolled ? 'text-red-600 hover:text-red-700' : 'text-red-400 hover:text-red-300'
                        }`}
                      >
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>
    </>
  )
}
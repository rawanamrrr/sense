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
  const { state: authState, logout } = useAuth()
  const { state: cartState } = useCart()
  const { state: favoritesState } = useFavorites()
  const pathname = usePathname()

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

  // Show loading state while auth is initializing
  if (authState.isLoading) {
    return (
      <nav className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-b border-gray-200 z-40">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Simplified loading navigation */}
            <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="flex items-center space-x-4">
              <div className="h-5 w-5 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-5 w-5 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </nav>
    )
  }
  return (
    <>
      <nav className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-b border-gray-200 z-40">
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
                className="relative"
              >
                <Image
                  src="\Logo-icon-blacks-nobg.png"
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
                <span className="text-xl font-normal tracking-[0.15em] text-gray-900 group-hover:text-black transition-colors uppercase ">
                  Sense
                </span>
                <span className="text-[10px] font-light tracking-[0.3em] text-gray-600 mt-0.5 uppercase">
                  Fragrances
                </span>
              </motion.div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link 
                href="/" 
                className={`relative px-3 py-2 text-gray-700 hover:text-black transition-colors ${
                  isActiveLink("/") ? "text-purple-600" : ""
                }`}
              >
                Home
                {isActiveLink("/") && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full" />
                )}
              </Link>
              <Link 
                href="/about" 
                className={`relative px-3 py-2 text-gray-700 hover:text-black transition-colors ${
                  isActiveLink("/about") ? "text-purple-600" : ""
                }`}
              >
                About
                {isActiveLink("/about") && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full" />
                )}
              </Link>
              <div className="relative group">
                <Link 
                  href="/products" 
                  className={`relative px-3 py-2 text-gray-700 hover:text-black transition-colors ${
                    isActiveLink("/products") ? "text-purple-600" : ""
                  }`}
                >
                  Products
                  {isActiveLink("/products") && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full" />
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
                className={`relative px-3 py-2 text-gray-700 hover:text-black transition-colors ${
                  isActiveLink("/contact") ? "text-purple-600" : ""
                }`}
              >
                Contact
                {isActiveLink("/contact") && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full" />
                )}
              </Link>
            </div>

            {/* Right Side Icons */}
            <div className="flex items-center space-x-4">
              {/* Favorites */}
              <Link 
                href="/favorites" 
                className={`relative p-2 text-gray-700 hover:text-black transition-colors ${
                  isActiveLink("/favorites") ? "text-purple-600" : ""
                }`}
              >
                <Heart className="h-5 w-5" />
                {favoritesState.count > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs">
                    {favoritesState.count}
                  </Badge>
                )}
                                 {isActiveLink("/favorites") && (
                   <div className="absolute inset-0 bg-black/3 rounded-xl" />
                 )}
              </Link>

              {/* Cart */}
              <Link 
                href="/cart" 
                className={`relative p-2 text-gray-700 hover:text-black transition-colors ${
                  isActiveLink("/cart") ? "text-purple-600" : ""
                }`}
              >
                <ShoppingCart className="h-5 w-5" />
                {cartState.count > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs">
                    {cartState.count}
                  </Badge>
                )}
                                 {isActiveLink("/cart") && (
                   <div className="absolute inset-0 bg-black/3 rounded-xl" />
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
                    className="p-2 text-gray-700 hover:text-black transition-colors"
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
                    <Button variant="ghost" size="sm">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/auth/register">
                    <Button size="sm" className="bg-black text-white hover:bg-gray-800">
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
                className="md:hidden p-2 text-gray-700 hover:text-black transition-colors"
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
                                  className="md:hidden border-t border-gray-200 bg-white mobile-navigation"
                 onClick={(e) => e.stopPropagation()}
                 onMouseDown={(e) => e.stopPropagation()}
               >
                 <div className="py-4 space-y-4">
                  <Link
                    href="/"
                    className={`relative block px-4 py-3 text-gray-700 hover:text-black transition-colors rounded-lg ${
                      isActiveLink("/") ? "text-purple-600" : ""
                    }`}
                    onClick={() => setIsOpen(false)}
                  >
                                         {isActiveLink("/") && (
                       <div className="absolute inset-0 bg-black/3 rounded-xl" />
                     )}
                    <span className="relative z-10">Home</span>
                  </Link>
                  <Link
                    href="/about"
                    className={`relative block px-4 py-3 text-gray-700 hover:text-black transition-colors rounded-lg ${
                      isActiveLink("/about") ? "text-purple-600" : ""
                    }`}
                    onClick={() => setIsOpen(false)}
                  >
                                         {isActiveLink("/about") && (
                       <div className="absolute inset-0 bg-black/3 rounded-xl" />
                     )}
                    <span className="relative z-10">About</span>
                  </Link>
                                                                           <div className="space-y-2 products-dropdown">
                      <div className="flex items-center justify-between">
                        <Link
                          href="/products"
                          className={`relative flex-1 px-4 py-3 text-gray-700 hover:text-black transition-colors rounded-lg ${
                            isActiveLink("/products") ? "text-purple-600" : ""
                          }`}
                          onClick={() => setIsOpen(false)}
                        >
                                                     {isActiveLink("/products") && (
                             <div className="absolute inset-0 bg-black/3 rounded-xl" />
                           )}
                          <span className="relative z-10">All Products</span>
                        </Link>
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            setProductsOpen(!productsOpen)
                          }}
                          className="p-2 text-gray-600 hover:text-black transition-colors"
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
                             className={`relative block px-4 py-2 text-sm text-gray-600 hover:text-black transition-colors rounded-lg ${
                               isActiveLink("/products/men") ? "text-purple-600" : ""
                             }`}
                             onClick={() => setIsOpen(false)}
                           >
                             {isActiveLink("/products/men") && (
                               <div className="absolute inset-0 bg-black/3 rounded-xl" />
                             )}
                             <span className="relative z-10">Men's Collection</span>
                           </Link>
                           <Link
                             href="/products/women"
                             className={`relative block px-4 py-2 text-sm text-gray-600 hover:text-black transition-colors rounded-lg ${
                               isActiveLink("/products/women") ? "text-purple-600" : ""
                             }`}
                             onClick={() => setIsOpen(false)}
                           >
                             {isActiveLink("/products/women") && (
                               <div className="absolute inset-0 bg-black/3 rounded-xl" />
                             )}
                             <span className="relative z-10">Women's Collection</span>
                           </Link>
                           <Link
                             href="/products/packages"
                             className={`relative block px-4 py-2 text-sm text-gray-600 hover:text-black transition-colors rounded-lg ${
                               isActiveLink("/products/packages") ? "text-purple-600" : ""
                             }`}
                             onClick={() => setIsOpen(false)}
                           >
                             {isActiveLink("/products/packages") && (
                               <div className="absolute inset-0 bg-black/3 rounded-xl" />
                             )}
                             <span className="relative z-10">Gift Packages</span>
                           </Link>
                           <Link
                             href="/products/outlet"
                             className={`relative block px-4 py-2 text-sm text-gray-600 hover:text-black transition-colors rounded-lg ${
                               isActiveLink("/products/outlet") ? "text-purple-600" : ""
                             }`}
                             onClick={() => setIsOpen(false)}
                           >
                             {isActiveLink("/products/outlet") && (
                               <div className="absolute inset-0 bg-black/3 rounded-xl" />
                             )}
                             <span className="relative z-10">Outlet Collection</span>
                           </Link>
                         </motion.div>
                       )}
                     </AnimatePresence>
                   </div>
                  <Link
                    href="/contact"
                    className={`relative block px-4 py-3 text-gray-700 hover:text-black transition-colors rounded-lg ${
                      isActiveLink("/contact") ? "text-purple-600" : ""
                    }`}
                    onClick={() => setIsOpen(false)}
                  >
                                         {isActiveLink("/contact") && (
                       <div className="absolute inset-0 bg-black/3 rounded-xl" />
                     )}
                    <span className="relative z-10">Contact</span>
                  </Link>

                  

                  {!authState.isAuthenticated ? (
                    <div className="flex flex-col space-y-2 pt-4 border-t border-gray-200">
                      <Link 
                        href="/auth/login" 
                        onClick={() => setIsOpen(false)}
                        className={`relative block ${
                          isActiveLink("/auth/login") ? "opacity-100" : ""
                        }`}
                      >
                                                 {isActiveLink("/auth/login") && (
                           <div className="absolute inset-0 bg-black/3 rounded-xl" />
                         )}
                        <Button variant="ghost" className="w-full justify-start relative z-10">
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
                           <div className="absolute inset-0 bg-black/3 rounded-xl" />
                         )}
                        <Button className="w-full bg-black text-white hover:bg-gray-800 relative z-10">Sign Up</Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="pt-4 border-t border-gray-200 space-y-2">
                      <p className="text-sm font-medium text-gray-900">{authState.user?.name}</p>
                      {authState.user?.role !== "admin" && (
                        <Link
                          href="/account"
                          className={`relative block px-4 py-3 text-gray-700 hover:text-black transition-colors rounded-lg ${
                            isActiveLink("/account") ? "text-purple-600" : ""
                          }`}
                          onClick={() => setIsOpen(false)}
                        >
                                                     {isActiveLink("/account") && (
                             <div className="absolute inset-0 bg-black/3 rounded-xl" />
                           )}
                          <span className="relative z-10">My Account</span>
                        </Link>
                      )}
                      {authState.user?.role === "admin" && (
                        <Link
                          href="/admin/dashboard"
                          className={`relative block px-4 py-3 text-gray-700 hover:text-black transition-colors rounded-lg ${
                            isActiveLink("/admin/dashboard") ? "text-purple-600" : ""
                          }`}
                          onClick={() => setIsOpen(false)}
                        >
                                                     {isActiveLink("/admin/dashboard") && (
                             <div className="absolute inset-0 bg-black/3 rounded-xl" />
                           )}
                          <span className="relative z-10">Admin Dashboard</span>
                        </Link>
                      )}
                      <button
                        onClick={() => {
                          handleLogout()
                          setIsOpen(false)
                        }}
                        className="block w-full text-left text-red-600 hover:text-red-700 transition-colors"
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
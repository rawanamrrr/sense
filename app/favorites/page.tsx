"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Heart, ShoppingCart, Trash2, ArrowLeft } from "lucide-react"
import { Navigation } from "@/components/navigation"
import { useFavorites } from "@/lib/favorites-context"
import { useCart } from "@/lib/cart-context"

export default function FavoritesPage() {
  const { state: favoritesState, removeFromFavorites, clearFavorites } = useFavorites()
  const { dispatch: cartDispatch } = useCart()
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  const addToCart = (item: any) => {
    cartDispatch({
      type: "ADD_ITEM",
      payload: {
        id: item.id,
        name: item.name,
        price: item.price,
        size: "Standard",
        volume: "50ml",
        image: item.image,
        category: item.category,
      },
    })
  }

  const handleClearFavorites = () => {
    clearFavorites()
    setShowClearConfirm(false)
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
            <Link href="/" className="inline-flex items-center text-gray-600 hover:text-black mb-6 transition-colors">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>

            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-light tracking-wider mb-2">My Favorites</h1>
                <p className="text-gray-600">
                  {favoritesState.count === 0
                    ? "You haven't added any favorites yet"
                    : `${favoritesState.count} item${favoritesState.count === 1 ? "" : "s"} in your favorites`}
                </p>
              </div>

              {favoritesState.count > 0 && (
                <div className="flex items-center space-x-4">
                  {!showClearConfirm ? (
                    <Button
                      variant="outline"
                      onClick={() => setShowClearConfirm(true)}
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear All
                    </Button>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">Are you sure?</span>
                      <Button size="sm" variant="outline" onClick={() => setShowClearConfirm(false)}>
                        Cancel
                      </Button>
                      <Button size="sm" onClick={handleClearFavorites} className="bg-red-600 hover:bg-red-700">
                        Clear All
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>

          {favoritesState.count === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="text-center py-16"
            >
              <Heart className="h-24 w-24 text-gray-300 mx-auto mb-6" />
              <h2 className="text-2xl font-light tracking-wider mb-4">No Favorites Yet</h2>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Start exploring our collection and add your favorite fragrances to this list for easy access.
              </p>
              <Link href="/products">
                <Button className="bg-black text-white hover:bg-gray-800">Explore Fragrances</Button>
              </Link>
            </motion.div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {favoritesState.items.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                >
                  <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md">
                    <CardContent className="p-0">
                      <div className="relative">
                        <Link href={`/products/${item.category}/${item.id}`}>
                          <Image
                            src={item.image || "/placeholder.svg"}
                            alt={item.name}
                            width={300}
                            height={400}
                            className="w-full h-64 object-cover rounded-t-lg group-hover:scale-105 transition-transform duration-300"
                          />
                        </Link>
                        <button
                          onClick={() => removeFromFavorites(item.id)}
                          className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-md hover:bg-white transition-colors"
                        >
                          <Heart className="h-4 w-4 text-red-500 fill-red-500" />
                        </button>
                      </div>

                      <div className="p-4">
                        <div className="mb-3">
                          <Badge variant="secondary" className="text-xs">
                            {item.category === "men" ? "Men's" : item.category === "women" ? "Women's" : "Gift Package"}
                          </Badge>
                        </div>

                        <Link href={`/products/${item.category}/${item.id}`}>
                          <h3 className="font-medium text-lg mb-2 hover:text-gray-600 transition-colors">
                            {item.name}
                          </h3>
                        </Link>

                        <div className="flex items-center justify-between">
                          <span className="text-xl font-light">{item.price} EGP</span>
                          <Button
                            size="sm"
                            onClick={() => addToCart(item)}
                            className="bg-black text-white hover:bg-gray-800"
                          >
                            <ShoppingCart className="h-4 w-4 mr-1" />
                            Add to Cart
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

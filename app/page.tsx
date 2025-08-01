"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { motion, useScroll, useTransform } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowRight, Sparkles } from "lucide-react"
import { Navigation } from "@/components/navigation"

export default function HomePage() {
  const [scrollY, setScrollY] = useState(0)
  const { scrollYProgress } = useScroll()

  const logoScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.8])
  const logoY = useTransform(scrollYProgress, [0, 0.2], [0, -20])

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

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
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <Navigation showScrollEffect={true} />

      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white">
        <div className="text-center space-y-8">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1 }}>
            <Image src="/logo-black.png" alt="Sense Fragrances" width={300} height={200} className="mx-auto mb-8" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="space-y-4"
          >
            <h1 className="text-4xl md:text-6xl font-light tracking-wider text-gray-900">Discover Your</h1>
            <h2 className="text-4xl md:text-6xl font-light tracking-wider text-gray-900">Signature Scent</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Experience the art of fine fragrance with our carefully curated collection of premium perfumes that tell
              your unique story.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.6 }}
          >
            <Button size="lg" className="bg-black text-white hover:bg-gray-800 px-8 py-3 text-lg">
              Explore Collection
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </motion.div>
        </div>

        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        >
          <Sparkles className="h-6 w-6 text-gray-400" />
        </motion.div>
      </section>

      {/* Products Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-light tracking-wider mb-4">Our Collections</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Discover our three distinctive fragrance collections, each crafted to capture the essence of elegance and
              sophistication.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {products.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                viewport={{ once: true }}
              >
                <Link href={`/products/${product.category}`}>
                  <Card className="group cursor-pointer border-0 shadow-lg hover:shadow-xl transition-all duration-300">
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
                          <h3 className="text-xl font-medium mb-2">{product.title}</h3>
                          <p className="text-sm opacity-90">{product.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* About Preview Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-light tracking-wider mb-6">The Art of Fragrance</h2>
              <p className="text-gray-600 mb-6 leading-relaxed">
                At Sense Fragrances, we believe that every scent tells a story. Our master perfumers craft each
                fragrance with precision and passion, using only the finest ingredients sourced from around the world.
              </p>
              <p className="text-gray-600 mb-8 leading-relaxed">
                From the first spritz to the lasting impression, our perfumes are designed to evoke emotions, create
                memories, and express your unique personality.
              </p>
              <Link href="/about">
                <Button
                  variant="outline"
                  className="border-black text-black hover:bg-black hover:text-white bg-transparent"
                >
                  Learn More About Us
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
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
            </motion.div>
          </div>
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

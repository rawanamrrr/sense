"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Award, Heart, Sparkles } from "lucide-react"
import { Navigation } from "@/components/navigation"

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
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
            <Link href="/" className="inline-flex items-center text-gray-600 hover:text-black mb-8 transition-colors">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
            <h1 className="text-4xl md:text-5xl font-light tracking-wider mb-6">Our Story</h1>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "150px" }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="h-1 bg-gradient-to-r from-purple-400 to-pink-400 mx-auto my-6 rounded-full"
            />
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Born from a passion for exceptional fragrances, Sense represents the perfect harmony between artistry and
              craftsmanship in the world of perfumery.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-light tracking-wider mb-6">The Beginning</h2>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Founded in 2015 by master perfumer Elena Rossi, Sense Fragrances began as a small atelier in the heart
                of Grasse, France. With over two decades of experience in the fragrance industry, Elena envisioned
                creating perfumes that would transcend traditional boundaries and speak directly to the soul.
              </p>
              <p className="text-gray-600 leading-relaxed">
                What started as a personal quest to capture emotions in bottles has evolved into a globally recognized
                brand, celebrated for its innovative approach to scent composition and unwavering commitment to quality.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <Image
                src="/placeholder.svg?height=400&width=500"
                alt="Perfume laboratory"
                width={500}
                height={400}
                className="w-full h-80 object-cover rounded-lg shadow-lg"
              />
            </motion.div>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="order-2 md:order-1"
            >
              <Image
                src="/placeholder.svg?height=400&width=500"
                alt="Fragrance ingredients"
                width={500}
                height={400}
                className="w-full h-80 object-cover rounded-lg shadow-lg"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="order-1 md:order-2"
            >
              <h2 className="text-3xl font-light tracking-wider mb-6">Our Philosophy</h2>
              <p className="text-gray-600 mb-6 leading-relaxed">
                At Sense, we believe that fragrance is more than just a scent—it's a form of self-expression, a memory
                keeper, and a confidence booster. Each of our perfumes is carefully crafted to evoke specific emotions
                and create lasting impressions.
              </p>
              <p className="text-gray-600 leading-relaxed">
                We source our ingredients from the finest suppliers worldwide, ensuring that every bottle contains only
                the purest essences. Our commitment to sustainability and ethical practices guides every decision we
                make, from ingredient sourcing to packaging design.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-light tracking-wider mb-6">Our Values</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              The principles that guide our craft and define our commitment to excellence.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-6">
                <Award className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-medium mb-4">Excellence</h3>
              <p className="text-gray-600 leading-relaxed">
                We pursue perfection in every aspect of our craft, from the selection of raw materials to the final
                presentation of our fragrances.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-6">
                <Heart className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-medium mb-4">Passion</h3>
              <p className="text-gray-600 leading-relaxed">
                Our love for fragrance drives everything we do. Each perfume is created with genuine passion and
                dedication to the art of perfumery.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-6">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-medium mb-4">Innovation</h3>
              <p className="text-gray-600 leading-relaxed">
                We constantly explore new techniques and combinations to create unique fragrances that push the
                boundaries of traditional perfumery.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="container mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-light tracking-wider mb-6">Experience Our Craft</h2>
            <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
              Discover the artistry behind each fragrance and find the perfect scent that tells your unique story.
            </p>
            <Link href="/products">
              <Button size="lg" className="bg-black text-white hover:bg-gray-800 px-8 py-3">
                Explore Our Collections
              </Button>
            </Link>
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

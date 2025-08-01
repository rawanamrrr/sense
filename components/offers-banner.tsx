"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Tag, ChevronLeft, ChevronRight, Copy, Check } from "lucide-react"

interface Offer {
  _id: string
  title: string
  description: string
  discountCode?: string
  isActive: boolean
  priority: number
}



export function OffersBanner() {
  const [offers, setOffers] = useState<Offer[]>([])
  const [currentOfferIndex, setCurrentOfferIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isHovered, setIsHovered] = useState(false)
  const [progress, setProgress] = useState(0)
  const [copied, setCopied] = useState(false)

  const hasMounted = useRef(false)

 const fetchOffers = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/offers", { cache: "no-store" })

      if (response.ok) {
        const data = await response.json()
        const activeOffers = data
          .filter((offer: Offer) => offer.isActive)
          .sort((a: Offer, b: Offer) => b.priority - a.priority)

        setOffers(activeOffers)
      } else {
        setOffers([])
      }
    } catch {
      setOffers([])
    } finally {
      setLoading(false)
      setIsVisible(true)
    }
  }, [])

  useEffect(() => {
    if (hasMounted.current) return
    hasMounted.current = true

    fetchOffers()
    const refreshInterval = setInterval(fetchOffers, 5 * 60 * 1000)
    return () => clearInterval(refreshInterval)
  }, [fetchOffers])

  useEffect(() => {
    if (offers.length <= 1) return

    let interval: NodeJS.Timeout
    let progressInterval: NodeJS.Timeout

    if (!isHovered) {
      interval = setInterval(() => {
        setCurrentOfferIndex(prev => (prev + 1) % offers.length)
        setProgress(0)
      }, 6000)

      progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 16.66, 100))
      }, 100)
    }

    return () => {
      clearInterval(interval)
      clearInterval(progressInterval)
    }
  }, [offers.length, isHovered])

  const handleClose = useCallback(() => {
    setIsVisible(false)
    localStorage.setItem("offers_banner_closed", Date.now().toString())
  }, [])

  const copyCode = useCallback(() => {
    const code = offers[currentOfferIndex]?.discountCode
    if (!code) return
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [currentOfferIndex, offers])

  const nextOffer = useCallback(() => {
    setCurrentOfferIndex(prev => (prev + 1) % offers.length)
    setProgress(0)
  }, [offers.length])

  const prevOffer = useCallback(() => {
    setCurrentOfferIndex(prev => (prev - 1 + offers.length) % offers.length)
    setProgress(0)
  }, [offers.length])

  useEffect(() => {
    const closedTimestamp = localStorage.getItem("offers_banner_closed")
    if (closedTimestamp) {
      const closedTime = parseInt(closedTimestamp)
      if (Date.now() - closedTime < 24 * 60 * 60 * 1000) {
        setIsVisible(false)
      } else {
        localStorage.removeItem("offers_banner_closed")
      }
    }
  }, [])

  if (loading || !isVisible || offers.length === 0) {
    return null
  }

  const currentOffer = offers[currentOfferIndex]

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999]">
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        transition={{ type: "spring", damping: 20, stiffness: 300 }}
        className="bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 border-b border-gray-600 shadow-xl"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-center relative">
            {offers.length > 1 && (
              <>
                <button
                  onClick={prevOffer}
                  className="absolute left-0 p-2 text-gray-400 hover:text-white transition-all duration-200 hover:scale-110"
                  aria-label="Previous offer"
                >
                  <ChevronLeft className="h-5 w-5" strokeWidth={2.5} />
                </button>
                <button
                  onClick={nextOffer}
                  className="absolute right-0 p-2 text-gray-400 hover:text-white transition-all duration-200 hover:scale-110"
                  aria-label="Next offer"
                >
                  <ChevronRight className="h-5 w-5" strokeWidth={2.5} />
                </button>
              </>
            )}

            <div className="flex flex-col items-center text-center max-w-4xl mx-12">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentOffer._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="w-full"
                >
                  <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6">
                    <div className="flex flex-col items-center md:items-start text-center md:text-left">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Tag className="h-4 w-4 text-gray-300" strokeWidth={2} />
                        <span className="font-bold text-xs uppercase tracking-[0.2em] text-gray-300">
                          {currentOffer.title}
                        </span>
                      </div>

                      <p className="text-gray-100 text-sm md:text-base font-medium max-w-[500px]">
                        {currentOffer.description}
                      </p>
                    </div>

                    {currentOffer.discountCode && (
                      <div className="flex flex-col items-center">
                        <motion.div
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={copyCode}
                          className="group relative bg-gradient-to-r from-gray-200 to-gray-300 text-gray-900 px-4 py-2 rounded-lg font-bold tracking-wider cursor-pointer transition-all duration-200 flex items-center gap-2 shadow-md hover:shadow-lg"
                        >
                          <span className="font-mono tracking-tighter text-sm">
                            {currentOffer.discountCode}
                          </span>
                          {copied ? (
                            <Check className="h-4 w-4 text-gray-700" />
                          ) : (
                            <Copy className="h-4 w-4 opacity-80 group-hover:opacity-100 transition-opacity" />
                          )}
                        </motion.div>
                        {copied && (
                          <motion.span
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 5 }}
                            className="mt-1 text-xs text-gray-300 font-medium"
                          >
                            Copied to clipboard!
                          </motion.span>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            <button
              onClick={handleClose}
              className="absolute right-0 p-1 text-gray-400 hover:text-white transition-all duration-200 hover:scale-110"
              aria-label="Close banner"
            >
              <X className="h-5 w-5" strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {offers.length > 1 && (
          <div className="h-1.5 bg-gray-600 w-full">
            <motion.div
              className="h-full bg-gradient-to-r from-gray-300 to-gray-400"
              initial={{ width: "0%" }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>
        )}
      </motion.div>
    </div>
  )
}
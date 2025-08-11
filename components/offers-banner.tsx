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

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(code)
        .then(() => {
          setCopied(true)
          setTimeout(() => setCopied(false), 2000)
        })
        .catch(err => {
          console.error("Clipboard write failed:", err)
          fallbackCopy(code)
        })
    } else {
      fallbackCopy(code)
    }
  }, [currentOfferIndex, offers])

  const fallbackCopy = (text: string) => {
    try {
      const textarea = document.createElement("textarea")
      textarea.value = text
      textarea.style.position = "fixed"
      document.body.appendChild(textarea)
      textarea.focus()
      textarea.select()

      const successful = document.execCommand("copy")
      if (successful) {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } else {
        alert("Copy failed. Please copy manually.")
      }
      document.body.removeChild(textarea)
    } catch (err) {
      console.error("Fallback copy failed:", err)
      alert("Copy not supported on this browser.")
    }
  }

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
    <div className="relative w-full">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="container mx-auto px-4 py-1">
          <div className="flex items-center justify-center relative">
            {offers.length > 1 && (
              <>
                <button
                  onClick={prevOffer}
                  className="absolute left-0 p-1 text-gray-400 hover:text-white transition-all duration-200"
                  aria-label="Previous offer"
                >
                  <ChevronLeft className="h-4 w-4" strokeWidth={2.5} />
                </button>
                <button
                  onClick={nextOffer}
                  className="absolute right-0 p-1 text-gray-400 hover:text-white transition-all duration-200"
                  aria-label="Next offer"
                >
                  <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
                </button>
              </>
            )}

            <div className="flex items-center justify-center gap-4 max-w-4xl mx-8 w-full">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentOffer._id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className={`flex items-center w-full ${
                    currentOffer.discountCode ? "justify-between" : "justify-center"
                  }`}
                >
                  <div
                    className={`flex items-center gap-2 ${
                      !currentOffer.discountCode ? "text-center" : ""
                    }`}
                  >
                    <Tag className="h-4 w-4 text-gray-300 flex-shrink-0" strokeWidth={2} />
                    <div>
                      <span className="font-bold text-[11px] uppercase tracking-[0.15em] text-gray-300 block">
                        {currentOffer.title}
                      </span>
                      <p className="text-white text-xs md:text-sm font-medium">
                        {currentOffer.description}
                      </p>
                    </div>
                  </div>

                  {currentOffer.discountCode && (
                    <div className="flex items-center gap-2">
                      <motion.div
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={copyCode}
                        className="group relative bg-gradient-to-r from-gray-200 to-gray-300 text-gray-900 px-3 py-1 rounded-md font-bold tracking-wider cursor-pointer transition-all duration-200 flex items-center gap-1 shadow-md hover:shadow-lg"
                      >
                        <span className="font-mono tracking-tighter text-xs">
                          {currentOffer.discountCode}
                        </span>
                        {copied ? (
                          <Check className="h-3 w-3 text-gray-700" />
                        ) : (
                          <Copy className="h-3 w-3 opacity-80 group-hover:opacity-100 transition-opacity" />
                        )}
                      </motion.div>
                      {copied && (
                        <motion.span
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 5 }}
                          className="text-[10px] text-gray-300 font-medium"
                        >
                          Copied!
                        </motion.span>
                      )}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            <button
              onClick={handleClose}
              className="absolute right-0 p-1 text-gray-400 hover:text-white transition-all duration-200"
              aria-label="Close banner"
            >
              <X className="h-4 w-4" strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {offers.length > 1 && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-800">
            <motion.div
              className="h-full bg-white"
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

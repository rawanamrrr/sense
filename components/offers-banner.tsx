"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Tag, ChevronLeft, ChevronRight, Copy, Check, Sparkles } from "lucide-react"

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
  const [error, setError] = useState(false)

  const hasMounted = useRef(false)

  const fetchOffers = useCallback(async () => {
    try {
      setLoading(true)
      setError(false)
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
    } catch (err) {
      console.error("Error fetching offers:", err)
      setOffers([])
      setError(true)
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
      if (interval) clearInterval(interval)
      if (progressInterval) clearInterval(progressInterval)
    }
  }, [offers.length, isHovered])

  const handleClose = useCallback(() => {
    try {
      setIsVisible(false)
      localStorage.setItem("offers_banner_closed", Date.now().toString())
    } catch (err) {
      console.error("Error in handleClose:", err)
      setIsVisible(false)
    }
  }, [])

  const copyCode = useCallback(() => {
    try {
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
    } catch (err) {
      console.error("Error in copyCode:", err)
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
    try {
      setCurrentOfferIndex(prev => (prev + 1) % offers.length)
      setProgress(0)
    } catch (err) {
      console.error("Error in nextOffer:", err)
    }
  }, [offers.length])

  const prevOffer = useCallback(() => {
    try {
      setCurrentOfferIndex(prev => (prev - 1 + offers.length) % offers.length)
      setProgress(0)
    } catch (err) {
      console.error("Error in prevOffer:", err)
    }
  }, [offers.length])

  useEffect(() => {
    try {
      const closedTimestamp = localStorage.getItem("offers_banner_closed")
      if (closedTimestamp) {
        const closedTime = parseInt(closedTimestamp)
        if (Date.now() - closedTime < 24 * 60 * 60 * 1000) {
          setIsVisible(false)
        } else {
          localStorage.removeItem("offers_banner_closed")
        }
      }
    } catch (err) {
      console.error("Error checking localStorage:", err)
    }
  }, [])

  // Error boundary - if there's an error, don't render the component
  if (error) {
    return null
  }

  if (loading || !isVisible || offers.length === 0) {
    return null
  }

  const currentOffer = offers[currentOfferIndex]
  if (!currentOffer) {
    return null
  }

  return (
    <div className="relative w-full h-12">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full h-full relative overflow-hidden"
        onMouseEnter={() => {
          try {
            setIsHovered(true)
          } catch (err) {
            console.error("Error in onMouseEnter:", err)
          }
        }}
        onMouseLeave={() => {
          try {
            setIsHovered(false)
          } catch (err) {
            console.error("Error in onMouseLeave:", err)
          }
        }}
      >
        {/* Black background */}
        <div className="absolute inset-0 bg-black" />
        


        <div className="container mx-auto px-4 h-full relative z-20">
          <div className="flex items-center justify-center relative h-full">
            {offers.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    try {
                      e?.preventDefault?.()
                      prevOffer()
                    } catch (err) {
                      console.error("Error in prevOffer onClick:", err)
                      prevOffer()
                    }
                  }}
                  className="absolute left-0 p-1 text-purple-300 hover:text-white transition-all duration-200 h-full flex items-center"
                  aria-label="Previous offer"
                >
                  <ChevronLeft className="h-3 w-3" strokeWidth={2.5} />
                </button>
                <button
                  onClick={(e) => {
                    try {
                      e?.preventDefault?.()
                      nextOffer()
                    } catch (err) {
                      console.error("Error in nextOffer onClick:", err)
                      nextOffer()
                    }
                  }}
                  className="absolute right-0 p-1 text-purple-300 hover:text-white transition-all duration-200 h-full flex items-center"
                  aria-label="Next offer"
                >
                  <ChevronRight className="h-3 w-3" strokeWidth={2.5} />
                </button>
              </>
            )}

            <div className="flex items-center justify-center gap-4 max-w-4xl mx-8 w-full h-full">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentOffer._id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className={`flex items-center w-full h-full ${
                    currentOffer.discountCode ? "justify-between" : "justify-center"
                  }`}
                >
                  <div
                    className={`flex items-center gap-2 ${
                      !currentOffer.discountCode ? "text-center" : ""
                    }`}
                  >
                    <Tag className="h-4 w-4 text-purple-300 flex-shrink-0" strokeWidth={2} />
                    <div className="flex flex-col justify-center min-w-0 flex-1">
                      <span className="font-bold text-[10px] uppercase tracking-[0.15em] text-purple-200 leading-tight truncate">
                        {currentOffer.title}
                      </span>
                      <p className="text-white text-xs font-medium leading-tight truncate">
                        {currentOffer.description}
                      </p>
                    </div>
                  </div>

                  {currentOffer.discountCode && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <motion.div
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={(e) => {
                          try {
                            e?.preventDefault?.()
                            copyCode()
                          } catch (err) {
                            console.error("Error in copyCode onClick:", err)
                            copyCode()
                          }
                        }}
                        className="group relative bg-gradient-to-r from-purple-200 to-pink-200 text-purple-900 px-2 py-0.5 rounded-md font-bold tracking-wider cursor-pointer transition-all duration-200 flex items-center gap-1 shadow-md hover:shadow-lg"
                      >
                        <span className="font-mono tracking-tighter text-[10px]">
                          {currentOffer.discountCode}
                        </span>
                        {copied ? (
                          <Check className="h-3 w-3 text-purple-700" />
                        ) : (
                          <Copy className="h-3 w-3 opacity-80 group-hover:opacity-100 transition-opacity" />
                        )}
                      </motion.div>
                      {copied && (
                        <motion.span
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 5 }}
                          className="text-[9px] text-purple-200 font-medium"
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
              onClick={(e) => {
                try {
                  e?.preventDefault?.()
                  handleClose()
                } catch (err) {
                  console.error("Error in handleClose onClick:", err)
                  handleClose()
                }
              }}
              className="absolute right-0 p-1 text-purple-300 hover:text-white transition-all duration-200 h-full flex items-center"
              aria-label="Close banner"
            >
              <X className="h-3 w-3" strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {offers.length > 1 && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-900">
            <motion.div
              className="h-full bg-gradient-to-r from-purple-400 to-pink-400"
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

import { Navigation } from "@/components/navigation"
import ProductsClient from "./ProductsClient"

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
  longDescription: string
  images: string[]
  rating: number
  reviews: number
  category: "men" | "women" | "packages" | "outlet"
  sizes: ProductSize[]
  isActive: boolean
  isNew: boolean
  isBestseller: boolean
  // Gift package fields
  isGiftPackage?: boolean
  packagePrice?: number
  packageOriginalPrice?: number
  giftPackageSizes?: any[]
  notes?: {
    top: string[]
    middle: string[]
    base: string[]
  }
}

export default async function ProductsPage() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/products?limit=20`, {
      cache: 'no-store', // Ensure fresh data on each request
    })
    
    if (!res.ok) {
      throw new Error('Failed to fetch products')
    }
    
    const products: Product[] = await res.json()
    
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <Navigation />
        <ProductsClient initialProducts={products} />
      </div>
    )
  } catch (error) {
    console.error("Error fetching products:", error)
    
    // Fallback to empty products if fetch fails
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <Navigation />
        <ProductsClient initialProducts={[]} />
      </div>
    )
  }
}
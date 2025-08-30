import type { ObjectId } from "mongodb"

export interface User {
  _id?: ObjectId
  email: string
  password: string
  name: string
  role: "admin" | "user"
  favorites?: string[] // Array of product IDs
  createdAt: Date
  updatedAt: Date
}

export interface ProductSize {
  size: string
  volume: string
  originalPrice?: number
  discountedPrice?: number
}

export interface GiftPackageSize {
  size: string
  volume: string
  productOptions: {
    productId: string
    productName: string
    productImage: string
    productDescription: string
  }[]
}

export interface Product {
  _id?: ObjectId
  id: string
  name: string
  description: string
  longDescription?: string
  price?: number // For regular products
  beforeSalePrice?: number // original price before sale
  afterSalePrice?: number  // discounted price after sale
  sizes: ProductSize[] // For regular products
  giftPackageSizes?: GiftPackageSize[] // For gift packages
  packagePrice?: number // Single price for the entire gift package
  packageOriginalPrice?: number // Original price before discount for gift packages
  images: string[]
  rating: number
  reviews: number
  notes: { top: string[]; middle: string[]; base: string[] }
  category: "men" | "women" | "packages" | "outlet"
  isNew?: boolean
  isBestseller?: boolean
  isActive: boolean
  isGiftPackage?: boolean // Flag to identify gift packages
  createdAt: Date
  updatedAt: Date
}

export interface OrderItem {
  id: string
  name: string
  price: number
  size: string
  volume: string
  image: string
  category: string
  quantity: number
  // Gift package fields
  isGiftPackage?: boolean
  selectedProducts?: Array<{
    size: string
    volume: string
    selectedProduct: {
      productId: string
      productName: string
      productImage: string
      productDescription: string
    }
  }>
  packageDetails?: {
    totalSizes: number
    packagePrice: number
    sizes: Array<{
      size: string
      volume: string
      selectedProduct: {
        productId: string
        productName: string
        productImage: string
        productDescription: string
      }
    }>
  }
}

export interface Order {
  _id?: ObjectId
  id: string
  userId: string
  items: OrderItem[]
  total: number
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled"
  shippingAddress: {
    name: string
    email: string
    phone: string
    secondaryPhone: string
    address: string
    city: string
    governorate: string
    postalCode: string
  }
  paymentMethod: "cod" | "visa" | "mastercard"
  paymentDetails?: {
    cardNumber: string
    cardName: string
  }
  discountCode?: string | null
  discountAmount?: number
  createdAt: Date
  updatedAt: Date
}

export interface CartItem {
  id: string
  name: string
  price: number
  size: string
  volume: string
  image: string
  category: string
  quantity: number
}

import { type NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import type { Product } from "@/lib/models/types"

type CachedProductsEntry = {
  status: number
  body: string
  headers: Record<string, string>
  expiresAt: number
}

const LIST_CACHE_TTL_MS = Number(process.env.PRODUCTS_CACHE_TTL_MS ?? 60_000)
const DETAIL_CACHE_TTL_MS = Number(process.env.PRODUCT_DETAIL_CACHE_TTL_MS ?? 300_000)

const globalForProducts = globalThis as typeof globalThis & {
  _productsCache?: Map<string, CachedProductsEntry>
}

const productsCache = globalForProducts._productsCache ?? new Map<string, CachedProductsEntry>()
if (!globalForProducts._productsCache) {
  globalForProducts._productsCache = productsCache
}

const buildCacheKey = (url: URL) => {
  const params = Array.from(url.searchParams.entries())
    .sort(([a, aVal], [b, bVal]) => {
      const nameCompare = a.localeCompare(b)
      return nameCompare !== 0 ? nameCompare : aVal.localeCompare(bVal)
    })
    .map(([key, value]) => `${key}=${value}`)
    .join("&")

  return params ? `${url.pathname}?${params}` : url.pathname
}

const getCachedResponse = (url: URL) => {
  const cacheKey = buildCacheKey(url)
  const entry = productsCache.get(cacheKey)
  if (!entry) return null

  if (Date.now() > entry.expiresAt) {
    productsCache.delete(cacheKey)
    return null
  }

  return new NextResponse(entry.body, {
    status: entry.status,
    headers: entry.headers,
  })
}

const setCachedResponse = (
  url: URL,
  status: number,
  body: string,
  headers: Record<string, string>,
  ttl: number,
) => {
  const cacheKey = buildCacheKey(url)
  productsCache.set(cacheKey, {
    status,
    body,
    headers,
    expiresAt: Date.now() + Math.max(ttl, 1_000),
  })
}

const clearProductsCache = () => {
  if (productsCache.size > 0) {
    productsCache.clear()
  }
}

// Configure the API route to handle larger payloads
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '25mb',
    },
  },
}

// Ensure this route runs on Node.js runtime (larger body size than Edge)
export const runtime = "nodejs"

// Helper function for error responses
const errorResponse = (message: string, status: number) => {
  return NextResponse.json(
    { 
      error: message, 
      timestamp: new Date().toISOString() 
    },
    { status }
  )
}

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  console.log("🔍 [API] GET /api/products - Request received")

  try {
    const { searchParams } = new URL(request.url)
    const requestUrl = new URL(request.url)

    const cachedResponse = getCachedResponse(requestUrl)
    if (cachedResponse) {
      console.log(`⚡ [API] GET /api/products - Cache hit in ${Date.now() - startTime}ms`)
      return cachedResponse
    }
    const id = searchParams.get("id")
    const category = searchParams.get("category")
    const isBestsellerParam = searchParams.get("isBestseller")
    const isNewParam = searchParams.get("isNew")
    const isGiftPackageParam = searchParams.get("isGiftPackage")
    const hasPagination = searchParams.has("page") || searchParams.has("limit")
    const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1)
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "20", 10), 1), 1000)
    const skip = (page - 1) * limit

    const db = await getDatabase()

    // Single product request
    if (id) {
      let product: Product | null = null
      
      // Try by MongoDB ObjectId first
      if (ObjectId.isValid(id)) {
        product = await db.collection<Product>("products").findOne({ _id: new ObjectId(id) })
      }
      
      // Fallback to custom ID
      if (!product) {
        product = await db.collection<Product>("products").findOne({ id: id })
      }

      if (!product) {
        return errorResponse("Product not found", 404)
      }

      const headers = {
        "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
        "Content-Type": "application/json",
      }
      const body = JSON.stringify(product)
      setCachedResponse(requestUrl, 200, body, headers, DETAIL_CACHE_TTL_MS)
      return new NextResponse(body, { status: 200, headers })
    }

    // Category listing
    const query: any = { isActive: true }
    if (category) {
      query.category = category
    }
    if (isBestsellerParam !== null) {
      query.isBestseller = isBestsellerParam === 'true'
    }
    if (isNewParam !== null) {
      query.isNew = isNewParam === 'true'
    }
    if (isGiftPackageParam !== null) {
      query.isGiftPackage = isGiftPackageParam === 'true'
    }

    const projection = {
      longDescription: 0,
      notes: 0,
      // keep only first image to shrink payload
      images: { $slice: 1 } as any,
    }

    const productsCol = db.collection<Product>("products")

    if (hasPagination) {
      const [products, total] = await Promise.all([
        productsCol
          .find(query, { projection })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .toArray(),
        productsCol.countDocuments(query),
      ])

      const totalPages = Math.max(Math.ceil(total / limit), 1)
      console.log(`⏱️ [API] Request completed in ${Date.now() - startTime}ms (page=${page}, limit=${limit}, total=${total})`)
      const headers = {
        "Content-Type": "application/json",
        "X-Total-Count": String(total),
        "X-Page": String(page),
        "X-Limit": String(limit),
        "X-Total-Pages": String(totalPages),
        "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
      }
      const body = JSON.stringify(products)
      setCachedResponse(requestUrl, 200, body, headers, LIST_CACHE_TTL_MS)
      return new NextResponse(body, { status: 200, headers })
    } else {
      const products = await productsCol
        .find(query, { projection })
        .sort({ createdAt: -1 })
        .toArray()

      console.log(`⏱️ [API] Request completed in ${Date.now() - startTime}ms (all=${products.length})`)
      const headers = {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
      }
      const body = JSON.stringify(products)
      setCachedResponse(requestUrl, 200, body, headers, LIST_CACHE_TTL_MS)
      return new NextResponse(body, { status: 200, headers })
    }

  } catch (error) {
    console.error("❌ [API] Error in GET /api/products:", error)
    return errorResponse(
      error instanceof Error ? error.message : "Internal server error",
      500
    )
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  console.log("🔍 [API] POST /api/products - Request received")

  try {
    // Increase body size limit to handle multiple base64 images
    ;(request as unknown as { [k: string]: unknown })["__NEXT_PRIVATE_BODY_SIZE_LIMIT"] = "25mb"
    // Authentication check
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return errorResponse("Authorization required", 401)
    }

    let decoded: any
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!)
    } catch (jwtError) {
      return errorResponse("Invalid token", 401)
    }

    if (decoded.role !== "admin") {
      return errorResponse("Admin access required", 403)
    }

    // Parse and validate data
    const productData = await request.json()
    const db = await getDatabase()

    // Generate unique product ID
    const productId = `product-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Create product document based on category
    let newProduct: Omit<Product, "_id">

    if (productData.category === "packages") {
      // Gift package
      newProduct = {
        id: productId,
        name: productData.name,
        description: productData.description,
        longDescription: productData.longDescription || "",
        sizes: [], // Empty for gift packages
        giftPackageSizes: productData.giftPackageSizes?.map((size: any) => ({
          size: size.size,
          volume: size.volume,
          productOptions: size.productOptions?.map((option: any) => ({
            productId: option.productId,
            productName: option.productName,
            productImage: option.productImage,
            productDescription: option.productDescription,
          })) || [],
        })) || [],
        packagePrice: productData.packagePrice ? Number(productData.packagePrice) : 0,
        packageOriginalPrice: productData.packageOriginalPrice ? Number(productData.packageOriginalPrice) : undefined,
        images: productData.images || ["/placeholder.svg"],
        rating: 0,
        reviews: 0,
        notes: {
          top: productData.notes?.top || [],
          middle: productData.notes?.middle || [],
          base: productData.notes?.base || [],
        },
        category: productData.category,
        isNew: productData.isNew ?? false,
        isBestseller: productData.isBestseller ?? false,
        isActive: productData.isActive ?? true,
        isGiftPackage: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        price: productData.packagePrice ? Number(productData.packagePrice) : 0,
        beforeSalePrice: undefined,
        afterSalePrice: undefined,
      }
    } else {
      // Regular product
      newProduct = {
        id: productId,
        name: productData.name,
        description: productData.description,
        longDescription: productData.longDescription || "",
        sizes: productData.sizes?.map((size: any) => ({
          size: size.size,
          volume: size.volume,
          originalPrice: size.originalPrice ? Number(size.originalPrice) : undefined,
          discountedPrice: size.discountedPrice ? Number(size.discountedPrice) : undefined,
        })) || [],
        images: productData.images || ["/placeholder.svg"],
        rating: 0,
        reviews: 0,
        notes: {
          top: productData.notes?.top || [],
          middle: productData.notes?.middle || [],
          base: productData.notes?.base || [],
        },
        category: productData.category,
        isNew: productData.isNew ?? false,
        isBestseller: productData.isBestseller ?? false,
        isActive: productData.isActive ?? true,
        isGiftPackage: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        price: productData.sizes && productData.sizes.length > 0 
          ? Math.min(...productData.sizes.map((size: any) => 
              size.discountedPrice ? Number(size.discountedPrice) : Number(size.originalPrice)
            ))
          : 0,
        beforeSalePrice: productData.beforeSalePrice !== undefined && productData.beforeSalePrice !== "" ? Number(productData.beforeSalePrice) : undefined,
        afterSalePrice: productData.afterSalePrice !== undefined && productData.afterSalePrice !== "" ? Number(productData.afterSalePrice) : undefined,
      }
    }

    // Insert into database
    const result = await db.collection<Product>("products").insertOne(newProduct)
    clearProductsCache()

    console.log(`⏱️ [API] Product created in ${Date.now() - startTime}ms`)
    return NextResponse.json({
      success: true,
      product: {
        _id: result.insertedId,
        ...newProduct,
      },
      message: "Product created successfully",
    })

  } catch (error) {
    console.error("❌ [API] Error in POST /api/products:", error)
    return errorResponse(
      error instanceof Error ? error.message : "Internal server error",
      500
    )
  }
}

export async function PUT(request: NextRequest) {
  const startTime = Date.now()
  console.log("🔍 [API] PUT /api/products - Request received")

  try {
    // Increase body size limit to handle multiple base64 images
    ;(request as unknown as { [k: string]: unknown })["__NEXT_PRIVATE_BODY_SIZE_LIMIT"] = "25mb"
    // Authentication check
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return errorResponse("Authorization required", 401)
    }

    let decoded: any
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!)
    } catch (jwtError) {
      return errorResponse("Invalid token", 401)
    }

    if (decoded.role !== "admin") {
      return errorResponse("Admin access required", 403)
    }

    // Get ID and data
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) {
      return errorResponse("Product ID is required", 400)
    }

    const productData = await request.json()
    const db = await getDatabase()

    // Prepare update based on category
    let updateData: any

    if (productData.category === "packages") {
      // Gift package update
      updateData = {
        name: productData.name,
        description: productData.description,
        longDescription: productData.longDescription || "",
        category: productData.category,
        sizes: [], // Empty for gift packages
        giftPackageSizes: productData.giftPackageSizes?.map((size: any) => ({
          size: size.size,
          volume: size.volume,
          productOptions: size.productOptions?.map((option: any) => ({
            productId: option.productId,
            productName: option.productName,
            productImage: option.productImage,
            productDescription: option.productDescription,
          })) || [],
        })) || [],
        packagePrice: productData.packagePrice ? Number(productData.packagePrice) : 0,
        packageOriginalPrice: productData.packageOriginalPrice ? Number(productData.packageOriginalPrice) : undefined,
        images: productData.images,
        notes: productData.notes,
        isActive: productData.isActive,
        isNew: productData.isNew,
        isBestseller: productData.isBestseller,
        isGiftPackage: true,
        updatedAt: new Date(),
        price: productData.packagePrice ? Number(productData.packagePrice) : 0,
        beforeSalePrice: undefined,
        afterSalePrice: undefined,
      }
    } else {
      // Regular product update
      updateData = {
        name: productData.name,
        description: productData.description,
        longDescription: productData.longDescription || "",
        category: productData.category,
        sizes: productData.sizes?.map((size: any) => ({
          size: size.size,
          volume: size.volume,
          originalPrice: size.originalPrice ? Number(size.originalPrice) : undefined,
          discountedPrice: size.discountedPrice ? Number(size.discountedPrice) : undefined,
        })) || [],
        images: productData.images,
        notes: productData.notes,
        isActive: productData.isActive,
        isNew: productData.isNew,
        isBestseller: productData.isBestseller,
        isGiftPackage: false,
        updatedAt: new Date(),
        price: productData.sizes && productData.sizes.length > 0
          ? Math.min(...productData.sizes.map((size: any) => 
              size.discountedPrice ? Number(size.discountedPrice) : Number(size.originalPrice)
            ))
          : 0,
        beforeSalePrice: productData.beforeSalePrice !== undefined && productData.beforeSalePrice !== "" ? Number(productData.beforeSalePrice) : undefined,
        afterSalePrice: productData.afterSalePrice !== undefined && productData.afterSalePrice !== "" ? Number(productData.afterSalePrice) : undefined,
      }
    }

    // Perform update
    let result
    if (ObjectId.isValid(id)) {
      result = await db.collection("products").updateOne(
        { _id: new ObjectId(id) },
        { $set: updateData }
      )
    } else {
      result = await db.collection("products").updateOne(
        { id: id },
        { $set: updateData }
      )
    }

    if (result.matchedCount === 0) {
      return errorResponse("Product not found", 404)
    }

    // Fetch the updated product to return
    const updatedProduct = await db.collection<Product>("products").findOne(
      ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { id: id }
    )

    if (!updatedProduct) {
      return errorResponse("Product not found after update", 404)
    }

    clearProductsCache()
    console.log(`⏱️ [API] Product updated in ${Date.now() - startTime}ms`)
    return NextResponse.json({ 
      success: true,
      product: updatedProduct,
      message: "Product updated successfully"
    })

  } catch (error) {
    console.error("❌ [API] Error in PUT /api/products:", error)
    return errorResponse(
      error instanceof Error ? error.message : "Internal server error",
      500
    )
  }
}

export async function DELETE(request: NextRequest) {
  const startTime = Date.now()
  console.log("🔍 [API] DELETE /api/products - Request received")

  try {
    // Authentication check
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return errorResponse("Authorization required", 401)
    }

    let decoded: any
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!)
    } catch (jwtError) {
      return errorResponse("Invalid token", 401)
    }

    if (decoded.role !== "admin") {
      return errorResponse("Admin access required", 403)
    }

    // Get ID
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) {
      return errorResponse("Product ID is required", 400)
    }

    const db = await getDatabase()
    let result

    // Try by ObjectId first
    if (ObjectId.isValid(id)) {
      result = await db.collection("products").deleteOne({ _id: new ObjectId(id) })
    } else {
      // Fallback to custom ID
      result = await db.collection("products").deleteOne({ id: id })
    }

    if (result.deletedCount === 0) {
      return errorResponse("Product not found", 404)
    }

    clearProductsCache()
    console.log(`⏱️ [API] Product deleted in ${Date.now() - startTime}ms`)
    return NextResponse.json({
      success: true,
      message: "Product deleted successfully",
      deletedId: id
    })

  } catch (error) {
    console.error("❌ [API] Error in DELETE /api/products:", error)
    return errorResponse(
      error instanceof Error ? error.message : "Internal server error",
      500
    )
  }
}
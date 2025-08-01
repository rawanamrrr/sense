import { type NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { getDatabase } from "@/lib/mongodb"
import type { Product } from "@/lib/models/types"

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  console.log("🔍 [API] GET /api/products - Request received")

  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")

    console.log("📝 [API] Query parameters:", { category })

    const db = await getDatabase()
    console.log("✅ [API] Database connection established")

    // Build query
    const query: any = { isActive: true }
    if (category) {
      query.category = category
    }

    console.log("🔍 [API] MongoDB query:", JSON.stringify(query))

    // Execute query with detailed logging
    const products = await db.collection<Product>("products").find(query).sort({ createdAt: -1 }).toArray()

    console.log(`✅ [API] Found ${products.length} products`)
    console.log("📊 [API] Products by category:")

    const categoryCount = products.reduce(
      (acc, product) => {
        acc[product.category] = (acc[product.category] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    console.log("   Category breakdown:", categoryCount)

    // Log first few products for debugging
    if (products.length > 0) {
      console.log("🧴 [API] Sample products:")
      products.slice(0, 2).forEach((product, index) => {
        console.log(`   ${index + 1}. ${product.name} (${product.category}) - $${product.price}`)
      })
    }

    const responseTime = Date.now() - startTime
    console.log(`⏱️ [API] Request completed in ${responseTime}ms`)

    return NextResponse.json(products)
  } catch (error) {
    const responseTime = Date.now() - startTime
    console.error("❌ [API] Error in GET /api/products:", error)
    console.error("🔍 [API] Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      responseTime: `${responseTime}ms`,
    })

    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  console.log("🔍 [API] POST /api/products - Request received")

  try {
    // Check authentication
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    console.log("🔐 [API] Token present:", !!token)

    if (!token) {
      console.log("❌ [API] No authorization token provided")
      return NextResponse.json({ error: "Authorization required" }, { status: 401 })
    }

    let decoded: any
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!)
      console.log("✅ [API] Token verified for user:", decoded.email, "Role:", decoded.role)
    } catch (jwtError) {
      console.error("❌ [API] JWT verification failed:", jwtError)
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    if (decoded.role !== "admin") {
      console.log("❌ [API] Access denied - user is not admin")
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    // Parse request body
    const productData = await request.json()
    console.log("📝 [API] Product data received:")
    console.log("   Name:", productData.name)
    console.log("   Category:", productData.category)
    console.log("   Price:", productData.price)
    console.log("   Images count:", productData.images?.length || 0)
    console.log("   Sizes count:", productData.sizes?.length || 0)

    const db = await getDatabase()
    console.log("✅ [API] Database connection established")

    // Generate unique product ID
    const productId = `product-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    console.log("🆔 [API] Generated product ID:", productId)

    // Prepare product document
    const newProduct: Omit<Product, "_id"> = {
      id: productId,
      name: productData.name,
      description: productData.description,
      longDescription: productData.longDescription,
      price: Number(productData.price),
      sizes: productData.sizes.map((size: any) => ({
        size: size.size,
        volume: size.volume,
        price: Number(size.price),
      })),
      images: productData.images || ["/placeholder.svg?height=600&width=400"],
      rating: 0,
      reviews: 0,
      notes: {
        top: productData.notes?.top || [],
        middle: productData.notes?.middle || [],
        base: productData.notes?.base || [],
      },
      category: productData.category,
      isNew: true,
      isBestseller: false,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    console.log("💾 [API] Inserting product into database...")
    console.log("📄 [API] Product document:", JSON.stringify(newProduct, null, 2))

    const result = await db.collection<Product>("products").insertOne(newProduct)
    console.log("✅ [API] Product inserted with MongoDB ID:", result.insertedId)

    // Verify insertion
    const insertedProduct = await db.collection<Product>("products").findOne({ _id: result.insertedId })
    console.log("🔍 [API] Verification - Product found in database:", !!insertedProduct)

    if (insertedProduct) {
      console.log("✅ [API] Product verification successful:")
      console.log("   Database ID:", insertedProduct._id)
      console.log("   Product ID:", insertedProduct.id)
      console.log("   Name:", insertedProduct.name)
      console.log("   Category:", insertedProduct.category)
      console.log("   Active:", insertedProduct.isActive)
    }

    // Check total products after insertion
    const totalProducts = await db.collection("products").countDocuments()
    const activeProducts = await db.collection("products").countDocuments({ isActive: true })
    console.log("📊 [API] Database stats after insertion:")
    console.log("   Total products:", totalProducts)
    console.log("   Active products:", activeProducts)

    const responseTime = Date.now() - startTime
    console.log(`⏱️ [API] Product creation completed in ${responseTime}ms`)

    return NextResponse.json({
      success: true,
      product: {
        _id: result.insertedId,
        ...newProduct,
      },
      message: "Product created successfully",
    })
  } catch (error) {
    const responseTime = Date.now() - startTime
    console.error("❌ [API] Error in POST /api/products:", error)
    console.error("🔍 [API] Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      responseTime: `${responseTime}ms`,
    })

    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

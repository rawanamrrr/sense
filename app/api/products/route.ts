import { type NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import type { Product } from "@/lib/models/types"

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
    const id = searchParams.get("id")
    const category = searchParams.get("category")

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

      return NextResponse.json(product)
    }

    // Category listing
    const query: any = { isActive: true }
    if (category) {
      query.category = category
    }

    const products = await db.collection<Product>("products")
      .find(query)
      .sort({ createdAt: -1 })
      .toArray()

    console.log(`⏱️ [API] Request completed in ${Date.now() - startTime}ms`)
    return NextResponse.json(products)

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

    // Create product document
    const newProduct: Omit<Product, "_id"> = {
      id: productId,
      name: productData.name,
      description: productData.description,
      sizes: productData.sizes.map((size: any) => ({
        size: size.size,
        volume: size.volume,
        originalPrice: size.originalPrice ? Number(size.originalPrice) : undefined,
        discountedPrice: size.discountedPrice ? Number(size.discountedPrice) : undefined,
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
      isNew: productData.isNew ?? false,
      isBestseller: productData.isBestseller ?? false,
      isActive: productData.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
      price: productData.sizes.length > 0 
        ? Math.min(...productData.sizes.map((size: any) => 
            size.discountedPrice ? Number(size.discountedPrice) : Number(size.originalPrice)
          ))
        : 0,
      beforeSalePrice: productData.beforeSalePrice !== undefined && productData.beforeSalePrice !== "" ? Number(productData.beforeSalePrice) : undefined,
      afterSalePrice: productData.afterSalePrice !== undefined && productData.afterSalePrice !== "" ? Number(productData.afterSalePrice) : undefined,
    }

    // Insert into database
    const result = await db.collection<Product>("products").insertOne(newProduct)

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

    // Prepare update
    const updateData = {
      name: productData.name,
      description: productData.description,
      category: productData.category,
      sizes: productData.sizes.map((size: any) => ({
        size: size.size,
        volume: size.volume,
        originalPrice: size.originalPrice ? Number(size.originalPrice) : undefined,
        discountedPrice: size.discountedPrice ? Number(size.discountedPrice) : undefined,
      })),
      images: productData.images,
      notes: productData.notes,
      isActive: productData.isActive,
      isNew: productData.isNew,
      isBestseller: productData.isBestseller,
      updatedAt: new Date(),
      price: productData.sizes.length > 0
        ? Math.min(...productData.sizes.map((size: any) => 
            size.discountedPrice ? Number(size.discountedPrice) : Number(size.originalPrice)
          ))
        : 0,
      beforeSalePrice: productData.beforeSalePrice !== undefined && productData.beforeSalePrice !== "" ? Number(productData.beforeSalePrice) : undefined,
      afterSalePrice: productData.afterSalePrice !== undefined && productData.afterSalePrice !== "" ? Number(productData.afterSalePrice) : undefined,
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
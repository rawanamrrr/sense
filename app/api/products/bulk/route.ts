import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import jwt from "jsonwebtoken"
import { ObjectId } from "mongodb"
import type { Product } from "@/lib/models/types"

// Increase the maximum request body size (default is 4.5MB)
export const maxDuration = 300 // 5 minutes
export const dynamic = 'force-dynamic' // Ensure dynamic route handling

export async function POST(request: Request) {
  const startTime = Date.now()
  console.log("🔍 [API] POST /api/products/bulk - Request received")

  try {
    // Authentication check
    const authHeader = request.headers.get("authorization")
    if (!authHeader) {
      return NextResponse.json(
        { error: "Authorization header is required" },
        { status: 401 }
      )
    }

    const token = authHeader.replace("Bearer ", "")
    let decoded: any

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!)
    } catch (jwtError) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      )
    }

    if (decoded.role !== "admin") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      )
    }

    // Parse request body
    const products = await request.json()
    
    if (!Array.isArray(products) || products.length === 0) {
      return NextResponse.json(
        { error: "Expected an array of products" },
        { status: 400 }
      )
    }

    // Basic validation
    const invalidProduct = products.find(p => !p.name || !p.category)
    if (invalidProduct) {
      return NextResponse.json(
        { 
          error: "Invalid product data",
          details: `Product missing required fields: ${JSON.stringify(invalidProduct)}`
        },
        { status: 400 }
      )
    }

    const db = await getDatabase()
    const productsCollection = db.collection<Product>("products")

    // Prepare bulk operations
    const bulkOps = products.map(productData => {
      const productId = `product-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      
      // Format the product data according to your schema
      const newProduct: Omit<Product, "_id"> = {
        id: productId,
        name: productData.name,
        description: productData.description || "",
        longDescription: productData.longDescription || "",
        sizes: productData.sizes?.map((size: any) => ({
          size: size.size,
          volume: size.volume || "",
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
        isNew: productData.isNew || false,
        isBestseller: productData.isBestseller || false,
        isActive: productData.isActive !== undefined ? productData.isActive : true,
        isGiftPackage: productData.isGiftPackage || false,
        createdAt: new Date(),
        updatedAt: new Date(),
        price: productData.price || 0,
        beforeSalePrice: productData.beforeSalePrice,
        afterSalePrice: productData.afterSalePrice,
      }

      return {
        insertOne: {
          document: newProduct
        }
      }
    })

    // Execute bulk write with error handling
    let result
    try {
      result = await productsCollection.bulkWrite(bulkOps, { ordered: false })
    } catch (bulkError: any) {
      console.error("Bulk write error:", bulkError)
      
      // Check for duplicate key errors
      if (bulkError.code === 11000) {
        return NextResponse.json(
          { 
            error: "Duplicate product detected",
            details: bulkError.message
          },
          { status: 400 }
        )
      }
      
      throw bulkError
    }

    console.log(`✅ [API] Bulk insert completed in ${Date.now() - startTime}ms`)
    
    return NextResponse.json({
      success: true,
      insertedCount: result.insertedCount,
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
      upsertedCount: result.upsertedCount,
      message: `Successfully processed ${products.length} products`
    })

  } catch (error) {
    console.error("❌ [API] Error in bulk upload:", error)
    return NextResponse.json(
      { 
        error: "Failed to process bulk upload",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}

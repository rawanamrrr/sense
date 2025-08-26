import { NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validate product ID
    if (!params.id || params.id === "undefined") {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      )
    }

    const db = await getDatabase()
    const { searchParams } = new URL(req.url)
    const orderId = searchParams.get("orderId")

    // The params.id is already the base product ID from the product page
    const baseProductId = params.id

    console.log("Base product ID from params:", baseProductId)

    // Build query to find reviews for this specific product
    let query: any = { productId: baseProductId }
    if (orderId) {
      query.orderId = orderId
    }
    
    console.log("Searching for reviews with query:", query)

    let reviews = await db
      .collection("reviews")
      .find(query)
      .sort({ createdAt: -1 })
      .toArray()

    console.log(`Found ${reviews.length} reviews with exact base ID`)

    // If no reviews found with base ID, try to find reviews with variations (size suffixes)
    if (reviews.length === 0) {
      // Create a regex pattern to match the base ID with any size suffix
      const escapedBaseId = baseProductId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const productIdPattern = new RegExp(`^${escapedBaseId}(-[a-zA-Z0-9]+)+$`)
      
      query = { productId: { $regex: productIdPattern } }
      if (orderId) {
        query.orderId = orderId
      }
      
      console.log("Searching for variations with pattern:", productIdPattern.toString())

      reviews = await db
        .collection("reviews")
        .find(query)
        .sort({ createdAt: -1 })
        .toArray()

      console.log(`Found ${reviews.length} reviews with variations`)
    }

    // Debug: Log the actual reviews found
    console.log("Final reviews found for product", baseProductId, ":", reviews.map(r => ({ 
      productId: r.productId, 
      rating: r.rating, 
      comment: r.comment.substring(0, 50) 
    })))
    
    // Debug: Check all reviews to see what productIds exist
    const allReviewsDebug = await db.collection("reviews").find({}).toArray()
    console.log("All productIds in reviews collection:", [...new Set(allReviewsDebug.map(r => r.productId))])

    // Convert MongoDB ObjectId to string for JSON serialization
    const serializedReviews = reviews.map(review => ({
      _id: review._id?.toString(),
      productId: review.productId,
      userId: review.userId,
      userName: review.userName,
      rating: review.rating,
      comment: review.comment,
      orderId: review.orderId,
      createdAt: review.createdAt.toISOString(),
      updatedAt: review.updatedAt?.toISOString()
    }))

    return NextResponse.json({ reviews: serializedReviews })
  } catch (error) {
    console.error("Error fetching reviews:", error)
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    )
  }
}


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

    // ALWAYS search for reviews with variations (size suffixes) to ensure we get ALL reviews
    // Create a regex pattern to match the base ID with any size suffix (but not the exact base ID to avoid duplicates)
    const escapedBaseId = baseProductId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const productIdPattern = new RegExp(`^${escapedBaseId}-[a-zA-Z0-9]+$`)
    
    query = { productId: { $regex: productIdPattern } }
    if (orderId) {
      query.orderId = orderId
    }
    
    console.log("Searching for variations with pattern:", productIdPattern.toString())

    const variationReviews = await db
      .collection("reviews")
      .find(query)
      .sort({ createdAt: -1 })
      .toArray()

    console.log(`Found ${variationReviews.length} reviews with variations (excluding base ID)`)

    // NEW: Search for reviews where originalProductId matches the base product ID
    // This handles cases where users reviewed customized gift products
    query = { originalProductId: { $regex: new RegExp(`^${escapedBaseId}`, 'i') } }
    if (orderId) {
      query.orderId = orderId
    }
    
    console.log("Searching for reviews with originalProductId matching base ID")

    const originalProductIdReviews = await db
      .collection("reviews")
      .find(query)
      .sort({ createdAt: -1 })
      .toArray()

    console.log(`Found ${originalProductIdReviews.length} reviews with matching originalProductId`)

    // NEW: Also search for reviews where productId contains the base product ID as a substring
    // This handles cases where the review was for a different variation of the same product
    query = { productId: { $regex: new RegExp(escapedBaseId, 'i') } }
    if (orderId) {
      query.orderId = orderId
    }
    
    console.log("Searching for reviews with productId containing base ID as substring")

    const substringReviews = await db
      .collection("reviews")
      .find(query)
      .sort({ createdAt: -1 })
      .toArray()

    console.log(`Found ${substringReviews.length} reviews with productId containing base ID as substring`)

    // Combine all sets of reviews and remove duplicates based on _id
    const allReviews = [...reviews, ...variationReviews, ...originalProductIdReviews, ...substringReviews]
    const uniqueReviews = allReviews.filter((review, index, self) => 
      index === self.findIndex(r => r._id.toString() === review._id.toString())
    )

    console.log(`Combined ${allReviews.length} total reviews, ${uniqueReviews.length} unique reviews`)

    // Debug: Log the actual reviews found
    console.log("Final reviews found for product", baseProductId, ":", uniqueReviews.map(r => ({ 
      productId: r.productId, 
      originalProductId: r.originalProductId,
      rating: r.rating, 
      comment: r.comment.substring(0, 50) 
    })))
    
    // Debug: Check all reviews to see what productIds exist
    const allReviewsDebug = await db.collection("reviews").find({}).toArray()
    console.log("All productIds in reviews collection:", [...new Set(allReviewsDebug.map(r => r.productId))])
    console.log("All originalProductIds in reviews collection:", [...new Set(allReviewsDebug.map(r => r.originalProductId).filter(Boolean))])

    // Convert MongoDB ObjectId to string for JSON serialization
    const serializedReviews = uniqueReviews.map(review => ({
      _id: review._id?.toString(),
      productId: review.productId,
      originalProductId: review.originalProductId,
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


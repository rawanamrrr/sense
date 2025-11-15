import { type NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { getDatabase } from "@/lib/mongodb"
import type { ObjectId } from "mongodb"

interface Review {
  _id?: ObjectId
  productId: string
  originalProductId?: string
  userId: string
  userName: string
  rating: number
  comment: string
  orderId: string
  createdAt: Date
  updatedAt?: Date
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "Authorization required" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    const { productId, rating, comment, orderId } = await request.json()

    if (!productId || !rating) {
      return NextResponse.json({ error: "Product ID and rating are required" }, { status: 400 })
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 })
    }

    const db = await getDatabase()

    // EXTRACT BASE PRODUCT ID (remove size suffix like -bundle, -Travel, -Reguler, etc.)
    const baseProductId = productId.replace(/-[a-zA-Z0-9]+$/, '');
    console.log("Original productId:", productId, "Base productId:", baseProductId);

    // Check if user already reviewed this product
    const existingReview = await db.collection<Review>("reviews").findOne({
      productId: baseProductId,
      userId: decoded.userId,
    })

    if (existingReview) {
      return NextResponse.json({ 
        error: "You have already reviewed this product" 
      }, { status: 400 })
    }

    const review: Review = {
      productId: baseProductId, // Use base product ID without size suffix
      userId: decoded.userId,
      userName: decoded.name || decoded.email,
      rating: Number(rating),
      comment: comment?.trim() || "",
      orderId: orderId || `review-${Date.now()}`,
      createdAt: new Date(),
    }

    const result = await db.collection<Review>("reviews").insertOne(review)

    // Update product rating
    // Get reviews where productId matches the base product ID
    const directReviews = await db.collection<Review>("reviews").find({ productId: baseProductId }).toArray()
    
    // Get reviews where originalProductId matches the base product ID (for customized gift products)
    const originalProductIdReviews = await db.collection<Review>("reviews")
      .find({ originalProductId: { $regex: new RegExp(`^${baseProductId}`, 'i') } })
      .toArray()
    
    // Combine both sets of reviews and remove duplicates based on _id
    const allReviews = [...directReviews, ...originalProductIdReviews]
    const uniqueReviews = allReviews.filter((review, index, self) => 
      index === self.findIndex(r => r._id.toString() === review._id.toString())
    )
    
    const averageRating = uniqueReviews.reduce((sum, r) => sum + r.rating, 0) / uniqueReviews.length
    const reviewCount = uniqueReviews.length

    await db.collection("products").updateOne(
      { id: baseProductId },
      {
        $set: {
          rating: Math.round(averageRating * 100) / 100,
          reviews: reviewCount,
        },
      },
    )

    return NextResponse.json({
      success: true,
      review: { 
        ...review, 
        _id: result.insertedId.toString()
      },
    })
  } catch (error: any) {
    console.error("Create review error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get("productId")
    const userId = searchParams.get("userId")

    console.log("GET /api/reviews called with:", { productId, userId })

    if (!productId && !userId) {
      return NextResponse.json({ error: "Product ID or User ID required" }, { status: 400 })
    }

    const db = await getDatabase()
    let query: any = {}

    if (productId) {
      // EXTRACT BASE PRODUCT ID (remove size suffix)
      const baseProductId = productId.replace(/-[a-zA-Z0-9]+$/, '');
      query.productId = baseProductId;
      console.log("Querying reviews for base productId:", baseProductId)
    }

    if (userId) {
      query.userId = userId
      console.log("Querying reviews for userId:", userId)
    }

    const reviews = await db.collection("reviews")
      .find(query)
      .sort({ createdAt: -1 })
      .toArray()

    console.log("Found", reviews.length, "reviews for query:", query)

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

    console.log("Returning", serializedReviews.length, "serialized reviews")
    return NextResponse.json(serializedReviews)

  } catch (error: any) {
    console.error("Get reviews error:", error)
    return NextResponse.json({ 
      error: "Internal server error",
      message: error.message 
    }, { status: 500 })
  }
}
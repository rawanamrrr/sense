import { type NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { getDatabase } from "@/lib/mongodb"
import type { ObjectId } from "mongodb"

interface Review {
  _id?: ObjectId
  productId: string
  userId: string
  userName: string
  rating: number
  comment: string
  orderId: string
  createdAt: Date
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "Authorization required" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    const { productId, rating, comment, orderId } = await request.json()

    if (!productId || !rating || !comment) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 })
    }

    const db = await getDatabase()


    const existingReview = await db.collection<Review>("reviews").findOne({
      productId,
      userId: decoded.userId,
    })

    if (existingReview) {
      return NextResponse.json({ error: "You have already reviewed this product" }, { status: 400 })
    }

    const review: Review = {
      productId,
      userId: decoded.userId,
      userName: decoded.name || "Anonymous User",
      rating: Number(rating),
      comment: comment.trim(),
      orderId: orderId || `review-${Date.now()}`,
      createdAt: new Date(),
    }

    const result = await db.collection<Review>("reviews").insertOne(review)

    // Update product rating
    const reviews = await db.collection<Review>("reviews").find({ productId }).toArray()
    const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    const reviewCount = reviews.length

    await db.collection("products").updateOne(
      { id: productId },
      {
        $set: {
          rating: Math.round(averageRating * 10) / 10,
          reviews: reviewCount,
        },
      },
    )

    return NextResponse.json({
      success: true,
      review: { ...review, _id: result.insertedId },
    })
  } catch (error) {
    console.error("Create review error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get("productId")

    if (!productId) {
      return NextResponse.json({ error: "Product ID required" }, { status: 400 })
    }

    const db = await getDatabase()
    const reviews = await db.collection<Review>("reviews").find({ productId }).sort({ createdAt: -1 }).toArray()

    return NextResponse.json(reviews)
  } catch (error) {
    console.error("Get reviews error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

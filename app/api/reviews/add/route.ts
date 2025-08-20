import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";

export async function POST(req: NextRequest) {
  try {
    // 1. Authentication
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json(
        { error: "Authorization token missing" }, 
        { status: 401 }
      );
    }

    // 2. Token Verification
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { 
      userId: string; 
      email: string;
      name?: string;
    };

    // 3. Parse and Validate Request
    const body = await req.json();
    
    // Accept either productId or id from the request
    const productId = body.productId || body.id;
    if (!productId) {
      return NextResponse.json(
        { error: "Product identifier is required" },
        { status: 400 }
      );
    }
    
    if (!body.orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }
    
    if (body.rating === undefined || body.rating === null) {
      return NextResponse.json(
        { error: "Rating is required" },
        { status: 400 }
      );
    }

    // Validate rating
    const rating = Number(body.rating);
    if (isNaN(rating)) {
      return NextResponse.json(
        { error: "Rating must be a number" },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    // 4. Database Operations
    const db = await getDatabase();
    
    // Verify order exists and is delivered
    const order = await db.collection("orders").findOne({
      _id: new ObjectId(body.orderId),
      userId: decoded.userId,
      status: "delivered"
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found or not delivered" },
        { status: 400 }
      );
    }

    // Find the specific item in the order
    const item = order.items.find((i: any) => 
      i.productId === productId || i.id === productId
    );

    if (!item) {
      return NextResponse.json(
        { error: "Product not found in order" },
        { status: 400 }
      );
    }

    if (item.reviewed) {
      return NextResponse.json(
        { error: "This product has already been reviewed" },
        { status: 400 }
      );
    }

    // EXTRACT BASE PRODUCT ID (remove size suffix like -bundle, -Travel, -Reguler, etc.)
    // This regex removes everything after the last hyphen that follows letters/numbers
    const baseProductId = productId.replace(/-[a-zA-Z0-9]+$/, '');
    console.log("Original productId:", productId, "Base productId:", baseProductId);

    // Check if review already exists in main collection
    const existingReview = await db.collection("reviews").findOne({
      productId: baseProductId,
      userId: decoded.userId,
      orderId: body.orderId
    });

    if (existingReview) {
      return NextResponse.json(
        { error: "You have already reviewed this product for this order" },
        { status: 400 }
      );
    }

    // 5. Save Review to main reviews collection (so product page can see it)
    const reviewDoc = {
      productId: baseProductId, // Use base product ID without size suffix
      orderId: body.orderId,
      userId: decoded.userId,
      userName: decoded.name || decoded.email,
      rating: rating,
      comment: body.comment || "",
      createdAt: new Date(),
      updatedAt: new Date(),
      isFromOrder: true, // Flag to identify order-based reviews
      originalProductId: productId // Keep original for reference
    };

    const result = await db.collection("reviews").insertOne(reviewDoc);

    // 6. Update Order
    await db.collection("orders").updateOne(
      { 
        _id: new ObjectId(body.orderId),
        "items.id": productId
      },
      {
        $set: {
          "items.$.reviewed": true,
          "items.$.review": {
            rating: rating,
            comment: body.comment || "",
            userName: decoded.name || decoded.email
          },
          updatedAt: new Date()
        }
      }
    );

    // 7. Update product stats
    await db.collection("products").updateOne(
      { id: baseProductId }, // Update the base product
      {
        $inc: { reviews: 1 },
        $set: { 
          updatedAt: new Date(),
          rating: await calculateAverageRating(db, baseProductId)
        }
      }
    );

    return NextResponse.json({ 
      success: true,
      message: "Review submitted successfully",
      review: {
        ...reviewDoc,
        _id: result.insertedId.toString()
      }
    });

  } catch (error: any) {
    console.error("Review submission error:", error);
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: process.env.NODE_ENV === "development" ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

async function calculateAverageRating(db: any, productId: string) {
  const reviews = await db.collection("reviews")
    .find({ productId: productId })
    .toArray();
  
  if (reviews.length === 0) return 0;
  
  const total = reviews.reduce((sum: number, review: any) => sum + review.rating, 0);
  return Math.round((total / reviews.length) * 10) / 10;
}
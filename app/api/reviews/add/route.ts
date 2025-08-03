import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import jwt from "jsonwebtoken";

export async function POST(req: NextRequest) {
  const requestId = Math.random().toString(36).substring(2, 8);
  console.log(`[${requestId}] Review submission started`);

  try {
    // 1. Authentication
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) {
      console.log(`[${requestId}] No token provided`);
      return NextResponse.json({ error: "Authorization token missing" }, { status: 401 });
    }

    // 2. Token Verification
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string; email: string };
    console.log(`[${requestId}] Authenticated user:`, decoded.email);

    // 3. Parse and Validate Request
    const body = await req.json();
    console.log(`[${requestId}] Raw request body:`, JSON.stringify(body));

    // 4. Required Fields Validation
    const requiredFields = {
      productId: "string",
      orderId: "string",
      rating: "number"
    };

    const errors = [];
    const validated: Record<string, any> = {};

    // Validate each field
    for (const [field, type] of Object.entries(requiredFields)) {
      if (!body[field]) {
        errors.push(`Missing required field: ${field}`);
        continue;
      }

      // Type checking
      if (type === "number") {
        validated[field] = Number(body[field]);
        if (isNaN(validated[field])) {
          errors.push(`${field} must be a valid number`);
        }
      } else {
        validated[field] = body[field];
        if (typeof validated[field] !== type) {
          errors.push(`${field} must be a ${type}`);
        }
      }
    }

    // Additional rating validation
    if (!errors.includes("rating must be a valid number") && 
        (validated.rating < 1 || validated.rating > 5)) {
      errors.push("Rating must be between 1 and 5");
    }

    if (errors.length > 0) {
      console.log(`[${requestId}] Validation errors:`, errors);
      return NextResponse.json(
        {
          error: "Validation failed",
          details: errors,
          received: body
        },
        { status: 400 }
      );
    }

    // 5. Database Operations
    const db = await getDatabase();
    
    // Verify order exists and contains the product
    const order = await db.collection("orders").findOne({
      _id: validated.orderId,
      userId: decoded.userId,
      "items.productId": validated.productId,
      status: "delivered"
    });

    if (!order) {
      console.log(`[${requestId}] Order validation failed`);
      return NextResponse.json(
        { 
          error: "Order not eligible for review",
          details: [
            "Order not found",
            "Product not in order",
            "Order not delivered",
            "Doesn't belong to user"
          ].filter(Boolean)
        },
        { status: 400 }
      );
    }

    // 6. Save Review
    const reviewDoc = {
      productId: validated.productId,
      orderId: validated.orderId,
      userId: decoded.userId,
      userName: decoded.email,
      rating: validated.rating,
      comment: body.comment || "",
      createdAt: new Date(),
      updatedAt: new Date()
    };

    console.log(`[${requestId}] Saving review:`, reviewDoc);
    await db.collection("reviews").updateOne(
      { productId: validated.productId, orderId: validated.orderId },
      { $set: reviewDoc },
      { upsert: true }
    );

    // 7. Update Order
    await db.collection("orders").updateOne(
      { _id: validated.orderId, "items.productId": validated.productId },
      {
        $set: {
          "items.$.reviewed": true,
          "items.$.review": {
            rating: validated.rating,
            comment: body.comment || ""
          },
          updatedAt: new Date()
        }
      }
    );

    return NextResponse.json({ 
      success: true,
      message: "Review submitted successfully"
    });

  } catch (error: any) {
    console.error(`[${requestId}] Server error:`, error);
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: process.env.NODE_ENV === "development" ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
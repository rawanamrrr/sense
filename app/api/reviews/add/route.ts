import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";

// Global cache clearing function
const globalForCache = globalThis as typeof globalThis & {
  _productsCache?: Map<string, any>
}

const clearProductsCache = () => {
  const cache = globalForCache._productsCache;
  if (cache && cache.size > 0) {
    cache.clear();
    console.log("🗑️ Cleared products list cache");
  }
}

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
    const productId = body.id || body.productId;
    if (!productId) {
      return NextResponse.json(
        { error: "Product identifier is required" },
        { status: 400 }
      );
    }
    
    const orderId = body.orderId || body.order_id;
    if (!orderId) {
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
    
    // Verify order exists and is completed (shipped or delivered)
    const order = await db.collection("orders").findOne({
      _id: new ObjectId(orderId),
      userId: decoded.userId,
      status: { $in: ["shipped", "delivered"] }
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found or not delivered" },
        { status: 400 }
      );
    }

    // Find the specific item in the order
    const item = order.items.find((i: any) => 
      i.productId === productId || i.id === productId || i.product_id === productId
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
    
    // NEW: For gift packages, we need to extract the actual base product ID
    // The pattern is: baseProduct-gift-package-timestamp
    // We want to update the baseProduct, not the gift-package variation
    let actualBaseProductId = baseProductId;
    if (baseProductId.includes('-gift-package')) {
      // Remove everything from '-gift-package' onwards to get the real base product
      actualBaseProductId = baseProductId.replace(/-gift-package.*$/, '');
      console.log("🎁 Gift package detected, actual base product ID:", actualBaseProductId);
    }
    
    // Debug: Log the review document being created
    console.log("Review document to be created:", {
      productId: actualBaseProductId, // Use the ACTUAL base product ID
      actualBaseProductId: actualBaseProductId,
      orderId: orderId,
      userId: decoded.userId,
      userName: decoded.name || decoded.email,
      rating: rating,
      comment: body.comment || ""
    });

    // Check if review already exists in main collection
    const existingReview = await db.collection("reviews").findOne({
      productId: actualBaseProductId,
      userId: decoded.userId,
      orderId: orderId
    });

    if (existingReview) {
      return NextResponse.json(
        { error: "You have already reviewed this product for this order" },
        { status: 400 }
      );
    }

    // 5. Save Review to main reviews collection (so product page can see it)
    const reviewDoc = {
      productId: actualBaseProductId, // Use actual base product ID for gift packages
      orderId: orderId,
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

    // 6. Update Order - try both possible item ID fields
    const updateResult = await db.collection("orders").updateOne(
      { 
        _id: new ObjectId(orderId),
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

    // If first update didn't work, try with productId field
    if (updateResult.matchedCount === 0) {
      await db.collection("orders").updateOne(
        { 
          _id: new ObjectId(orderId),
          "items.productId": productId
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
    }

    // 7. Update product stats
    console.log("🔄 Updating product stats for actualBaseProductId:", actualBaseProductId);
    
    // Clear the products list cache to ensure updated ratings appear in best sellers and other lists
    clearProductsCache();
    
    // Check if the product exists in the database
    const productExists = await db.collection("products").findOne({ id: actualBaseProductId });
    console.log("🔍 Product found in database:", !!productExists);
    if (productExists) {
      console.log("📝 Current product data:", {
        id: productExists.id,
        name: productExists.name,
        currentRating: productExists.rating,
        currentReviews: productExists.reviews
      });
    } else {
      console.log("❌ Product NOT found in database with id:", actualBaseProductId);
      // Let's check what products exist with similar IDs
      const similarProducts = await db.collection("products").find({ 
        id: { $regex: new RegExp(actualBaseProductId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }
      }).toArray();
      console.log("🔍 Similar products found:", similarProducts.map(p => ({ id: p.id, name: p.name })));
      
      // Also check if there are any products with the original productId
      const originalProduct = await db.collection("products").findOne({ id: productId });
      console.log("🔍 Original product found:", !!originalProduct);
      if (originalProduct) {
        console.log("📝 Original product data:", {
          id: originalProduct.id,
          name: originalProduct.name,
          currentRating: originalProduct.rating,
          currentReviews: originalProduct.reviews
        });
      }
    }
    
    const calculatedRating = await calculateAverageRating(db, actualBaseProductId);
    console.log("📊 Calculated rating:", calculatedRating);
    
    // Verify the calculated rating is valid
    if (calculatedRating === 0) {
      console.log("⚠️ Warning: Calculated rating is 0, this might indicate an issue with review aggregation");
    }
    
    const productUpdateResult = await db.collection("products").updateOne(
      { id: actualBaseProductId }, // Update the actual base product
      {
        $inc: { reviews: 1 },
        $set: { 
          updatedAt: new Date(),
          rating: calculatedRating
        }
      }
    );
    
    console.log("✅ Product update result:", productUpdateResult);
    console.log("📝 Matched count:", productUpdateResult.matchedCount, "Modified count:", productUpdateResult.modifiedCount);
    
    // If the update didn't work, let's try to find the product by a different method
    if (productUpdateResult.matchedCount === 0) {
      console.log("⚠️ Product update failed - no product found with id:", actualBaseProductId);
      console.log("🔍 Trying to find product by _id or other fields...");
      
      // Check if there's a product with a similar ID
      const allProducts = await db.collection("products").find({}).toArray();
      const matchingProducts = allProducts.filter(p => 
        p.id.includes(actualBaseProductId) || actualBaseProductId.includes(p.id)
      );
      console.log("🔍 Products with similar IDs:", matchingProducts.map(p => ({ id: p.id, name: p.name })));
      
      // Try to update by similar ID if exact match failed
      if (matchingProducts.length > 0) {
        console.log("🔄 Attempting to update product with similar ID:", matchingProducts[0].id);
        const fallbackUpdate = await db.collection("products").updateOne(
          { id: matchingProducts[0].id },
          {
            $inc: { reviews: 1 },
            $set: { 
              updatedAt: new Date(),
              rating: calculatedRating
            }
          }
        );
        console.log("🔄 Fallback update result:", fallbackUpdate);
      } else {
        // If no similar products found, try to update the original product ID
        console.log("🔄 Attempting to update original product ID:", productId);
        const originalProductUpdate = await db.collection("products").updateOne(
          { id: productId },
          {
            $inc: { reviews: 1 },
            $set: { 
              updatedAt: new Date(),
              rating: calculatedRating
            }
          }
        );
        console.log("🔄 Original product update result:", originalProductUpdate);
      }
    }

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
  console.log("🔍 Calculating average rating for productId:", productId);
  
  // 1. Get reviews where productId exactly matches the base product ID
  const directReviews = await db.collection("reviews")
    .find({ productId: productId })
    .toArray();
  
  console.log("📊 Found", directReviews.length, "direct reviews with productId:", productId);
  
  // 2. Get reviews where productId contains the base product ID as a substring
  const escapedBaseId = productId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const productIdPattern = new RegExp(escapedBaseId, 'i');
  
  const substringReviews = await db.collection("reviews")
    .find({ productId: { $regex: productIdPattern } })
    .toArray();
  
  console.log("🔗 Found", substringReviews.length, "reviews with productId containing base ID as substring");
  
  // 3. Get reviews where originalProductId matches the base product ID
  const originalProductIdReviews = await db.collection("reviews")
    .find({ originalProductId: { $regex: new RegExp(`^${escapedBaseId}`, 'i') } })
    .toArray();
  
  console.log("🎁 Found", originalProductIdReviews.length, "reviews with originalProductId matching base ID");
  
  // 4. Get reviews where originalProductId contains the base product ID as a substring
  const relatedOriginalProductIdReviews = await db.collection("reviews")
    .find({ originalProductId: { $regex: productIdPattern } })
    .toArray();
  
  console.log("🔗 Found", relatedOriginalProductIdReviews.length, "reviews with originalProductId containing base ID as substring");
  
  // 5. NEW: Get reviews for gift packages that were created from this base product
  // This handles cases where someone reviews a gift package and we need to find the base product
  const giftPackageReviews = await db.collection("reviews")
    .find({ 
      $or: [
        { originalProductId: { $regex: new RegExp(`^${escapedBaseId}-gift-package`, 'i') } },
        { originalProductId: { $regex: new RegExp(`^${escapedBaseId}-gift-package.*`, 'i') } }
      ]
    })
    .toArray();
  
  console.log("🎁 Found", giftPackageReviews.length, "gift package reviews for base product");
  
  // Combine ALL sets of reviews and remove duplicates based on _id
  const allReviews = [
    ...directReviews, 
    ...substringReviews, 
    ...originalProductIdReviews, 
    ...relatedOriginalProductIdReviews,
    ...giftPackageReviews
  ];
  
  const uniqueReviews = allReviews.filter((review, index, self) => 
    index === self.findIndex(r => r._id.toString() === review._id.toString())
  );
  
  console.log("🔄 Combined", allReviews.length, "total reviews,", uniqueReviews.length, "unique reviews");
  
  // Debug: Show what reviews we found
  console.log("📋 All unique reviews found:", uniqueReviews.map((r: any) => ({ 
    _id: r._id.toString(),
    productId: r.productId, 
    originalProductId: r.originalProductId, 
    rating: r.rating,
    comment: r.comment?.substring(0, 30) + "..."
  })));
  
  if (uniqueReviews.length === 0) {
    console.log("❌ No reviews found, returning 0");
    return 0;
  }
  
  const total = uniqueReviews.reduce((sum: number, review: any) => sum + review.rating, 0);
  const averageRating = Math.round((total / uniqueReviews.length) * 10) / 10;
  
  console.log("⭐ Total rating:", total, "Average rating:", averageRating, "from", uniqueReviews.length, "reviews");
  
  return averageRating;
}
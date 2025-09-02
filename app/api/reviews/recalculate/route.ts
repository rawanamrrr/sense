import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";

export async function POST(req: NextRequest) {
  try {
    const { productId } = await req.json();
    
    if (!productId) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    const db = await getDatabase();
    
    // Find the product
    const product = await db.collection("products").findOne({ id: productId });
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    console.log("🔄 Recalculating rating for product:", productId);
    
    // Calculate average rating using the same logic as the review submission
    const directReviews = await db.collection("reviews")
      .find({ productId: productId })
      .toArray();
    
    console.log("📊 Found", directReviews.length, "direct reviews");
    
    // Get reviews where productId contains the base product ID as a substring
    const escapedBaseId = productId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const productIdPattern = new RegExp(escapedBaseId, 'i');
    
    const substringReviews = await db.collection("reviews")
      .find({ productId: { $regex: productIdPattern } })
      .toArray();
    
    console.log("🔗 Found", substringReviews.length, "substring reviews");
    
    // Get reviews where originalProductId matches the base product ID
    const originalProductIdReviews = await db.collection("reviews")
      .find({ originalProductId: { $regex: new RegExp(`^${escapedBaseId}`, 'i') } })
      .toArray();
    
    console.log("🎁 Found", originalProductIdReviews.length, "original product ID reviews");
    
    // Get reviews for gift packages
    const giftPackageReviews = await db.collection("reviews")
      .find({ 
        $or: [
          { originalProductId: { $regex: new RegExp(`^${escapedBaseId}-gift-package`, 'i') } },
          { originalProductId: { $regex: new RegExp(`^${escapedBaseId}-gift-package.*`, 'i') } }
        ]
      })
      .toArray();
    
    console.log("🎁 Found", giftPackageReviews.length, "gift package reviews");
    
    // Combine all reviews and remove duplicates
    const allReviews = [
      ...directReviews, 
      ...substringReviews, 
      ...originalProductIdReviews,
      ...giftPackageReviews
    ];
    
    const uniqueReviews = allReviews.filter((review, index, self) => 
      index === self.findIndex(r => r._id.toString() === review._id.toString())
    );
    
    console.log("🔄 Total unique reviews:", uniqueReviews.length);
    
    if (uniqueReviews.length === 0) {
      return NextResponse.json({ 
        message: "No reviews found for this product",
        rating: 0,
        reviewCount: 0
      });
    }
    
    const total = uniqueReviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = Math.round((total / uniqueReviews.length) * 10) / 10;
    
    console.log("⭐ Calculated rating:", averageRating, "from", uniqueReviews.length, "reviews");
    
    // Update the product
    const updateResult = await db.collection("products").updateOne(
      { id: productId },
      {
        $set: { 
          rating: averageRating,
          reviews: uniqueReviews.length,
          updatedAt: new Date()
        }
      }
    );
    
    console.log("✅ Product update result:", updateResult);
    
    return NextResponse.json({ 
      success: true,
      message: "Rating recalculated successfully",
      productId: productId,
      rating: averageRating,
      reviewCount: uniqueReviews.length,
      matchedCount: updateResult.matchedCount,
      modifiedCount: updateResult.modifiedCount
    });

  } catch (error: any) {
    console.error("Recalculate rating error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

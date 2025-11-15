import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";

function errorResponse(message: string, status: number = 400) {
  console.error(`API Error [${status}]:`, message);
  return NextResponse.json({ error: message }, { status });
}

// Helper function to get the smallest price from sizes
function getSmallestPrice(sizes: any[]) {
  if (!sizes || sizes.length === 0) return 0;
  
  const prices = sizes.map(size => size.discountedPrice || size.originalPrice || size.price || 0);
  return Math.min(...prices.filter(price => price > 0));
}

// Helper function to transform sizes to match the expected format
function transformSizes(sizes: any[]) {
  if (!sizes || sizes.length === 0) return [];
  
  return sizes.map(size => ({
    size: size.size,
    volume: size.volume,
    originalPrice: size.originalPrice || size.price || 0,
    discountedPrice: size.discountedPrice || size.price || 0,
  }));
}

export async function GET(request: NextRequest) {
  console.log("Favorites API - GET Request Received");

  // Auth check
  const authHeader = request.headers.get("authorization");
  if (!authHeader) {
    console.log("No Authorization header found");
    return errorResponse("Authorization required", 401);
  }

  const token = authHeader.replace("Bearer ", "");
  if (!token) {
    console.log("No token found in Authorization header");
    return errorResponse("Authorization required", 401);
  }

  let decoded: { userId: string };
  try {
    console.log("Verifying token...");
    decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    console.log("Token successfully decoded:", decoded);
  } catch (err) {
    console.error("Token verification failed:", err);
    return errorResponse("Invalid or expired token", 401);
  }

  try {
    const db = await getDatabase();
    console.log("Fetching user from database with ID:", decoded.userId);

    const user = await db.collection("users").findOne({ 
      _id: new ObjectId(decoded.userId) 
    });
    
    if (!user) {
      console.log("User not found in database");
      return errorResponse("User not found", 404);
    }

    const favorites: string[] = user.favorites || [];
    console.log(`Found ${favorites.length} favorites for user`);

    if (!favorites.length) {
      console.log("No favorites found - returning empty array");
      return NextResponse.json([]);
    }

    // Fetch product details
    console.log("Fetching favorite products from database...");
    const products = await db.collection("products").find(
      { id: { $in: favorites } },
      {
        projection: {
          id: 1,
          name: 1,
          sizes: 1,
          images: 1,
          category: 1,
          description: 1,
          rating: 1,
          isNew: 1,
          isBestseller: 1,
          isGiftPackage: 1,
          packagePrice: 1,
          packageOriginalPrice: 1,
          giftPackageSizes: 1,
        },
      }
    ).toArray();

    console.log(`Found ${products.length} products matching favorites`);
    console.log("Sample product sizes:", products[0]?.sizes);

    // Transform products to match the expected format
    const transformedProducts = products.map(product => ({
      id: product.id,
      name: product.name,
      price: product.isGiftPackage ? (product.packagePrice || 0) : getSmallestPrice(product.sizes || []),
      image: product.images && product.images.length > 0 ? product.images[0] : "/placeholder.svg",
      category: product.category,
      ...(product.rating !== undefined ? { rating: product.rating } : {}),
      isNew: product.isNew || false,
      isBestseller: product.isBestseller || false,
      sizes: product.isGiftPackage ? [] : transformSizes(product.sizes || []),
      // Gift package fields
      isGiftPackage: product.isGiftPackage || false,
      packagePrice: product.packagePrice || 0,
      packageOriginalPrice: product.packageOriginalPrice || 0,
      giftPackageSizes: product.giftPackageSizes || [],
    }));

    // Maintain order
    const productMap = Object.fromEntries(transformedProducts.map((p) => [p.id, p]));
    const ordered = favorites.map((id) => productMap[id]).filter(Boolean);

    console.log("Transformed sizes for first product:", ordered[0]?.sizes);
    return NextResponse.json(ordered, {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0"
      }
    });
  } catch (err) {
    console.error("Database error:", err);
    return errorResponse("Internal server error", 500);
  }
}

export async function POST(request: NextRequest) {
  console.log("Favorites API - POST Request Received");

  // Auth check
  const authHeader = request.headers.get("authorization");
  if (!authHeader) {
    return errorResponse("Authorization required", 401);
  }

  const token = authHeader.replace("Bearer ", "");
  let decoded: { userId: string };
  
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
  } catch (err) {
    return errorResponse("Invalid or expired token", 401);
  }

  try {
    const { productId } = await request.json();
    if (!productId) {
      return errorResponse("productId required", 400);
    }

    const db = await getDatabase();
    const user = await db.collection("users").findOne({ 
      _id: new ObjectId(decoded.userId) 
    });
    
    if (!user) {
      return errorResponse("User not found", 404);
    }

    const favorites: string[] = user.favorites || [];
    if (!favorites.includes(productId)) {
      const newFavorites = [...favorites, productId];
      await db.collection("users").updateOne(
        { _id: new ObjectId(decoded.userId) },
        { $set: { favorites: newFavorites } }
      );
      console.log(`Added product ${productId} to favorites`);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error in POST favorites:", err);
    return errorResponse("Internal server error", 500);
  }
}

export async function DELETE(request: NextRequest) {
  console.log("Favorites API - DELETE Request Received");

  // Auth check
  const authHeader = request.headers.get("authorization");
  if (!authHeader) {
    return errorResponse("Authorization required", 401);
  }

  const token = authHeader.replace("Bearer ", "");
  let decoded: { userId: string };
  
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
  } catch (err) {
    return errorResponse("Invalid or expired token", 401);
  }

  try {
    const { productId } = await request.json();
    if (!productId) {
      return errorResponse("productId required", 400);
    }

    const db = await getDatabase();
    const user = await db.collection("users").findOne({ 
      _id: new ObjectId(decoded.userId) 
    });
    
    if (!user) {
      return errorResponse("User not found", 404);
    }

    const favorites: string[] = user.favorites || [];
    const newFavorites = favorites.filter((id) => id !== productId);

    await db.collection("users").updateOne(
      { _id: new ObjectId(decoded.userId) },
      { $set: { favorites: newFavorites } }
    );
    
    console.log(`Removed product ${productId} from favorites`);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error in DELETE favorites:", err);
    return errorResponse("Internal server error", 500);
  }
}
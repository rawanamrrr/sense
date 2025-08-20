import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";

function errorResponse(message: string, status: number = 400) {
  console.error(`API Error [${status}]:`, message);
  return NextResponse.json({ error: message }, { status });
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
          price: 1,
          image: 1,
          category: 1,
          description: 1,
        },
      }
    ).toArray();

    console.log(`Found ${products.length} products matching favorites`);

    // Maintain order
    const productMap = Object.fromEntries(products.map((p) => [p.id, p]));
    const ordered = favorites.map((id) => productMap[id]).filter(Boolean);

    return NextResponse.json(ordered);
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
import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";
import { User } from "./../../../lib/models/types";

function errorResponse(message: string, status: number = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET(request: NextRequest) {
  // Auth check
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return errorResponse("Authorization required", 401);

  let decoded: any;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET!);
  } catch {
    return errorResponse("Invalid token", 401);
  }

  const userId = decoded.userId;
  const db = await getDatabase();
  const user = await db.collection("users").findOne({ _id: new ObjectId(userId) });
  if (!user) return errorResponse("User not found", 404);

  const favorites: string[] = user.favorites || [];
  if (!favorites.length) return NextResponse.json([]);

  // Fetch product details with image, name, price, etc.
  const products = await db.collection("products").find(
    { id: { $in: favorites } },
    {
      projection: {
        id: 1,
        name: 1,
        price: 1,
        image: 1, // make sure this field exists in the DB
        category: 1,
        description: 1,
      },
    }
  ).toArray();

  // Maintain order
  const productMap = Object.fromEntries(products.map((p) => [p.id, p]));
  const ordered = favorites.map((id) => productMap[id]).filter(Boolean);

  return NextResponse.json(ordered);
}

export async function POST(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return errorResponse("Authorization required", 401);

  let decoded: any;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET!);
  } catch {
    return errorResponse("Invalid token", 401);
  }

  const userId = decoded.userId;
  const db = await getDatabase();
  const { productId } = await request.json();
  if (!productId) return errorResponse("productId required", 400);

  const user = await db.collection("users").findOne({ _id: new ObjectId(userId) });
  if (!user) return errorResponse("User not found", 404);

  const favorites: string[] = user.favorites || [];
  if (!favorites.includes(productId)) {
    favorites.push(productId);
    await db.collection("users").updateOne(
      { _id: new ObjectId(userId) },
      { $set: { favorites } }
    );
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return errorResponse("Authorization required", 401);

  let decoded: any;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET!);
  } catch {
    return errorResponse("Invalid token", 401);
  }

  const userId = decoded.userId;
  const db = await getDatabase();
  const { productId } = await request.json();
  if (!productId) return errorResponse("productId required", 400);

  const user = await db.collection("users").findOne({ _id: new ObjectId(userId) });
  if (!user) return errorResponse("User not found", 404);

  const favorites: string[] = user.favorites || [];
  const newFavorites = favorites.filter((id) => id !== productId);

  await db.collection("users").updateOne(
    { _id: new ObjectId(userId) },
    { $set: { favorites: newFavorites } }
  );

  return NextResponse.json({ success: true });
}

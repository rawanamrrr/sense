import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";

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
  const userId = decoded.id;
  const db = await getDatabase();
  const user = await db.collection("users").findOne({ _id: new ObjectId(userId) });
  if (!user) return errorResponse("User not found", 404);
  const favorites: string[] = user.favorites || [];
  if (!favorites.length) return NextResponse.json([]);
  // Fetch full product objects in the order of favorites
  const products = await db.collection("products").find({ id: { $in: favorites } }).toArray();
  // Sort to match the order in favorites
  const productMap = Object.fromEntries(products.map(p => [p.id, p]));
  const ordered = favorites.map(id => productMap[id]).filter(Boolean);
  return NextResponse.json(ordered);
}

export async function POST(request: NextRequest) {
  // Auth check
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return errorResponse("Authorization required", 401);
  let decoded: any;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET!);
  } catch {
    return errorResponse("Invalid token", 401);
  }
  const userId = decoded.id;
  const db = await getDatabase();
  const { productId } = await request.json();
  if (!productId) return errorResponse("productId required", 400);
  // Add to favorites if not already present
  const user = await db.collection("users").findOne({ _id: new ObjectId(userId) });
  if (!user) return errorResponse("User not found", 404);
  const favorites: string[] = user.favorites || [];
  if (!favorites.includes(productId)) {
    favorites.push(productId);
    await db.collection("users").updateOne({ _id: new ObjectId(userId) }, { $set: { favorites } });
  }
  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  // Auth check
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return errorResponse("Authorization required", 401);
  let decoded: any;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET!);
  } catch {
    return errorResponse("Invalid token", 401);
  }
  const userId = decoded.id;
  const db = await getDatabase();
  const { productId } = await request.json();
  if (!productId) return errorResponse("productId required", 400);
  // Remove from favorites
  const user = await db.collection("users").findOne({ _id: new ObjectId(userId) });
  if (!user) return errorResponse("User not found", 404);
  const favorites: string[] = user.favorites || [];
  const newFavorites = favorites.filter(id => id !== productId);
  await db.collection("users").updateOne({ _id: new ObjectId(userId) }, { $set: { favorites: newFavorites } });
  return NextResponse.json({ success: true });
}

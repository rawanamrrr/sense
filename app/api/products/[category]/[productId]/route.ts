import { type NextRequest, NextResponse } from "next/server";
import { MongoClient, type Db } from "mongodb";
import type { Product } from "@/lib/models/types";
import Redis from "ioredis";

// ----- MongoDB Connection Pooling -----
let cachedDb: Db | null = null;
async function getDatabase(): Promise<Db> {
  if (cachedDb) return cachedDb;

  const client = await MongoClient.connect(process.env.MONGODB_URI!, {
    // useUnifiedTopology: true // optional depending on version
  });
  cachedDb = client.db();
  return cachedDb;
}

// ----- Redis Cache -----
// Initialize Redis client with proper error handling
let redis: Redis | null = null;

try {
  if (!process.env.REDIS_URL) {
    console.warn('REDIS_URL not set, Redis caching will be disabled');
  } else {
    redis = new Redis(process.env.REDIS_URL);
  }
} catch (error) {
  console.error('Failed to initialize Redis client:', error);
  redis = null;
}

const validCategories = ["men", "women", "packages", "outlet"] as const;
type ValidCategory = typeof validCategories[number];

export async function GET(
  request: NextRequest,
  { params }: { params: { category: string; productId: string } }
) {
  try {
    const { category, productId } = params;

    // ---- 1. Validate category ----
    if (!validCategories.includes(category as ValidCategory)) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }

    // ---- 2. Try cache first ----
    const cacheKey = `product:${category}:${productId}`;
    const cachedProduct = redis ? await redis.get(cacheKey) : null;
    if (cachedProduct) {
      return NextResponse.json(JSON.parse(cachedProduct), {
        headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=600" },
      });
    }

    // ---- 3. Get DB connection ----
    const db = await getDatabase();

    // ---- 4. Query product ----
    const product = await db.collection<Product>("products").findOne({
      category: category as ValidCategory,
      id: productId,
      isActive: true,
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // ---- 5. Save to cache ----
    if (redis) {
      await redis.set(cacheKey, JSON.stringify(product), "EX", 300); // cache 5 minutes
    }

    // ---- 6. Return response ----
    return NextResponse.json(product, {
      headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=600" },
    });
  } catch (error) {
    console.error("Get product error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

import { MongoClient, type Db } from "mongodb";

if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || process.env.MONGODB_DB_NAME || "sense_fragrances";

// MongoDB client options
const options = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  family: 4 as 0 | 4 | 6, // Force IPv4
} as const;

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

// Create a single global client to avoid cold start on each request
if (!global._mongoClientPromise) {
  console.log("🔄 [MongoDB] Creating new client connection...");
  client = new MongoClient(uri, options);
  global._mongoClientPromise = client.connect();
}
clientPromise = global._mongoClientPromise;

// Ensure indexes are created once per process
let indexesCreated = false;
async function ensureIndexes(db: Db) {
  if (indexesCreated) return;
  try {
    await db.collection('products').createIndexes([
      { key: { id: 1 }, name: 'idx_products_id', unique: true },
      { key: { isActive: 1, category: 1, createdAt: -1 }, name: 'idx_products_active_category_createdAt' },
      { key: { isActive: 1, createdAt: -1 }, name: 'idx_products_active_createdAt' },
      { key: { isActive: 1, isGiftPackage: 1, createdAt: -1 }, name: 'idx_products_active_gift_createdAt' },
      { key: { createdAt: -1 }, name: 'idx_products_createdAt' },
    ]);
    console.log("✅ [MongoDB] Indexes ensured");
  } catch (err) {
    console.warn("⚠️ [MongoDB] Index creation skipped/failed:", err);
  } finally {
    indexesCreated = true;
  }
}

// Exported function to get database instance
export async function getDatabase(): Promise<Db> {
  try {
    const client = await clientPromise;
    const db = client.db(dbName);
    await ensureIndexes(db); // ensure indexes only once
    return db;
  } catch (error) {
    console.error("❌ [MongoDB] Database connection failed:", error);
    throw error;
  }
}

// Optional: test connection helper
export async function testConnection(): Promise<boolean> {
  try {
    console.log("🧪 [MongoDB] Testing database connection...");
    const db = await getDatabase();
    const collections = await db.listCollections().toArray();
    console.log("📋 [MongoDB] Available collections:", collections.map(c => c.name));
    const productCount = await db.collection("products").countDocuments();
    console.log("🧴 [MongoDB] Products in database:", productCount);
    const orderCount = await db.collection("orders").countDocuments();
    console.log("📦 [MongoDB] Orders in database:", orderCount);
    console.log("✅ [MongoDB] Connection test successful");
    return true;
  } catch (error) {
    console.error("❌ [MongoDB] Connection test failed:", error);
    return false;
  }
}

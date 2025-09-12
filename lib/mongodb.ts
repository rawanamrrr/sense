import { MongoClient, type Db } from "mongodb"

if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"')
}

const uri = process.env.MONGODB_URI
const options = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
}

let client: MongoClient
let clientPromise: Promise<MongoClient>

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined
}

// Reuse a single client in both development and production
if (!global._mongoClientPromise) {
  client = new MongoClient(uri, options)
  global._mongoClientPromise = client.connect()
}
clientPromise = global._mongoClientPromise

export default clientPromise

export async function getDatabase(): Promise<Db> {
  try {
    const client = await clientPromise
    return client.db("sense_fragrances")
  } catch (error) {
    throw error
  }
}

export async function testConnection(): Promise<boolean> {
  try {
    console.log("🧪 [MongoDB] Testing database connection...")
    const db = await getDatabase()

    // Test basic operations
    const collections = await db.listCollections().toArray()
    console.log(
      "📋 [MongoDB] Available collections:",
      collections.map((c) => c.name),
    )

    // Test product query
    const productCount = await db.collection("products").countDocuments()
    console.log("🧴 [MongoDB] Products in database:", productCount)

    // Test order query
    const orderCount = await db.collection("orders").countDocuments()
    console.log("📦 [MongoDB] Orders in database:", orderCount)

    console.log("✅ [MongoDB] Connection test successful")
    return true
  } catch (error) {
    console.error("❌ [MongoDB] Connection test failed:", error)
    return false
  }
}

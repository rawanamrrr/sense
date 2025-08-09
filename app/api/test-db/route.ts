import { type NextRequest, NextResponse } from "next/server"
import { getDatabase, testConnection } from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  console.log("🧪 [API] Database test endpoint called")

  try {
    // Test basic connection
    const connectionTest = await testConnection()

    if (!connectionTest) {
      return NextResponse.json(
        {
          success: false,
          error: "Database connection failed",
          timestamp: new Date().toISOString(),
        },
        { status: 500 },
      )
    }

    const db = await getDatabase()

    // Comprehensive database tests
    const tests = {
      connection: true,
      collections: {},
      queries: {},
      indexes: {},
    }

    // Test collections
    console.log("📋 [Test] Checking collections...")
    const collections = await db.listCollections().toArray()
    tests.collections = {
      available: collections.map((c) => c.name),
      count: collections.length,
    }

    // Test products collection
    console.log("🧴 [Test] Testing products collection...")
    const productStats = {
      total: await db.collection("products").countDocuments(),
      active: await db.collection("products").countDocuments({ isActive: true }),
      byCategory: {
        men: await db.collection("products").countDocuments({ category: "men", isActive: true }),
        women: await db.collection("products").countDocuments({ category: "women", isActive: true }),
        packages: await db.collection("products").countDocuments({ category: "packages", isActive: true }),
      },
    }

    // Sample products
    const sampleProducts = await db
      .collection("products")
      .find({ isActive: true })
      .limit(3)
      .project({ name: 1, category: 1, price: 1, id: 1 })
      .toArray()

    tests.queries.products = {
      stats: productStats,
      samples: sampleProducts,
    }

    // Test orders collection
    console.log("📦 [Test] Testing orders collection...")
    const orderStats = {
      total: await db.collection("orders").countDocuments(),
      byStatus: {
        pending: await db.collection("orders").countDocuments({ status: "pending" }),
        processing: await db.collection("orders").countDocuments({ status: "processing" }),
        shipped: await db.collection("orders").countDocuments({ status: "shipped" }),
        delivered: await db.collection("orders").countDocuments({ status: "delivered" }),
      },
    }

    // Sample orders
    const sampleOrders = await db
      .collection("orders")
      .find({})
      .limit(3)
      .project({ id: 1, total: 1, status: 1, createdAt: 1 })
      .toArray()

    tests.queries.orders = {
      stats: orderStats,
      samples: sampleOrders,
    }

    // Test users collection
    console.log("👥 [Test] Testing users collection...")
    const userStats = {
      total: await db.collection("users").countDocuments(),
      byRole: {
        admin: await db.collection("users").countDocuments({ role: "admin" }),
        user: await db.collection("users").countDocuments({ role: "user" }),
      },
    }

    tests.queries.users = {
      stats: userStats,
    }

    // Test indexes
    console.log("📝 [Test] Checking indexes...")
    const productIndexes = await db.collection("products").indexes()
    const orderIndexes = await db.collection("orders").indexes()
    const userIndexes = await db.collection("users").indexes()

    tests.indexes = {
      products: productIndexes.length,
      orders: orderIndexes.length,
      users: userIndexes.length,
    }

    console.log("✅ [Test] All database tests completed successfully")

    return NextResponse.json({
      success: true,
      message: "Database tests completed successfully",
      tests,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      mongoUri: process.env.MONGODB_URI?.replace(/\/\/.*@/, "//***:***@"),
    })
  } catch (error) {
    console.error("❌ [Test] Database test failed:", error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

import { type NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { getDatabase } from "@/lib/mongodb"
import type { Order } from "@/lib/models/types"

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  console.log("🔍 [API] GET /api/orders - Request received")

  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    console.log("🔐 [API] Token present:", !!token)

    if (!token) {
      console.log("❌ [API] No authorization token provided")
      return NextResponse.json({ error: "Authorization required" }, { status: 401 })
    }

    let decoded: any
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!)
      console.log("✅ [API] Token verified for user:", decoded.email, "Role:", decoded.role)
    } catch (jwtError) {
      console.error("❌ [API] JWT verification failed:", jwtError)
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const db = await getDatabase()
    console.log("✅ [API] Database connection established")

    const query: any = {}

    // If user role, only show their orders
    if (decoded.role === "user") {
      query.userId = decoded.userId
      console.log("👤 [API] Filtering orders for user:", decoded.userId)
    } else {
      console.log("👑 [API] Admin access - fetching all orders")
    }

    console.log("🔍 [API] MongoDB query:", JSON.stringify(query))

    const orders = await db.collection<Order>("orders").find(query).sort({ createdAt: -1 }).toArray()

    console.log(`✅ [API] Found ${orders.length} orders`)

    if (orders.length > 0) {
      console.log("📦 [API] Sample orders:")
      orders.slice(0, 2).forEach((order, index) => {
        console.log(`   ${index + 1}. Order ${order.id} - ${order.total} EGP (${order.status})`)
      })
    }

    const responseTime = Date.now() - startTime
    console.log(`⏱️ [API] Request completed in ${responseTime}ms`)

    return NextResponse.json(orders)
  } catch (error) {
    const responseTime = Date.now() - startTime
    console.error("❌ [API] Error in GET /api/orders:", error)
    console.error("🔍 [API] Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      responseTime: `${responseTime}ms`,
    })

    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  console.log("🔍 [API] POST /api/orders - Request received")

  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    console.log("🔐 [API] Token present:", !!token)

    // Parse request body first
    const orderData = await request.json()
    console.log("📝 [API] Order data received:")
    console.log("   Items count:", orderData.items?.length || 0)
    console.log("   Total:", orderData.total)
    console.log("   Payment method:", orderData.paymentMethod)
    console.log("   Customer:", orderData.shippingAddress?.name)

    let userId = "guest"

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
        userId = decoded.userId
        console.log("✅ [API] Authenticated user:", decoded.email)
      } catch (jwtError) {
        console.log("⚠️ [API] Invalid token, proceeding as guest order")
      }
    } else {
      console.log("👤 [API] Guest order (no token provided)")
    }

    const db = await getDatabase()
    console.log("✅ [API] Database connection established")

    // Generate unique order ID
    const orderId = `order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    console.log("🆔 [API] Generated order ID:", orderId)

    // Prepare order document
    const newOrder: Omit<Order, "_id"> = {
      id: orderId,
      userId: userId,
      items: orderData.items.map((item: any) => ({
        id: item.id,
        name: item.name,
        price: Number(item.price),
        size: item.size,
        volume: item.volume,
        image: item.image,
        category: item.category,
        quantity: Number(item.quantity),
      })),
      total: Number(orderData.total),
      status: "pending",
      shippingAddress: {
        name: orderData.shippingAddress.name,
        email: orderData.shippingAddress.email || "",
        phone: orderData.shippingAddress.phone || "",
        secondaryPhone: orderData.shippingAddress.secondaryPhone,
        address: orderData.shippingAddress.address,
        city: orderData.shippingAddress.city,
        governorate: orderData.shippingAddress.governorate || "",
        postalCode: orderData.shippingAddress.postalCode || "",
      },
      paymentMethod: orderData.paymentMethod || "cod",
      paymentDetails: orderData.paymentDetails || null,
      discountCode: orderData.discountCode || null,
      discountAmount: orderData.discountAmount || 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    console.log("💾 [API] Inserting order into database...")
    console.log("📄 [API] Order document summary:")
    console.log("   Order ID:", newOrder.id)
    console.log("   User ID:", newOrder.userId)
    console.log("   Items:", newOrder.items.length)
    console.log("   Total:", newOrder.total)
    console.log("   Status:", newOrder.status)
    console.log("   Discount:", newOrder.discountCode, newOrder.discountAmount)

    const result = await db.collection<Order>("orders").insertOne(newOrder)
    console.log("✅ [API] Order inserted with MongoDB ID:", result.insertedId)

    // Verify insertion
    const insertedOrder = await db.collection<Order>("orders").findOne({ _id: result.insertedId })
    console.log("🔍 [API] Verification - Order found in database:", !!insertedOrder)

    if (insertedOrder) {
      console.log("✅ [API] Order verification successful:")
      console.log("   Database ID:", insertedOrder._id)
      console.log("   Order ID:", insertedOrder.id)
      console.log("   Customer:", insertedOrder.shippingAddress.name)
      console.log("   Total:", insertedOrder.total)
      console.log("   Status:", insertedOrder.status)
    }

    // Check total orders after insertion
    const totalOrders = await db.collection("orders").countDocuments()
    const userOrders = userId !== "guest" ? await db.collection("orders").countDocuments({ userId }) : 0

    console.log("📊 [API] Database stats after insertion:")
    console.log("   Total orders:", totalOrders)
    if (userId !== "guest") {
      console.log("   User orders:", userOrders)
    }

    const responseTime = Date.now() - startTime
    console.log(`⏱️ [API] Order creation completed in ${responseTime}ms`)

    return NextResponse.json({
      success: true,
      order: {
        _id: result.insertedId,
        ...newOrder,
      },
      message: "Order created successfully",
    })
  } catch (error) {
    const responseTime = Date.now() - startTime
    console.error("❌ [API] Error in POST /api/orders:", error)
    console.error("🔍 [API] Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      responseTime: `${responseTime}ms`,
    })

    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

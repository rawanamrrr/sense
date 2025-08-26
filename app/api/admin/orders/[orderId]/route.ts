import { type NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { getDatabase } from "@/lib/mongodb"
import type { Order } from "@/lib/models/types"

export async function GET(request: NextRequest, { params }: { params: { orderId: string } }) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "Authorization required" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any

    if (decoded.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const { orderId } = params
    const db = await getDatabase()

    const order = await db.collection<Order>("orders").findOne({ id: orderId })

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    return NextResponse.json(order)
  } catch (error) {
    console.error("Get admin order error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { orderId: string } }) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "Authorization required" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any

    if (decoded.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const { orderId } = params
    const { status } = await request.json()

    if (!status) {
      return NextResponse.json({ error: "Status is required" }, { status: 400 })
    }

    const db = await getDatabase()

    // Get the current order to check previous status
    const currentOrder = await db.collection<Order>("orders").findOne({ id: orderId })

    if (!currentOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    const previousStatus = currentOrder.status

    // Update the order status
    const result = await db.collection<Order>("orders").updateOne(
      { id: orderId },
      { 
        $set: { 
          status: status,
          updatedAt: new Date()
        } 
      }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    // Get the updated order
    const updatedOrder = await db.collection<Order>("orders").findOne({ id: orderId })

    // Send order update email
    try {
      const updateResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/send-order-update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          order: updatedOrder,
          previousStatus: previousStatus,
          newStatus: status
        })
      })

      if (updateResponse.ok) {
        console.log(`✅ Order update email sent for order ${orderId}`)
      } else {
        console.error(`❌ Failed to send order update email for order ${orderId}`)
      }
    } catch (emailError) {
      console.error("❌ Error sending order update email:", emailError)
    }

    // If status is 'delivered', send review reminder emails for each product
    if (status === 'delivered') {
      try {
        for (const item of updatedOrder!.items) {
          // Get product details
          const product = await db.collection("products").findOne({ id: item.productId })
          
          if (product) {
            const reviewReminderResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/send-review-reminder`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                order: updatedOrder,
                product: product
              })
            })

            if (reviewReminderResponse.ok) {
              console.log(`✅ Review reminder email sent for product ${product.name}`)
            } else {
              console.error(`❌ Failed to send review reminder email for product ${product.name}`)
            }
          }
        }
      } catch (reviewEmailError) {
        console.error("❌ Error sending review reminder emails:", reviewEmailError)
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: "Order status updated successfully",
      order: updatedOrder
    })

  } catch (error) {
    console.error("Update admin order error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

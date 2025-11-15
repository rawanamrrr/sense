import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import jwt from "jsonwebtoken";

export async function PUT(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "Authorization required" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any

    if (decoded.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const { orderId, status } = await request.json()

    if (!orderId || !status) {
      return NextResponse.json({ error: "Order ID and status are required" }, { status: 400 })
    }

    const db = await getDatabase()

    // Get the current order to check previous status
    const currentOrder = await db.collection("orders").findOne({ id: orderId })

    if (!currentOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    const previousStatus = currentOrder.status

    // If status is being changed to cancelled, adjust the total balance
    if (status === 'cancelled' && previousStatus !== 'cancelled') {
      // Get the current balance
      const balanceDoc = await db.collection('balance').findOne({});
      const currentBalance = balanceDoc?.balance || 0;
      const orderTotal = currentOrder.total || 0;
      
      // Update the balance by subtracting the order total
      await db.collection('balance').updateOne(
        {},
        { $inc: { balance: -orderTotal } },
        { upsert: true }
      );
    }
    // If status is being changed from cancelled to something else, add the amount back
    else if (previousStatus === 'cancelled' && status !== 'cancelled') {
      // Get the current balance
      const balanceDoc = await db.collection('balance').findOne({});
      const currentBalance = balanceDoc?.balance || 0;
      const orderTotal = currentOrder.total || 0;
      
      // Update the balance by adding the order total back
      await db.collection('balance').updateOne(
        {},
        { $inc: { balance: orderTotal } },
        { upsert: true }
      );
    }

    // Update the order status
    const result = await db.collection("orders").updateOne(
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
    const updatedOrder = await db.collection("orders").findOne({ id: orderId })

    // Send order update email
    try {
      const updateResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.sensefragrance.com'}/api/send-order-update`, {
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

    return NextResponse.json({ 
      message: "Order status updated successfully",
      order: updatedOrder 
    })
  } catch (error) {
    console.error("Update order error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

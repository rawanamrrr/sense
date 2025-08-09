import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    const { code, orderAmount } = await request.json()

    if (!code || !orderAmount) {
      return NextResponse.json({ error: "Code and order amount are required" }, { status: 400 })
    }

    const db = await getDatabase()

    // Find active discount code (case insensitive search but stored in uppercase)
    const discountCode = await db.collection("discount").findOne({
      code: code.toUpperCase(),
      isActive: true,
    })

    if (!discountCode) {
      return NextResponse.json({ error: "Invalid discount code" }, { status: 400 })
    }

    // Check if expired
    if (discountCode.expiresAt && new Date() > new Date(discountCode.expiresAt)) {
      return NextResponse.json({ error: "Discount code has expired" }, { status: 400 })
    }

    // Check if max uses reached
    if (discountCode.maxUses && discountCode.currentUses >= discountCode.maxUses) {
      return NextResponse.json({ error: "Discount code usage limit reached" }, { status: 400 })
    }

    // Check minimum order amount
    if (discountCode.minOrderAmount && orderAmount < discountCode.minOrderAmount) {
      return NextResponse.json(
        {
          error: `Minimum order amount of ${discountCode.minOrderAmount} EGP required`,
        },
        { status: 400 },
      )
    }

    // Calculate discount
    let discountAmount = 0
    if (discountCode.type === "percentage") {
      discountAmount = (orderAmount * discountCode.value) / 100
    } else {
      discountAmount = discountCode.value
    }

    return NextResponse.json({
      valid: true,
      discountAmount,
      code: discountCode.code,
      type: discountCode.type,
      value: discountCode.value,
    })
  } catch (error) {
    console.error("Validate discount code error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

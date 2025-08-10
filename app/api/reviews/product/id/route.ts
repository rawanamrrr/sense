import { NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validate product ID
    if (!params.id || params.id === "undefined") {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      )
    }

    const db = await getDatabase()
    const { searchParams } = new URL(req.url)
    const orderId = searchParams.get("orderId")

    let query: any = { productId: params.id }
    if (orderId) {
      query.orderId = orderId
    }

    const reviews = await db
      .collection("reviews")
      .find(query)
      .sort({ createdAt: -1 })
      .toArray()

    return NextResponse.json({ reviews })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    )
  }
}
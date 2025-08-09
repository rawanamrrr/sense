import { NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = await getDatabase()
    const reviews = await db
      .collection("reviews")
      .find({ productId: params.id })
      .sort({ createdAt: -1 })
      .toArray()

    return NextResponse.json({ reviews })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 })
  }
}

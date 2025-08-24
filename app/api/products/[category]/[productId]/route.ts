import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import type { Product } from "@/lib/models/types"

export async function GET(request: NextRequest, { params }: { params: { category: string; productId: string } }) {
  try {
    const { category, productId } = params
    const db = await getDatabase()

    const product = await db.collection<Product>("products").findOne({
      category: category,
      id: productId,
      isActive: true,
    })

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    return NextResponse.json(product)
  } catch (error) {
    console.error("Get product error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
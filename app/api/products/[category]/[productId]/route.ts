import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import type { Product } from "@/lib/models/types"

const validCategories = ["men", "women", "packages", "outlet"] as const;
type ValidCategory = typeof validCategories[number];

export async function GET(request: NextRequest, { params }: { params: { category: string; productId: string } }) {
  try {
    const { category, productId } = params
    
    // Validate category
    if (!validCategories.includes(category as ValidCategory)) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 })
    }

    const db = await getDatabase()

    const product = await db.collection<Product>("products").findOne({
      category: category as ValidCategory,
      id: productId,
      isActive: true,
    })

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    return NextResponse.json(product, {
      headers: {
        "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
      },
    })
  } catch (error) {
    console.error("Get product error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
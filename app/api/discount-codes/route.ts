import { type NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { getDatabase } from "@/lib/mongodb"
import type { ObjectId } from "mongodb"

interface DiscountCode {
  _id?: ObjectId
  code: string
  type: "percentage" | "fixed"
  value: number
  minOrderAmount?: number
  maxUses?: number
  currentUses: number
  isActive: boolean
  expiresAt?: Date
  createdAt: Date
  updatedAt: Date
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "Authorization required" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any

    if (decoded.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const { code, type, value, minOrderAmount, maxUses, expiresAt } = await request.json()

    if (!code || !type || !value) {
      return NextResponse.json({ error: "Code, type, and value are required" }, { status: 400 })
    }

    const db = await getDatabase()

    // Allow duplicate codes - admin can add same code multiple times
    const discountCode: DiscountCode = {
      code: code.toUpperCase(), // Always store in uppercase for consistency
      type,
      value,
      minOrderAmount: minOrderAmount || 0,
      maxUses: maxUses || null,
      currentUses: 0,
      isActive: true,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection<DiscountCode>("discount").insertOne(discountCode)

    return NextResponse.json({
      success: true,
      discountCode: { ...discountCode, _id: result.insertedId },
    })
  } catch (error) {
    console.error("Create discount code error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "Authorization required" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any

    if (decoded.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const db = await getDatabase()
    const discountCodes = await db.collection<DiscountCode>("discount").find({}).sort({ createdAt: -1 }).toArray()

    return NextResponse.json(discountCodes)
  } catch (error) {
    console.error("Get discount codes error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

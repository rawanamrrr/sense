import { type NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { getDatabase } from "@/lib/mongodb"
import type { ObjectId } from "mongodb"

interface DiscountCode {
  _id?: ObjectId
  code: string
  type: "percentage" | "fixed" | "buyXgetX"
  value: number
  minOrderAmount?: number
  maxUses?: number
  currentUses: number
  isActive: boolean
  expiresAt?: Date | null
  createdAt: Date
  updatedAt: Date
  buyX?: number
  getX?: number
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

    const { code, type, value, minOrderAmount, maxUses, expiresAt, buyX, getX } = await request.json()

    if (!code || !type) {
      return NextResponse.json({ error: "Code and type are required" }, { status: 400 })
    }

    if (type !== "buyXgetX" && !value) {
      return NextResponse.json({ error: "Value is required for this discount type" }, { status: 400 })
    }

    if (type === "buyXgetX" && (!buyX || !getX)) {
      return NextResponse.json({ error: "Buy X and Get X quantities are required" }, { status: 400 })
    }

    const db = await getDatabase()

    const discountCode: DiscountCode = {
      code: code.toUpperCase(),
      type,
      value: type === "buyXgetX" ? 0 : Number(value),
      minOrderAmount: minOrderAmount ? Number(minOrderAmount) : undefined,
      maxUses: maxUses ? Number(maxUses) : undefined,
      currentUses: 0,
      isActive: true,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    if (type === "buyXgetX") {
      discountCode.buyX = Number(buyX)
      discountCode.getX = Number(getX)
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
    const discountCodes = await db
      .collection<DiscountCode>("discount")
      .find({})
      .sort({ createdAt: -1 })
      .toArray()

    return NextResponse.json(discountCodes)
  } catch (error) {
    console.error("Get discount codes error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

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

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Discount code ID is required" }, { status: 400 })
    }

    const db = await getDatabase()
    const { ObjectId } = await import("mongodb")

    const body = await request.json()
    const updateData = {
      ...body,
      updatedAt: new Date(),
    }

    if (updateData.expiresAt) {
      updateData.expiresAt = new Date(updateData.expiresAt)
    }

    const result = await db.collection<DiscountCode>("discount").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: updateData,
      }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Discount code not found" }, { status: 404 })
    }

    const updatedCode = await db.collection<DiscountCode>("discount").findOne({
      _id: new ObjectId(id),
    })

    return NextResponse.json({
      success: true,
      discountCode: updatedCode,
    })
  } catch (error) {
    console.error("Update discount code error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "Authorization required" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any

    if (decoded.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Discount code ID is required" }, { status: 400 })
    }

    const db = await getDatabase()
    const { ObjectId } = await import("mongodb")

    const result = await db.collection<DiscountCode>("discount").deleteOne({
      _id: new ObjectId(id),
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Discount code not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Discount code deleted successfully",
    })
  } catch (error) {
    console.error("Delete discount code error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
import { type NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"
import { getDatabase } from "@/lib/mongodb"
import type { User } from "@/lib/models/types"
import { ObjectId } from "mongodb" 

export async function PATCH(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "Authorization required" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    const { name, email, currentPassword, newPassword } = await request.json()

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 })
    }

    const db = await getDatabase()

    // ✅ Fix: Convert userId to ObjectId
    const userId = new ObjectId(decoded.userId)

    // ✅ Fix: Use ObjectId to find user
    const user = await db.collection<User>("users").findOne({ _id: userId })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // ✅ Fix: Also convert _id in duplicate email check
    if (email !== user.email) {
      const existingUser = await db.collection<User>("users").findOne({
        email,
        _id: { $ne: userId },
      })

      if (existingUser) {
        return NextResponse.json({ error: "Email already in use" }, { status: 400 })
      }
    }

    const updateData: any = {
      name,
      email,
      updatedAt: new Date(),
    }

    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: "Current password is required" }, { status: 400 })
      }

      const isValidPassword = await bcrypt.compare(currentPassword, user.password)
      if (!isValidPassword) {
        return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 })
      }

      const hashedNewPassword = await bcrypt.hash(newPassword, 12)
      updateData.password = hashedNewPassword
    }

    // ✅ Fix: Use ObjectId in update query
    await db.collection<User>("users").updateOne({ _id: userId }, { $set: updateData })

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      user: {
        name,
        email,
        role: user.role,
      },
    })
  } catch (error) {
    console.error("Update profile error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

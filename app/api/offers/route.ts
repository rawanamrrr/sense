import { type NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { getDatabase } from "@/lib/mongodb"

interface Offer {
  _id?: string
  title: string
  description: string
  discountCode?: string
  isActive: boolean
  priority: number
  expiresAt?: Date
  createdAt: Date
  updatedAt: Date
}

export async function GET() {
  try {
    const db = await getDatabase()
    const now = new Date()

    const offers = await db
      .collection<Offer>("offers")
      .find({
        isActive: true,
        $or: [{ expiresAt: { $exists: false } }, { expiresAt: null }, { expiresAt: { $gt: now } }],
      })
      .sort({ priority: -1, createdAt: -1 })
      .toArray()

    return NextResponse.json(offers)
  } catch (error) {
    console.error("Error fetching offers:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
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

    const { title, description, discountCode, priority, expiresAt } = await request.json()

    if (!title || !description) {
      return NextResponse.json({ error: "Title and description are required" }, { status: 400 })
    }

    const db = await getDatabase()

    const newOffer: Omit<Offer, "_id"> = {
      title: title.trim(),
      description: description.trim(),
      discountCode: discountCode ? discountCode.trim().toUpperCase() : null,
      isActive: true,
      priority: Number(priority) || 0,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection<Offer>("offers").insertOne(newOffer)

    // Send email to all users about the new offer
    try {
      const users = await db
        .collection("users")
        .find({
          role: { $ne: "admin" },
          email: { $exists: true, $ne: "" },
        })
        .toArray()

      console.log(`📧 Sending offer emails to ${users.length} users...`)

      if (users.length > 0) {
        // Send emails in batches to avoid overwhelming the system
        const batchSize = 10
        for (let i = 0; i < users.length; i += batchSize) {
          const batch = users.slice(i, i + batchSize)

          const emailPromises = batch.map(async (user) => {
            try {
              const response = await fetch(
                `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/send-offer-email`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    email: user.email,
                    name: user.name || "Valued Customer",
                    offer: {
                      title: newOffer.title,
                      description: newOffer.description,
                      discountCode: newOffer.discountCode,
                    },
                  }),
                },
              )

              if (!response.ok) {
                console.error(`Failed to send email to ${user.email}:`, await response.text())
              } else {
                console.log(`✅ Email sent to ${user.email}`)
              }
            } catch (emailError) {
              console.error(`Error sending email to ${user.email}:`, emailError)
            }
          })

          await Promise.allSettled(emailPromises)

          // Small delay between batches
          if (i + batchSize < users.length) {
            await new Promise((resolve) => setTimeout(resolve, 1000))
          }
        }
      }
    } catch (emailError) {
      console.error("Error in email sending process:", emailError)
      // Don't fail the offer creation if email sending fails
    }

    return NextResponse.json({
      success: true,
      offer: {
        _id: result.insertedId,
        ...newOffer,
      },
      message: "Offer created successfully and emails are being sent to users",
    })
  } catch (error) {
    console.error("Error creating offer:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

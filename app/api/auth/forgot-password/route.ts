import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import jwt from "jsonwebtoken"
import nodemailer from "nodemailer"
import type { User } from "@/lib/models/types"

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const db = await getDatabase()
    const user = await db.collection<User>("users").findOne({ email })

    if (!user) {
      // Don't reveal if user exists or not for security
      return NextResponse.json({ message: "If an account with that email exists, we've sent a reset link." })
    }

    // Generate reset token
    const resetToken = jwt.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET!, { expiresIn: "1h" })

    // Create email transporter
  const transporter = nodemailer.createTransport({

  host: "smtp.mail.me.com",
  port: 587,
  secure: false,
  auth: {
    user: "rawanamr20002@icloud.com",
    pass: process.env.EMAIL_PASS, 
  },
})


    const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/auth/reset-password?token=${resetToken}`

    // Send email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Reset Your Sense Fragrances Password",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #000; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-weight: 300; letter-spacing: 2px;">SENSE</h1>
            <p style="margin: 5px 0 0 0; font-size: 14px;">FRAGRANCES</p>
          </div>
          
          <div style="padding: 40px 20px; background: #f9f9f9;">
            <h2 style="color: #333; font-weight: 300; margin-bottom: 20px;">Reset Your Password</h2>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 30px;">
              We received a request to reset your password for your Sense Fragrances account. 
              Click the button below to create a new password:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background: #000; color: white; padding: 15px 30px; text-decoration: none; 
                        border-radius: 5px; display: inline-block; font-weight: 500;">
                Reset Password
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px; line-height: 1.6;">
              This link will expire in 1 hour for security reasons. If you didn't request this reset, 
              please ignore this email.
            </p>
            
            <p style="color: #666; font-size: 14px; line-height: 1.6;">
              If the button doesn't work, copy and paste this link into your browser:<br>
              <a href="${resetUrl}" style="color: #666; word-break: break-all;">${resetUrl}</a>
            </p>
          </div>
          
          <div style="background: #333; color: #999; padding: 20px; text-align: center; font-size: 12px;">
            <p style="margin: 0;">© 2024 Sense Fragrances. All rights reserved.</p>
          </div>
        </div>
      `,
    })

    return NextResponse.json({ message: "If an account with that email exists, we've sent a reset link." })
  } catch (error) {
    console.error("Forgot password error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import jwt from "jsonwebtoken"
import nodemailer from "nodemailer"
import type { User } from "@/lib/models/types"
import { createEmailTemplate, createEmailSection } from "@/lib/email-templates"

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

    // Check environment variables
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error("❌ [EMAIL] Missing email configuration")
      return NextResponse.json({ 
        error: "Email configuration missing. Please check EMAIL_USER and EMAIL_PASS environment variables." 
      }, { status: 500 })
    }

    // Create email transporter
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, 
      },
    })


    const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.sensefragrance.com'}/auth/reset-password?token=${resetToken}`

    // Create email content sections
    const greeting = createEmailSection({
      content: `
        <h2>Reset Your Password</h2>
        <p>We received a request to reset your password for your Sense Fragrances account. Click the button below to create a new password:</p>
      `
    })

    const resetSection = createEmailSection({
      title: "Password Reset Request",
      highlight: true,
      content: `
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" class="btn btn-primary" style="font-size: 16px;">
            Reset Password
          </a>
        </div>
        
        <div class="email-card" style="background-color: #fef3c7; border-left-color: #f59e0b; margin-top: 20px;">
          <p style="margin: 0;"><strong>Security Notice:</strong></p>
          <p style="margin: 10px 0 0 0;">This link will expire in 1 hour for security reasons. If you didn't request this reset, please ignore this email.</p>
        </div>
      `
    })

    const troubleshootingSection = createEmailSection({
      title: "Need Help?",
      content: `
        <p style="margin-bottom: 15px;">If the button doesn't work, copy and paste this link into your browser:</p>
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; word-break: break-all; font-family: monospace; font-size: 14px;">
          ${resetUrl}
        </div>
        
        <hr class="divider">
        
        <p style="text-align: center;">
          Still having trouble? <a href="mailto:${process.env.EMAIL_USER}">Contact our support team</a>
        </p>
      `
    })

    const emailContent = greeting + resetSection + troubleshootingSection

    // Send email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Reset Your Sense Fragrances Password",
      html: createEmailTemplate({
        title: "Reset Your Password - Sense Fragrances",
        preheader: "Reset your password to regain access to your account",
        content: emailContent,
        theme: { mode: 'light' }
      })
    })

    return NextResponse.json({ message: "If an account with that email exists, we've sent a reset link." })
  } catch (error) {
    console.error("Forgot password error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

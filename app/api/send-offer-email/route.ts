import { type NextRequest, NextResponse } from "next/server"
import nodemailer from "nodemailer"
import { createEmailTemplate, createEmailSection } from "@/lib/email-templates"

export async function POST(request: NextRequest) {
  try {
    const { email, name, offer } = await request.json()

    if (!email || !name || !offer) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 })
    }

    // Create email transporter
    const transporter = nodemailer.createTransport({
      host: "smtp.mail.me.com",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    })

    // Verify transporter configuration
    try {
      await transporter.verify()
    } catch (verifyError) {
      console.error("Email transporter verification failed:", verifyError)
      return NextResponse.json({ error: "Email service configuration error" }, { status: 500 })
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"

    // Create email content sections
    const greeting = createEmailSection({
      content: `
        <div style="text-align: center; margin-bottom: 30px;">
          <h1>${offer.title}</h1>
          <div style="width: 60px; height: 3px; background: currentColor; margin: 0 auto;"></div>
        </div>
        
        <p>Dear ${name},</p>
        <p>${offer.description}</p>
      `
    })

    const discountSection = offer.discountCode ? createEmailSection({
      title: "Use Discount Code",
      highlight: true,
      content: `
        <div style="text-align: center;">
          <div class="status-badge status-badge-info" style="font-family: 'Courier New', monospace; font-size: 20px; letter-spacing: 2px; padding: 15px 25px;">
            ${offer.discountCode}
          </div>
        </div>
      `
    }) : ''

    const ctaSection = createEmailSection({
      content: `
        <div style="text-align: center; margin: 30px 0;">
          <a href="${baseUrl}/products" class="btn btn-primary" style="font-size: 16px; letter-spacing: 1px; text-transform: uppercase;">
            Shop Now
          </a>
        </div>
        
        <hr class="divider">
        
        <p style="text-align: center; margin-bottom: 20px;">
          Discover our exclusive collections:
        </p>
        
        <div style="text-align: center;">
          <a href="${baseUrl}/products/men" style="margin: 0 15px;">Men's Collection</a>
          <span style="color: #ccc;">•</span>
          <a href="${baseUrl}/products/women" style="margin: 0 15px;">Women's Collection</a>
          <span style="color: #ccc;">•</span>
          <a href="${baseUrl}/products/packages" style="margin: 0 15px;">Gift Sets</a>
          <span style="color: #ccc;">•</span>
          <a href="${baseUrl}/products/outlet" style="margin: 0 15px;">Outlet Collection</a>
        </div>
      `
    })

    const emailContent = greeting + discountSection + ctaSection

    // Send offer email
    await transporter.sendMail({
      from: `"Sense Fragrances" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `🎉 New Exclusive Offer: ${offer.title}`,
      html: createEmailTemplate({
        title: "New Offer - Sense Fragrances",
        preheader: `${offer.title} - Don't miss this exclusive offer!`,
        content: emailContent,
        theme: { mode: 'light' }
      })
    })

    return NextResponse.json({
      success: true,
      message: "Offer email sent successfully",
    })
  } catch (error) {
    console.error("Offer email error:", error)
    return NextResponse.json(
      {
        error: "Failed to send offer email",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

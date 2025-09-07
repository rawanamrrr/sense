import { type NextRequest, NextResponse } from "next/server"
import nodemailer from "nodemailer"
import { createEmailTemplate, createEmailSection, createProductCard } from "@/lib/email-templates"

export async function POST(request: NextRequest) {
  try {
    const { order, product } = await request.json()

    if (!order || !product) {
      return NextResponse.json({ error: "Order and product are required" }, { status: 400 })
    }

    // Check environment variables
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error("❌ [EMAIL] Missing email configuration")
      return NextResponse.json({ 
        error: "Email configuration missing. Please check EMAIL_USER and EMAIL_PASS environment variables." 
      }, { status: 500 })
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    })

    const customerEmail = order.shippingAddress.email
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

    // Create email content sections
    const greeting = createEmailSection({
      content: `
        <div style="text-align: center; margin-bottom: 30px;">
          <h1>How was your experience?</h1>
          <p style="font-size: 18px; margin: 10px 0;">We'd love to hear from you!</p>
        </div>
        
        <h2>Hello ${order.shippingAddress.name},</h2>
        <p>Thank you for choosing Sense Fragrances! We hope you're enjoying your new fragrance.</p>
      `
    })

    const productSection = createEmailSection({
      title: "Your Recent Purchase",
      highlight: true,
      content: `
        ${createProductCard({
          name: product.name,
          description: `Order #${order.id} • Your honest feedback helps other customers make informed decisions and helps us improve our products and service.`
        })}
        
        <div style="text-align: center; margin: 20px 0;">
          <div style="color: #FFD700; font-size: 28px; letter-spacing: 5px;">★★★★★</div>
        </div>
        
        <h4>What did you think?</h4>
        <ul style="margin: 15px 0; padding-left: 20px; line-height: 1.8;">
          <li>How does the fragrance smell?</li>
          <li>How long does it last?</li>
          <li>Would you recommend it to others?</li>
          <li>How was your overall experience?</li>
        </ul>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${baseUrl}/account" class="btn btn-primary" style="font-size: 16px;">
            Leave Your Review
          </a>
        </div>
      `
    })

    const whyReviewSection = createEmailSection({
      title: "Why leave a review?",
      content: `
        <ul style="margin: 0; padding-left: 20px; line-height: 1.8;">
          <li>Help other fragrance lovers discover great products</li>
          <li>Share your experience with the community</li>
          <li>Help us improve our products and service</li>
          <li>Get exclusive offers and updates</li>
        </ul>
        
        <hr class="divider">
        
        <p style="text-align: center;">
          Your review will be visible on our website and will help other customers make informed decisions.
        </p>
        
        <p style="text-align: center;">
          Have questions? <a href="mailto:${process.env.EMAIL_USER}">Contact our support team</a>
        </p>
        
        <p style="text-align: center; margin-top: 30px; font-weight: 600;">
          Thank you for being part of the Sense Fragrances family!
        </p>
      `
    })

    const emailContent = greeting + productSection + whyReviewSection

    const htmlContent = createEmailTemplate({
      title: "Share Your Experience - Sense Fragrances",
      preheader: `How was your ${product.name}? Share your experience with us!`,
      content: emailContent,
      theme: { mode: 'light' }
    })

    // Send email
    await transporter.sendMail({
      from: `"Sense Fragrances" <${process.env.EMAIL_USER}>`,
      to: customerEmail,
      subject: `How was your ${product.name}? Share your experience!`,
      html: htmlContent,
    })

    console.log(`✅ Review reminder email sent to ${customerEmail} for product: ${product.name}`)

    return NextResponse.json({ success: true, message: "Review reminder email sent" })
  } catch (error) {
    console.error("❌ Error sending review reminder email:", error)
    return NextResponse.json({ error: "Failed to send review reminder email" }, { status: 500 })
  }
}


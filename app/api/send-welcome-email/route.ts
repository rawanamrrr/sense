import { type NextRequest, NextResponse } from "next/server"
import nodemailer from "nodemailer"
import { getDatabase } from "@/lib/mongodb"
import { createEmailTemplate, createEmailSection } from "@/lib/email-templates"

export async function POST(request: NextRequest) {
  try {
    const { email, name } = await request.json()

    if (!email || !name) {
      return NextResponse.json({ error: "Email and name are required" }, { status: 400 })
    }

    // Get active offers
    const db = await getDatabase()
    const offers = await db
      .collection("offers")
      .find({
        isActive: true,
        $or: [{ expiresAt: { $exists: false } }, { expiresAt: null }, { expiresAt: { $gt: new Date() } }],
      })
      .sort({ priority: -1 })
      .limit(3)
      .toArray()

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

    // Generate offers section
    const offersSection = offers.length > 0 ? createEmailSection({
      title: "🎁 Current Offers Just For You!",
      highlight: true,
      content: offers.map((offer) => `
        <div class="email-card" style="margin: 15px 0;">
          <h4 style="margin: 0 0 10px 0;">${offer.title}</h4>
          <p style="margin: 0 0 15px 0;">${offer.description}</p>
          ${offer.discountCode ? `
            <div class="status-badge status-badge-info" style="font-family: monospace;">
              Code: ${offer.discountCode}
            </div>
          ` : ''}
        </div>
      `).join('')
    }) : ''

    // Create email content sections
    const greeting = createEmailSection({
      content: `
        <h2>Welcome to Sense Fragrances, ${name}!</h2>
        <p>Thank you for joining our exclusive fragrance community. We're thrilled to have you discover our carefully curated collection of premium scents.</p>
      `
    })

    const welcomeBenefits = createEmailSection({
      title: "🎁 Welcome Benefits",
      highlight: true,
      content: `
        <div style="display: grid; gap: 15px; margin: 20px 0;">
          <div class="email-card" style="margin: 0;">
            <strong>15% OFF</strong> your first order with code: <strong>WELCOME15</strong>
          </div>
          
          <div class="email-card" style="margin: 0;">
            <strong>Free Shipping</strong> on orders over 2000 EGP
          </div>
          
          <div class="email-card" style="margin: 0;">
            <strong>Free Sample</strong> with every purchase this month
          </div>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.sensefragrance.com'}/products" class="btn btn-primary">
            Explore Our Collection
          </a>
        </div>
      `
    })

    const whyChooseUs = createEmailSection({
      title: "Why Choose Sense Fragrances?",
      content: `
        <ul style="margin: 0; padding-left: 20px; line-height: 1.8;">
          <li>Premium quality ingredients sourced globally</li>
          <li>Unique and sophisticated scent profiles</li>
          <li>Easy returns within 30 days</li>
          <li>Expert fragrance consultation available</li>
          <li>Exclusive member-only offers and early access</li>
        </ul>
        
        <hr class="divider">
        
        <p style="text-align: center; margin: 0;">
          Stay connected with us for the latest releases, exclusive offers, and fragrance tips. Follow us on social media and never miss an update!
        </p>
      `
    })

    const emailContent = greeting + offersSection + welcomeBenefits + whyChooseUs

    // Send welcome email with offers
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Welcome to Sense Fragrances - Exclusive Offers Inside!",
      html: createEmailTemplate({
        title: "Welcome to Sense Fragrances",
        preheader: `Welcome ${name}! Discover exclusive offers and premium fragrances.`,
        content: emailContent,
        theme: { mode: 'light' }
      })
    })

    return NextResponse.json({ message: "Welcome email sent successfully" })
  } catch (error) {
    console.error("Welcome email error:", error)
    return NextResponse.json({ error: "Failed to send welcome email" }, { status: 500 })
  }
}

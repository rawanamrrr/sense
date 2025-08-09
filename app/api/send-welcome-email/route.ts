import { type NextRequest, NextResponse } from "next/server"
import nodemailer from "nodemailer"
import { getDatabase } from "@/lib/mongodb"

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

    // Create email transporter
    const transporter = nodemailer.createTransport({
          host: "smtp.mail.me.com",
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        })

    // Generate offers HTML
    const offersHtml =
      offers.length > 0
        ? `
      <div style="background: #f0f0f0; padding: 30px; border-radius: 10px; margin: 30px 0;">
        <h3 style="color: #333; margin-top: 0; font-weight: 500; text-align: center;">🎁 Current Offers Just For You!</h3>
        ${offers
          .map(
            (offer) => `
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #000;">
            <h4 style="color: #000; margin: 0 0 10px 0; font-size: 16px;">${offer.title}</h4>
            <p style="color: #666; margin: 0 0 10px 0; font-size: 14px;">${offer.description}</p>
            ${
              offer.discountCode
                ? `
              <div style="background: #000; color: white; padding: 8px 12px; border-radius: 4px; display: inline-block; font-family: monospace; font-size: 12px;">
                Code: ${offer.discountCode}
              </div>
            `
                : ""
            }
          </div>
        `,
          )
          .join("")}
      </div>
    `
        : ""

    // Send welcome email with offers
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Welcome to Sense Fragrances - Exclusive Offers Inside!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #000; color: white; padding: 30px; text-align: center;">
            <h1 style="margin: 0; font-weight: 300; letter-spacing: 3px; font-size: 28px;">SENSE</h1>
            <p style="margin: 5px 0 0 0; font-size: 16px; letter-spacing: 2px;">FRAGRANCES</p>
          </div>
          
          <div style="padding: 40px 20px; background: #f9f9f9;">
            <h2 style="color: #333; font-weight: 300; margin-bottom: 20px;">Welcome to Sense Fragrances, ${name}!</h2>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 30px;">
              Thank you for joining our exclusive fragrance community. We're thrilled to have you discover 
              our carefully curated collection of premium scents.
            </p>
            
            ${offersHtml}
            
            <div style="background: white; padding: 30px; border-radius: 10px; margin: 30px 0; border-left: 4px solid #000;">
              <h3 style="color: #333; margin-top: 0; font-weight: 500;">🎁 Welcome Benefits</h3>
              
              <div style="margin: 20px 0;">
                <div style="background: #f0f0f0; padding: 15px; border-radius: 5px; margin: 10px 0;">
                  <strong style="color: #000;">15% OFF</strong> your first order with code: <strong>WELCOME15</strong>
                </div>
                
                <div style="background: #f0f0f0; padding: 15px; border-radius: 5px; margin: 10px 0;">
                  <strong style="color: #000;">Free Shipping</strong> on orders over 2000 EGP
                </div>
                
                <div style="background: #f0f0f0; padding: 15px; border-radius: 5px; margin: 10px 0;">
                  <strong style="color: #000;">Free Sample</strong> with every purchase this month
                </div>
              </div>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_BASE_URL}/products" 
                 style="background: #000; color: white; padding: 15px 30px; text-decoration: none; 
                        border-radius: 5px; display: inline-block; font-weight: 500;">
                Explore Our Collection
              </a>
            </div>
            
            <div style="border-top: 1px solid #ddd; padding-top: 30px; margin-top: 30px;">
              <h3 style="color: #333; font-weight: 500; margin-bottom: 15px;">Why Choose Sense Fragrances?</h3>
              <ul style="color: #666; line-height: 1.8; padding-left: 20px;">
                <li>Premium quality ingredients sourced globally</li>
                <li>Unique and sophisticated scent profiles</li>
                <li>Easy returns within 30 days</li>
                <li>Expert fragrance consultation available</li>
                <li>Exclusive member-only offers and early access</li>
              </ul>
            </div>
            
            <p style="color: #666; font-size: 14px; line-height: 1.6; margin-top: 30px;">
              Stay connected with us for the latest releases, exclusive offers, and fragrance tips. 
              Follow us on social media and never miss an update!
            </p>
          </div>
          
          <div style="background: #333; color: #999; padding: 20px; text-align: center;">
            <p style="margin: 0; font-size: 14px;">
              © 2024 Sense Fragrances. All rights reserved.<br>
              You're receiving this because you created an account with us.
            </p>
            <p style="margin: 10px 0 0 0; font-size: 12px;">
              <a href="${process.env.NEXT_PUBLIC_BASE_URL}/contact" style="color: #999;">Contact Us</a> | 
              <a href="${process.env.NEXT_PUBLIC_BASE_URL}/about" style="color: #999;">About Us</a>
            </p>
          </div>
        </div>
      `,
    })

    return NextResponse.json({ message: "Welcome email sent successfully" })
  } catch (error) {
    console.error("Welcome email error:", error)
    return NextResponse.json({ error: "Failed to send welcome email" }, { status: 500 })
  }
}

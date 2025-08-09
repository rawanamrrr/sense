import { type NextRequest, NextResponse } from "next/server"
import nodemailer from "nodemailer"

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

    // Send offer email
    await transporter.sendMail({
      from: `"Sense Fragrances" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `🎉 New Exclusive Offer: ${offer.title}`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Offer - Sense Fragrances</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #000 0%, #333 100%); color: white; padding: 40px 20px; text-align: center;">
              <h1 style="margin: 0; font-weight: 300; letter-spacing: 4px; font-size: 32px;">SENSE</h1>
              <p style="margin: 8px 0 0 0; font-size: 14px; letter-spacing: 3px; opacity: 0.9;">FRAGRANCES</p>
            </div>
            
            <!-- Main Content -->
            <div style="padding: 40px 30px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h2 style="color: #333; font-weight: 400; margin: 0 0 10px 0; font-size: 28px;">
                  ${offer.title}
                </h2>
                <div style="width: 60px; height: 3px; background: #000; margin: 0 auto;"></div>
              </div>
              
              <p style="color: #666; line-height: 1.6; margin-bottom: 20px; font-size: 16px;">
                Dear ${name},
              </p>
              
              <p style="color: #666; line-height: 1.8; margin-bottom: 30px; font-size: 16px;">
                ${offer.description}
              </p>
              
              ${
                offer.discountCode
                  ? `
                <div style="background: #f8f8f8; border-left: 4px solid #000; padding: 20px; margin: 30px 0; text-align: center;">
                  <p style="margin: 0 0 10px 0; font-size: 14px; color: #666; text-transform: uppercase; letter-spacing: 1px;">Use Discount Code</p>
                  <p style="margin: 0; font-family: 'Courier New', monospace; font-size: 24px; font-weight: bold; color: #000; letter-spacing: 3px;">
                    ${offer.discountCode}
                  </p>
                </div>
              `
                  : ""
              }
              
              <div style="text-align: center; margin: 40px 0;">
                <a href="${baseUrl}/products" 
                   style="background: #000; color: white; padding: 16px 32px; text-decoration: none; 
                          border-radius: 4px; display: inline-block; font-weight: 500; font-size: 16px; 
                          letter-spacing: 1px; text-transform: uppercase;">
                  Shop Now
                </a>
              </div>
              
              <div style="border-top: 1px solid #eee; padding-top: 30px; margin-top: 40px;">
                <p style="color: #999; font-size: 14px; line-height: 1.6; text-align: center; margin: 0 0 20px 0;">
                  Discover our exclusive collections:
                </p>
                
                <div style="text-align: center;">
                  <a href="${baseUrl}/products/men" style="color: #000; text-decoration: none; margin: 0 15px; font-size: 14px;">Men's Collection</a>
                  <span style="color: #ccc;">•</span>
                  <a href="${baseUrl}/products/women" style="color: #000; text-decoration: none; margin: 0 15px; font-size: 14px;">Women's Collection</a>
                  <span style="color: #ccc;">•</span>
                  <a href="${baseUrl}/products/packages" style="color: #000; text-decoration: none; margin: 0 15px; font-size: 14px;">Gift Sets</a>
                </div>
              </div>
            </div>
            
            <!-- Footer -->
            <div style="background: #333; color: #999; padding: 30px 20px; text-align: center;">
              <p style="margin: 0 0 15px 0; font-size: 14px;">
                © 2024 Sense Fragrances. All rights reserved.
              </p>
              <p style="margin: 0; font-size: 12px; line-height: 1.5;">
                You're receiving this email because you're a valued member of our community.<br>
                <a href="${baseUrl}/contact" style="color: #999;">Contact Us</a> | 
                <a href="${baseUrl}/about" style="color: #999;">About Us</a>
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
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

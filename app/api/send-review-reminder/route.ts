import { type NextRequest, NextResponse } from "next/server"
import nodemailer from "nodemailer"

export async function POST(request: NextRequest) {
  try {
    const { order, product } = await request.json()

    if (!order || !product) {
      return NextResponse.json({ error: "Order and product are required" }, { status: 400 })
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: "smtp.mail.me.com",
      port: 587,
      secure: false,
      auth: {
        user: "rawanamr20002@icloud.com",
        pass: process.env.EMAIL_PASS,
      },
    })

    const customerEmail = order.shippingAddress.email
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

    // Create HTML email content
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Share Your Experience - Sense Fragrances</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #000; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .product-card { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #000; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
            .cta-button {
                display: inline-block;
                background: #000;
                color: white;
                padding: 15px 30px;
                text-decoration: none;
                border-radius: 8px;
                margin: 20px 0;
                font-weight: bold;
                font-size: 16px;
            }
            .stars { color: #FFD700; font-size: 24px; margin: 10px 0; }
            .product-image { width: 80px; height: 80px; background: #f0f0f0; border-radius: 8px; display: inline-block; margin-right: 15px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>How was your experience?</h1>
                <p>We'd love to hear from you!</p>
            </div>
            
            <div class="content">
                <h2>Hello ${order.shippingAddress.name},</h2>
                <p>Thank you for choosing Sense Fragrances! We hope you're enjoying your new fragrance.</p>
                
                <div class="product-card">
                    <div style="display: flex; align-items: center; margin-bottom: 15px;">
                        <div class="product-image"></div>
                        <div>
                            <h3 style="margin: 0 0 5px 0;">${product.name}</h3>
                            <p style="margin: 0; color: #666;">Order #${order.id}</p>
                        </div>
                    </div>
                    
                    <p>Your honest feedback helps other customers make informed decisions and helps us improve our products and service.</p>
                    
                    <div class="stars">★★★★★</div>
                    
                    <p><strong>What did you think?</strong></p>
                    <ul>
                        <li>How does the fragrance smell?</li>
                        <li>How long does it last?</li>
                        <li>Would you recommend it to others?</li>
                        <li>How was your overall experience?</li>
                    </ul>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${baseUrl}/account" class="cta-button">Leave Your Review</a>
                </div>
                
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h4 style="margin-top: 0;">Why leave a review?</h4>
                    <ul style="margin-bottom: 0;">
                        <li>Help other fragrance lovers discover great products</li>
                        <li>Share your experience with the community</li>
                        <li>Help us improve our products and service</li>
                        <li>Get exclusive offers and updates</li>
                    </ul>
                </div>
                
                <p>Your review will be visible on our website and will help other customers make informed decisions.</p>
                
                <p>If you have any questions or need assistance, please don't hesitate to contact us at <a href="mailto:rawanamr20002@icloud.com">rawanamr20002@icloud.com</a></p>
                
                <p>Thank you for being part of the Sense Fragrances family!</p>
            </div>
            
            <div class="footer">
                <p>Thank you for choosing Sense Fragrances!</p>
                <p>© 2024 Sense Fragrances. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    `

    // Send email
    await transporter.sendMail({
      from: '"Sense Fragrances" <rawanamr20002@icloud.com>',
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


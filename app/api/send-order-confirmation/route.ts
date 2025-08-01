import { type NextRequest, NextResponse } from "next/server"
import nodemailer from "nodemailer"

export async function POST(request: NextRequest) {
  try {
    const { order, customerEmail } = await request.json()

    if (!order || !customerEmail) {
      return NextResponse.json({ error: "Order and customer email are required" }, { status: 400 })
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

    // Calculate totals
    const subtotal = order.items.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0)
    const shipping = order.total - subtotal + (order.discountAmount || 0)

    // Create HTML email content
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Confirmation - Sense Fragrances</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #000; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .order-details { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
            .item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
            .total { font-weight: bold; font-size: 18px; padding-top: 10px; border-top: 2px solid #000; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
            .status-badge { background: #4CAF50; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Order Confirmation</h1>
                <p>Thank you for your order!</p>
            </div>
            
            <div class="content">
                <h2>Hello ${order.shippingAddress.name},</h2>
                <p>We've received your order and it's being processed. Here are your order details:</p>
                
                <div class="order-details">
                    <h3>Order #${order.id} <span class="status-badge">Confirmed</span></h3>
                    <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
                    <p><strong>Payment Method:</strong> Cash on Delivery</p>
                    
                    <h4>Items Ordered:</h4>
                    ${order.items
                      .map(
                        (item: any) => `
                        <div class="item">
                            <div>
                                <strong>${item.name}</strong><br>
                                <small>${item.size} (${item.volume}) × ${item.quantity}</small>
                            </div>
                            <div>${(item.price * item.quantity).toFixed(2)} EGP</div>
                        </div>
                    `,
                      )
                      .join("")}
                    
                    <div class="item">
                        <div>Subtotal</div>
                        <div>${subtotal.toFixed(2)} EGP</div>
                    </div>
                    
                    ${
                      order.discountAmount
                        ? `
                        <div class="item" style="color: green;">
                            <div>Discount (${order.discountCode})</div>
                            <div>-${order.discountAmount.toFixed(2)} EGP</div>
                        </div>
                    `
                        : ""
                    }
                    
                    <div class="item">
                        <div>Shipping</div>
                        <div>${shipping > 0 ? `${shipping.toFixed(2)} EGP` : "Free"}</div>
                    </div>
                    
                    <div class="item total">
                        <div>Total</div>
                        <div>${order.total.toFixed(2)} EGP</div>
                    </div>
                </div>
                
                <div class="order-details">
                    <h4>Shipping Address:</h4>
                    <p>
                        ${order.shippingAddress.name}<br>
                        ${order.shippingAddress.address}<br>
                        ${order.shippingAddress.city}, ${order.shippingAddress.governorate}<br>
                        ${order.shippingAddress.postalCode || ""}<br>
                        Phone: ${order.shippingAddress.phone}
                    </p>
                </div>
                
                <h3>What's Next?</h3>
                <ul>
                    <li>We'll process your order within 1-2 business days</li>
                    <li>You'll receive a shipping confirmation with tracking details</li>
                    <li>Your order will be delivered within 3-7 business days</li>
                    <li>Payment will be collected upon delivery</li>
                </ul>
                
                <p>If you have any questions about your order, please contact us at <a href="mailto:rawanamr20002@icloud.com">rawanamr20002@icloud.com</a></p>
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
      subject: `Order Confirmation #${order.id} - Sense Fragrances`,
      html: htmlContent,
    })

    console.log("✅ Order confirmation email sent to:", customerEmail)

    return NextResponse.json({ success: true, message: "Confirmation email sent" })
  } catch (error) {
    console.error("❌ Error sending order confirmation email:", error)
    return NextResponse.json({ error: "Failed to send confirmation email" }, { status: 500 })
  }
}

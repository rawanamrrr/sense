import { type NextRequest, NextResponse } from "next/server"
import nodemailer from "nodemailer"

export async function POST(request: NextRequest) {
  try {
    const { order, previousStatus, newStatus } = await request.json()

    if (!order || !newStatus) {
      return NextResponse.json({ error: "Order and new status are required" }, { status: 400 })
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

    // Get status-specific content
    const statusContent = getStatusContent(newStatus, order)
    const customerEmail = order.shippingAddress.email

    // Create HTML email content
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Update - Sense Fragrances</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #000; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .order-details { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
            .status-badge { 
                background: ${statusContent.badgeColor}; 
                color: white; 
                padding: 8px 16px; 
                border-radius: 20px; 
                font-size: 14px; 
                font-weight: bold;
                display: inline-block;
                margin-bottom: 10px;
            }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
            .cta-button {
                display: inline-block;
                background: #000;
                color: white;
                padding: 12px 24px;
                text-decoration: none;
                border-radius: 6px;
                margin: 20px 0;
                font-weight: bold;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Order Update</h1>
                <p>Your order status has been updated</p>
            </div>
            
            <div class="content">
                <h2>Hello ${order.shippingAddress.name},</h2>
                <p>Your order status has been updated:</p>
                
                <div class="order-details">
                    <h3>Order #${order.id}</h3>
                    <div class="status-badge">${statusContent.title}</div>
                    <p><strong>Previous Status:</strong> ${previousStatus || 'New Order'}</p>
                    <p><strong>Current Status:</strong> ${newStatus}</p>
                    <p><strong>Updated:</strong> ${new Date().toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    })}</p>
                </div>
                
                <div class="order-details">
                    <h4>Order Summary:</h4>
                    ${order.items
                      .map(
                        (item: any) => `
                        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee;">
                            <div>
                                <strong>${item.name}</strong><br>
                                <small>${item.size} (${item.volume}) × ${item.quantity}</small>
                            </div>
                            <div>${(item.price * item.quantity).toFixed(2)} EGP</div>
                        </div>
                    `,
                      )
                      .join("")}
                    <div style="font-weight: bold; font-size: 18px; padding-top: 10px; border-top: 2px solid #000; text-align: right;">
                        Total: ${order.total.toFixed(2)} EGP
                    </div>
                </div>
                
                ${statusContent.description}
                
                ${statusContent.cta ? `
                <div style="text-align: center;">
                    <a href="${statusContent.cta.url}" class="cta-button">${statusContent.cta.text}</a>
                </div>
                ` : ''}
                
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
      subject: `Order Update #${order.id} - ${statusContent.title}`,
      html: htmlContent,
    })

    console.log(`✅ Order update email sent to ${customerEmail} - Status: ${newStatus}`)

    return NextResponse.json({ success: true, message: "Update email sent" })
  } catch (error) {
    console.error("❌ Error sending order update email:", error)
    return NextResponse.json({ error: "Failed to send update email" }, { status: 500 })
  }
}

function getStatusContent(status: string, order: any) {
  switch (status) {
    case 'processing':
      return {
        title: 'Processing',
        badgeColor: '#FFA500',
        description: `
          <h3>Your order is being processed!</h3>
          <p>We're carefully preparing your fragrances for shipment. This usually takes 1-2 business days.</p>
          <ul>
            <li>Quality checking each product</li>
            <li>Packaging with care</li>
            <li>Preparing shipping documents</li>
          </ul>
        `
      }
    
    case 'shipped':
      return {
        title: 'Shipped',
        badgeColor: '#2196F3',
        description: `
          <h3>Your order is on its way!</h3>
          <p>Your fragrances have been shipped and are heading to your address. Delivery typically takes 3-7 business days.</p>
          <ul>
            <li>Package has been picked up by courier</li>
            <li>Estimated delivery: 3-7 business days</li>
            <li>You'll receive a call from the courier before delivery</li>
          </ul>
        `
      }
    
    case 'delivered':
      return {
        title: 'Delivered',
        badgeColor: '#4CAF50',
        description: `
          <h3>Your order has been delivered!</h3>
          <p>We hope you love your new fragrances! Please take a moment to share your experience with us.</p>
          <ul>
            <li>Enjoy your new fragrances</li>
            <li>Share your experience with a review</li>
            <li>Help other customers make informed decisions</li>
          </ul>
        `,
        cta: {
          text: 'Leave a Review',
          url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/account`
        }
      }
    
    case 'cancelled':
      return {
        title: 'Cancelled',
        badgeColor: '#F44336',
        description: `
          <h3>Order Cancelled</h3>
          <p>Your order has been cancelled. If you have any questions about this cancellation, please contact us.</p>
          <p>If you'd like to place a new order, we'd be happy to help!</p>
        `
      }
    
    default:
      return {
        title: 'Status Updated',
        badgeColor: '#9E9E9E',
        description: `
          <h3>Order Status Updated</h3>
          <p>Your order status has been updated to: <strong>${status}</strong></p>
        `
      }
  }
}


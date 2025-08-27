import { type NextRequest, NextResponse } from "next/server"
import nodemailer from "nodemailer"
import { createEmailTemplate, createEmailSection } from "@/lib/email-templates"

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

    // Create email content sections
    const greeting = createEmailSection({
      content: `
        <h2>Hello ${order.shippingAddress.name},</h2>
        <p>Your order status has been updated. Here's what's happening with your order:</p>
      `
    })

    const orderStatusSection = createEmailSection({
      title: `Order #${order.id}`,
      highlight: true,
      content: `
        <div style="margin-bottom: 20px;">
          <span class="status-badge" style="background: ${statusContent.badgeColor};">${statusContent.title}</span>
        </div>
        
        <p><strong>Previous Status:</strong> ${previousStatus || 'New Order'}</p>
        <p><strong>Current Status:</strong> ${newStatus}</p>
        <p><strong>Updated:</strong> ${new Date().toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}</p>
      `
    })

    const orderSummarySection = createEmailSection({
      title: "Order Summary",
      content: `
        ${order.items
          .map(
            (item: any) => `
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid currentColor; opacity: 0.3;">
                <div>
                    <strong>${item.name}</strong><br>
                    <small>${item.size} (${item.volume}) × ${item.quantity}</small>
                </div>
                <div>${(item.price * item.quantity).toFixed(2)} EGP</div>
            </div>
        `,
          )
          .join("")}
        <div style="font-weight: bold; font-size: 18px; padding-top: 15px; border-top: 2px solid currentColor; text-align: right; margin-top: 15px;">
            Total: ${order.total.toFixed(2)} EGP
        </div>
      `
    })

    const statusDescriptionSection = statusContent.description ? createEmailSection({
      content: statusContent.description
    }) : ''

    const ctaSection = createEmailSection({
      content: `
        ${statusContent.cta ? `
        <div style="text-align: center; margin: 30px 0;">
          <a href="${statusContent.cta.url}" class="btn btn-primary">${statusContent.cta.text}</a>
        </div>
        ` : ''}
        
        <hr class="divider">
        
        <p style="text-align: center;">
          Have questions about your order? <a href="mailto:rawanamr20002@icloud.com">Contact our support team</a>
        </p>
      `
    })

    const emailContent = greeting + orderStatusSection + orderSummarySection + statusDescriptionSection + ctaSection

    const htmlContent = createEmailTemplate({
      title: "Order Update - Sense Fragrances",
      preheader: `Order #${order.id} status: ${newStatus}`,
      content: emailContent,
      theme: { mode: 'light' }
    })

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


import { type NextRequest, NextResponse } from "next/server"
import nodemailer from "nodemailer"
import { createEmailTemplate, createEmailSection, createOrderItemsTable } from "@/lib/email-templates"

export async function POST(request: NextRequest) {
  try {
    const { order } = await request.json()

    if (!order) {
      return NextResponse.json({ error: "Order is required" }, { status: 400 })
    }

    // Get customer email from order details
    const customerEmail = order.shippingAddress?.email

    if (!customerEmail) {
      return NextResponse.json({ error: "Customer email not found in order details" }, { status: 400 })
    }

    console.log("📧 [EMAIL] Order confirmation request received")
    console.log("📧 [EMAIL] Order ID:", order.id)
    console.log("📧 [EMAIL] Customer Email:", customerEmail)
    console.log("📧 [EMAIL] Order structure:", JSON.stringify(order, null, 2))

    // Check environment variables
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error("❌ [EMAIL] Missing email configuration")
      console.error("   EMAIL_USER:", !!process.env.EMAIL_USER)
      console.error("   EMAIL_PASS:", !!process.env.EMAIL_PASS)
      return NextResponse.json({ 
        error: "Email configuration missing. Please check EMAIL_USER and EMAIL_PASS environment variables." 
      }, { status: 500 })
    }

    // Create transporter
    console.log("📧 [EMAIL] Creating email transporter...")
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    })

    // Verify transporter configuration
    console.log("📧 [EMAIL] Verifying transporter configuration...")
    try {
      await transporter.verify()
      console.log("✅ [EMAIL] Transporter verification successful")
    } catch (verifyError) {
      console.error("❌ [EMAIL] Transporter verification failed:", verifyError)
      return NextResponse.json({ 
        error: "Email service configuration error. Please check your email credentials.", 
        details: verifyError instanceof Error ? verifyError.message : String(verifyError)
      }, { status: 500 })
    }

    // Calculate totals
    const subtotal = order.items.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0)
    const shipping = order.total - subtotal + (order.discountAmount || 0)

    // Create order items for the table
    console.log("📧 [EMAIL] Processing order items...")
    console.log("📧 [EMAIL] Order items:", order.items)
    
    const orderItems = order.items.map((item: any) => {
      console.log("📧 [EMAIL] Processing item:", item)
      return {
        name: `${item.name}${item.size ? ` - ${item.size}` : ''}${item.volume ? ` (${item.volume})` : ''}`,
        quantity: item.quantity || 1,
        price: item.price || 0,
        total: (item.price || 0) * (item.quantity || 1)
      }
    })

    // Create email content sections
    console.log("📧 [EMAIL] Creating greeting section...")
    const greeting = createEmailSection({
      content: `
        <h2>Hello ${order.shippingAddress?.name || 'Valued Customer'},</h2>
        <p>Thank you for your order! We've received your order and it's being processed. Here are your order details:</p>
      `
    })

    console.log("📧 [EMAIL] Creating order summary section...")
    let orderTable
    try {
      orderTable = createOrderItemsTable(orderItems)
      console.log("📧 [EMAIL] Order table created successfully")
    } catch (tableError) {
      console.error("📧 [EMAIL] Error creating order table:", tableError)
      orderTable = '<p>Order items will be listed in a separate email.</p>'
    }

    const orderSummary = createEmailSection({
      title: `Order #${order.id}`,
      highlight: true,
      content: `
        <div style="margin-bottom: 20px;">
          <span class="status-badge status-badge-success">Confirmed</span>
        </div>
        <p><strong>Order Date:</strong> ${order.createdAt ? new Date(order.createdAt).toLocaleDateString() : new Date().toLocaleDateString()}</p>
        <p><strong>Payment Method:</strong> Cash on Delivery</p>
        
        <h4>Items Ordered:</h4>
        ${orderTable}
        
        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid currentColor;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
            <span>Subtotal:</span>
            <span>${subtotal.toFixed(2)} EGP</span>
          </div>
          
          ${order.discountAmount ? `
          <div style="display: flex; justify-content: space-between; margin-bottom: 10px; color: #16a34a;">
            <span>Discount (${order.discountCode}):</span>
            <span>-${order.discountAmount.toFixed(2)} EGP</span>
          </div>
          ` : ''}
          
          <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
            <span>Shipping:</span>
            <span>${shipping > 0 ? `${shipping.toFixed(2)} EGP` : "Free"}</span>
          </div>
          
          <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: 600; padding-top: 15px; border-top: 2px solid currentColor;">
            <span>Total:</span>
            <span>${order.total.toFixed(2)} EGP</span>
          </div>
        </div>
      `
    })

    console.log("📧 [EMAIL] Creating shipping info section...")
    const shippingAddress = order.shippingAddress || {}
    const shippingInfo = createEmailSection({
      title: "Shipping Address",
      content: `
        <p style="line-height: 1.8; margin: 0;">
          <strong>${shippingAddress.name || 'N/A'}</strong><br>
          ${shippingAddress.address || 'N/A'}<br>
          ${shippingAddress.city || 'N/A'}${shippingAddress.governorate ? `, ${shippingAddress.governorate}` : ''}<br>
          ${shippingAddress.postalCode ? `${shippingAddress.postalCode}<br>` : ''}
          <strong>Phone:</strong> ${shippingAddress.phone || 'N/A'}
        </p>
      `
    })

    const nextSteps = createEmailSection({
      title: "What's Next?",
      content: `
        <ul style="margin: 0; padding-left: 20px;">
          <li>We'll process your order within 1-2 business days</li>
          <li>You'll receive a shipping confirmation with tracking details</li>
          <li>Your order will be delivered within 3-7 business days</li>
          <li>Payment will be collected upon delivery</li>
        </ul>
        
        <hr class="divider">
        
        <p style="text-align: center;">
          <a href="${process.env.NEXT_PUBLIC_BASE_URL}/account" class="btn btn-primary">
            Track Your Order
          </a>
        </p>
        
        <p style="text-align: center; margin-top: 20px;">
          Have questions? <a href="mailto:${process.env.EMAIL_USER}">Contact our support team</a>
        </p>
      `
    })

    console.log("📧 [EMAIL] Building email content...")
    const emailContent = greeting + orderSummary + shippingInfo + nextSteps

    console.log("📧 [EMAIL] Creating email template...")
    let htmlContent
    try {
      htmlContent = createEmailTemplate({
        title: "Order Confirmation - Sense Fragrances",
        preheader: `Order #${order.id} confirmed - Thank you for choosing Sense Fragrances!`,
        content: emailContent,
        theme: { mode: 'light' }
      })
      console.log("📧 [EMAIL] Email template created successfully")
    } catch (templateError) {
      console.error("📧 [EMAIL] Error creating email template:", templateError)
      throw new Error(`Email template creation failed: ${templateError}`)
    }

    // Send email
    console.log("📧 [EMAIL] Sending email to:", customerEmail)
    try {
      await transporter.sendMail({
        from: `"Sense Fragrances" <${process.env.EMAIL_USER}>`,
        to: customerEmail,
        subject: `Order Confirmation #${order.id} - Sense Fragrances`,
        html: htmlContent,
      })

      console.log("✅ [EMAIL] Order confirmation email sent successfully to:", customerEmail)
      return NextResponse.json({ success: true, message: "Confirmation email sent" })
    } catch (emailError) {
      console.error("❌ [EMAIL] Failed to send email:", emailError)
      throw emailError
    }
  } catch (error) {
    console.error("❌ Error sending order confirmation email:", error)
    return NextResponse.json({ error: "Failed to send confirmation email" }, { status: 500 })
  }
}

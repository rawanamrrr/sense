import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    const { code, orderAmount, items } = await request.json()

    if (!code) {
      return NextResponse.json({ error: "Discount code is required" }, { status: 400 })
    }

    if (items && !Array.isArray(items)) {
      return NextResponse.json({ error: "Items must be an array" }, { status: 400 })
    }

    const db = await getDatabase()

    // Find active discount code (case insensitive)
    const discountCode = await db.collection("discount").findOne({
      code: code.toUpperCase(),
      isActive: true,
    })

    if (!discountCode) {
      return NextResponse.json({ error: "Invalid discount code" }, { status: 400 })
    }

    // Check expiration
    if (discountCode.expiresAt && new Date() > new Date(discountCode.expiresAt)) {
      return NextResponse.json({ error: "Discount code has expired" }, { status: 400 })
    }

    // Check usage limits
    if (discountCode.maxUses && discountCode.currentUses >= discountCode.maxUses) {
      return NextResponse.json({ error: "Discount code usage limit reached" }, { status: 400 })
    }

    // Check minimum order amount
    if (discountCode.minOrderAmount && orderAmount < discountCode.minOrderAmount) {
      const remaining = discountCode.minOrderAmount - orderAmount
      return NextResponse.json(
        { 
          error: `Add ${remaining.toFixed(2)} EGP more to your cart to apply this discount (minimum order: ${discountCode.minOrderAmount} EGP)` 
        },
        { status: 400 }
      )
    }

    // Calculate discount
    let discountAmount = 0
    let freeItems = []
    let discountDetails = {}

    if (discountCode.type === "percentage") {
      discountAmount = (orderAmount * discountCode.value) / 100
      discountDetails = { percentage: discountCode.value }
    } 
    else if (discountCode.type === "fixed") {
      discountAmount = Math.min(discountCode.value, orderAmount)
      discountDetails = { fixedAmount: discountCode.value }
    } 
    else if (discountCode.type === "buyXgetX") {
      if (!items || items.length === 0) {
        return NextResponse.json(
          { error: "Add items to your cart to apply this discount" },
          { status: 400 }
        )
      }
      if (!discountCode.buyX || !discountCode.getX) {
        return NextResponse.json(
          { error: "This discount requires buyX and getX values" },
          { status: 400 }
        )
      }

      // Create a working copy of items sorted by price (cheapest first)
      const itemsCopy = JSON.parse(JSON.stringify(items))
        .filter(item => item.price > 0)
        .sort((a, b) => a.price - b.price)

      const totalQuantity = itemsCopy.reduce((sum, item) => sum + item.quantity, 0)
      const setSize = discountCode.buyX + discountCode.getX
      const fullSets = Math.floor(totalQuantity / setSize)
      const totalFreeItems = fullSets * discountCode.getX

      // Check if minimum quantity requirement is met
      if (totalQuantity < discountCode.buyX) {
        return NextResponse.json(
          { 
            error: `Add ${discountCode.buyX - totalQuantity} more item${discountCode.buyX - totalQuantity === 1 ? '' : 's'} to your cart to apply this discount (Buy ${discountCode.buyX} Get ${discountCode.getX} Free)` 
          },
          { status: 400 }
        )
      }

      if (fullSets > 0) {
        let remainingFree = totalFreeItems

        // Apply free items to cheapest available items first
        for (const item of itemsCopy) {
          if (remainingFree <= 0) break

          const freeQuantity = Math.min(remainingFree, item.quantity)
          discountAmount += freeQuantity * item.price
          remainingFree -= freeQuantity

          freeItems.push({
            productId: item.productId,
            name: item.name || `Product ${item.productId}`,
            quantity: freeQuantity,
            price: item.price
          })
        }

        discountDetails = {
          buyX: discountCode.buyX,
          getX: discountCode.getX,
          totalFreeItems,
          totalDiscount: discountAmount
        }
      } else {
        // If no full sets but minimum quantity is met, provide specific feedback
        const remainingForNextSet = setSize - (totalQuantity % setSize)
        return NextResponse.json(
          { 
            error: `Add ${remainingForNextSet} more item${remainingForNextSet === 1 ? '' : 's'} to get the next free item (Buy ${discountCode.buyX} Get ${discountCode.getX} Free)` 
          },
          { status: 400 }
        )
      }
    }

    // If we reach here and no discount was calculated, the discount type is not supported
    if (discountAmount === 0 && discountCode.type !== "buyXgetX") {
      return NextResponse.json(
        { error: "This discount code type is not supported" },
        { status: 400 }
      )
    }

    return NextResponse.json({
      valid: true,
      discountAmount,
      code: discountCode.code,
      type: discountCode.type,
      value: discountCode.value,
      discountDetails,
      ...(discountCode.type === "buyXgetX" && {
        buyX: discountCode.buyX,
        getX: discountCode.getX,
        freeItems
      })
    })

  } catch (error) {
    console.error("Discount validation error:", error)
    return NextResponse.json(
      { error: "An error occurred while validating discount code" },
      { status: 500 }
    )
  }
}
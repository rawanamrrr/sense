import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"

export async function GET() {
  try {
    const db = await getDatabase()
    const results = {
      timestamp: new Date().toISOString(),
      tests: {} as any,
    }

    // Test 1: Database Connection
    try {
      await db.admin().ping()
      results.tests.databaseConnection = { status: "✅ PASS", message: "Database connected successfully" }
    } catch (error) {
      results.tests.databaseConnection = {
        status: "❌ FAIL",
        message: "Database connection failed",
        error: error.message,
      }
    }

    // Test 2: Collections Existence
    const collections = await db.listCollections().toArray()
    const collectionNames = collections.map((c) => c.name)
    const requiredCollections = ["products", "users", "orders", "reviews", "offers", "discount"]

    results.tests.collections = {
      status: requiredCollections.every((name) => collectionNames.includes(name)) ? "✅ PASS" : "⚠️ PARTIAL",
      found: collectionNames,
      required: requiredCollections,
      missing: requiredCollections.filter((name) => !collectionNames.includes(name)),
    }

    // Test 3: Sample Data
    const counts = {
      products: await db.collection("products").countDocuments(),
      users: await db.collection("users").countDocuments(),
      reviews: await db.collection("reviews").countDocuments(),
      offers: await db.collection("offers").countDocuments(),
      discountCodes: await db.collection("discount").countDocuments(),
    }

    results.tests.sampleData = {
      status: Object.values(counts).every((count) => count > 0) ? "✅ PASS" : "⚠️ PARTIAL",
      counts,
    }

    // Test 4: Environment Variables
    const envVars = {
      MONGODB_URI: !!process.env.MONGODB_URI,
      JWT_SECRET: !!process.env.JWT_SECRET,
      EMAIL_USER: !!process.env.EMAIL_USER,
      EMAIL_PASS: !!process.env.EMAIL_PASS,
      NEXT_PUBLIC_BASE_URL: !!process.env.NEXT_PUBLIC_BASE_URL,
    }

    results.tests.environmentVariables = {
      status: Object.values(envVars).every((exists) => exists) ? "✅ PASS" : "⚠️ PARTIAL",
      variables: envVars,
    }

    // Test 5: Active Offers
    const activeOffers = await db
      .collection("offers")
      .find({
        isActive: true,
        $or: [{ expiresAt: { $exists: false } }, { expiresAt: null }, { expiresAt: { $gt: new Date() } }],
      })
      .toArray()

    results.tests.activeOffers = {
      status: activeOffers.length > 0 ? "✅ PASS" : "⚠️ NO ACTIVE OFFERS",
      count: activeOffers.length,
      offers: activeOffers.map((offer) => ({
        title: offer.title,
        discountCode: offer.discountCode,
        expiresAt: offer.expiresAt,
      })),
    }

    // Test 6: Discount Code Validation
    const discountCodes = await db.collection("discount").find({ isActive: true }).toArray()
    
    if (discountCodes.length > 0) {
      const testDiscount = discountCodes[0]
      const testItems = [
        { id: "test1", price: 100, quantity: 1, productId: "test1" },
        { id: "test2", price: 150, quantity: 1, productId: "test2" }
      ]
      
      try {
        // Test validation with insufficient items for buyXgetX
        if (testDiscount.type === "buyXgetX") {
          const insufficientItems = [{ id: "test1", price: 100, quantity: 1, productId: "test1" }]
          const validationResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.sensefragrance.com'}/api/discount-codes/validate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              code: testDiscount.code,
              orderAmount: 100,
              items: insufficientItems
            })
          })
          
          if (validationResponse.status === 400) {
            const errorData = await validationResponse.json()
            results.tests.discountValidation = {
              status: "✅ PASS",
              message: "Discount validation provides specific error messages",
              testCase: "Insufficient items for buyXgetX",
              errorMessage: errorData.error
            }
          } else {
            results.tests.discountValidation = {
              status: "⚠️ PARTIAL",
              message: "Discount validation response unexpected",
              statusCode: validationResponse.status
            }
          }
        } else {
          results.tests.discountValidation = {
            status: "✅ PASS",
            message: "Discount codes available for testing",
            availableTypes: discountCodes.map(dc => dc.type)
          }
        }
      } catch (error) {
        results.tests.discountValidation = {
          status: "❌ FAIL",
          message: "Discount validation test failed",
          error: error.message
        }
      }
    } else {
      results.tests.discountValidation = {
        status: "⚠️ NO DISCOUNT CODES",
        message: "No active discount codes found for testing"
      }
    }

    // Overall Status
    const allTests = Object.values(results.tests)
    const passCount = allTests.filter((test) => test.status.includes("✅")).length
    const totalTests = allTests.length

    results.overallStatus = {
      status:
        passCount === totalTests
          ? "✅ ALL SYSTEMS OPERATIONAL"
          : passCount > totalTests / 2
            ? "⚠️ SOME ISSUES DETECTED"
            : "❌ CRITICAL ISSUES",
      passRate: `${passCount}/${totalTests}`,
      percentage: Math.round((passCount / totalTests) * 100),
    }

    return NextResponse.json(results, { status: 200 })
  } catch (error) {
    return NextResponse.json(
      {
        error: "System test failed",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

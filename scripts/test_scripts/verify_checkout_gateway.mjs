/**
 * Test script: Verify production checkout gateway routing
 * Sends a mock payment intent request to the live budolshap checkout API
 */
async function testProductionCheckout() {
  const baseUrl = "https://budolshap.vercel.app";
  const gatewayUrl = "https://payment-gateway-service-two.vercel.app";

  console.log("=== Production Checkout Gateway Verification ===\n");

  // 1. Test that the gateway itself is reachable
  try {
    console.log(`1. Checking gateway health: ${gatewayUrl}`);
    const gwRes = await fetch(`${gatewayUrl}/health`, { 
      signal: AbortSignal.timeout(10000) 
    });
    console.log(`   Gateway HTTP status: ${gwRes.status}`);
    if (gwRes.ok) {
      const data = await gwRes.json();
      console.log("   ✅ Gateway is HEALTHY:", JSON.stringify(data));
    } else {
      const text = await gwRes.text();
      console.log("   ⚠️ Gateway returned:", text.substring(0, 200));
    }
  } catch (err) {
    console.error("   ❌ Gateway health check failed:", err.message);
  }

  console.log("");

  // 2. Test the dead domain is NOT reachable (confirm we've bypassed it)
  try {
    console.log("2. Checking stale domain (should FAIL/timeout):");
    const deadRes = await fetch("https://api.budolpay.budol.duckdns.org/health", {
      signal: AbortSignal.timeout(5000)
    });
    console.log("   ⚠️ UNEXPECTED - Dead domain is reachable! Status:", deadRes.status);
  } catch (err) {
    console.log("   ✅ Dead domain is correctly unreachable:", err.message);
  }

  console.log("");

  // 3. Test creating a payment intent via the live gateway
  try {
    console.log("3. Testing payment intent creation on live gateway...");
    const intentRes = await fetch(`${gatewayUrl}/create-intent`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "x-api-key": "bs_key_2025"
      },
      body: JSON.stringify({
        amount: 100, // PHP 1.00
        currency: "PHP",
        description: "Test from verification script",
        provider: "internal",
        paymentMethod: "budolpay",
        metadata: { app: "test-script", orderId: "verify-001" }
      }),
      signal: AbortSignal.timeout(15000)
    });
    console.log(`   HTTP Status: ${intentRes.status}`);
    const text = await intentRes.text();
    try {
      const data = JSON.parse(text);
      if (intentRes.ok) {
        console.log("   ✅ Payment intent created successfully!");
        console.log("   Reference:", data.referenceId || data.id || "N/A");
        if (data.qrCode || data.qrCodeData || data.checkoutUrl) {
          console.log("   ✅ QR Code / Checkout URL present");
        }
      } else {
        console.log("   ❌ Gateway error:", JSON.stringify(data).substring(0, 300));
      }
    } catch(e) {
      console.log("   Raw response:", text.substring(0, 300));
    }
  } catch (err) {
    console.error("   ❌ Payment intent request failed:", err.message);
  }

  console.log("\n=== Verification Complete ===");
}

testProductionCheckout();

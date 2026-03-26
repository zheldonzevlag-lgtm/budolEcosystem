/**
 * Debug script: Diagnose 500 in gateway /create-intent
 * Tests multiple endpoint variations to isolate the failure
 */
async function debugGateway() {
  const gatewayUrl = "https://payment-gateway-service-two.vercel.app";

  console.log("=== Gateway Debug ===\n");

  // Test 1: Check /create-intent with detailed logging
  try {
    console.log("1. POST /create-intent (minimal payload)...");
    const res = await fetch(`${gatewayUrl}/create-intent`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "x-api-key": "bs_key_2025"
      },
      body: JSON.stringify({
        amount: 100,
        currency: "PHP",
        provider: "internal",
        paymentMethod: "budolpay",
        description: "test",
        metadata: { orderId: "test-001" }
      }),
      signal: AbortSignal.timeout(20000)
    });
    console.log(`   Status: ${res.status} ${res.statusText}`);
    const text = await res.text();
    console.log(`   Response: ${text.substring(0, 500)}`);
  } catch(e) {
    console.error("   Error:", e.message);
  }

  console.log("");

  // Test 2: Check /payment-intent (alternate path)
  try {
    console.log("2. POST /payment-intent (alternate path)...");
    const res = await fetch(`${gatewayUrl}/payment-intent`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "x-api-key": "bs_key_2025"
      },
      body: JSON.stringify({
        amount: 100,
        currency: "PHP",
        description: "test",
        metadata: { orderId: "test-001" }
      }),
      signal: AbortSignal.timeout(10000)
    });
    console.log(`   Status: ${res.status}`);
    const text = await res.text();
    console.log(`   Response: ${text.substring(0, 300)}`);
  } catch(e) {
    console.error("   Error:", e.message);
  }

  console.log("");

  // Test 3: Check what routes exist
  try {
    console.log("3. GET / (routes listing)...");
    const res = await fetch(`${gatewayUrl}/`, {
      signal: AbortSignal.timeout(5000)
    });
    console.log(`   Status: ${res.status}`);
    const text = await res.text();
    console.log(`   Response: ${text.substring(0, 500)}`);
  } catch(e) {
    console.error("   Error:", e.message);
  }

  console.log("\n=== Debug Complete ===");
}

debugGateway();

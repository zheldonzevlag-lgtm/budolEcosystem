const io = require('socket.io-client');
const axios = require('axios');

/**
 * Budol Ecosystem v404 Test Script
 * Purpose: Verify Provider-Agnostic Realtime Updates
 * Scenario: Simulate a new user registration and a new transaction, 
 * then verify the API Gateway broadcasts these to the 'admin' room.
 */

const GATEWAY_URL = "http://localhost:8080"; // Adjust if necessary
const AUTH_SERVICE_URL = "http://localhost:3001"; // Simulated auth service
const TX_SERVICE_URL = "http://localhost:3002"; // Simulated tx service

async function runTest() {
    console.log("🚀 Starting Realtime Agnostic Test (v404)...");

    // 1. Connect to Socket.io (Simulating Admin Dashboard)
    const socket = io(GATEWAY_URL);
    
    let userEventReceived = false;
    let txEventReceived = false;

    socket.on('connect', () => {
        console.log("✅ Dashboard connected to Gateway via Socket.io");
        socket.emit('join', 'admin');
    });

    socket.on('new_user', (data) => {
        console.log("📩 Received 'new_user' event:", data);
        userEventReceived = true;
    });

    socket.on('new_transaction', (data) => {
        console.log("📩 Received 'new_transaction' event:", data);
        txEventReceived = true;
    });

    // Wait for connection to stabilize
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 2. Simulate User Registration (Auth Service)
    console.log("\n👤 Simulating User Registration...");
    try {
        await axios.post(`${GATEWAY_URL}/internal/notify`, {
            event: 'new_user',
            data: { username: 'testuser_v404', count: 1250 },
            isAdmin: true
        });
        console.log("📤 Sent 'new_user' notification to Gateway");
    } catch (err) {
        console.error("❌ Failed to send user notification:", err.message);
    }

    // 3. Simulate Transaction (Transaction Service)
    console.log("\n💸 Simulating Transaction...");
    try {
        await axios.post(`${GATEWAY_URL}/internal/notify`, {
            event: 'new_transaction',
            data: {
                id: 'tx_v404_999',
                type: 'CASH_IN',
                amount: 500.00,
                status: 'COMPLETED',
                timestamp: new Date().toISOString()
            },
            isAdmin: true
        });
        console.log("📤 Sent 'new_transaction' notification to Gateway");
    } catch (err) {
        console.error("❌ Failed to send transaction notification:", err.message);
    }

    // 4. Wait for events
    console.log("\n⏳ Waiting for events to be received by dashboard...");
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 5. Final Report
    console.log("\n--- TEST RESULTS ---");
    console.log(`User Event Received: ${userEventReceived ? "✅ PASS" : "❌ FAIL"}`);
    console.log(`Transaction Event Received: ${txEventReceived ? "✅ PASS" : "❌ FAIL"}`);

    if (userEventReceived && txEventReceived) {
        console.log("\n🎉 ALL REALTIME TESTS PASSED!");
        process.exit(0);
    } else {
        console.log("\n⚠️ SOME TESTS FAILED.");
        process.exit(1);
    }
}

runTest().catch(err => {
    console.error("Fatal error:", err);
    process.exit(1);
});

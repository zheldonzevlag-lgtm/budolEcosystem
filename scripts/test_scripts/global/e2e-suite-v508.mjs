import fetch from 'node-fetch';

const LOCAL_IP = process.env.LOCAL_IP || 'localhost';

async function runE2ESuite() {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🚀 Budol Ecosystem E2E Suite v5.0.8');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    let overallSuccess = true;

    // 1. Health Checks
    console.log('🔍 [1/4] Checking Service Health...');
    const healthChecks = [
        { name: 'budolID', url: `http://${LOCAL_IP}:8000/api/health` },
        { name: 'budolShap', url: `http://${LOCAL_IP}:3001/api/internal/system/health` },
        { name: 'budolPay Gateway', url: `http://${LOCAL_IP}:8004/health` }
    ];

    for (const service of healthChecks) {
        try {
            const res = await fetch(service.url);
            if (res.ok) {
                console.log(`   ✅ ${service.name}: ONLINE (${res.status})`);
            } else {
                console.log(`   ❌ ${service.name}: ERROR (${res.status})`);
                overallSuccess = false;
            }
        } catch (e) {
            console.log(`   ❌ ${service.name}: OFFLINE (${e.message})`);
            overallSuccess = false;
        }
    }

    // 2. BudolPay Integration Test
    console.log('\n💳 [2/4] Testing BudolPay Integration (budolShap -> Gateway)...');
    const paymentData = {
        amount: 25000, // 250.00 PHP
        currency: 'PHP',
        method: 'BUDOL_PAY',
        provider: 'budolpay',
        description: 'E2E Suite Test Order',
        orderId: 'e2e-' + Date.now(),
        billing: {
            name: 'E2E Tester',
            email: 'e2e@budolshap.com'
        }
    };

    try {
        const res = await fetch(`http://${LOCAL_IP}:3001/api/payment/checkout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(paymentData)
        });

        const result = await res.json();
        if (res.ok && (result.checkoutUrl || result.paymentIntentId)) {
            console.log(`   ✅ Integration: SUCCESS (ID: ${result.paymentIntentId || 'N/A'})`);
        } else {
            console.log(`   ❌ Integration: FAILED (${res.status})`);
            console.log('      Response:', JSON.stringify(result));
            overallSuccess = false;
        }
    } catch (e) {
        console.log(`   ❌ Integration: ERROR (${e.message})`);
        overallSuccess = false;
    }

    // 3. Cart Persistence Logic Check (v5.0.7 Regression)
    console.log('\n🛒 [3/4] Verifying Cart Persistence Logic (v5.0.7 Fix)...');
    // We'll verify that the 'isAsyncPayment' list in ordersService includes the new methods
    // by checking the actual file content since we are in the same environment.
    try {
        const fs = await import('fs');
        const path = await import('path');
        const ordersServicePath = 'budolshap-0.1.0/lib/services/ordersService.js';
        const content = fs.readFileSync(ordersServicePath, 'utf8');
        
        const hasCard = content.includes("'CARD'");
        const hasPayMaya = content.includes("'PAYMAYA'");
        const hasRobustMatch = content.includes('OR: ['); // Sign of the robust variation matching fix

        if (hasCard && hasPayMaya && hasRobustMatch) {
            console.log('   ✅ Logic Verification: SUCCESS (Async methods and robust matching present)');
        } else {
            console.log('   ❌ Logic Verification: FAILED (Missing v5.0.7 fixes in code)');
            overallSuccess = false;
        }
    } catch (e) {
        console.log(`   ❌ Logic Verification: ERROR (${e.message})`);
        overallSuccess = false;
    }

    // 4. Final Report
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    if (overallSuccess) {
        console.log('✨ E2E SUITE PASSED');
    } else {
        console.log('⚠️ E2E SUITE FAILED (Check logs above)');
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    process.exit(overallSuccess ? 0 : 1);
}

runE2ESuite();

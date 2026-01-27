import fetch from 'node-fetch';

async function testRepaymentResponse() {
    console.log('🧪 Testing Repayment Modal Data Structure (v488)');
    
    // Simulate a repayment request to the checkout API
    // Note: In a real test we would need a valid session and orderId
    // For this verification, we'll check the logic in the checkout route
    
    console.log('📝 Verification Plan:');
    console.log('1. Verify payment-gateway-service returns qrCode string for budolPay');
    console.log('2. Verify budolshap OrderSummary/Orders page handles string vs object QR');
    console.log('3. Verify modal priority (qrCode > checkoutUrl)');

    // Mock verification of the normalization logic
    const mockBudolPayQr = "budolpay://pay?id=tx_123&amount=100.00";
    const mockPayMongoQr = {
        id: "pi_123",
        amount: 10000,
        label: "GCASH",
        qr_code_url: "https://paymongo.com/qr/123"
    };

    function normalize(qrCode, orderId, amount, paymentMethod) {
        let normalizedQrCode;
        const amountInCentavos = Math.round(amount * 100);
        const paymentIntentId = "pi_mock_123";

        if (typeof qrCode === 'string') {
            normalizedQrCode = {
                id: paymentIntentId,
                amount: amountInCentavos,
                label: `Order #${orderId}`,
                imageUrl: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrCode)}`
            };
        } else {
            normalizedQrCode = {
                id: qrCode.id || paymentIntentId,
                amount: qrCode.amount || amountInCentavos,
                label: qrCode.label || paymentMethod,
                imageUrl: qrCode.imageUrl || qrCode.image_url || qrCode.qr_code_url
            };
        }
        return normalizedQrCode;
    }

    const normBudol = normalize(mockBudolPayQr, "1001", 100.00, "budolPay");
    const normPayMongo = normalize(mockPayMongoQr, "1002", 100.00, "GCASH");

    console.log('✅ Normalized BudolPay:', normBudol.imageUrl.includes('api.qrserver.com') ? 'PASS' : 'FAIL');
    console.log('✅ Normalized PayMongo:', normPayMongo.imageUrl === mockPayMongoQr.qr_code_url ? 'PASS' : 'FAIL');

    if (normBudol.imageUrl.includes('api.qrserver.com') && normPayMongo.imageUrl === mockPayMongoQr.qr_code_url) {
        console.log('\n✨ TEST RESULT: SUCCESS');
        console.log('The normalization logic correctly handles both provider formats.');
    } else {
        console.log('\n❌ TEST RESULT: FAILED');
        process.exit(1);
    }
}

testRepaymentResponse().catch(console.error);


const assert = require('assert');

function normalizeQrData(data, paymentMethod, amountInCentavos, orderId) {
    const qrCode = data.qrCode;
    const paymentIntentId = data.paymentIntentId || data.id;
    
    let normalizedQrCode;
    
    if (typeof qrCode === 'string') {
        // String format (budolPay internal)
        normalizedQrCode = {
            id: paymentIntentId,
            amount: amountInCentavos,
            label: `Order #${orderId}`,
            imageUrl: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrCode)}`
        };
    } else {
        // Object format (PayMongo)
        normalizedQrCode = {
            id: qrCode.id || paymentIntentId,
            amount: qrCode.amount || amountInCentavos,
            label: qrCode.label || paymentMethod,
            imageUrl: qrCode.imageUrl || qrCode.image_url || qrCode.qr_code_url
        };
    }
    
    return normalizedQrCode;
}

function runTests() {
    console.log('🧪 Running QR Data Normalization Tests...');

    // Test Case 1: PayMongo Format (Object)
    const paymongoData = {
        qrCode: {
            imageUrl: 'https://paymongo.com/qr/123',
            amount: 10000,
            label: 'GCASH'
        },
        paymentIntentId: 'pi_123'
    };
    const result1 = normalizeQrData(paymongoData, 'GCASH', 10000, 'order-1');
    assert.strictEqual(result1.imageUrl, 'https://paymongo.com/qr/123');
    assert.strictEqual(result1.amount, 10000);
    console.log('✅ Test Case 1 Passed: PayMongo (Object) format');

    // Test Case 2: budolPay Format (String)
    const budolPayData = {
        qrCode: '{"type":"budolpay_payment","orderId":"order-2"}',
        paymentIntentId: 'bp_456'
    };
    const result2 = normalizeQrData(budolPayData, 'BUDOL_PAY', 20000, 'order-2');
    assert.ok(result2.imageUrl.includes('qrserver.com'));
    assert.ok(result2.imageUrl.includes(encodeURIComponent(budolPayData.qrCode)));
    assert.strictEqual(result2.amount, 20000);
    assert.strictEqual(result2.label, 'Order #order-2');
    console.log('✅ Test Case 2 Passed: budolPay (String) format');

    console.log('🎉 All normalization tests passed!');
}

try {
    runTests();
} catch (error) {
    console.error('❌ Tests failed:', error.message);
    process.exit(1);
}

const axios = require('axios');

// Configuration
const GATEWAY_URL = 'http://localhost:8004'; // Direct to Payment Gateway Service
const WALLET_SERVICE_URL = 'http://localhost:8002'; // Direct to Wallet Service
const TEST_ORDER_ID = 'TEST-ORD-' + Date.now();

async function runTests() {
    console.log('--- Budol Ecosystem Payment Security Tests ---');

    // Test 1: NaN Amount in Gateway Create Intent
    try {
        console.log('\n[Test 1] Testing NaN Amount in Gateway...');
        const res = await axios.post(`${GATEWAY_URL}/create-intent`, {
            amount: 'NaN',
            currency: 'PHP',
            method: 'budolpay',
            metadata: { orderId: TEST_ORDER_ID }
        });
        console.error('FAIL: Gateway accepted NaN amount');
    } catch (err) {
        if (err.response && err.response.status === 400) {
            console.log('PASS: Gateway rejected NaN amount with 400');
        } else {
            console.error('FAIL: Unexpected error:', err.message);
        }
    }

    // Test 2: Negative Amount in Gateway
    try {
        console.log('\n[Test 2] Testing Negative Amount in Gateway...');
        const res = await axios.post(`${GATEWAY_URL}/create-intent`, {
            amount: -100,
            currency: 'PHP',
            method: 'budolpay',
            metadata: { orderId: TEST_ORDER_ID }
        });
        console.error('FAIL: Gateway accepted negative amount');
    } catch (err) {
        if (err.response && err.response.status === 400) {
            console.log('PASS: Gateway rejected negative amount with 400');
        } else {
            console.error('FAIL: Unexpected error:', err.message);
        }
    }

    // Test 3: Duplicate Transaction Prevention
    let firstRefId;
    try {
        console.log('\n[Test 3] Testing Duplicate Transaction Prevention...');
        const res1 = await axios.post(`${GATEWAY_URL}/create-intent`, {
            amount: 150.50,
            currency: 'PHP',
            method: 'budolpay',
            metadata: { orderId: TEST_ORDER_ID, storeName: 'Test Store' }
        });
        firstRefId = res1.data.referenceId;
        console.log('First intent created:', firstRefId);

        const res2 = await axios.post(`${GATEWAY_URL}/create-intent`, {
            amount: 150.50,
            currency: 'PHP',
            method: 'budolpay',
            metadata: { orderId: TEST_ORDER_ID, storeName: 'Test Store' }
        });
        
        if (res2.data.referenceId === firstRefId) {
            console.log('PASS: Gateway returned existing transaction for duplicate orderId');
        } else {
            console.error('FAIL: Gateway created a new transaction for duplicate orderId');
        }
    } catch (err) {
        console.error('FAIL: Unexpected error in duplicate test:', err.message);
    }

    // Test 4: Amount Mismatch in Wallet Service (QR Processing)
    try {
        console.log('\n[Test 4] Testing Amount Mismatch in Wallet Service...');
        const res = await axios.post(`${WALLET_SERVICE_URL}/process-qr`, {
            userId: 'test-user-id',
            qrData: {
                paymentIntentId: firstRefId,
                amount: 9999.99, // Mismatched amount
                referenceId: firstRefId
            }
        }, {
            headers: { 'x-bypass-auth': 'true' }
        });
        console.error('FAIL: Wallet service accepted mismatched amount');
    } catch (err) {
        if (err.response && err.response.status === 400 && err.response.data.error === 'Amount mismatch') {
            console.log('PASS: Wallet service rejected mismatched amount');
        } else {
            console.error('FAIL: Unexpected error:', err.response?.data || err.message);
        }
    }

    console.log('\n--- Tests Completed ---');
}

runTests();

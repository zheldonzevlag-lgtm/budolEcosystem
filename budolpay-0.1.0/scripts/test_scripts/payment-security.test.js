const axios = require('axios');

// Configuration
// WHY: Using 127.0.0.1 avoids Node.js 18+ IPv6 resolution ambiguity (ECONNREFUSED on ::1)
const GATEWAY_URL = 'http://127.0.0.1:8004'; // Payment Gateway Service
const WALLET_SERVICE_URL = 'http://127.0.0.1:8002'; // Wallet Service
const TEST_ORDER_ID = 'JEST-ORD-' + Date.now();

// WHY: body-parser rejects uppercase 'UTF-8' charset; must use lowercase 'utf-8'
//      to avoid HTTP 415 Unsupported Media Type on all POST requests.
const JSON_HEADERS = { 'Content-Type': 'application/json; charset=utf-8' };

// WHY: This is an integration test requiring a live payment gateway service.
//      We check availability first and skip gracefully to avoid false CI failures.
let gatewayAvailable = false;

beforeAll(async () => {
    try {
        const res = await axios.get(`${GATEWAY_URL}/health`, {
            timeout: 2000,
            validateStatus: () => true
        });
        gatewayAvailable = res.status === 200;
    } catch (e) {
        gatewayAvailable = false;
        console.warn('[payment-security] Payment Gateway not reachable. Tests will be skipped.');
    }
});

const itIfGateway = (...args) => gatewayAvailable ? it(...args) : it.skip(...args);

describe('Budol Ecosystem Payment Security (v1.8.0)', () => {

    itIfGateway('Gateway should reject NaN amount', async () => {
        const res = await axios.post(`${GATEWAY_URL}/create-intent`, {
            amount: 'not-a-number',
            currency: 'PHP',
            paymentMethod: 'paymongo',
            metadata: { orderId: TEST_ORDER_ID + '-NAN' }
        }, {
            headers: JSON_HEADERS,
            validateStatus: () => true // Never throw; always inspect status manually
        });
        expect(res.status).toBe(400);
        expect(res.data.message).toContain('Invalid amount');
    });

    itIfGateway('Gateway should reject negative amount', async () => {
        const res = await axios.post(`${GATEWAY_URL}/create-intent`, {
            amount: -500,
            currency: 'PHP',
            paymentMethod: 'paymongo',
            metadata: { orderId: TEST_ORDER_ID + '-NEG' }
        }, {
            headers: JSON_HEADERS,
            validateStatus: () => true
        });
        expect(res.status).toBe(400);
        expect(res.data.message).toContain('Invalid amount');
    });

    itIfGateway('Gateway should prevent duplicate PENDING transactions', async () => {
        const orderId = TEST_ORDER_ID + '-DUP';

        // 1. Create first intent
        const res1 = await axios.post(`${GATEWAY_URL}/create-intent`, {
            amount: 1000,
            currency: 'PHP',
            paymentMethod: 'paymongo',
            metadata: { orderId }
        }, { headers: JSON_HEADERS, validateStatus: () => true });

        expect(res1.status).toBe(201);
        const firstId = res1.data.referenceId;
        expect(firstId).toBeDefined();

        // 2. Try to create second intent with same orderId
        // WHY: Should return the SAME referenceId (idempotency gate)
        const res2 = await axios.post(`${GATEWAY_URL}/create-intent`, {
            amount: 1000,
            currency: 'PHP',
            paymentMethod: 'paymongo',
            metadata: { orderId }
        }, { headers: JSON_HEADERS, validateStatus: () => true });

        expect(res2.data.referenceId).toBe(firstId);
    });

    itIfGateway('Wallet Service should reject amount mismatch in QR processing', async () => {
        const orderId = TEST_ORDER_ID + '-MIS';

        // 1. Create intent
        const resIntent = await axios.post(`${GATEWAY_URL}/create-intent`, {
            amount: 5000, // 50.00 PHP
            currency: 'PHP',
            paymentMethod: 'paymongo',
            metadata: { orderId }
        }, { headers: JSON_HEADERS, validateStatus: () => true });

        expect(resIntent.status).toBe(201);
        const refId = resIntent.data.referenceId;

        // 2. Try to process with WRONG amount (tampered QR data)
        // WHY: Security gate — amount mismatch must be rejected to prevent
        //      QR-tampering fraud (BSP Circular No. 1033 - E-Payments Security)
        const resMismatch = await axios.post(`${WALLET_SERVICE_URL}/process-qr`, {
            userId: 'test-user-id',
            qrData: {
                paymentIntentId: refId,
                amount: 9999.99, // Intentionally mismatched
                referenceId: refId
            }
        }, {
            headers: { ...JSON_HEADERS, 'x-bypass-auth': 'true' },
            validateStatus: () => true
        });

        expect(resMismatch.status).toBe(400);
        expect(resMismatch.data.error).toContain('Amount mismatch');
    });
});

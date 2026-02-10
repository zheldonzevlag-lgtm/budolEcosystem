const axios = require('axios');

// Configuration
const GATEWAY_URL = 'http://localhost:8004'; // Payment Gateway Service
const WALLET_SERVICE_URL = 'http://localhost:8002'; // Wallet Service
const TEST_ORDER_ID = 'JEST-ORD-' + Date.now();

describe('Budol Ecosystem Payment Security (v1.8.0)', () => {
    
    test('Gateway should reject NaN amount', async () => {
        try {
            await axios.post(`${GATEWAY_URL}/create-intent`, {
                amount: 'not-a-number',
                currency: 'PHP',
                paymentMethod: 'paymongo',
                metadata: { orderId: TEST_ORDER_ID + '-NAN' }
            });
            // If it doesn't throw, it failed to reject
            throw new Error('Should have rejected NaN amount');
        } catch (error) {
            expect(error.response.status).toBe(400);
            expect(error.response.data.message).toContain('Invalid amount');
        }
    });

    test('Gateway should reject negative amount', async () => {
        try {
            await axios.post(`${GATEWAY_URL}/create-intent`, {
                amount: -500,
                currency: 'PHP',
                paymentMethod: 'paymongo',
                metadata: { orderId: TEST_ORDER_ID + '-NEG' }
            });
            throw new Error('Should have rejected negative amount');
        } catch (error) {
            expect(error.response.status).toBe(400);
            expect(error.response.data.message).toContain('Invalid amount');
        }
    });

    test('Gateway should prevent duplicate PENDING transactions', async () => {
        const orderId = TEST_ORDER_ID + '-DUP';
        
        // 1. Create first intent
        const res1 = await axios.post(`${GATEWAY_URL}/create-intent`, {
            amount: 1000,
            currency: 'PHP',
            paymentMethod: 'paymongo',
            metadata: { orderId }
        });
        const firstId = res1.data.referenceId;
        expect(firstId).toBeDefined();

        // 2. Try to create second intent with same orderId
        const res2 = await axios.post(`${GATEWAY_URL}/create-intent`, {
            amount: 1000,
            currency: 'PHP',
            paymentMethod: 'paymongo',
            metadata: { orderId }
        });
        
        // Should return the SAME referenceId
        expect(res2.data.referenceId).toBe(firstId);
    });

    test('Wallet Service should reject amount mismatch in QR processing', async () => {
        const orderId = TEST_ORDER_ID + '-MIS';
        
        // 1. Create intent
        const resIntent = await axios.post(`${GATEWAY_URL}/create-intent`, {
            amount: 5000, // 50.00 PHP
            currency: 'PHP',
            paymentMethod: 'paymongo',
            metadata: { orderId }
        });
        const refId = resIntent.data.referenceId;

        // 2. Try to process with WRONG amount (tampered)
        try {
            await axios.post(`${WALLET_SERVICE_URL}/process-qr`, {
                userId: 'test-user-id',
                qrData: {
                    paymentIntentId: refId,
                    amount: 9999.99, // Mismatched
                    referenceId: refId
                }
            }, {
                headers: { 'x-bypass-auth': 'true' }
            });
            throw new Error('Should have rejected mismatched amount');
        } catch (error) {
            expect(error.response.status).toBe(400);
            expect(error.response.data.error).toContain('Amount mismatch');
        }
    });
});

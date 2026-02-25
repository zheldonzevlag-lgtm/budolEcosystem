
const { PayMongoAdapter } = require('../../lib/payment/adapters/paymongo-adapter');

// Mock fetch
global.fetch = jest.fn();
process.env.PAYMONGO_SECRET_KEY = 'sk_test_mock';

describe('PayMongoAdapter', () => {
    let adapter;

    beforeEach(() => {
        adapter = new PayMongoAdapter();
        fetch.mockClear();
    });

    test('createPaymentIntent sends correct payload for GCash', async () => {
        // Mock successful responses
        fetch.mockResolvedValueOnce({
            json: () => Promise.resolve({
                data: { id: 'pi_123', attributes: { status: 'awaiting_payment_method' } }
            })
        }); // intent
        fetch.mockResolvedValueOnce({
            json: () => Promise.resolve({
                data: { id: 'pm_456', attributes: { type: 'gcash' } }
            })
        }); // method
        fetch.mockResolvedValueOnce({
            json: () => Promise.resolve({
                data: {
                    id: 'pi_123',
                    attributes: {
                        status: 'awaiting_next_action',
                        next_action: {
                            type: 'redirect',
                            redirect: { url: 'https://test.paymongo.com/checkout' }
                        }
                    }
                }
            })
        }); // attach

        const result = await adapter.createPaymentIntent(
            10000, // 100.00 PHP
            'PHP',
            'gcash',
            {
                name: 'Test User',
                email: 'test@example.com',
                phone: '09171234567',
                address: { line1: 'Test St', city: 'Manila' }
            },
            {
                orderId: 'order_123',
                description: 'Test Order',
                successUrl: 'http://localhost:3000/success'
            }
        );

        // Verify Intent Creation Payload
        const intentCall = fetch.mock.calls[0];
        expect(intentCall[0]).toContain('/payment_intents');
        const intentBody = JSON.parse(intentCall[1].body);
        expect(intentBody.data.attributes.amount).toBe(10000);
        expect(intentBody.data.attributes.capture_type).toBe('automatic');
        expect(intentBody.data.attributes.metadata.orderId).toBe('order_123');

        // Verify Method Creation Payload
        const methodCall = fetch.mock.calls[1];
        expect(methodCall[0]).toContain('/payment_methods');
        const methodBody = JSON.parse(methodCall[1].body);
        expect(methodBody.data.attributes.type).toBe('gcash');

        // Verify Attach Payload
        const attachCall = fetch.mock.calls[2];
        expect(attachCall[0]).toContain('/attach');
        const attachBody = JSON.parse(attachCall[1].body);
        expect(attachBody.data.attributes.payment_method).toBe('pm_456');
        expect(attachBody.data.attributes.return_url).toBe('http://localhost:3000/success');

        // Verify Result
        expect(result.checkoutUrl).toBe('https://test.paymongo.com/checkout');
        expect(result.paymentIntentId).toBe('pi_123');
    });
});

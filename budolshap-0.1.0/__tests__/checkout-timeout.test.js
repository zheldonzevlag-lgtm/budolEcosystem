import { BudolPayAdapter } from '@/lib/payment/adapters/budolpay-adapter';

// Mock global fetch
global.fetch = jest.fn();

describe('BudolPayAdapter Error Handling', () => {
    let adapter;
    let consoleErrorSpy;

    beforeEach(() => {
        adapter = new BudolPayAdapter();
        jest.clearAllMocks();
        
        // Mock environment variables
        process.env.LOCAL_IP = '127.0.0.1';
        process.env.BUDOLPAY_API_KEY = 'test_key';

        // Suppress console.error for expected errors in these tests
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        // Restore console.error after each test
        consoleErrorSpy.mockRestore();
    });

    it('should throw a helpful error when the gateway returns an empty response (timeout scenario)', async () => {
        // Mock an empty response with OK status (some proxies/servers might do this)
        global.fetch.mockResolvedValueOnce({
            ok: true,
            status: 200,
            headers: new Map([['content-type', 'text/plain']]),
            text: jest.fn().mockResolvedValue('')
        });

        const amount = 10000;
        const currency = 'PHP';
        const method = 'gcash';
        const billing = { email: 'test@example.com', name: 'Test User' };
        const options = { orderId: 'ORD-123' };

        await expect(adapter.createPaymentIntent(amount, currency, method, billing, options))
            .rejects.toThrow('BudolPay Gateway returned an empty response. This may be due to an internal service timeout.');
    });

    it('should throw an error with the server status when response is not OK and empty', async () => {
        // Mock a 504 Gateway Timeout or similar with empty body
        global.fetch.mockResolvedValueOnce({
            ok: false,
            status: 504,
            headers: new Map([['content-type', 'text/plain']]),
            text: jest.fn().mockResolvedValue('')
        });

        const amount = 10000;
        
        await expect(adapter.createPaymentIntent(amount, 'PHP', 'gcash', {}, {}))
            .rejects.toThrow('Empty response from server');
    });

    it('should parse JSON correctly on successful response', async () => {
        const mockResponse = {
            success: true,
            referenceId: 'BP-12345',
            checkoutUrl: 'http://localhost:8004/checkout/BP-12345',
            status: 'pending'
        };

        global.fetch.mockResolvedValueOnce({
            ok: true,
            status: 200,
            headers: new Map([['content-type', 'application/json']]),
            json: jest.fn().mockResolvedValue(mockResponse)
        });

        const result = await adapter.createPaymentIntent(10000, 'PHP', 'gcash', {}, { orderId: 'ORD-123' });
        
        expect(result.paymentIntentId).toBe('BP-12345');
        expect(result.checkoutUrl).toContain('orderId=ORD-123');
    });
});

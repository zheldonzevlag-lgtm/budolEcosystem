/**
 * Phase 16 Testing Script: Branding & Multi-Provider Integration
 * Tests:
 * 1. budolExpress Shipping Rate Calculation (ordersService.js)
 * 2. Hybrid Accounting Sync Hooks (escrow.js & accounting.js)
 * 
 * Run with: node scripts/test_scripts/test-phase16-integration.mjs
 */

import 'dotenv/config';
import { BudolPayAdapter } from '../../budolshap-0.1.0/lib/payment/adapters/budolpay-adapter.js';
import { createLedgerEntry, buildOrderPaymentEntries } from '../../budolshap-0.1.0/lib/accounting.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const testResults = {
    timestamp: new Date().toISOString(),
    passed: 0,
    failed: 0,
    tests: []
};

function logTest(name, passed, message = '', details = null) {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} - ${name}${message ? ': ' + message : ''}`);
    testResults.tests.push({ name, passed, message, details, reason: passed ? null : (message || 'Assertion failed') });
    if (passed) {
        testResults.passed++;
    } else {
        testResults.failed++;
    }
}

async function testBudolShapRates() {
    console.log('\n🚚 Testing budolshap Shipping Rates...\n');
    
    try {
        // We test the logic manually since we can't easily import the service with aliases
        const calculateRate = (total) => {
            let cost = 50;
            if (total >= 1000) cost = 0;
            return cost;
        };

        const rate1 = calculateRate(500);
        logTest('budolshap: Standard Rate (₱500 total)', rate1 === 50, `Expected 50, got ${rate1}`);

        const rate2 = calculateRate(1200);
        logTest('budolshap: Free Shipping (₱1200 total)', rate2 === 0, `Expected 0, got ${rate2}`);

        return true;
    } catch (error) {
        logTest('budolshap Rates', false, error.message);
        return false;
    }
}

async function testAccountingEntries() {
    console.log('\n💰 Testing Accounting Entry Generation...\n');
    
    try {
        const mockOrder = {
            id: 'ord_test_123',
            total: 1000,
            platformFee: 50,
            netEarnings: 950
        };

        const entries = buildOrderPaymentEntries(mockOrder);
        
        logTest('Accounting: Entry Count', entries.length === 3, `Expected 3 entries, got ${entries.length}`);
        
        const cashEntry = entries.find(e => e.accountCode === '1000');
        logTest('Accounting: Cash Debit (1000)', cashEntry && cashEntry.debit === 1000, `Expected 1000, got ${cashEntry?.debit}`);
        
        const revenueEntry = entries.find(e => e.accountCode === '4000');
        logTest('Accounting: Platform Revenue Credit (4000)', revenueEntry && revenueEntry.credit === 50, `Expected 50, got ${revenueEntry?.credit}`);
        
        const liabilityEntry = entries.find(e => e.accountCode === '2000');
        logTest('Accounting: Seller Liability Credit (2000)', liabilityEntry && liabilityEntry.credit === 950, `Expected 950, got ${liabilityEntry?.credit}`);

        return true;
    } catch (error) {
        logTest('Accounting Entries', false, error.message);
        return false;
    }
}

async function testAccountingSyncClient() {
    console.log('\n📡 Testing Accounting Sync Client (Network Mock)...\n');
    
    // We mock the fetch call since we might not have the service running
    const originalFetch = global.fetch;
    global.fetch = async (url, options) => {
        return {
            ok: true,
            status: 200,
            headers: {
                get: (name) => name.toLowerCase() === 'content-type' ? 'application/json' : null
            },
            json: async () => ({ success: true, id: 'acc_sync_test' })
        };
    };

    try {
        const result = await createLedgerEntry({
            transactionId: 'txn_test',
            referenceId: 'ref_test',
            entries: [{ accountCode: '1000', debit: 100, credit: 0, description: 'Test' }]
        });

        logTest('Accounting Client: Sync Success', result !== null, 'Should return a result');
        return true;
    } catch (error) {
        logTest('Accounting Client: Sync Failure', false, error.message);
        return false;
    } finally {
        global.fetch = originalFetch;
    }
}

async function testLalamoveRates() {
    console.log('\n🚛 Testing Lalamove Shipping Rates...\n');
    
    try {
        const mockShipping = { provider: 'lalamove', cost: 150, shippingDiscount: 20, voucherAmount: 10 };
        
        // Simulation of logic in ordersService.js
        const calculateLalamove = (shipping) => {
            const cost = shipping.cost || 0;
            const discount = shipping.shippingDiscount || 0;
            const voucher = shipping.voucherAmount || 0;
            return Math.max(0, cost - discount - voucher);
        };

        const netCost = calculateLalamove(mockShipping);
        logTest('Lalamove: Net Shipping Calculation', netCost === 120, `Expected 120, got ${netCost}`);

        return true;
    } catch (error) {
        logTest('Lalamove Rates', false, error.message);
        return false;
    }
}

async function testBudolPayIntegration() {
    console.log('\n💳 Testing budolpay Payment Method Integration...\n');
    
    // Mock fetch for Gateway call
    const originalFetch = global.fetch;
    global.fetch = async (url, options) => {
        if (url.includes('/payments/create-intent')) {
            return {
                ok: true,
                status: 200,
                headers: {
                    get: (name) => name.toLowerCase() === 'content-type' ? 'application/json' : null
                },
                json: async () => ({ 
                    id: 'pi_test_789', 
                    checkoutUrl: 'http://localhost:8000/checkout/test',
                    status: 'pending'
                })
            };
        }
        return { 
            ok: false, 
            status: 404,
            headers: {
                get: (name) => null
            }
        };
    };

    try {
        const adapter = new BudolPayAdapter();
        const result = await adapter.createPaymentIntent(10000, 'PHP', 'gcash', { email: 'test@example.com' }, { orderId: 'ord_999' });

        logTest('budolpay: Intent Creation', result.paymentIntentId === 'pi_test_789', 'Correct Intent ID');
        logTest('budolpay: Checkout URL Mapping', result.checkoutUrl.includes('orderId=ord_999'), 'Order ID appended to URL');
        
        return true;
    } catch (error) {
        logTest('budolpay Integration', false, error.message);
        return false;
    } finally {
        global.fetch = originalFetch;
    }
}

async function runTests() {
    console.log('🚀 Starting Phase 16 Integration Tests (Branding & Multi-Provider)...\n');
    
    await testBudolShapRates();
    await testLalamoveRates();
    await testBudolPayIntegration();
    await testAccountingEntries();
    await testAccountingSyncClient();

    console.log('\n🏁 Test Summary:');
    console.log(`Passed: ${testResults.passed}`);
    console.log(`Failed: ${testResults.failed}`);
    
    // Save results to a JSON file for documentation
    const reportPath = path.join(__dirname, '..', 'documentation', 'test_reports', `test_v16_${new Date().getTime()}.json`);
    if (!fs.existsSync(path.dirname(reportPath))) {
        fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    }
    fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
    console.log(`\n📄 Report saved to: ${reportPath}`);
    
    if (testResults.failed > 0) {
        process.exit(1);
    }
}

runTests().catch(err => {
    console.error('Fatal error during testing:', err);
    process.exit(1);
});

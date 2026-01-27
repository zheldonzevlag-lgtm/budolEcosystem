import { BudolPayAdapter } from '../lib/payment/adapters/budolpay-adapter.js';
import dotenv from 'dotenv';

dotenv.config();

async function testIntegration() {
    console.log('🚀 Testing BudolPay Integration...');

    const adapter = new BudolPayAdapter();
    
    const testData = {
        amount: 15000, // 150.00 PHP
        currency: 'PHP',
        method: 'gcash',
        billing: {
            name: 'John Doe',
            email: 'john@example.com'
        },
        options: {
            description: 'Integration Test Order #999',
            orderId: '999'
        }
    };

    console.log('--- Request Data ---');
    console.log(JSON.stringify(testData, null, 2));

    try {
        const result = await adapter.createPaymentIntent(
            testData.amount,
            testData.currency,
            testData.method,
            testData.billing,
            testData.options
        );

        console.log('\n--- Response Result ---');
        console.log(JSON.stringify(result, null, 2));

        if (result.checkoutUrl || result.paymentIntentId) {
            console.log('\n✅ Integration Successful!');
        } else {
            console.log('\n⚠️ Integration returned unexpected format.');
        }

    } catch (error) {
        console.error('\n❌ Integration Failed:');
        console.error(error.message);
        const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:8004';
        console.log(`\nNote: Make sure the budolPay API Gateway is running at ${GATEWAY_URL}`);
    }
}

testIntegration();

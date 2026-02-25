import { BudolPayAdapter } from '../../lib/payment/adapters/budolpay-adapter.js';
import dotenv from 'dotenv';
dotenv.config();

async function testAdapter() {
    console.log('🧪 Testing BudolPayAdapter...');
    
    const adapter = new BudolPayAdapter();
    
    try {
        const result = await adapter.createPaymentIntent(
            5400, // amount in centavos
            'PHP',
            'budolpay',
            {
                name: 'Debug User',
                email: 'debug@budolshap.com'
            },
            {
                description: 'Debug Adapter Order',
                orderId: 'debug-adapter-' + Date.now(),
                successUrl: 'http://localhost:3000/payment/return'
            }
        );

        console.log('✅ Adapter Result:', JSON.stringify(result, null, 2));
        
        // Verify paymentIntentId presence
        if (!result.paymentIntentId) {
            console.error('❌ Missing paymentIntentId!');
        } else {
            console.log('✅ paymentIntentId present:', result.paymentIntentId);
        }

        // Verify QR code presence
        if (!result.qrCode) {
            console.error('❌ Missing qrCode!');
        } else {
            console.log('✅ qrCode present:', result.qrCode);
        }

    } catch (error) {
        console.error('💥 Adapter Error:', error);
    }
}

testAdapter();

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { paymentService } from '@/lib/payment/service';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const intent_id = searchParams.get('intent_id');
    const provider = searchParams.get('provider');

    if (!intent_id) {
        return NextResponse.json({ error: 'Missing intent_id' }, { status: 400 });
    }

    try {
        // 1. Check local database first (FAST & UNIFIED)
        // If our webhook already processed the payment, the order will be marked as paid.
        const order = await prisma.order.findFirst({
            where: { paymentId: intent_id }
        });

        if (order && (order.isPaid || order.paymentStatus === 'paid' || order.paymentStatus === 'succeeded')) {
            console.log(`🔍 [Status API] Intent ${intent_id} confirmed as PAID in database.`);
            return NextResponse.json({ status: 'succeeded' });
        }

        // 2. If not paid in DB, check the appropriate payment provider
        if (intent_id.startsWith('INTENT-') || intent_id.startsWith('JON-') || provider === 'budolpay' || provider === 'BUDOL_PAY') {
            // BudolPay Intent
            try {
                const budolPayAdapter = paymentService.adapters['budolpay'];
                const statusData = await budolPayAdapter.getPaymentIntent(intent_id);
                console.log(`🔍 [Status API] BudolPay Intent ${intent_id} status: ${statusData.status}`);
                
                // Translate BudolPay status to standard "succeeded" for frontend
                const status = statusData.status === 'COMPLETED' ? 'succeeded' : statusData.status;
                return NextResponse.json({ status });
            } catch (err) {
                console.error('Error fetching BudolPay status:', err.message);
                // Fallback to order status if adapter fails
                return NextResponse.json({ status: order?.paymentStatus || 'pending' });
            }
        } else {
            // PayMongo Intent (default)
            const options = {
                method: 'GET',
                headers: {
                    accept: 'application/json',
                    authorization: `Basic ${Buffer.from(process.env.PAYMONGO_SECRET_KEY + ':').toString('base64')}`
                }
            };

            const response = await fetch(`https://api.paymongo.com/v1/payment_intents/${intent_id}`, options);
            const data = await response.json();

            if (data.errors) {
                console.error(`[Status API] PayMongo Error for ${intent_id}:`, data.errors);
            } else if (data.data) {
                const status = data.data.attributes.status;
                console.log(`🔍 [Status API] PayMongo Intent ${intent_id} status: ${status}`);
                
                // Log full response for debugging "missing payment" issues
                if (status === 'succeeded' || status === 'awaiting_payment_method' || status === 'processing') {
                    console.log(`ℹ️ [Status API] PayMongo Response for ${intent_id} (${status}):`, JSON.stringify(data.data.attributes, null, 2));
                }
                return NextResponse.json({ status });
            }
        }

        // 3. Fallback for unknown
        return NextResponse.json({ status: order?.paymentStatus || 'pending' });

    } catch (error) {
        console.error('Internal Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

import { NextResponse } from 'next/server';
import { getOrders, createOrder } from '@/lib/services/ordersService';

/**
 * Internal Orders API
 * GET /api/internal/orders
 * POST /api/internal/orders
 */
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        
        const filters = {
            userId: searchParams.get('userId'),
            storeId: searchParams.get('storeId'),
            status: searchParams.get('status'),
            isPaid: searchParams.get('isPaid'),
            paymentStatus: searchParams.get('paymentStatus'),
            paymentMethod: searchParams.get('paymentMethod'),
            excludePaymentMethod: searchParams.get('excludePaymentMethod'),
            page: searchParams.get('page') || '1',
            limit: searchParams.get('limit') || '20'
        };

        const result = await getOrders(filters);
        return NextResponse.json(result);
    } catch (error) {
        console.error('[Internal Orders] Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch orders' },
            { status: 500 }
        );
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const orders = await createOrder(body);
        return NextResponse.json(orders, { status: 201 });
    } catch (error) {
        console.error('[Internal Orders] Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to create order' },
            { status: 500 }
        );
    }
}





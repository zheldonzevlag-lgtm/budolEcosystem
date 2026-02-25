import { NextResponse } from 'next/server';
import { getOrderById, updateOrderStatus } from '@/lib/services/ordersService';

/**
 * Internal Orders API - Single Order
 * GET /api/internal/orders/[orderId]
 * PUT /api/internal/orders/[orderId]
 */
export async function GET(request, { params }) {
    try {
        const { orderId } = await params;
        const order = await getOrderById(orderId);
        return NextResponse.json(order);
    } catch (error) {
        console.error('[Internal Orders] Error:', error);
        if (error.message === 'Order not found') {
            return NextResponse.json(
                { error: error.message },
                { status: 404 }
            );
        }
        return NextResponse.json(
            { error: error.message || 'Failed to fetch order' },
            { status: 500 }
        );
    }
}

export async function PUT(request, { params }) {
    try {
        const { orderId } = await params;
        const body = await request.json();
        const { status, isPaid } = body;
        
        const updatedOrder = await updateOrderStatus(orderId, { status, isPaid });
        return NextResponse.json(updatedOrder);
    } catch (error) {
        console.error('[Internal Orders] Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to update order' },
            { status: 500 }
        );
    }
}





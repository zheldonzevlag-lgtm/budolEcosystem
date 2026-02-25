
import { NextResponse } from 'next/server';
import { cancelOrder } from '@/lib/services/ordersService';

export async function POST(request, { params }) {
    try {
        const { orderId } = await params;

        if (!orderId) {
            return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
        }

        const updatedOrder = await cancelOrder(orderId, true); // Restore cart by default

        console.log(`🚫 Order ${orderId} marked as Cancelled via Service`);

        return NextResponse.json(updatedOrder);

    } catch (error) {
        console.error('Error cancelling order:', error);
        return NextResponse.json({ 
            error: error.message || 'Internal Server Error' 
        }, { status: error.message === 'Order not found' ? 404 : 500 });
    }
}

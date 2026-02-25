import { NextResponse } from 'next/server'
import { getOrderById, updateOrderStatus } from '@/lib/services/ordersService'
import { getSystemSettings } from '@/lib/services/systemSettingsService'
import { getAuthFromCookies } from '@/lib/auth'
import { isUserAdmin } from '@/lib/adminAccess'

// Force dynamic rendering - no caching
export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * Public Orders API - Single Order
 * GET /api/orders/[orderId]
 * PUT /api/orders/[orderId]
 * 
 * Phase 4: Uses orders service layer
 */
export async function GET(request, { params }) {
    try {
        const { orderId } = await params;
        const user = await getAuthFromCookies();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const order = await getOrderById(orderId);
        if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

        // Security: Check if user is buyer, store owner, or admin
        const isAdmin = await isUserAdmin(user);
        if (!isAdmin && order.userId !== user.id && order.storeId !== user.storeId) {
             return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        
        const settings = await getSystemSettings();
        const protectionWindowDays = settings?.protectionWindowDays || 7;

        return NextResponse.json({ ...order, protectionWindowDays }, {
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        });
    } catch (error) {
        console.error('Error fetching order:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch order' },
            { status: 500 }
        );
    }
}

export async function PUT(request, { params }) {
    try {
        const { orderId } = await params;
        const user = await getAuthFromCookies();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const order = await getOrderById(orderId);
        if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

        // Security: Check if user is store owner or admin
        const isAdmin = await isUserAdmin(user);
        if (!isAdmin && order.storeId !== user.storeId) {
             return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const { status, isPaid } = body;
        
        const updatedOrder = await updateOrderStatus(orderId, { status, isPaid });
        return NextResponse.json(updatedOrder);
    } catch (error) {
        console.error('Error updating order:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to update order' },
            { status: 500 }
        );
    }
}

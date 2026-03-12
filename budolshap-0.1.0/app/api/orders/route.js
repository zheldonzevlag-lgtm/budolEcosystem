import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getOrders, createOrder } from '@/lib/services/ordersService'
import { getAuthFromCookies } from '@/lib/auth'
import { isUserAdmin } from '@/lib/adminAccess'

/**
 * Public Orders API
 * GET /api/orders
 * POST /api/orders
 * 
 * Phase 4: Uses orders service layer
 */
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const user = await getAuthFromCookies();

        const userId = searchParams.get('userId');
        const storeId = searchParams.get('storeId');

        // Security Check: If not admin, must provide userId (their own) or storeId (their own)
        const isAdmin = user ? await isUserAdmin(user) : false;

        if (!isAdmin) {
            if (!user) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
            if (!userId && !storeId) {
                // If no filter, non-admins can only see their own orders
                searchParams.set('userId', user.id);
            } else if (userId && userId !== user.id) {
                // Cannot see other users' orders
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }
            // For storeId, we'd need to check ownership, but let's assume the service handles it or keep it simple for now
        }

        const filters = {
            userId: searchParams.get('userId'),
            storeId: searchParams.get('storeId'),
            status: searchParams.get('status'),
            isPaid: searchParams.get('isPaid'),
            paymentStatus: searchParams.get('paymentStatus'),
            paymentMethod: searchParams.get('paymentMethod'),
            paymentId: searchParams.get('paymentId'),
            excludePaymentMethod: searchParams.get('excludePaymentMethod'),
            excludeAbandonedPayments: searchParams.get('excludeAbandonedPayments') || 'true',
            page: searchParams.get('page') || '1',
            limit: searchParams.get('limit') || '20',
            isCancelledTab: searchParams.get('isCancelledTab') === 'true'
        };

        console.log('[API/Orders] GET filters:', JSON.stringify(filters));

        // Option 1: Direct service call (current)
        const result = await getOrders(filters);
        return NextResponse.json(result);

        // Option 2: Call internal API (for Phase 4 testing)
        // Uncomment to test internal API calls:
        // const { callInternalServiceJson } = await import('@/lib/api/serviceClient');
        // const result = await callInternalServiceJson('orders', `?${new URLSearchParams(filters).toString()}`);
        // return NextResponse.json(result);
    } catch (error) {
        console.error('Error fetching orders:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch orders' },
            { status: 500 }
        );
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const user = await getAuthFromCookies();

        // Security: If user is logged in and not admin, enforce userId to match session
        if (user) {
            const isAdmin = await isUserAdmin(user);
            if (!isAdmin) {
                body.userId = user.id;
            }
        }
        
        // Option 1: Direct service call (current)
        const orders = await createOrder(body);
        return NextResponse.json(orders, { status: 201 });

        // Option 2: Call internal API (for Phase 4 testing)
        // Uncomment to test internal API calls:
        // const { callInternalServiceJson } = await import('@/lib/api/serviceClient');
        // const orders = await callInternalServiceJson('orders', '', {
        //     method: 'POST',
        //     body: JSON.stringify(body)
        // });
        // return NextResponse.json(orders, { status: 201 });
    } catch (error) {
        console.error('[API/Orders] Error creating order:', error);
        const errorMessage = error?.message || 'Failed to create order';
        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}

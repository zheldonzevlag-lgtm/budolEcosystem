import { NextResponse } from 'next/server';
import { cancelExpiredUnpaidOrders } from '@/lib/services/ordersService';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/cron/cancel-unpaid-orders
 * Triggered by Vercel Cron
 * Security: Uses CRON_SECRET environment variable
 */
export async function GET(request) {
    try {
        const authHeader = request.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET;

        // If CRON_SECRET is set, verify it
        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            console.error('[Cancel Unpaid Cron] Unauthorized access attempt');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.log('[Cancel Unpaid Cron] Starting automated cancellation');
        const results = await cancelExpiredUnpaidOrders();

        return NextResponse.json({
            success: true,
            timestamp: new Date().toISOString(),
            results: results.data || results
        });

    } catch (error) {
        console.error('[Cancel Unpaid Cron] Fatal error:', error);
        return NextResponse.json({
            error: 'Cancellation process failed',
            message: error.message,
            timestamp: new Date().toISOString()
        }, { status: 500 });
    }
}

/**
 * POST /api/cron/cancel-unpaid-orders
 * Manual trigger for admin
 */
export async function POST(_request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const decoded = verifyToken(token);
        if (!decoded || !decoded.userId) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { accountType: true }
        });

        if (user?.accountType !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        console.log('[Cancel Unpaid Cron] Manual trigger initiated by admin');
        const results = await cancelExpiredUnpaidOrders();

        return NextResponse.json({
            success: true,
            manual: true,
            timestamp: new Date().toISOString(),
            results: results.data || results
        });

    } catch (error) {
        console.error('[Cancel Unpaid Cron] Manual trigger error:', error);
        return NextResponse.json({
            error: 'Cancellation process failed',
            message: error.message,
            timestamp: new Date().toISOString()
        }, { status: 500 });
    }
}

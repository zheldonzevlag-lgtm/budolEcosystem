import { NextResponse } from 'next/server';
import { processAutoCompletions } from '@/lib/orderAutoComplete';

/**
 * GET /api/cron/auto-complete-orders
 * Process auto-completion for delivered orders
 * 
 * This endpoint should be called by a cron job daily
 * Vercel Cron: Configure in vercel.json
 * 
 * Security: Uses CRON_SECRET environment variable for authentication
 */
export async function GET(request) {
    try {
        // Verify cron secret for security
        const authHeader = request.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET;

        // If CRON_SECRET is set, verify it
        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            console.error('[Auto-Complete Cron] Unauthorized access attempt');
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        console.log('[Auto-Complete Cron] Starting auto-completion cron job');

        // Process auto-completions
        const results = await processAutoCompletions();

        // Return success response with results
        return NextResponse.json({
            success: true,
            timestamp: new Date().toISOString(),
            results: {
                totalOrders: results.total,
                completed: results.completed,
                failed: results.failed,
                errors: results.errors
            }
        });

    } catch (error) {
        console.error('[Auto-Complete Cron] Fatal error:', error);

        return NextResponse.json(
            {
                error: 'Auto-completion process failed',
                message: error.message,
                timestamp: new Date().toISOString()
            },
            { status: 500 }
        );
    }
}

/**
 * POST /api/cron/auto-complete-orders
 * Manual trigger for auto-completion (for testing)
 * Requires admin authentication
 */
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request) {
    try {
        // Authenticate Admin
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

        const body = await request.json().catch(() => ({}));
        const days = body.days ? parseInt(body.days) : 7;

        console.log(`[Auto-Complete Cron] Manual trigger initiated by admin (Days: ${days})`);

        const results = await processAutoCompletions(days);

        return NextResponse.json({
            success: true,
            manual: true,
            timestamp: new Date().toISOString(),
            results: {
                totalOrders: results.total,
                total: results.total, // Add this for frontend compatibility
                completed: results.completed,
                failed: results.failed,
                errors: results.errors
            }
        });

    } catch (error) {
        console.error('[Auto-Complete Cron] Manual trigger error:', error);

        return NextResponse.json(
            {
                error: 'Auto-completion process failed',
                message: error.message,
                timestamp: new Date().toISOString()
            },
            { status: 500 }
        );
    }
}

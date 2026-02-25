import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSystemSettings } from '@/lib/services/systemSettingsService';
import { requireAdmin } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    const { authorized, errorResponse } = await requireAdmin(request)
    if (!authorized) return errorResponse

    try {
        const settings = await getSystemSettings();
        const protectionWindowDays = settings?.protectionWindowDays || 7;

        // Calculate Total Pending (In Escrow)
        const totalPending = await prisma.wallet.aggregate({
            _sum: {
                pendingBalance: true
            }
        });

        // Calculate Total Available (Ready for payout)
        const totalAvailable = await prisma.wallet.aggregate({
            _sum: {
                balance: true
            }
        });

        // Count Payout Queue (Pending Requests)
        const payoutQueue = await prisma.payoutRequest.aggregate({
            where: {
                status: 'PENDING'
            },
            _count: {
                id: true
            }
        });

        // Calculate Average Wait Time (Optional/Mock for now or complex query)
        // For now, we will return a static or calculated value if possible
        // Let's just return the count and amounts

        return NextResponse.json({
            stats: {
                pending: totalPending._sum.pendingBalance || 0,
                available: totalAvailable._sum.balance || 0,
                payoutQueue: payoutQueue._count.id || 0
            },
            protectionWindowDays
        });

    } catch (error) {
        console.error('Error fetching admin escrow stats:', error);
        return NextResponse.json(
            { error: 'Failed to fetch stats' },
            { status: 500 }
        );
    }
}

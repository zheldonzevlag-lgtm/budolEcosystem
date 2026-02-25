import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    const { authorized, errorResponse } = await requireAdmin(request)
    if (!authorized) return errorResponse

    try {
        const events = await prisma.webhookEvent.findMany({
            orderBy: { createdAt: 'desc' },
            take: 50
        });
        return NextResponse.json(events);
    } catch (error) {
        console.error('Error fetching webhook events:', error);
        return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
    }
}

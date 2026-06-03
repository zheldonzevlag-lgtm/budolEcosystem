import { NextResponse } from 'next/server';
import { prisma } from '@budolpay/database';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        let settings;
        try {
            settings = await prisma.systemSettings.findUnique({
                where: { id: 'default' }
            });
        } catch (findError) {
            console.warn('[SystemStatus API] systemSettings not found, falling back:', findError);
            settings = null;
        }

        const now = new Date();
        const lastUpdated = settings?.updatedAt ?? now;
        const diffInMinutes = (now.getTime() - lastUpdated.getTime()) / (1000 * 60);

        let status = 'ACTIVE';
        let color = 'emerald';

        if (diffInMinutes > 5) {
            status = 'OFFLINE';
            color = 'rose';
        } else if (diffInMinutes > 2) {
            status = 'DELAYED';
            color = 'amber';
        }

        return NextResponse.json({
            status,
            color,
            lastSeen: lastUpdated.toISOString(),
            diffInMinutes
        });
    } catch (error: any) {
        console.error('[SystemStatus API] Error:', error.message);
        // Return successful response with UNKNOWN status instead of 500
        return NextResponse.json({ status: 'UNKNOWN', color: 'slate' });
    }
}

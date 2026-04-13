import { NextResponse } from 'next/server';
import { prisma } from '@budolpay/database';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const heartbeat = await prisma.systemSetting.findUnique({
            where: { key: 'DRS_ENGINE_HEARTBEAT' }
        });

        if (!heartbeat) {
            return NextResponse.json({
                status: 'OFFLINE',
                message: 'No heartbeat recorded.',
                color: 'red'
            });
        }

        const lastHeartbeat = new Date(heartbeat.value);
        const now = new Date();
        const diffInMinutes = (now.getTime() - lastHeartbeat.getTime()) / (1000 * 60);

        let status = 'ACTIVE';
        let color = 'emerald'; // Green
        
        if (diffInMinutes > 5) {
            status = 'OFFLINE';
            color = 'rose'; // Red
        } else if (diffInMinutes > 2) {
            status = 'DELAYED';
            color = 'amber'; // Yellow
        }

        return NextResponse.json({
            status,
            color,
            lastSeen: heartbeat.value,
            diffInMinutes
        });
    } catch (error: any) {
        console.error('[SystemStatus API] Error:', error.message);
        return NextResponse.json({ status: 'UNKNOWN', color: 'slate' }, { status: 500 });
    }
}

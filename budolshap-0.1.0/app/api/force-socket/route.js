import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { clearSettingsCache } from '@/lib/settings';
import { clearSettingsCache as clearRealtimeCache } from '@/lib/realtime';

export async function GET() {
    try {
        const result = await prisma.systemSettings.update({
            where: { id: "default" },
            data: {
                realtimeProvider: "SOCKET_IO",
                socketUrl: "https://budolws.duckdns.org"
            }
        });
        clearSettingsCache();
        clearRealtimeCache();
        return NextResponse.json({ success: true, settings: result });
    } catch (e) {
        return NextResponse.json({ success: false, error: e.message });
    }
}

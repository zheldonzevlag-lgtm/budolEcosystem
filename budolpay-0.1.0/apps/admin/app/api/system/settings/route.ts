import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const settings = await prisma.systemSetting.findMany({
            where: { isActive: true }
        });
        
        const settingsMap = settings.reduce((acc: any, curr) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {});

        // Format for mobile app
        const response = {
            realtime: {
                method: settingsMap['REALTIME_METHOD'] || 'SWR',
                pusher: {
                    key: settingsMap['PUSHER_KEY'] || settingsMap['REALTIME_PUSHER_KEY'],
                    cluster: settingsMap['PUSHER_CLUSTER'] || settingsMap['REALTIME_PUSHER_CLUSTER']
                },
                socketio: {
                    url: settingsMap['SOCKETIO_URL']
                },
                swr: {
                    refreshInterval: parseInt(settingsMap['SWR_REFRESH_INTERVAL'] || '5000')
                }
            },
            maps: {
                enabledProviders: JSON.parse(settingsMap['ENABLED_MAP_PROVIDERS'] || '[]'),
                googleMapsKey: settingsMap['GOOGLE_MAPS_API_KEY'],
                geoapifyKey: settingsMap['GEOAPIFY_API_KEY'],
                radarKey: settingsMap['RADAR_API_KEY']
            }
        };

        return NextResponse.json(response);
    } catch (error: any) {
        console.error('[System Settings API] Error:', error.message);
        return NextResponse.json({ error: 'Failed to fetch system settings' }, { status: 500 });
    }
}

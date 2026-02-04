import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const settings = await prisma.systemSetting.findMany({
      where: {
        group: 'REALTIME'
      }
    });

    const settingsMap = settings.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {} as Record<string, string>);

    return NextResponse.json({
      provider: settingsMap['REALTIME_METHOD'] || 'SWR',
      pusherKey: settingsMap['REALTIME_PUSHER_KEY'],
      pusherCluster: settingsMap['REALTIME_PUSHER_CLUSTER'] || 'ap1',
      socketUrl: settingsMap['REALTIME_SOCKETIO_URL'],
      swrPollingInterval: parseInt(settingsMap['REALTIME_SWR_REFRESH_INTERVAL']) || 10000
    });
  } catch (error: any) {
    console.error("[Realtime API] Failed to fetch settings:", error.message);
    return NextResponse.json({ provider: 'SWR', swrPollingInterval: 10000 });
  }
}

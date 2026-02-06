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

    // Make Socket.io URL network aware if it's localhost
    let socketUrl = settingsMap['REALTIME_SOCKETIO_URL'];
    const localIp = process.env.LOCAL_IP;

    if (socketUrl && socketUrl.includes('localhost') && localIp) {
      socketUrl = socketUrl.replace('localhost', localIp);
      console.log(`[Realtime API] Adjusted localhost to ${localIp} for network awareness`);
    }

    return NextResponse.json({
      provider: settingsMap['REALTIME_METHOD'] || 'SWR',
      pusherKey: settingsMap['REALTIME_PUSHER_KEY'],
      pusherCluster: settingsMap['REALTIME_PUSHER_CLUSTER'] || 'ap1',
      socketUrl: socketUrl,
      swrPollingInterval: parseInt(settingsMap['REALTIME_SWR_REFRESH_INTERVAL']) || 10000
    });
  } catch (error: any) {
    console.error("[Realtime API] Failed to fetch settings:", error.message);
    return NextResponse.json({ provider: 'SWR', swrPollingInterval: 10000 });
  }
}

import { NextResponse } from 'next/server';
import { prisma } from '@budolpay/database';

export const dynamic = 'force-dynamic';

/**
 * GET /api/system/status
 * 
 * Why: The admin dashboard polls this endpoint to show system health.
 * What: Queries the singular SystemSetting table for the DRS_ENGINE_HEARTBEAT key,
 *       then computes elapsed time to determine ACTIVE / DELAYED / OFFLINE status.
 * 
 * Fix (v1.3.94): Previously used plural `systemSettings` model which does not exist
 * in the production database. Now uses `systemSetting` (singular) matching the
 * packages/database/prisma/schema.prisma source-of-truth.
 */
export async function GET() {
    try {
        let heartbeatSetting;
        try {
            // Query the singular SystemSetting model for DRS engine heartbeat timestamp
            heartbeatSetting = await prisma.systemSetting.findUnique({
                where: { key: 'DRS_ENGINE_HEARTBEAT' }
            });
        } catch (findError) {
            console.warn('[SystemStatus API] DRS_ENGINE_HEARTBEAT setting not found, falling back:', findError);
            heartbeatSetting = null;
        }

        const now = new Date();
        // Parse the heartbeat timestamp from the setting value, or fallback to now
        let lastUpdated = now;
        if (heartbeatSetting?.value) {
            try {
                lastUpdated = new Date(heartbeatSetting.value);
            } catch (e) {
                lastUpdated = now;
            }
        }
        const diffInMinutes = (now.getTime() - lastUpdated.getTime()) / (1000 * 60);

        // Determine system health status based on heartbeat freshness
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
        // Return successful response with UNKNOWN status instead of crashing with 500
        return NextResponse.json({ status: 'UNKNOWN', color: 'slate' });
    }
}

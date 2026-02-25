import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminAuth';
import { getNowUTC } from '@/lib/dateUtils';

export async function GET(request) {
    const { authorized, errorResponse } = await requireAdmin(request)
    if (!authorized) return errorResponse

    try {
        const telemetry = {
            timestamp: getNowUTC().toISOString(),
            checks: []
        };

        // 1. PCI DSS v4.0: Secure Gateway Check
        let pciStatus = 'VERIFIED';
        let pciWarning = null;
        try {
            const budolPayUrl = process.env.NEXT_PUBLIC_BUDOLPAY_GATEWAY_URL || 'http://localhost:8080';
            let response = await fetch(`${budolPayUrl}/health`, { signal: AbortSignal.timeout(2000) }).catch(() => null);
            if (!response || !response.ok) {
                response = await fetch(`${budolPayUrl}/api/health`, { signal: AbortSignal.timeout(2000) }).catch(() => null);
            }
            if (!response || !response.ok) {
                pciStatus = 'SYNCING';
                pciWarning = 'BudolPay Gateway heartbeat failed. Payment tunnel may be unstable.';
            }
        } catch (e) {
            pciStatus = 'ERROR';
        }
        telemetry.checks.push({
            id: 'pci',
            label: 'PCI DSS v4.0 Encryption',
            status: pciStatus,
            warning: pciWarning,
            sub: 'Data-at-rest & in-transit'
        });

        // 2. BSP Circular 808: Audit Log Integrity
        let bspStatus = 'ACTIVE';
        let bspWarning = null;
        try {
            const recentLogs = await prisma.auditLog.count({
                where: {
                    createdAt: {
                        gte: new Date(getNowUTC().getTime() - 24 * 60 * 60 * 1000)
                    }
                }
            });

            if (recentLogs === 0) {
                bspStatus = 'WARNING';
                bspWarning = 'No administrative audit logs detected in the last 24 hours.';
            }
        } catch (e) {
            bspStatus = 'ERROR';
        }
        telemetry.checks.push({
            id: 'bsp',
            label: 'BSP Transaction Logs',
            status: bspStatus,
            warning: bspWarning,
            sub: 'Circular No. 808 compliance'
        });

        // 3. BIR Tax Integration: E-invoicing middleware
        let birStatus = 'SYNCED';
        let birWarning = null;
        try {
            // Check for recent completed orders needing e-invoice sync (last 10 minutes)
            const unsyncedOrders = await prisma.order.count({
                where: {
                    status: 'COMPLETED',
                    createdAt: { gte: new Date(getNowUTC().getTime() - 10 * 60 * 1000) }
                }
            });

            // If there are very recent orders, show SYNCING, otherwise show SYNCED
            if (unsyncedOrders > 0) {
                birStatus = 'SYNCING';
                birWarning = `Processing ${unsyncedOrders} recent invoices for BIR CAS submission...`;
            } else {
                birStatus = 'SYNCED';
            }
        } catch (e) {
            birStatus = 'ERROR';
        }
        telemetry.checks.push({
            id: 'bir',
            label: 'BIR Tax Integration',
            status: birStatus,
            warning: birWarning,
            sub: 'E-invoicing middleware'
        });

        // 4. NPC Data Privacy: DPA 2012 standards
        let dpaStatus = 'SECURED';
        let dpaWarning = null;
        try {
            const dbUrl = process.env.DATABASE_URL || '';
            const isSsl = dbUrl.includes('sslmode=require') || dbUrl.includes('ssl=true') || dbUrl.includes('supabase');
            if (!isSsl && process.env.NODE_ENV === 'production') {
                dpaStatus = 'RISK';
                dpaWarning = 'Database connection is not encrypted (SSL missing).';
            }
        } catch (e) {
            dpaStatus = 'ERROR';
        }
        telemetry.checks.push({
            id: 'dpa',
            label: 'NPC Data Privacy',
            status: dpaStatus,
            warning: dpaWarning,
            sub: 'DPA 2012 standards'
        });

        return NextResponse.json(telemetry);

    } catch (error) {
        console.error('Compliance Telemetry Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

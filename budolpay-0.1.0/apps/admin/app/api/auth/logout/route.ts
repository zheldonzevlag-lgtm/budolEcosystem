import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createAuditLog } from '@/lib/audit';
import jwt from 'jsonwebtoken';

export const dynamic = "force-dynamic";

/**
 * Standardized Logout Controller (v43.5)
 * Handles both manual exit and session timeouts.
 * Forensic traceability for PCI-DSS 10.2.1 compliance.
 */
export async function POST(request: Request) {
    try {
        const body = await request.json().catch(() => ({}));
        const { reason = 'MANUAL' } = body; 
        const actionType = reason === 'TIMEOUT' ? 'USER_SESSION_TIMEOUT' : 'USER_LOGOUT';

        // 1. Identification
        const token = request.cookies.get('budolpay_token')?.value;
        let userId = 'SYSTEM';
        let email = 'unknown';

        if (token) {
            try {
                const decoded: any = jwt.decode(token);
                if (decoded) {
                    userId = decoded.id || decoded.userId || decoded.sub || 'SYSTEM';
                    email = decoded.email || 'unknown';
                }
            } catch (e) {
                console.warn('[Logout API] Token decode failed');
            }
        }

        // 2. Audit Log (Standardized v43.5)
        const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
        await createAuditLog({
            action: actionType,
            userId: userId,
            entity: 'Security',
            entityId: userId,
            ipAddress: ip,
            metadata: {
                reason,
                email,
                userAgent: request.headers.get('user-agent'),
                compliance: { pci_dss: '10.2.1' }
            }
        });

        // 3. Clear Cookie
        const response = NextResponse.json({ success: true, action: actionType });
        response.cookies.set('budolpay_token', '', {
            httpOnly: true,
            expires: new Date(0),
            path: '/',
        });

        console.log(`[Logout API] ${actionType} completed for user: ${email}`);
        return response;

    } catch (error: any) {
        console.error('[API Logout Error]', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

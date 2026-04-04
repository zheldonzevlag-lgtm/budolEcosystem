import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { createAuditLog } from '@/lib/audit';
import jwt from 'jsonwebtoken';

export const dynamic = "force-dynamic";

/**
 * Standardized Logout Controller (v43.5)
 * Handles both manual exit and session timeouts for Web & Mobile.
 * Forensic traceability for PCI-DSS 10.2.1 compliance.
 */
export async function POST(request: Request) {
    try {
        const body = await request.json().catch(() => ({}));
        const { reason = 'MANUAL' } = body; 

        // 1. Identification (Support Web Cookies & Mobile Header)
        const cookieStore = cookies();
        let token = cookieStore.get('budolpay_token')?.value;
        const authHeader = request.headers.get('Authorization');

        if (!token && authHeader?.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        }

        let userId = 'SYSTEM';
        let email = 'unknown';
        const isMobile = !!authHeader;

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

        // 2. Action Determination
        const actionType = reason === 'TIMEOUT' 
            ? 'USER_SESSION_TIMEOUT' 
            : (isMobile ? 'MOBILE_LOGOUT' : 'USER_LOGOUT');

        // 3. Audit Log (Standardized v43.5)
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
                compliance: { pci_dss: '10.2.1' },
                platform: isMobile ? 'MobileApp' : 'WebDashboard'
            }
        });

        // 4. Clear Cookie (Web only)
        const response = NextResponse.json({ success: true, action: actionType });
        if (!isMobile) {
            response.cookies.set('budolpay_token', '', {
                httpOnly: true,
                expires: new Date(0),
                path: '/',
            });
        }

        console.log(`[Logout API] ${actionType} completed for user: ${email}`);
        return response;

    } catch (error: any) {
        console.error('[API Logout Error]', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

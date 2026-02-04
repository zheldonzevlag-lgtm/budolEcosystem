import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { createAuditLog } from '@/lib/audit';

const SETTLEMENT_SERVICE_URL = process.env.SETTLEMENT_SERVICE_URL || 'http://settlement-service:8005';

export async function PATCH(
    request: Request,
    { params }: { params: { id: string } }
) {
    const id = params.id;
    const body = await request.json();
    const cookieStore = cookies();
    const token = cookieStore.get('budolpay_token')?.value;

    try {
        const res = await fetch(`${SETTLEMENT_SERVICE_URL}/disputes/${id}/resolve`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        const data = await res.json();

        if (res.ok) {
            // Log the dispute resolution
            try {
                let adminId = 'SYSTEM';
                if (token) {
                    const LOCAL_IP = process.env.LOCAL_IP || 'localhost';
                    const ssoUrl = process.env.SSO_URL || `http://${LOCAL_IP}:8000`;
                    const verifyRes = await fetch(`${ssoUrl}/auth/verify`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (verifyRes.ok) {
                        const verifyData = await verifyRes.json();
                        if (verifyData.valid && verifyData.user) {
                            const user = await prisma.user.findUnique({ where: { email: verifyData.user.email } });
                            if (user) adminId = user.id;
                        }
                    }
                }

                await createAuditLog({
                    action: 'DISPUTE_RESOLVED',
                    entity: 'Dispute',
                    entityId: id,
                    userId: adminId,
                    newValue: body as any,
                    ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
                    metadata: {
                        compliance: {
                            pci_dss: '10.2.2',
                            bsp: 'Circular 808'
                        }
                    }
                });
            } catch (auditError) {
                console.error('Failed to create audit log for dispute resolution:', auditError);
            }
        }

        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: 'Settlement service unreachable' }, { status: 503 });
    }
}

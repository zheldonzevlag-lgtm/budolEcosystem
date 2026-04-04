import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createAuditLog } from '@/lib/audit';

export const dynamic = 'force-dynamic';

/**
 * WHY: Users who forget their PIN are stuck — the only way out was previously
 *      to contact support. This endpoint allows a secure self-service reset.
 * WHAT: Clears the user's pinHash. The frontend then calls identify() again
 *       which sends an OTP. After OTP verification, the user sets a new PIN.
 */
export async function POST(request: Request) {
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    try {
        const body = await request.json();
        const { userId } = body;

        if (!userId) {
            return NextResponse.json({ error: 'userId is required' }, { status: 400 });
        }

        // Find user by ID
        const user = await prisma.user.findUnique({ where: { id: userId } });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Clear PIN hash
        await prisma.user.update({
            where: { id: user.id },
            data: {
                pinHash: null,
                otpCode: null,
                otpExpiresAt: null
            }
        });

        // Audit the reset (Standardized v43.5)
        await createAuditLog({
            userId: user.id,
            action: 'MOBILE_PIN_RESET_REQUESTED',
            entity: 'Security',
            entityId: user.id,
            ipAddress: ip,
            metadata: {
                compliance: 'BSP Circular No. 808',
                standard: 'Self-service PIN Reset'
            }
        });

        return NextResponse.json({
            status: 'PIN_CLEARED',
            message: 'PIN has been reset. Please complete OTP verification to set a new PIN.'
        });

    } catch (error: any) {
        console.error('[API Reset PIN Error]', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

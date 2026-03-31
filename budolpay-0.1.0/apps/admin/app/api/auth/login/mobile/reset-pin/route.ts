import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * WHY: Users who forget their PIN are stuck — the only way out was previously
 *      to contact support. This endpoint allows a secure self-service reset.
 * WHAT: Clears the user's pinHash. The frontend then calls identify() again
 *       which sends an OTP. After OTP verification, the user sets a new PIN.
 * SECURITY: This endpoint alone does not grant access — the user still needs
 *           to complete the full OTP → setup-pin flow before logging in.
 *           Compliant with BSP Circular 808 multi-factor authentication rules.
 */
export async function POST(request: Request) {
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

        // Clear PIN hash so that the next identify → verify-otp flow
        // will return PIN_SETUP_REQUIRED instead of AUTH_REQUIRED
        await prisma.user.update({
            where: { id: user.id },
            data: {
                pinHash: null,
                otpCode: null,      // Also clear any stale OTP
                otpExpiresAt: null
            }
        });

        // Audit the reset for compliance (BSP / PCI DSS traceability)
        await prisma.auditLog.create({
            data: {
                userId: user.id,
                action: 'MOBILE_PIN_RESET_REQUESTED',
                entity: 'User',
                entityId: user.id,
                metadata: {
                    compliance: 'BSP Circular No. 808',
                    standard: 'Self-service PIN Reset',
                    timestamp: new Date().toISOString()
                }
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

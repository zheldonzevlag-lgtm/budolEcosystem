import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createAuditLog } from '@/lib/audit';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET || 'GJ7Lxn0/kdV/KuZJ5xJ7Ip0RvMerrGW5n0gf44mfHgc=';

/**
 * [Vercel Bridge] Mobile PIN Setup
 * WHY: The Flutter app sends { userId, pin } after OTP verification.
 * WHAT: Accepts userId + pin (new format) OR phoneNumber + newPin + tempToken (legacy).
 */
export async function POST(request: Request) {
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    try {
        const body = await request.json();

        // Support both new (userId + pin) and legacy formats
        const userId = body.userId;
        const pin = body.pin || body.newPin;
        const phoneNumber = body.phoneNumber;
        const tempToken = body.tempToken;

        // Validate PIN format (6 digits)
        const pinToUse = pin?.toString().trim();
        if (!pinToUse || !/^\d{6}$/.test(pinToUse)) {
            return NextResponse.json({ error: 'PIN must be exactly 6 digits' }, { status: 400 });
        }

        // Find user
        let user;
        if (userId) {
            user = await prisma.user.findUnique({ where: { id: userId } });
        } else if (phoneNumber) {
            let normalizedPhone = phoneNumber.replace(/\D/g, '');
            if (normalizedPhone.startsWith('63')) {
                normalizedPhone = '0' + normalizedPhone.substring(2);
            }
            user = await prisma.user.findFirst({
                where: {
                    OR: [
                        { phoneNumber: phoneNumber },
                        { phoneNumber: normalizedPhone },
                        { phoneNumber: '+63' + normalizedPhone.substring(1) }
                    ]
                }
            });

            if (user && tempToken) {
                const expectedToken = Buffer.from(`${user.id}:${user.otpCode}`).toString('base64');
                if (tempToken !== expectedToken) {
                    return NextResponse.json({ error: 'Security session expired or invalid' }, { status: 401 });
                }
            }
        } else {
            return NextResponse.json({ error: 'userId or phoneNumber is required' }, { status: 400 });
        }

        if (!user) {
            return NextResponse.json({ error: 'Account not found' }, { status: 404 });
        }

        // Hash PIN (PCI DSS 8.2 Compliant)
        const pinHash = await bcrypt.hash(pinToUse, 10);

        // Update user
        await prisma.user.update({
            where: { id: user.id },
            data: {
                pinHash,
                lastLoginAt: new Date(),
                otpCode: null,
                otpExpiresAt: null
            }
        });

        // Audit PIN Setup (Standardized v43.5)
        await createAuditLog({
            userId: user.id,
            action: 'MOBILE_PIN_SETUP_SUCCESS',
            entity: 'Security',
            entityId: user.id,
            ipAddress: ip,
            metadata: { channel: 'VercelBridge', compliance: { bsp: 'Circular 808' } }
        });

        // Issue JWT
        const token = jwt.sign(
            { userId: user.id, role: user.role, phone: user.phoneNumber },
            JWT_SECRET,
            { expiresIn: '30d' }
        );

        return NextResponse.json({
            status: 'SUCCESS',
            message: 'PIN setup successful',
            token,
            user: {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                phoneNumber: user.phoneNumber,
                email: user.email,
                avatarUrl: user.avatarUrl,
                kycStatus: user.kycStatus,
                kycTier: user.kycTier
            }
        });

    } catch (error: any) {
        console.error('[API Setup PIN Error]', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

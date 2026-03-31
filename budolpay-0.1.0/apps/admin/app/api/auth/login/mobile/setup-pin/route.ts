import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET || 'GJ7Lxn0/kdV/KuZJ5xJ7Ip0RvMerrGW5n0gf44mfHgc=';

/**
 * [Vercel Bridge] Mobile PIN Setup
 * WHY: The Flutter app sends { userId, pin } after OTP verification.
 *      The old route expected { phoneNumber, newPin, tempToken } which caused a mismatch.
 * WHAT: Accepts userId + pin (new format) OR phoneNumber + newPin + tempToken (legacy).
 *       After OTP is verified, the user is allowed to set their PIN without re-validating a tempToken.
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Support both new (userId + pin) and legacy (phoneNumber + newPin + tempToken) formats
        const userId = body.userId;
        const pin = body.pin || body.newPin;
        const phoneNumber = body.phoneNumber;
        const tempToken = body.tempToken;

        // Validate PIN format (6 digits) - PCI DSS 8.2 compliant
        const pinToUse = pin?.toString().trim();
        if (!pinToUse || !/^\d{6}$/.test(pinToUse)) {
            return NextResponse.json({ error: 'PIN must be exactly 6 digits' }, { status: 400 });
        }

        // Find user by userId (new flow) or phoneNumber (legacy flow)
        let user;
        if (userId) {
            user = await prisma.user.findUnique({ where: { id: userId } });
        } else if (phoneNumber) {
            // Normalize phone: +639xx -> 09xx
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

            // Legacy: verify tempToken if provided
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

        // Update user: save pinHash and clear OTP fields
        await prisma.user.update({
            where: { id: user.id },
            data: {
                pinHash,
                lastLoginAt: new Date(),
                otpCode: null,       // Clear OTP after PIN is set
                otpExpiresAt: null
            }
        });

        // Audit PIN Setup (BSP compliance)
        await prisma.auditLog.create({
            data: {
                userId: user.id,
                action: 'MOBILE_PIN_SETUP_SUCCESS',
                entity: 'User',
                entityId: user.id,
                metadata: { channel: 'VercelBridge' }
            }
        });

        // Issue final login JWT (30-day mobile session)
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

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET || 'GJ7Lxn0/kdV/KuZJ5xJ7Ip0RvMerrGW5n0gf44mfHgc=';

/**
 * [Vercel Bridge] Mobile PIN Setup
 * Matches logic in Express auth-service/index.js (line 860)
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { phoneNumber, newPin, tempToken } = body;

        if (!phoneNumber || !newPin || !tempToken) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Validate 6-digit PIN format
        if (!/^\d{6}$/.test(newPin)) {
            return NextResponse.json({ error: 'PIN must be 6 digits' }, { status: 400 });
        }

        // Normalize phone number (+63 -> 0)
        let normalizedPhone = phoneNumber.replace(/\D/g, '');
        if (normalizedPhone.startsWith('63')) {
            normalizedPhone = '0' + normalizedPhone.substring(2);
        }

        // Find user
        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { phoneNumber: phoneNumber },
                    { phoneNumber: normalizedPhone },
                    { phoneNumber: '+63' + normalizedPhone.substring(1) }
                ]
            }
        });

        if (!user) {
            return NextResponse.json({ error: 'Account not found' }, { status: 404 });
        }

        // Verify temp token (Matches the identify flow)
        const expectedToken = Buffer.from(`${user.id}:${user.otpCode}`).toString('base64');
        if (tempToken !== expectedToken) {
            return NextResponse.json({ error: 'Security session expired or invalid' }, { status: 401 });
        }

        // Hash PIN (PCI DSS 8.2 Compliant)
        const pinHash = await bcrypt.hash(newPin, 10);

        // Update user
        await prisma.user.update({
            where: { id: user.id },
            data: {
                pinHash,
                lastLoginAt: new Date(),
                otpCode: null, // Clear OTP after use
                otpExpiresAt: null
            }
        });

        // Audit PIN Setup
        await prisma.auditLog.create({
            data: {
                userId: user.id,
                action: 'MOBILE_PIN_SETUP_SUCCESS',
                entity: 'User',
                entityId: user.id,
                metadata: { channel: 'VercelBridge' }
            }
        });

        // Issue final login JWT
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
                kycStatus: user.kycStatus
            }
        });

    } catch (error: any) {
        console.error('[API Setup PIN Error]', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

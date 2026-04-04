import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { triggerRealtimeEvent } from '@/lib/realtime-server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET || 'GJ7Lxn0/kdV/KuZJ5xJ7Ip0RvMerrGW5n0gf44mfHgc=';

/**
 * [Vercel Bridge] Mobile PIN Verification
 * Matches logic in Express auth-service/index.js (line 802)
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { phoneNumber, userId, pin, deviceId } = body;

        if ((!phoneNumber && !userId) || !pin) {
            return NextResponse.json({ error: 'User identifier and PIN are required' }, { status: 400 });
        }

        // Search for user (consistent with local index.js)
        let user;
        if (userId) {
            user = await prisma.user.findUnique({ where: { id: userId } });
        } else if (phoneNumber) {
            // Normalize phone number (+63 -> 0)
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
        }

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        if (!user.pinHash) {
            return NextResponse.json({
                status: 'PIN_SETUP_REQUIRED',
                error: 'PIN not set'
            }, { status: 403 });
        }

        // Verify PIN (PCI DSS 8.2 compliant comparison)
        const isMatch = await bcrypt.compare(pin, user.pinHash);
        if (!isMatch) {
            // Log failed attempt for audit (AuditLog model is available)
            await prisma.auditLog.create({
                data: {
                    userId: user.id,
                    action: 'MOBILE_LOGIN_FAILED',
                    entity: 'User',
                    entityId: user.id,
                    metadata: { reason: 'Invalid PIN', deviceId }
                }
            });
            
            // Trigger realtime update for dashboard
            await triggerRealtimeEvent('admin', 'MOBILE_LOGIN_FAILED', { 
                phoneNumber: user.phoneNumber, 
                reason: 'Invalid PIN',
                deviceId 
            });

            return NextResponse.json({ error: 'Invalid security PIN' }, { status: 401 });
        }

        // 4. Handle Device Trust Update (Consistent with local JSON format)
        let devices = [];
        try {
            devices = user.trustedDevices ? JSON.parse(user.trustedDevices) : [];
        } catch {
            // Fallback for comma-separated legacy or corrupt data
            devices = user.trustedDevices ? user.trustedDevices.split(',').map((id: string) => ({ deviceId: id, isVerified: true })) : [];
        }

        if (deviceId) {
            const deviceIndex = devices.findIndex((d: any) => d.deviceId === deviceId);
            if (deviceIndex !== -1) {
                devices[deviceIndex].isVerified = true;
                devices[deviceIndex].lastUsed = new Date();
            } else {
                devices.push({
                    deviceId,
                    addedAt: new Date(),
                    lastUsed: new Date(),
                    isVerified: true
                });
            }
        }

        // Update login state
        await prisma.user.update({
            where: { id: user.id },
            data: {
                lastLoginAt: new Date(),
                trustedDevices: JSON.stringify(devices)
            }
        });

        // Audit Success
        await prisma.auditLog.create({
            data: {
                userId: user.id,
                action: 'MOBILE_LOGIN_SUCCESS',
                entity: 'User',
                entityId: user.id,
                metadata: { deviceId }
            }
        });

        // Trigger realtime update for dashboard — Ensure instant synchronization (v43.1)
        await triggerRealtimeEvent('admin', 'AUDIT_LOG_CREATED', {
            action: 'MOBILE_LOGIN_SUCCESS',
            entity: 'User',
            entityId: user.id,
            user: {
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role
            },
            createdAt: new Date().toISOString(),
            metadata: { deviceId }
        });

        // Issue JWT (BSP Standard Multi-Factor Identity)
        const token = jwt.sign(
            { 
                userId: user.id, 
                role: user.role,
                phone: user.phoneNumber,
                email: user.email 
            },
            JWT_SECRET,
            { expiresIn: '30d' } // Mobile sessions are usually longer
        );

        return NextResponse.json({
            status: 'SUCCESS',
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
        console.error('[API Verify PIN Error]', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createAuditLog } from '@/lib/audit';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    // Base URL for redirects, ensuring we don't use 0.0.0.0
    const baseUrl = new URL(request.url);
    if (baseUrl.hostname === '0.0.0.0') {
        baseUrl.hostname = process.env.LOCAL_IP || 'localhost';
    }

    if (!token) {
        return NextResponse.redirect(new URL('/login?error=no_token', baseUrl));
    }

    try {
        // 1. Verify token with budolID
        // In this ecosystem, budolID is at port 8000
        const LOCAL_IP = process.env.LOCAL_IP || 'localhost';
        const ssoUrl = process.env.NEXT_PUBLIC_SSO_URL || process.env.SSO_URL || `http://${LOCAL_IP}:8000`;
        
        console.log(`[SSO Callback] Verifying token with: ${ssoUrl}/auth/verify`);
        
        const verifyResponse = await fetch(`${ssoUrl}/auth/verify`, {
            headers: {
                'Authorization': `Bearer ${token}`
            },
            cache: 'no-store'
        });

        if (!verifyResponse.ok) {
            const errorText = await verifyResponse.text();
            console.error(`[SSO Callback] Verification failed with status ${verifyResponse.status}:`, errorText);
            
            // Log Failure (v43.5)
            const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
            await createAuditLog({
                action: 'USER_LOGIN_FAILURE',
                userId: 'SYSTEM',
                entity: 'Security',
                entityId: 'SSO_CALLBACK',
                ipAddress: ip,
                metadata: { reason: `SSO Verification returned status ${verifyResponse.status}`, error: errorText }
            });

            return NextResponse.redirect(new URL(`/login?error=verification_failed&status=${verifyResponse.status}`, baseUrl));
        }

        const verificationData = await verifyResponse.json();
        console.log('[SSO Callback] Verification data:', JSON.stringify(verificationData));

        if (!verificationData.valid) {
            console.error('[SSO Callback] Token marked as invalid by budolID');
            
            // Log Failure (v43.5)
            const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
            await createAuditLog({
                action: 'USER_LOGIN_FAILURE',
                userId: 'SYSTEM',
                entity: 'Security',
                entityId: 'SSO_CALLBACK',
                ipAddress: ip,
                metadata: { reason: 'Token marked as invalid by SSO provider' }
            });

            return NextResponse.redirect(new URL('/login?error=invalid_token', baseUrl));
        }

        const { user: ssoUser } = verificationData;

        // 2. Sync user with local budolPay database
        let localUser = await prisma.user.findUnique({
            where: { email: ssoUser.email }
        });

        if (!localUser) {
            // Create local user if they don't exist
            localUser = await prisma.user.create({
                data: {
                    email: ssoUser.email,
                    firstName: ssoUser.firstName || 'SSO',
                    lastName: ssoUser.lastName || 'User',
                    passwordHash: 'SSO_MANAGED',
                    phoneNumber: ssoUser.phoneNumber || `SSO_${Date.now()}`,
                    role: 'STAFF', // Default role for new SSO users in Admin
                    kycStatus: 'VERIFIED'
                }
            });
        }

        // 3. Set local session cookie
        const protocol = request.headers.get('x-forwarded-proto') || 'http';
        const host = request.headers.get('host');
        const appUrl = process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_APP_URL.includes('localhost:3000') 
            ? process.env.NEXT_PUBLIC_APP_URL 
            : `${protocol}://${host}`;

        const response = NextResponse.redirect(new URL('/', appUrl));
        
        // Log Login Action for Forensic Audit Trail
        const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
        await createAuditLog({
            action: 'USER_LOGIN',
            userId: localUser.id,
            entity: 'Security',
            entityId: localUser.id,
            ipAddress: ip,
            metadata: {
                userAgent: request.headers.get('user-agent'),
                authMethod: 'SSO_CALLBACK',
                compliance: {
                    pci_dss: '10.2.1',
                    bsp: 'Circular 808'
                }
            }
        });

        console.log(`[SSO Callback] Setting budolpay_token cookie and redirecting to / via ${appUrl}`);
        // Use the same token for the local cookie so the middleware can verify it
        response.cookies.set('budolpay_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // Secure in production (HTTPS), false in dev (HTTP)
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 7 // 7 days
        });

        return response;

    } catch (error: any) {
        console.error('SSO Callback Error Details:', {
            error,
            url: request.url
        });
        
        // Log Unexpected Error (v43.5)
        try {
            const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
            await createAuditLog({
                action: 'USER_LOGIN_FAILURE',
                userId: 'SYSTEM',
                entity: 'Security',
                entityId: 'SSO_CALLBACK',
                ipAddress: ip,
                metadata: { reason: 'SSO Callback internal error', error: error.message }
            });
        } catch (e) {}

        // Base URL for redirects, ensuring we don't use 0.0.0.0
        const baseUrl = new URL(request.url);
        if (baseUrl.hostname === '0.0.0.0') {
            baseUrl.hostname = process.env.LOCAL_IP || 'localhost';
        }
        
        return NextResponse.redirect(new URL('/login?error=sso_failed', baseUrl));
    }
}

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { COOKIE_OPTIONS } from '@/lib/auth';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    // Base URL for redirects
    const baseUrl = new URL(request.url);
    const LOCAL_IP = process.env.LOCAL_IP || 'localhost';
    if (baseUrl.hostname === '0.0.0.0') {
        baseUrl.hostname = LOCAL_IP;
    }

    if (!token) {
        console.log('[SSO Callback] No token provided');
        return NextResponse.redirect(new URL('/login?error=no_token', baseUrl));
    }

    try {
        // 1. Verify token with budolID
        const ssoUrl = process.env.NEXT_PUBLIC_SSO_URL || `http://${LOCAL_IP}:8000`;
        
        console.log(`[SSO Callback] Verifying token with SSO: ${ssoUrl}/auth/verify`);
        const verifyResponse = await fetch(`${ssoUrl}/auth/verify`, {
            headers: {
                'Authorization': `Bearer ${token}`
            },
            cache: 'no-store'
        });

        if (!verifyResponse.ok) {
            const errorText = await verifyResponse.text();
            console.error(`[SSO Callback] Verification failed with status ${verifyResponse.status}:`, errorText);
            return NextResponse.redirect(new URL(`/login?error=verification_failed&status=${verifyResponse.status}`, baseUrl));
        }

        const verificationData = await verifyResponse.json();
        console.log(`[SSO Callback] Verification response data:`, JSON.stringify(verificationData));

        if (!verificationData.valid) {
            console.log('[SSO Callback] Token verification failed: marked as invalid');
            return NextResponse.redirect(new URL('/login?error=invalid_token', baseUrl));
        }

        const { user: ssoUser } = verificationData;
        console.log(`[SSO Callback] Token verified for: ${ssoUser.email}`);

        // 2. Sync user with local budolShap database
        let localUser = await prisma.user.findUnique({
            where: { email: ssoUser.email }
        });

        if (!localUser) {
            console.log(`[SSO Callback] Creating local user for ${ssoUser.email}`);
            // Create local user if they don't exist
            // Use the same ID from SSO to keep it consistent
            localUser = await prisma.user.create({
                data: {
                    id: ssoUser.id,
                    email: ssoUser.email,
                    name: `${ssoUser.firstName || ''} ${ssoUser.lastName || ''}`.trim() || 'SSO User',
                    password: 'SSO_MANAGED', // Placeholder
                    phoneNumber: ssoUser.phoneNumber || `SSO_${Date.now()}`,
                    image: ssoUser.avatarUrl || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y',
                    emailVerified: true,
                    role: 'USER'
                }
            });
        }

        // 3. Set local session cookie
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || `${baseUrl.protocol}//${baseUrl.host}`;
        const response = NextResponse.redirect(new URL('/', appUrl));
        
        console.log(`[SSO Callback] Setting budolshap_token cookie and redirecting to /`);
        
        // Use the same token for the local cookie
        response.cookies.set('budolshap_token', token, COOKIE_OPTIONS);

        return response;

    } catch (error) {
        console.error('[SSO Callback] Error:', error);
        return NextResponse.redirect(new URL('/login?error=sso_failed', baseUrl));
    }
}

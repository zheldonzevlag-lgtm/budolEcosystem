import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkRateLimit } from '@/lib/rate-limit';
import { createAuditLog } from '@/lib/audit';

export async function POST(request: Request) {
    try {
        const { email, password } = await request.json();

        // 0. Rate Limiting (Budol Ecosystem Security Standard Phase 3)
        // Protect against brute force attacks on authentication endpoints.
        const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
        const rateLimitKey = `auth_login_${ip}`;
        
        // Fetch rate limit setting from database (default to 5 attempts per 15 mins if not set)
        const limitSetting = await prisma.systemSetting.findUnique({ where: { key: 'SECURITY_RATE_LIMIT_AUTH' } });
        const limit = limitSetting ? parseInt(limitSetting.value) : 5;
        const window = 15 * 60; // 15 minutes

        const limiter = await checkRateLimit(rateLimitKey, limit, window);
        
        if (!limiter.success) {
            console.warn(`[Login API] Rate limit exceeded for IP: ${ip}`);
            return NextResponse.json(
                { 
                    error: 'Too many login attempts. Please try again later.',
                    retryAfter: limiter.reset
                },
                { 
                    status: 429,
                    headers: {
                        'Retry-After': Math.ceil((limiter.reset.getTime() - Date.now()) / 1000).toString()
                    }
                }
            );
        }

        // 1. Authenticate against budolID API (Server-to-Server)
        const LOCAL_IP = process.env.LOCAL_IP || 'localhost';
        const ssoUrl = process.env.SSO_URL || `http://${LOCAL_IP}:8000`;
        const apiKey = 'bp_key_2025'; // This should be in env

        console.log(`[Login API] Attempting SSO login via: ${ssoUrl}/auth/sso/login`);
        
        const ssoResponse = await fetch(`${ssoUrl}/auth/sso/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email,
                password,
                apiKey
            })
        });

        const ssoData = await ssoResponse.json();

        if (!ssoResponse.ok) {
            return NextResponse.json(
                { error: ssoData.error || 'Authentication failed' },
                { status: ssoResponse.status }
            );
        }

        const { token } = ssoData;

        // 2. Verify token immediately to get user details for local sync
        // (Optional if we trust the login response, but good practice)
        const verifyResponse = await fetch(`${ssoUrl}/auth/verify`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const verifyData = await verifyResponse.json();
        
        if (!verifyData.valid) {
            return NextResponse.json({ error: 'Token validation failed' }, { status: 401 });
        }
        
        const { user: ssoUser } = verifyData;

        // 3. Sync User Locally
        let localUser = await prisma.user.findUnique({
            where: { email: ssoUser.email }
        });

        if (!localUser) {
            localUser = await prisma.user.create({
                data: {
                    email: ssoUser.email,
                    firstName: ssoUser.firstName || 'SSO',
                    lastName: ssoUser.lastName || 'User',
                    passwordHash: 'SSO_MANAGED', // No password stored locally
                    phoneNumber: ssoUser.phoneNumber || `SSO_${Date.now()}`,
                    role: 'STAFF', 
                    kycStatus: 'VERIFIED'
                }
            });
        }

        // 4. Set Session Cookie
        const response = NextResponse.json({ success: true });
        
        // Log Login Action for Forensic Audit Trail
        await createAuditLog({
            action: 'USER_LOGIN',
            userId: localUser.id,
            entity: 'Security',
            entityId: localUser.id,
            ipAddress: ip,
            metadata: {
                userAgent: request.headers.get('user-agent'),
                authMethod: 'SSO_BUDOLID',
                compliance: {
                    pci_dss: '10.2.1',
                    bsp: 'Circular 808'
                }
            }
        });

        console.log(`[Login API] Setting budolpay_token for ${email}`);
        response.cookies.set('budolpay_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 7 // 7 days
        });

        return response;

    } catch (error: any) {
        console.error('Login API Error:', error);
        
        // Handle connection errors (e.g. SSO service down)
        if (error.code === 'ECONNREFUSED' || error.message.includes('fetch failed')) {
            return NextResponse.json(
                { error: 'SSO Service (budolID) is currently offline. Please ensure the authentication server is running on port 8000.' },
                { status: 503 }
            );
        }

        return NextResponse.json(
            { error: 'Internal Server Error' }, 
            { status: 500 }
        );
    }
}
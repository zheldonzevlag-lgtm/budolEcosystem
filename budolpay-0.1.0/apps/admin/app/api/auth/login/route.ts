import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const { email, password } = await request.json();

        // 1. Authenticate against budolID API (Server-to-Server)
        const ssoUrl = process.env.SSO_URL || 'http://192.168.1.24:8000';
        const apiKey = 'bp_key_2025'; // This should be in env

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
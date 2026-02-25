import { NextResponse } from 'next/server';
import { COOKIE_OPTIONS, generateToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const LOCAL_IP = process.env.LOCAL_IP || 'localhost';
    // Use LOCAL_IP instead of localhost to avoid potential IPv6 resolution issues with fetch in Node.js
    const ssoUrl = (process.env.NEXT_PUBLIC_SSO_URL || `http://${LOCAL_IP}:8000`).replace('localhost', LOCAL_IP);

    // Base URL for redirects, ensuring we don't use 0.0.0.0
    const baseUrl = new URL(request.url);
    if (baseUrl.hostname === '0.0.0.0') {
        baseUrl.hostname = LOCAL_IP;
    }

    if (!token || token === 'undefined') {
        return NextResponse.redirect(new URL('/login?error=no_token', baseUrl));
    }

    try {
        console.log('[SSO Callback] DATABASE_URL:', process.env.DATABASE_URL ? (process.env.DATABASE_URL.substring(0, 15) + '...') : 'NOT SET');
        console.log('[SSO Callback] Verifying token with:', `${ssoUrl}/auth/verify`);
        // 1. Verify token with budolID
        console.log(`[SSO Callback] Fetching from ${ssoUrl}/auth/verify with token: ${token.substring(0, 10)}...`);
        
        const verifyResponse = await axios.get(`${ssoUrl}/auth/verify`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const verificationData = verifyResponse.data;
        console.log('[SSO Callback] Verification result:', verificationData);

        if (!verificationData.valid) {
            console.error('SSO Verification Failed:', verificationData);
            return NextResponse.redirect(new URL('/login?error=invalid_token', baseUrl));
        }

        const { user: ssoUser } = verificationData;
        console.log('[SSO Callback] SSO User:', ssoUser);

        // 2. Sync user with local budolShap database
        // We use the email as the unique identifier across the ecosystem
        let localUser = await prisma.user.findUnique({
            where: { email: ssoUser.email }
        });

        if (!localUser) {
            console.log('[SSO Callback] Creating local user for:', ssoUser.email);
            // Create user if they don't exist
            localUser = await prisma.user.create({
                data: {
                    id: `sso_${Math.random().toString(36).substring(2, 15)}`,
                    email: ssoUser.email,
                    name: ssoUser.firstName ? `${ssoUser.firstName} ${ssoUser.lastName || ''}`.trim() : (ssoUser.name || ssoUser.email.split('@')[0]),
                    phoneNumber: ssoUser.phoneNumber || `sso_${Math.random().toString(36).substring(2, 10)}`, // Fallback for legacy users
                    password: 'SSO_MANAGED_USER',
                    image: ssoUser.avatarUrl || ssoUser.image || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + ssoUser.email,
                    accountType: ssoUser.role === 'ADMIN' ? 'ADMIN' : 'BUYER',
                    isAdmin: ssoUser.role === 'ADMIN',
                    emailVerified: true,
                    metadata: {
                        ssoUserId: ssoUser.id
                    }
                }
            });
        } else {
            console.log('[SSO Callback] Updating existing local user:', ssoUser.email);
            // Always sync role/isAdmin and store ssoUserId in metadata
            const existingMetadata = typeof localUser.metadata === 'object' ? localUser.metadata : {};
            
            localUser = await prisma.user.update({
                where: { email: ssoUser.email },
                data: {
                    accountType: ssoUser.role === 'ADMIN' ? 'ADMIN' : 'BUYER',
                    isAdmin: ssoUser.role === 'ADMIN',
                    name: ssoUser.firstName ? `${ssoUser.firstName} ${ssoUser.lastName || ''}`.trim() : localUser.name,
                    image: ssoUser.avatarUrl || ssoUser.image || localUser.image,
                    metadata: {
                        ...existingMetadata,
                        ssoUserId: ssoUser.id
                    }
                }
            });
        }
        console.log('[SSO Callback] Local user synced:', localUser.id);

        // 3. Generate a local token for budolShap
        const localToken = generateToken({
            userId: localUser.id,
            email: localUser.email,
            name: localUser.name,
            role: localUser.accountType
        });

        // 4. Set local session cookie
        const protocol = request.headers.get('x-forwarded-proto') || 'http';
        const host = request.headers.get('host');
        
        // Use relative URL for redirect to ensure cookies are set correctly on the same origin
        const redirectUrl = new URL('/', `${protocol}://${host}`);
        redirectUrl.searchParams.set('token', localToken);
        redirectUrl.searchParams.set('sso', 'true');
        
        const response = NextResponse.redirect(redirectUrl);
        
        console.log(`[SSO Callback] Redirecting to ${redirectUrl.toString()}`);
        console.log(`[SSO Callback] Setting auth cookies: budolshap_token and token`);
        
        const cookieConfig = {
            ...COOKIE_OPTIONS,
            httpOnly: false,
            maxAge: 60 * 60 * 24 * 7,
            path: '/'
        };
        
        response.cookies.set('budolshap_token', localToken, cookieConfig);
        response.cookies.set('token', localToken, cookieConfig);

        console.log(`[SSO Callback] Cookies set. Redirecting...`);
        return response;

    } catch (error) {
        const errorLog = {
            message: error.message,
            code: error.code,
            response: error.response ? {
                status: error.response.status,
                data: error.response.data
            } : 'No response',
            stack: error.stack,
            url: request.url,
            timestamp: new Date().toISOString()
        };
        
        try {
            fs.appendFileSync('sso-error.log', JSON.stringify(errorLog, null, 2) + '\n---\n');
        } catch (e) {
            console.error('Failed to write to sso-error.log', e);
        }

        console.error('SSO Callback CRITICAL ERROR:', error);
        
        // Prevent redirecting to 0.0.0.0 which is an invalid browsable address
        const baseUrl = new URL(request.url);
        if (baseUrl.hostname === '0.0.0.0') {
            baseUrl.hostname = 'localhost';
        }
        
        return NextResponse.redirect(new URL('/login?error=sso_failed', baseUrl));
    }
}

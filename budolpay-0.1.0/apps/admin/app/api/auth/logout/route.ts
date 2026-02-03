import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
    const cookieStore = cookies();
    const token = cookieStore.get('budolpay_token')?.value;
    let userId = null;

    // Try to get user ID from token before clearing it
    if (token) {
        try {
            const LOCAL_IP = process.env.LOCAL_IP || 'localhost';
            const ssoUrl = process.env.SSO_URL || `http://${LOCAL_IP}:8000`;
            
            const verifyResponse = await fetch(`${ssoUrl}/auth/verify`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (verifyResponse.ok) {
                const verifyData = await verifyResponse.json();
                if (verifyData.valid && verifyData.user) {
                    // Find the local user
                    const localUser = await prisma.user.findUnique({
                        where: { email: verifyData.user.email }
                    });
                    if (localUser) {
                        userId = localUser.id;
                    }
                }
            }
        } catch (error) {
            console.error('Logout audit log error:', error);
        }
    }

    // Log the logout event if we found a user
    if (userId) {
        const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
        await prisma.auditLog.create({
            data: {
                action: 'USER_LOGOUT',
                userId: userId,
                entity: 'Security',
                ipAddress: ip,
                userAgent: request.headers.get('user-agent'),
                metadata: {
                    compliance: {
                        pci_dss: '10.2.3',
                        bsp: 'Circular 808'
                    }
                }
            }
        });
    }

    const response = NextResponse.json({ success: true });
    
    // Clear the budolpay_token cookie
    response.cookies.set('budolpay_token', '', {
        httpOnly: true,
        expires: new Date(0),
        path: '/',
    });

    return response;
}

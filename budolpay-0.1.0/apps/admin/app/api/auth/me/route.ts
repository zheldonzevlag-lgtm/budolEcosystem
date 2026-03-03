import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('budolpay_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const LOCAL_IP = process.env.LOCAL_IP || 'localhost';
    const ssoUrl = process.env.SSO_URL || `http://${LOCAL_IP}:8000`;

    const verifyResponse = await fetch(`${ssoUrl}/auth/verify`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const verifyData = await verifyResponse.json();

    if (!verifyResponse.ok || !verifyData.valid) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Bridge: Find local user by email from SSO
    const localUser = await prisma.user.findUnique({
      where: { email: verifyData.user.email }
    });

    return NextResponse.json({
      user: {
        ...verifyData.user,
        id: localUser?.id || verifyData.user.id // Prefer local ID if available
      }
    });
  } catch (error) {
    console.error('Me API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

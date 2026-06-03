import { NextResponse } from 'next/server';
export const dynamic = "force-dynamic";
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('budolpay_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let localUser;

    // Handle local admin tokens
    if (token.startsWith('local_')) {
      const userId = token.slice('local_'.length);
      localUser = await prisma.user.findUnique({
        where: { id: userId }
      });
      if (!localUser) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
      }

      return NextResponse.json({
        user: {
          id: localUser.id,
          email: localUser.email,
          firstName: localUser.firstName,
          lastName: localUser.lastName,
          role: localUser.role
        }
      });
    } else {
      // Handle SSO tokens
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
      localUser = await prisma.user.findUnique({
        where: { email: verifyData.user.email }
      });

      return NextResponse.json({
        user: {
          ...verifyData.user,
          id: localUser?.id || verifyData.user.id // Prefer local ID if available
        }
      });
    }
  } catch (error) {
    console.error('Me API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

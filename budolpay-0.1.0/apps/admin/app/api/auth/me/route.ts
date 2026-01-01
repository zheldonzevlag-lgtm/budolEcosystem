import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('budolpay_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ssoUrl = process.env.SSO_URL || 'http://192.168.1.24:8000';

    const verifyResponse = await fetch(`${ssoUrl}/auth/verify`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const verifyData = await verifyResponse.json();

    if (!verifyResponse.ok || !verifyData.valid) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    return NextResponse.json({ user: verifyData.user });
  } catch (error) {
    console.error('Me API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

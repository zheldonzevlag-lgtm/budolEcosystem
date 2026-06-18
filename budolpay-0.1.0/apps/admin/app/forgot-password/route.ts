import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET() {
    const ssoUrl = process.env.SSO_URL || process.env.BUDOLID_SSO_URL || process.env.NEXT_PUBLIC_SSO_URL || 'https://budolid-ten.vercel.app';
    const apiKey = process.env.BUDOLPAY_API_KEY || process.env.NEXT_PUBLIC_BUDOLPAY_API_KEY || 'bp_b31ea1888dcb2ba76fdbb776ea8f5b7a';
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://budolpay.vercel.app';

    const target = `${ssoUrl.replace(/\/$/, '')}/forgot-password?apiKey=${encodeURIComponent(apiKey)}&redirect_uri=${encodeURIComponent(appUrl + '/login')}`;

    return NextResponse.redirect(target);
}
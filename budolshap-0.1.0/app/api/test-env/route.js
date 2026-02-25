import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({
        NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'NOT SET',
        NEXT_PUBLIC_SSO_URL: process.env.NEXT_PUBLIC_SSO_URL || 'NOT SET',
        NODE_ENV: process.env.NODE_ENV || 'NOT SET',
        PORT: process.env.PORT || 'NOT SET',
        LALAMOVE_ENV: process.env.LALAMOVE_ENV || 'NOT SET'
    });
}

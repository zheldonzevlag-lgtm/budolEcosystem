import { NextResponse } from 'next/server';

const SETTLEMENT_SERVICE_URL = process.env.SETTLEMENT_SERVICE_URL || 'http://settlement-service:8005';

export async function GET() {
    try {
        const res = await fetch(`${SETTLEMENT_SERVICE_URL}/disputes`, { cache: 'no-store' });
        const data = await res.json();
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: 'Settlement service unreachable' }, { status: 503 });
    }
}

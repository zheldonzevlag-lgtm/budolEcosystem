import { NextResponse } from 'next/server';

const SETTLEMENT_SERVICE_URL = process.env.SETTLEMENT_SERVICE_URL || 'http://settlement-service:8005';

export async function PATCH(
    request: Request,
    { params }: { params: { id: string } }
) {
    const id = params.id;
    const body = await request.json();

    try {
        const res = await fetch(`${SETTLEMENT_SERVICE_URL}/disputes/${id}/resolve`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        const data = await res.json();
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: 'Settlement service unreachable' }, { status: 503 });
    }
}

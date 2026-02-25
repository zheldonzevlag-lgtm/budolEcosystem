import { NextResponse } from 'next/server'

const BUDOL_ID_URL = process.env.BUDOL_ID_URL || 'http://localhost:8000';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');

    console.log(`[API Check Phone] Checking phone: ${phone}`);

    if (!phone) {
        return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    try {
        const url = `${BUDOL_ID_URL}/auth/check-phone?phone=${encodeURIComponent(phone)}`;
        console.log(`[API Check Phone] Proxying to: ${url}`);
        
        const response = await fetch(url, {
            headers: {
                'Accept': 'application/json'
            },
            cache: 'no-store'
        });
        
        const text = await response.text();
        console.log(`[API Check Phone] Raw response from budolID: ${text}`);
        
        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            console.error(`[API Check Phone] Failed to parse JSON: ${text}`);
            return NextResponse.json({ error: 'Invalid response from identity service' }, { status: 500 });
        }

        console.log(`[API Check Phone] Parsed data:`, data);

        if (!response.ok) {
            return NextResponse.json({ error: data.error || 'Failed to check phone number' }, { status: response.status });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('[API Check Phone] Error:', error);
        return NextResponse.json({ error: 'Identity service unavailable' }, { status: 503 });
    }
}

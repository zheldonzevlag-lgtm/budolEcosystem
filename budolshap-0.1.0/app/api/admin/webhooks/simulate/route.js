import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';

export async function POST(request) {
    const { authorized, errorResponse } = await requireAdmin(request)
    if (!authorized) return errorResponse

    try {
        const { payload, provider } = await request.json();

        if (!payload || !provider) {
            return NextResponse.json({ error: 'Payload and provider required' }, { status: 400 });
        }

        // Determine Webhook URL
        const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
        const host = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || 'localhost:3000';
        const baseUrl = host.startsWith('http') ? host : `${protocol}://${host}`;

        let webhookUrl = '';

        if (provider === 'lalamove') {
            webhookUrl = `${baseUrl}/api/shipping/lalamove/webhook`;
        } else {
            return NextResponse.json({ error: 'Unknown provider' }, { status: 400 });
        }

        console.log(`[Admin] Simulating webhook to ${webhookUrl}`);

        try {
            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Lalamove-Signature': 'simulated-test-signature',
                    'Authorization': 'simulated-test-signature'
                },
                body: JSON.stringify(payload)
            });

            const resultData = await response.json().catch(() => ({}));

            // We return success even if the webhook returns 404/retry, 
            // because the simulation *request* worked.
            // But we pass the status code back.

            return NextResponse.json({
                success: response.ok,
                status: response.status,
                message: response.ok ? 'Simulation sent successfully' : `Webhook responded with ${response.status}`,
                result: resultData
            });

        } catch (fetchError) {
            return NextResponse.json({ error: `Fetch failed: ${fetchError.message}` }, { status: 502 });
        }

    } catch (error) {
        console.error('Simulation error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

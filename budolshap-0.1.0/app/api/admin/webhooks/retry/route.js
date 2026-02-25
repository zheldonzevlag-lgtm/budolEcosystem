import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminAuth';

export async function POST(request) {
    const { authorized, errorResponse } = await requireAdmin(request)
    if (!authorized) return errorResponse

    try {
        const { eventId } = await request.json();

        if (!eventId) {
            return NextResponse.json({ error: 'Event ID required' }, { status: 400 });
        }

        const event = await prisma.webhookEvent.findUnique({
            where: { id: eventId }
        });

        if (!event) {
            return NextResponse.json({ error: 'Event not found' }, { status: 404 });
        }

        // Determine Webhook URL
        const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
        const host = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || 'localhost:3000';
        const baseUrl = host.startsWith('http') ? host : `${protocol}://${host}`;

        let webhookUrl = '';

        if (event.provider === 'lalamove') {
            webhookUrl = `${baseUrl}/api/shipping/lalamove/webhook`;
        } else {
            return NextResponse.json({ error: 'Unknown provider' }, { status: 400 });
        }

        console.log(`[Admin] Retrying webhook ${eventId} to ${webhookUrl}`);

        try {
            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Lalamove-Signature': 'simulated-retry-signature',
                    'Authorization': 'simulated-retry-signature'
                },
                body: JSON.stringify(event.payload)
            });

            const resultData = await response.json().catch(() => ({}));

            if (!response.ok) {
                return NextResponse.json({
                    success: false,
                    message: `Retry failed with status ${response.status}`,
                    result: resultData
                });
            }

            // Update event status to RETRIED or keep logic simple (the handler creates a NEW log anyway!)
            // We should mark THIS event as "Retried"? 
            // Or rely on the new log.
            // Let's just return success.

            return NextResponse.json({
                success: true,
                message: 'Retry request processed',
                result: resultData
            });

        } catch (fetchError) {
            return NextResponse.json({ error: `Fetch failed: ${fetchError.message}` }, { status: 502 });
        }

    } catch (error) {
        console.error('Retry error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

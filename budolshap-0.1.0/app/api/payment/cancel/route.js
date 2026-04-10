import { NextResponse } from 'next/server';

/**
 * Payment Cancellation Proxy – POST /api/payment/cancel
 *
 * WHY THIS EXISTS:
 *   When a user clicks "Cancel Payment" or closes the QR modal in budolshap,
 *   we call /api/orders/{id}/cancel which sets the Order to CANCELLED in the
 *   budolshap DB.  However the corresponding Transaction record in the
 *   budolPay payment-gateway is a SEPARATE DB entity and remains PENDING.
 *
 *   Stale PENDING transactions:
 *     • Appear in the Admin Dashboard under the wrong status
 *     • Skew financial reconciliation reports
 *     • Violate BSP Circular No. 808 accurate ledger requirements
 *
 * WHAT THIS DOES:
 *   Acts as an authenticated proxy, receiving the referenceId (payment intent
 *   reference) from the frontend, forwarding it to the gateway's
 *   POST /cancel/:referenceId endpoint, and returning the result.
 *
 * COMPLIANCE:
 *   PCI DSS Req 10.2.4 – Log Access to Audit Trails
 *   BSP Circular No. 808 – Financial Transaction Audit Standard
 *   NPC – accurate record-keeping of processed personal data (payment sessions)
 */
export async function POST(request) {
    try {
        const body = await request.json();

        // referenceId – the gateway's referenceId stored on the transaction
        // intentId    – optional, the internal UUID of the transaction (fallback lookup)
        const { referenceId, intentId, reason = 'User cancelled payment' } = body;

        if (!referenceId && !intentId) {
            return NextResponse.json(
                { error: 'referenceId or intentId is required' },
                { status: 400 }
            );
        }

        // Resolve the gateway base URL:
        //   Production → PAYMENT_GATEWAY_URL env var (set in Vercel project settings)
        //   Local dev   → http://localhost:8004
        const GATEWAY_BASE_URL =
            process.env.PAYMENT_GATEWAY_URL ||
            process.env.NEXT_PUBLIC_PAYMENT_GATEWAY_URL ||
            'http://localhost:8004';

        // Use referenceId if provided; fall back to intentId
        const targetRef = referenceId || intentId;

        console.log(`[Payment Cancel Proxy] Forwarding cancel for ref: ${targetRef} | reason: ${reason}`);

        const gatewayRes = await fetch(`${GATEWAY_BASE_URL}/cancel/${targetRef}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reason }),
            // Short timeout – fire-and-forget is acceptable, but we prefer a confirmed response
            signal: AbortSignal.timeout(8000)
        });

        // We handle both success and expected "not found" responses gracefully
        if (gatewayRes.status === 404) {
            console.warn(`[Payment Cancel Proxy] Gateway: transaction ${targetRef} not found. May have already expired.`);
            return NextResponse.json(
                { success: true, status: 'NOT_FOUND', message: 'Transaction not found in gateway (may have already expired)' },
                { status: 200 } // Return 200 to the client – the goal is already achieved
            );
        }

        if (gatewayRes.status === 409) {
            // 409 = transaction was COMPLETED – do not overwrite, return the conflict
            const data = await gatewayRes.json().catch(() => ({}));
            console.warn(`[Payment Cancel Proxy] Cannot cancel COMPLETED transaction ${targetRef}.`);
            return NextResponse.json({ error: data.error || 'Cannot cancel a completed transaction' }, { status: 409 });
        }

        if (!gatewayRes.ok) {
            const errorText = await gatewayRes.text().catch(() => 'Unknown error');
            console.error(`[Payment Cancel Proxy] Gateway responded with ${gatewayRes.status}: ${errorText}`);
            return NextResponse.json(
                { error: `Gateway error: ${gatewayRes.status}` },
                { status: 502 }
            );
        }

        const data = await gatewayRes.json();
        console.log(`[Payment Cancel Proxy] ✅ Transaction ${targetRef} cancelled on gateway. Response:`, data);

        return NextResponse.json(data);

    } catch (error) {
        // Network errors, timeouts, etc. – log but do not block the user
        if (error.name === 'TimeoutError' || error.name === 'AbortError') {
            console.error('[Payment Cancel Proxy] ⏰ Gateway request timed out. Transaction may still be PENDING.');
            return NextResponse.json(
                { success: false, error: 'Gateway timeout – transaction may still be PENDING. It will be auto-expired by the cleanup job.' },
                { status: 504 }
            );
        }

        console.error('[Payment Cancel Proxy] Unexpected error:', error.message);
        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}

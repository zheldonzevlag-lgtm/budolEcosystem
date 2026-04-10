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
 *   Root cause of the original bug:
 *     The budolpay-adapter.js was merging the gateway's `referenceId` field into
 *     `paymentIntentId`, so the cancel handler received paymentIntentId = "JON-xxx"
 *     but referenceId = null. This proxy would then call /cancel/null — which fails.
 *
 *   Fix applied in v2.2.8 (hotfix):
 *     - budolpay-adapter.js now exposes both `paymentIntentId` (UUID) and
 *       `referenceId` (JON-xxx string) as separate fields.
 *     - This proxy prefers referenceId, falls back to intentId (UUID).
 *     - Null/undefined guard prevents calling /cancel/null.
 *
 * COMPLIANCE:
 *   PCI DSS Req 10.2.4 – Log Access to Audit Trails
 *   BSP Circular No. 808 – Financial Transaction Audit Standard
 *   NPC – accurate record-keeping of processed personal data (payment sessions)
 */
export async function POST(request) {
    try {
        const body = await request.json();

        // referenceId – the gateway's human-readable reference (JON-YYYYMMDD-XXXXXXXX)
        //               used as the URL param in /cancel/:referenceId
        // intentId    – the gateway's internal UUID (Transaction.id), used as fallback
        // reason      – optional human-readable cancellation reason for audit log
        const { referenceId, intentId, reason = 'User cancelled payment' } = body;

        // WHY: The gateway's cancel endpoint uses referenceId as the URL parameter.
        //      intentId (UUID) is accepted as a fallback.
        //      If both are absent or literally "null"/"undefined", reject early.
        const targetRef = (referenceId && referenceId !== 'null' && referenceId !== 'undefined')
            ? referenceId
            : (intentId && intentId !== 'null' && intentId !== 'undefined')
                ? intentId
                : null;

        if (!targetRef) {
            console.error('[Payment Cancel Proxy] Cannot cancel: both referenceId and intentId are null/missing.', { referenceId, intentId });
            return NextResponse.json(
                { error: 'A valid referenceId or intentId is required to cancel the transaction' },
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

        console.log(`[Payment Cancel Proxy] Forwarding cancel for ref: ${targetRef} | reason: ${reason} | gateway: ${GATEWAY_BASE_URL}`);

        const gatewayRes = await fetch(`${GATEWAY_BASE_URL}/cancel/${encodeURIComponent(targetRef)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reason }),
            // Short timeout – order is already cancelled; this is best-effort for the gateway record
            signal: AbortSignal.timeout(8000)
        });

        // 404: transaction not found in gateway (may have already expired / been cleaned up)
        if (gatewayRes.status === 404) {
            console.warn(`[Payment Cancel Proxy] Gateway: transaction ${targetRef} not found. May have already expired.`);
            return NextResponse.json(
                { success: true, status: 'NOT_FOUND', message: 'Transaction not found in gateway (may have already expired)' },
                { status: 200 } // Return 200 – the cancellation goal is already achieved
            );
        }

        // 409: transaction is already COMPLETED – do not overwrite
        if (gatewayRes.status === 409) {
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
        console.log(`[Payment Cancel Proxy] ✅ Transaction ${targetRef} cancelled on gateway.`);

        return NextResponse.json(data);

    } catch (error) {
        // Network errors, timeouts – log but do not block the user (order is already cancelled)
        if (error.name === 'TimeoutError' || error.name === 'AbortError') {
            console.error('[Payment Cancel Proxy] ⏰ Gateway request timed out. Transaction may still be PENDING.');
            return NextResponse.json(
                { success: false, error: 'Gateway timeout – transaction may still be PENDING.' },
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

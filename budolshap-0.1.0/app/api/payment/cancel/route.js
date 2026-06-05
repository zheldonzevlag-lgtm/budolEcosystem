import { NextResponse } from 'next/server';

/**
 * Payment Cancellation Proxy – POST /api/payment/cancel
 *
 * WHY THIS EXISTS:
 *   When a user clicks "Cancel Payment" or closes the QR modal in budolshap,
 *   we must cancel the Transaction record in the budolPay payment-gateway DB.
 *   Without this, the gateway Transaction stays PENDING forever, polluting the
 *   Admin Dashboard and financial reconciliation reports.
 *
 * STRATEGY (executed in parallel for maximum reliability):
 *   1. POST /cancel/:referenceId  → targets the exact transaction by reference or UUID
 *   2. POST /cancel-by-order/:orderId → searches metadata for ALL PENDING transactions
 *      matching this orderId and cancels them ALL (catches retries and stale records)
 *
 * WHY BOTH:
 *   Frontend identifier passing is fragile. referenceId may be null/stale due to:
 *   - React async state closure bugs
 *   - Adapter field-mapping changes
 *   - User retrying payment (multiple PENDING records for same order)
 *   cancel-by-order is the guaranteed fallback — orderId is always in metadata.
 *
 * COMPLIANCE:
 *   PCI DSS Req 10.2.4 – Log Access to Audit Trails
 *   BSP Circular No. 808 – Financial Transaction Audit Standard
 *   NPC – accurate record-keeping of processed personal data (payment sessions)
 */
export async function POST(request) {
    try {
        const body = await request.json();

        // All identifiers used in the cancel strategies:
        //   referenceId – gateway's JON-xxx reference string (preferred for /cancel/:ref)
        //   intentId    – gateway's internal UUID (Transaction.id) — fallback for /cancel/:ref
        //   orderId     – budolshap Order ID — used for /cancel-by-order/:orderId (GUARANTEED)
        //   reason      – human-readable cancellation reason for audit log
        const {
            referenceId,
            intentId,
            orderId,
            reason = 'User cancelled payment'
        } = body;

        // Resolve the best available reference for the /cancel/:ref endpoint
        const targetRef = (referenceId && referenceId !== 'null' && referenceId !== 'undefined')
            ? referenceId
            : (intentId && intentId !== 'null' && intentId !== 'undefined')
                ? intentId
                : null;

        const hasOrderId = orderId && orderId !== 'null' && orderId !== 'undefined';

        // Must have at least one identifier to cancel
        if (!targetRef && !hasOrderId) {
            console.error('[Payment Cancel Proxy] Cannot cancel: all identifiers are null/missing.', { referenceId, intentId, orderId });
            return NextResponse.json(
                { error: 'At least one of referenceId, intentId, or orderId is required' },
                { status: 400 }
            );
        }

        // Resolve gateway base URL:
        const GATEWAY_BASE_URL =
            process.env.PAYMENT_GATEWAY_URL ||
            process.env.NEXT_PUBLIC_PAYMENT_GATEWAY_URL ||
            process.env.MONOLITH_URL;

        if (!GATEWAY_BASE_URL) {
            console.error('[Payment Cancel Proxy] No gateway URL configured. Set PAYMENT_GATEWAY_URL, NEXT_PUBLIC_PAYMENT_GATEWAY_URL, or MONOLITH_URL.');
            return NextResponse.json(
                { error: 'Payment gateway URL not configured' },
                { status: 500 }
            );
        }

        console.log(`[Payment Cancel Proxy] Cancelling | ref=${targetRef} | orderId=${orderId} | gateway=${GATEWAY_BASE_URL}`);

        // ---------------------------------------------------------------
        // STRATEGY 1: Cancel by referenceId/UUID (if available)
        //   Targets the exact transaction the user just interacted with.
        // ---------------------------------------------------------------
        let refCancelPromise = Promise.resolve(null);
        if (targetRef) {
            refCancelPromise = fetch(
                `${GATEWAY_BASE_URL}/cancel/${encodeURIComponent(targetRef)}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ reason, orderId }),
                    signal: AbortSignal.timeout(8000)
                }
            ).catch(err => {
                console.warn(`[Payment Cancel Proxy] Strategy 1 (ref) failed: ${err.message}`);
                return null;
            });
        }

        // ---------------------------------------------------------------
        // STRATEGY 2: Cancel by orderId (GUARANTEED — searches metadata)
        //   Finds and cancels ALL PENDING transactions for this order.
        //   Works even when referenceId is null, stale, or when the user
        //   retried payment multiple times creating multiple PENDING records.
        // ---------------------------------------------------------------
        let orderCancelPromise = Promise.resolve(null);
        if (hasOrderId) {
            orderCancelPromise = fetch(
                `${GATEWAY_BASE_URL}/cancel-by-order/${encodeURIComponent(orderId)}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ reason }),
                    signal: AbortSignal.timeout(8000)
                }
            ).catch(err => {
                console.warn(`[Payment Cancel Proxy] Strategy 2 (order) failed: ${err.message}`);
                return null;
            });
        }

        // Run both in parallel for speed
        const [refResult, orderResult] = await Promise.all([refCancelPromise, orderCancelPromise]);

        // ---------------------------------------------------------------
        // Evaluate results
        // ---------------------------------------------------------------
        let refData = null;
        let orderData = null;
        let refSuccess = false;
        let orderSuccess = false;

        if (refResult) {
            if (refResult.status === 409) {
                // Transaction is COMPLETED — this is important to know
                const d = await refResult.json().catch(() => ({}));
                console.warn(`[Payment Cancel Proxy] Strategy 1: Cannot cancel COMPLETED transaction ${targetRef}.`);
                return NextResponse.json({ error: d.error || 'Cannot cancel a completed transaction' }, { status: 409 });
            }
            refSuccess = refResult.ok || refResult.status === 404; // 404 = already gone, treat as success
            if (refResult.ok) {
                refData = await refResult.json().catch(() => ({}));
                console.log(`[Payment Cancel Proxy] ✅ Strategy 1 (ref) success: ${targetRef}`);
            }
        }

        if (orderResult) {
            orderSuccess = orderResult.ok;
            if (orderResult.ok) {
                orderData = await orderResult.json().catch(() => ({}));
                const cancelCount = orderData?.cancelled ?? '?';
                console.log(`[Payment Cancel Proxy] ✅ Strategy 2 (order) success: ${cancelCount} transaction(s) cancelled for orderId=${orderId}`);
            }
        }

        // Return success if either strategy worked
        if (refSuccess || orderSuccess) {
            return NextResponse.json({
                success: true,
                status: 'CANCELLED',
                byRef: refData,
                byOrder: orderData
            });
        }

        // Both strategies failed — return what we know
        const errMsg = 'Gateway could not cancel the transaction(s). They may already be expired or completed.';
        console.error(`[Payment Cancel Proxy] Both strategies failed for ref=${targetRef} orderId=${orderId}`);
        return NextResponse.json({ success: false, error: errMsg }, { status: 502 });

    } catch (error) {
        if (error.name === 'TimeoutError' || error.name === 'AbortError') {
            console.error('[Payment Cancel Proxy] ⏰ Gateway request timed out.');
            return NextResponse.json(
                { success: false, error: 'Gateway timeout – transaction may still be PENDING.' },
                { status: 504 }
            );
        }
        console.error('[Payment Cancel Proxy] Unexpected error:', error.message);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}

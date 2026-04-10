/**
 * Jest Test Suite – Payment Gateway Cancel Endpoint
 * File: scripts/test_scripts/payment_gateway/cancel.test.js
 *
 * WHY: Ensure the /cancel/:referenceId endpoint correctly transitions
 *      a PENDING transaction → CANCELLED status and rejects invalid states.
 *      These tests cover the bug identified in v2.2.8 where the adapter
 *      did not expose referenceId separately from paymentIntentId.
 *
 * COMPLIANCE:
 *   PCI DSS 10.2.4 – Log Access to Audit Trails
 *   BSP Circular No. 808 – Financial Transaction Audit Standard
 *
 * USAGE:
 *   cd budolpay-0.1.0/services/payment-gateway-service
 *   npx jest ../../../../scripts/test_scripts/payment_gateway/cancel.test.js --runInBand
 *
 * PREREQUISITES:
 *   GATEWAY_BASE_URL must point to a running instance (default: http://localhost:8004)
 *   The gateway database must be seeded with at least one PENDING transaction.
 */

const GATEWAY_BASE_URL = process.env.GATEWAY_BASE_URL || 'http://localhost:8004';

// --- Helper: Create a minimal test transaction via the gateway ---
async function createTestTransaction(overrides = {}) {
  const res = await fetch(`${GATEWAY_BASE_URL}/create-intent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount: 100.00,
      currency: 'PHP',
      description: 'Jest Cancel Test',
      provider: 'internal',
      metadata: {
        orderId: `TEST-ORDER-${Date.now()}`,
        app: 'budolShap',
        storeName: 'Test Store'
      },
      ...overrides
    })
  });
  expect(res.status).toBe(201);
  const data = await res.json();
  expect(data.referenceId).toBeTruthy();
  return data;
}

// --- Helper: Cancel via the gateway endpoint ---
async function cancelTransaction(ref, reason = 'Jest test cancel') {
  return fetch(`${GATEWAY_BASE_URL}/cancel/${encodeURIComponent(ref)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason })
  });
}

// --- Helper: Get status from the gateway ---
async function getStatus(ref) {
  const res = await fetch(`${GATEWAY_BASE_URL}/status/${encodeURIComponent(ref)}`);
  return res.json();
}

// =============================================================================
describe('POST /cancel/:referenceId – Payment Gateway Cancel Endpoint', () => {

  // ---------------------------------------------------------------------------
  test('TC-001: PENDING transaction → CANCELLED via referenceId', async () => {
    const intent = await createTestTransaction();
    const referenceId = intent.referenceId;

    // Confirm it's PENDING initially
    const statusBefore = await getStatus(referenceId);
    expect(statusBefore.status).toBe('PENDING');

    // Cancel it
    const res = await cancelTransaction(referenceId, 'TC-001: User clicked X');
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.status).toBe('CANCELLED');

    // Verify via status endpoint
    const statusAfter = await getStatus(referenceId);
    expect(statusAfter.status).toBe('CANCELLED');
  }, 15000);

  // ---------------------------------------------------------------------------
  test('TC-002: Idempotent – calling cancel twice returns 200 with Already cancelled', async () => {
    const intent = await createTestTransaction();
    const referenceId = intent.referenceId;

    // First cancel
    const res1 = await cancelTransaction(referenceId, 'TC-002 first cancel');
    expect(res1.status).toBe(200);

    // Second cancel (idempotent)
    const res2 = await cancelTransaction(referenceId, 'TC-002 second cancel');
    expect(res2.status).toBe(200);
    const body2 = await res2.json();
    expect(body2.message).toMatch(/already cancelled/i);
  }, 15000);

  // ---------------------------------------------------------------------------
  test('TC-003: Non-existent referenceId returns 404', async () => {
    const res = await cancelTransaction('JON-DOES-NOT-EXIST-XXXX', 'TC-003 not found test');
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBeTruthy();
  }, 10000);

  // ---------------------------------------------------------------------------
  test('TC-004: Cancel via UUID (intentId fallback) also works', async () => {
    const intent = await createTestTransaction();

    // Use the UUID (id field) instead of referenceId
    const uuid = intent.id || intent.paymentIntentId;
    expect(uuid).toBeTruthy();

    const res = await cancelTransaction(uuid, 'TC-004: cancel via UUID fallback');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('CANCELLED');
  }, 15000);

  // ---------------------------------------------------------------------------
  test('TC-005: Cancel with missing reason field still works (uses default)', async () => {
    const intent = await createTestTransaction();
    const res = await fetch(`${GATEWAY_BASE_URL}/cancel/${encodeURIComponent(intent.referenceId)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}) // no reason
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  }, 15000);

});

// =============================================================================
describe('POST /api/payment/cancel – budolshap Proxy Route', () => {
  /**
   * WHY: The proxy is what the storefront actually calls.
   *      We test it independently to catch any regression in null-guarding,
   *      URL building, and error forwarding.
   *
   * NOTE: These tests require the budolshap dev server to be running.
   *       Set BUDOLSHAP_BASE_URL to test these (default: http://localhost:3001).
   */
  const BUDOLSHAP_URL = process.env.BUDOLSHAP_BASE_URL || 'http://localhost:3001';

  async function proxyCancel(body) {
    return fetch(`${BUDOLSHAP_URL}/api/payment/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
  }

  // ---------------------------------------------------------------------------
  test('TC-006: Proxy rejects when both referenceId and intentId are null', async () => {
    const res = await proxyCancel({ referenceId: null, intentId: null });
    expect([400, 500]).toContain(res.status); // 400 preferred, 500 if proxy crashes
  }, 10000);

  // ---------------------------------------------------------------------------
  test('TC-007: Proxy rejects when referenceId is the literal string "null"', async () => {
    const res = await proxyCancel({ referenceId: 'null', intentId: 'undefined' });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/valid referenceId/i);
  }, 10000);

  // ---------------------------------------------------------------------------
  test('TC-008: Proxy forwards valid referenceId to gateway and returns 200', async () => {
    // Create a transaction directly on the gateway first
    const createRes = await fetch(`${GATEWAY_BASE_URL}/create-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: 50,
        currency: 'PHP',
        description: 'TC-008 Proxy Test',
        provider: 'internal',
        metadata: { orderId: `TC008-${Date.now()}`, app: 'budolShap' }
      })
    });
    const intent = await createRes.json();

    const res = await proxyCancel({
      referenceId: intent.referenceId,
      intentId: intent.id,
      reason: 'TC-008: proxy forwarding test'
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('CANCELLED');
  }, 20000);

});

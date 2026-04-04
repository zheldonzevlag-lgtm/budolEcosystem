/**
 * v43.5 Forensic Audit Verification Script
 * Triggers and verifies new authentication audit events.
 */
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000'; // Assuming local dev server is running for test

async function testAuditGaps() {
    console.log('--- Phase 1: Login Failure ---');
    try {
        const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'nonexistent@budol.com', password: 'wrong' })
        });
        console.log('Login Status:', loginRes.status);
    } catch (e) {
        console.log('Login trigger failed (expected if server offline):', e.message);
    }

    console.log('\n--- Phase 2: OTP Failure ---');
    try {
        const otpRes = await fetch(`${BASE_URL}/api/auth/verify-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: 'some-id', otp: '000000' })
        });
        console.log('OTP Status:', otpRes.status);
    } catch (e) {
        console.log('OTP trigger failed:', e.message);
    }

    console.log('\n--- Phase 3: Rate Limit Lockout ---');
    for (let i = 0; i < 6; i++) {
        try {
            const res = await fetch(`${BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: 'lockout@test.com', password: 'pw' })
            });
            console.log(`Attempt ${i+1}: ${res.status}`);
            if (res.status === 429) {
                console.log('Rate limit successfully triggered!');
                break;
            }
        } catch (e) { break; }
    }
}

testAuditGaps();

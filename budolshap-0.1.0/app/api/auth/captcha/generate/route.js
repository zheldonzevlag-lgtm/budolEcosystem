import { NextResponse } from 'next/server';
import crypto from 'crypto';

// In-memory CAPTCHA store (resets on server restart)
if (!globalThis.__captchaStore) {
    globalThis.__captchaStore = {};
}

export async function GET() {
    const operator = Math.random() > 0.5 ? '+' : '-';
    let a = Math.floor(Math.random() * 9) + 1;
    let b = Math.floor(Math.random() * 9) + 1;
    if (operator === '-' && a < b) {
        [a, b] = [b, a];
    }
    const sessionId = crypto.randomBytes(16).toString('hex');

    globalThis.__captchaStore[sessionId] = { a, b, operator, created: Date.now() };

    // Clean expired CAPTCHAs (older than 5 minutes)
    const now = Date.now();
    for (const [key, val] of Object.entries(globalThis.__captchaStore)) {
        if (now - val.created > 300000) delete globalThis.__captchaStore[key];
    }

    return NextResponse.json({ sessionId, a, b, operator });
}

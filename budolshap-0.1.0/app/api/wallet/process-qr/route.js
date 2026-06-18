import { NextResponse } from 'next/server';

function resolveWalletBaseUrl() {
    const isVercel = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';

    const url = process.env.WALLET_SERVICE_URL
        || process.env.NEXT_PUBLIC_WALLET_SERVICE_URL
        || process.env.MONOLITH_URL;

    if (!url) {
        throw new Error(
            '[Wallet Proxy] No wallet service URL configured. Set WALLET_SERVICE_URL, NEXT_PUBLIC_WALLET_SERVICE_URL, or MONOLITH_URL environment variable.'
        );
    }

    return url;
}

export async function POST(request) {
    try {
        const body = await request.json();
        const authHeader = request.headers.get('authorization');
        const walletBaseUrl = resolveWalletBaseUrl();
        const targetUrl = `${walletBaseUrl}/api/wallet/process-qr`;

        console.log(`[Wallet Proxy] Forwarding POST to ${targetUrl}`);

        const headers = {
            'Content-Type': 'application/json',
        };
        if (authHeader) {
            headers['Authorization'] = authHeader;
        }

        const response = await fetch(targetUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(15000),
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            console.error(`[Wallet Proxy] Upstream error: ${response.status}`, data);
            return NextResponse.json(
                { error: data.error || `Wallet service error: ${response.status}` },
                { status: response.status }
            );
        }

        return NextResponse.json(data);
    } catch (error) {
        if (error.name === 'TimeoutError' || error.name === 'AbortError') {
            console.error('[Wallet Proxy] Upstream request timed out');
            return NextResponse.json(
                { error: 'Wallet service timeout' },
                { status: 504 }
            );
        }
        console.error('[Wallet Proxy] Unexpected error:', error.message);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}

import { NextResponse } from "next/server";

function getWalletServiceUrl(): string {
    const isVercel = process.env.VERCEL === '1' || !!process.env.NEXT_PUBLIC_VERCEL_ENV;

    // Priority: explicit env var > monolith URL (for consolidated deployments) > error
    if (process.env.WALLET_SERVICE_URL) {
        return process.env.WALLET_SERVICE_URL;
    }
    if (process.env.MONOLITH_URL) {
        return process.env.MONOLITH_URL;
    }
    if (isVercel && process.env.VERCEL_PROJECT_PRO_URL) {
        return process.env.VERCEL_PROJECT_PRO_URL;
    }

    throw new Error(
        '[Wallet Proxy] No wallet service URL configured. Set WALLET_SERVICE_URL, MONOLITH_URL, or VERCEL_PROJECT_PRO_URL environment variable.'
    );
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const walletBaseUrl = getWalletServiceUrl();

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'x-bypass-auth': 'true',
        };
        const authHeader = req.headers.get('authorization');
        if (authHeader) {
            headers['Authorization'] = authHeader;
        }

        const targetUrl = `${walletBaseUrl}/api/wallet/process-qr`;
        console.log(`[Wallet Proxy] Forwarding POST to ${targetUrl}`);

        const response = await fetch(targetUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(15000),
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            return NextResponse.json(
                { error: data.error || `Wallet service error: ${response.status}` },
                { status: response.status }
            );
        }

        return NextResponse.json(data);
    } catch (error: any) {
        if (error.name === 'TimeoutError' || error.name === 'AbortError') {
            return NextResponse.json(
                { error: 'Wallet service timeout' },
                { status: 504 }
            );
        }
        console.error('[Wallet Proxy] Error:', error.message);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}

import { NextRequest, NextResponse } from 'next/server';

// Why this file exists:
// The mobile app uses 'budolpay.vercel.app' as the API host, which points to THIS
// Next.js app. When calling /api/verification/upload, there was no route here,
// causing a 404. This catch-all route proxies all /api/verification/* requests
// to the dedicated verification-service (running on Vercel or locally).
//
// TODO: Add file upload size limits as per BSP NPC data privacy guidelines

export const dynamic = 'force-dynamic';

// The verification service URL - set VERIFICATION_SERVICE_URL in Vercel env vars
// Falls back to the Vercel production deployment URL, or local development address
const getVerificationServiceUrl = () => {
  if (process.env.VERIFICATION_SERVICE_URL) {
    return process.env.VERIFICATION_SERVICE_URL;
  }
  if (process.env.NODE_ENV === 'production') {
    return 'https://budolpay-verification-service.vercel.app';
  }
  return `http://${process.env.LOCAL_IP || 'localhost'}:8006`;
};

async function proxyRequest(req: NextRequest, path: string[]) {
  const verificationUrl = getVerificationServiceUrl();
  // Build the target URL from the catch-all path segments
  const targetPath = path.join('/');
  const targetUrl = `${verificationUrl}/${targetPath}`;

  console.log(`[Verification Proxy] ${req.method} /api/verification/${targetPath} -> ${targetUrl}`);

  try {
    // Forward all headers except host (to avoid SSL mismatch)
    const headers = new Headers(req.headers);
    headers.delete('host');

    // Forward the request body as-is (supports multipart/form-data for file uploads)
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: headers,
      // Only attach body for non-GET requests
      body: req.method !== 'GET' && req.method !== 'HEAD' ? req.body : undefined,
      // Required for streaming body forwarding (file uploads)
      duplex: 'half',
    } as RequestInit & { duplex: string });

    // Forward the response back to the client
    const responseHeaders = new Headers(response.headers);
    // Allow cross-origin access from mobile app
    responseHeaders.set('Access-Control-Allow-Origin', '*');

    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error: any) {
    console.error(`[Verification Proxy] Error proxying to ${targetUrl}:`, error.message);
    return NextResponse.json(
      {
        error: 'Verification service unavailable',
        details: error.message,
        // Help diagnose: show which URL was being targeted
        targetUrl,
      },
      { status: 503 }
    );
  }
}

// Handle CORS preflight for mobile app
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function GET(req: NextRequest, { params }: { params: { path: string[] } }) {
  return proxyRequest(req, params.path);
}

export async function POST(req: NextRequest, { params }: { params: { path: string[] } }) {
  return proxyRequest(req, params.path);
}

export async function PUT(req: NextRequest, { params }: { params: { path: string[] } }) {
  return proxyRequest(req, params.path);
}

export async function PATCH(req: NextRequest, { params }: { params: { path: string[] } }) {
  return proxyRequest(req, params.path);
}

export async function DELETE(req: NextRequest, { params }: { params: { path: string[] } }) {
  return proxyRequest(req, params.path);
}

import { NextResponse } from 'next/server'

// Security configuration
const MAX_REQUEST_SIZE_MB = 4 // Limit request body size
const ALLOWED_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD']

export function middleware(request) {
    const response = NextResponse.next()
    
    // 1. Security headers
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-XSS-Protection', '1; mode=block')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
    
    // 2. HSTS (only in production)
    if (process.env.NODE_ENV === 'production') {
        response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
    }
    
    // 3. Method validation - Block dangerous methods
    const method = request.method
    if (!ALLOWED_METHODS.includes(method)) {
        return NextResponse.json(
            { error: 'Method not allowed' },
            { status: 405, headers: { 'Allow': ALLOWED_METHODS.join(', ') } }
        )
    }
    
    // 4. Request size limiting (for POST/PUT requests)
    const contentLength = request.headers.get('content-length')
    if (contentLength && parseInt(contentLength) > MAX_REQUEST_SIZE_MB * 1024 * 1024) {
        return NextResponse.json(
            { error: 'Request too large. Maximum size is ' + MAX_REQUEST_SIZE_MB + 'MB' },
            { status: 413 }
        )
    }
    
    // 5. Block common attack patterns in headers
    const userAgent = request.headers.get('user-agent') || ''
    const dangerousUserAgents = ['sqlmap', 'nikto', 'nmap', 'metasploit', ' nessus']
    const lowerUserAgent = userAgent.toLowerCase()
    for (const agent of dangerousUserAgents) {
        if (lowerUserAgent.includes(agent)) {
            console.warn(`[Security] Blocked suspicious User-Agent: ${userAgent}`)
            return NextResponse.json(
                { error: 'Access denied' },
                { status: 403 }
            )
        }
    }
    
    const isProduction = process.env.NODE_ENV === 'production'
    if (!isProduction) return response

    const host = request.headers.get('host') || ''
    const isLocalHost = host.includes('localhost') || host.includes('127.0.0.1')
    if (isLocalHost) return NextResponse.next()

    const proto = request.headers.get('x-forwarded-proto') || 'http'
    if (proto === 'https') return NextResponse.next()

    const url = request.nextUrl.clone()
    url.protocol = 'https:'
    return NextResponse.redirect(url, 308)
}

export const config = {
    matcher: '/:path*',
}

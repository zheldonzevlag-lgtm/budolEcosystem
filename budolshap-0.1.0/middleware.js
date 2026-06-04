import { NextResponse } from 'next/server'

export function middleware(request) {
    const response = NextResponse.next()
    
    // Security headers - non-breaking, always safe
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-XSS-Protection', '1; mode=block')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
    
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

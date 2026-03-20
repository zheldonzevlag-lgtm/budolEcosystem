import { NextResponse } from 'next/server'

export function middleware(request) {
    const isProduction = process.env.NODE_ENV === 'production'
    if (!isProduction) return NextResponse.next()

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

import { NextResponse } from 'next/server'
import { verifyTokenEdge } from '../../lib/token-edge'

const protectedRoutes = [
	'/store',
	'/admin',
	'/orders',
	'/cart'
]

const authRoutes = [
	'/login',
	'/register'
]

export function proxy(request) {
	const { pathname } = request.nextUrl
	const token = request.cookies.get('budolshap_token')?.value || request.cookies.get('token')?.value

	const isLoginPage = pathname === '/login' || pathname === '/store/login' || pathname === '/admin/login'
	const isPaymentReturn = pathname.startsWith('/payment')

	const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route)) && !isLoginPage && !isPaymentReturn
	const isAuthRoute = authRoutes.some(route => pathname.startsWith(route))

	if (isProtectedRoute && !token) {
		const loginUrl = new URL('/', request.url)
		loginUrl.searchParams.set('showLogin', 'true')
		loginUrl.searchParams.set('redirect', pathname)
		return NextResponse.redirect(loginUrl)
	}

	if (token) {
		return verifyTokenEdge(token).then(decoded => {
			if (!decoded && isProtectedRoute) {
				const response = NextResponse.redirect(new URL('/', request.url))
				response.cookies.delete('token')
				response.cookies.delete('budolshap_token')
				return response
			}

			if (decoded) {
				if (isAuthRoute) {
					return NextResponse.redirect(new URL('/', request.url))
				}

				if (pathname.startsWith('/admin') && decoded.role !== 'ADMIN') {
					return NextResponse.redirect(new URL('/', request.url))
				}
			}

			return NextResponse.next()
		})
	}

	return NextResponse.next()
}

export const config = {
	matcher: [
		'/((?!api|_next/static|_next/image|favicon.ico|api/debug-db|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
	],
}


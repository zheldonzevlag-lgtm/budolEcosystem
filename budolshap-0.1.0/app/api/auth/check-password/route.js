import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword } from '@/lib/auth'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(request) {
    try {
        const body = await request.json()
        const email = (body?.email || '').trim()
        const password = body?.password || ''

        if (!email || !password) {
            return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
        }

        const ip = request.headers.get('x-forwarded-for') || 'unknown-ip'
        const limitKey = `check-password:${ip}:${email.toLowerCase()}`
        const { success } = await rateLimit(limitKey, 10, 60)
        if (!success) {
            return NextResponse.json(
                { valid: false },
                { status: 200, headers: { 'Cache-Control': 'no-store' } }
            )
        }

        const normalizedEmail = email.toLowerCase()
        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: normalizedEmail },
                    { email }
                ]
            },
            select: {
                password: true
            }
        })

        if (!user?.password) {
            return NextResponse.json(
                { valid: false },
                { status: 200, headers: { 'Cache-Control': 'no-store' } }
            )
        }

        const valid = await verifyPassword(password, user.password)
        return NextResponse.json(
            { valid },
            { status: 200, headers: { 'Cache-Control': 'no-store' } }
        )
    } catch (error) {
        console.error('[API Check Password] Error:', error)
        return NextResponse.json({ error: 'Password check failed' }, { status: 500 })
    }
}

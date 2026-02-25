import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyResetToken, hashPassword } from '@/lib/auth'

export async function POST(request) {
    try {
        const body = await request.json()
        const { token, password } = body

        if (!token || !password) {
            return NextResponse.json(
                { error: 'Token and password are required' },
                { status: 400 }
            )
        }

        if (password.length < 6) {
            return NextResponse.json(
                { error: 'Password must be at least 6 characters' },
                { status: 400 }
            )
        }

        // Verify token
        const decoded = verifyResetToken(token)
        if (!decoded) {
            return NextResponse.json(
                { error: 'Invalid or expired token' },
                { status: 400 }
            )
        }

        // Find user with this token
        const user = await prisma.user.findFirst({
            where: {
                resetToken: token,
                resetTokenExpiry: {
                    gte: new Date()
                }
            }
        })

        if (!user) {
            return NextResponse.json(
                { error: 'Invalid or expired reset token' },
                { status: 400 }
            )
        }

        // Hash new password
        const hashedPassword = await hashPassword(password)

        // Update user
        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetToken: null,
                resetTokenExpiry: null
            }
        })

        return NextResponse.json({ message: 'Password reset successfully' })
    } catch (error) {
        console.error('Reset password error:', error)
        return NextResponse.json(
            { error: 'Failed to reset password' },
            { status: 500 }
        )
    }
}


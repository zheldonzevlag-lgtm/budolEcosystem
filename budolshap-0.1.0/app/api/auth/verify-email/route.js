import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyEmailToken } from '@/lib/auth'
import { createAuditLog } from '@/lib/audit'

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url)
        const token = searchParams.get('token')

        if (!token) {
            return NextResponse.json(
                { error: 'Token is required' },
                { status: 400 }
            )
        }

        // Verify token
        const decoded = verifyEmailToken(token)
        if (!decoded) {
            return NextResponse.json(
                { error: 'Invalid or expired token' },
                { status: 400 }
            )
        }

        // Find user with this token
        const user = await prisma.user.findFirst({
            where: {
                emailVerifyToken: token
            }
        })

        if (!user) {
            await createAuditLog(null, 'EMAIL_VERIFY_FAILED', request, {
                status: 'FAILURE',
                details: 'Invalid email verification token',
                metadata: { token }
            });
            return NextResponse.json(
                { error: 'Invalid verification token' },
                { status: 400 }
            )
        }

        // Update user
        await prisma.user.update({
            where: { id: user.id },
            data: {
                emailVerified: true,
                emailVerifyToken: null
            }
        })

        await createAuditLog(user.id, 'EMAIL_VERIFIED', request, {
            details: 'Email verified successfully via token',
            entity: 'User',
            entityId: user.id
        });

        return NextResponse.json({ message: 'Email verified successfully' })
    } catch (error) {
        console.error('Email verification error:', error)
        return NextResponse.json(
            { error: 'Failed to verify email' },
            { status: 500 }
        )
    }
}

export async function POST(request) {
    try {
        const body = await request.json()
        const { email, otp } = body

        if (!email || !otp) {
            return NextResponse.json(
                { error: 'Email and OTP are required' },
                { status: 400 }
            )
        }

        // Find user with this email and OTP
        const user = await prisma.user.findFirst({
            where: {
                email,
                emailVerifyToken: otp
            }
        })

        if (!user) {
            await createAuditLog(null, 'EMAIL_VERIFY_FAILED', request, {
                status: 'FAILURE',
                details: 'Invalid OTP for email verification',
                metadata: { email }
            });
            return NextResponse.json(
                { error: 'Invalid or expired verification code' },
                { status: 400 }
            )
        }

        // Update user
        await prisma.user.update({
            where: { id: user.id },
            data: {
                emailVerified: true,
                emailVerifyToken: null
            }
        })

        // Forensic Log: OTP Verified
        await createAuditLog(user.id, 'SECURITY_OTP_VERIFIED', request, {
            details: 'Account verified successfully via OTP',
            entity: 'User',
            entityId: user.id,
            status: 'SUCCESS',
            metadata: {
                method: 'OTP',
                email: email
            }
        });

        return NextResponse.json({ message: 'Verification successful' })
    } catch (error) {
        console.error('OTP verification error:', error)
        return NextResponse.json(
            { error: 'Failed to verify code' },
            { status: 500 }
        )
    }
}


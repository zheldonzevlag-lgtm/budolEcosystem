import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateEmailToken, generateOTP } from '@/lib/auth'
import { sendVerificationEmail, sendOTPEmail } from '@/lib/email'
import { sendOTPSMS } from '@/lib/sms'

export async function POST(request) {
    try {
        const body = await request.json()
        const { email } = body

        if (!email) {
            return NextResponse.json(
                { error: 'Email is required' },
                { status: 400 }
            )
        }

        // Find user
        const user = await prisma.user.findUnique({
            where: { email }
        })

        if (!user) {
            // For security, don't reveal if user exists
            return NextResponse.json(
                { message: 'If an account with this email exists, a verification link has been sent.' },
                { status: 200 }
            )
        }

        if (user.emailVerified) {
            return NextResponse.json(
                { message: 'This email is already verified. You can log in.' },
                { status: 400 }
            )
        }

        // Determine if this is a quick registration user
        const isQuickReg = user.metadata && typeof user.metadata === 'object' && user.metadata.isQuickRegistration === true;

        // Generate new token or OTP
        const verificationToken = isQuickReg ? generateOTP(6) : generateEmailToken()

        // Update user with new token
        await prisma.user.update({
            where: { id: user.id },
            data: {
                emailVerifyToken: verificationToken
            }
        })

        // Send verification (Email + SMS for Quick Registration)
        try {
            if (isQuickReg) {
                // Dual-channel OTP for quick registration
                await Promise.all([
                    sendOTPEmail(user.email, verificationToken, user.name),
                    sendOTPSMS(user.phoneNumber, verificationToken)
                ]);
            } else {
                // Standard email verification link
                await sendVerificationEmail(user.email, verificationToken, user.name)
            }
        } catch (sendError) {
            console.error('Failed to send verification:', sendError)
        }

        // If email/sms is not configured, include the token in the response (for dev)
        const isEmailConfigured = process.env.SMTP_USER && process.env.SMTP_PASS;
        if (!isEmailConfigured) {
            const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`
            return NextResponse.json(
                {
                    message: isQuickReg 
                        ? 'Verification code sent (check console/response in dev mode).'
                        : 'Verification email sent (check console/response for link in dev mode).',
                    verificationToken: verificationToken,
                    verificationLink: isQuickReg ? undefined : verifyUrl
                },
                { status: 200 }
            )
        }

        return NextResponse.json(
            { message: 'Verification sent successfully.' },
            { status: 200 }
        )
    } catch (error) {
        console.error('Resend verification error:', error)
        return NextResponse.json(
            { error: 'Failed to send verification' },
            { status: 500 }
        )
    }
}

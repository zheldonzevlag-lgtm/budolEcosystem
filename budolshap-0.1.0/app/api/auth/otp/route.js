import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendOTPSMS } from '@/lib/sms'
import { sendOTPEmail } from '@/lib/email'
import { rateLimit } from '@/lib/rate-limit'
import { hashPassword } from '@/lib/auth'
import { normalizePhone } from '@/lib/utils/phone-utils'
import { createAuditLog } from '@/lib/audit'
import { maskPII } from '@/lib/compliance'
import { randomInt } from 'crypto'

function generateOTP() {
    return randomInt(100000, 1000000).toString()
}

export async function POST(request) {
    try {
        const body = await request.json()
        let { identifier, action } = body
        const responseHeaders = { 'Cache-Control': 'no-store' }
        const genericResponse = NextResponse.json(
            { message: 'If the account exists, a verification code has been sent.' },
            { status: 200, headers: responseHeaders }
        )

        if (action !== 'send') {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400, headers: responseHeaders })
        }

        if (!identifier) {
            return NextResponse.json({ error: 'Identifier is required' }, { status: 400, headers: responseHeaders })
        }

        identifier = String(identifier).trim()
        const normalizedPhone = normalizePhone(identifier)
        const searchIdentifier = normalizedPhone || identifier.toLowerCase()
        const rawForwardedFor = request.headers.get('x-forwarded-for') || ''
        const ip = rawForwardedFor.split(',')[0]?.trim() || 'unknown-ip'

        const [ipWindow, identifierWindow] = await Promise.all([
            rateLimit(`otp:send:ip:${ip}`, 8, 60 * 10),
            rateLimit(`otp:send:identifier:${searchIdentifier}`, 3, 60 * 10)
        ])

        if (!ipWindow.success || !identifierWindow.success) {
            await createAuditLog(null, 'SECURITY_OTP_RATE_LIMITED', request, {
                entity: 'Auth',
                status: 'WARNING',
                details: 'OTP send throttled by rate limits',
                metadata: {
                    identifier: maskPII(searchIdentifier),
                    ip,
                    ipWindowRemaining: ipWindow.remaining,
                    identifierWindowRemaining: identifierWindow.remaining
                }
            })
            return genericResponse
        }

        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: searchIdentifier },
                    { phoneNumber: searchIdentifier }
                ]
            }
        })
        let budolUser = null

        if (!user && normalizedPhone) {
            try {
                const BUDOL_ID_URL = process.env.BUDOL_ID_URL || 'http://localhost:8000'
                const checkUrl = `${BUDOL_ID_URL}/auth/check-phone?phone=${encodeURIComponent(searchIdentifier)}`
                const budolResponse = await fetch(checkUrl, {
                    headers: { Accept: 'application/json' },
                    cache: 'no-store'
                })

                if (budolResponse.ok) {
                    const budolData = await budolResponse.json()
                    if (budolData.exists) {
                        budolUser = budolData
                    }
                }
            } catch (_error) {
            }
        }

        if (!user && !budolUser) {
            return genericResponse
        }

        const now = new Date()
        const existing = await prisma.verificationCode.findUnique({
            where: { identifier: searchIdentifier }
        })
        const cooldownMillis = 60 * 1000
        if (existing && now.getTime() - existing.createdAt.getTime() < cooldownMillis) {
            return genericResponse
        }

        const configuredTtl = parseInt(process.env.OTP_TTL_MINUTES || '5', 10)
        const otpTtlMinutes = Math.min(10, Math.max(3, configuredTtl))
        const expires = new Date(now.getTime() + otpTtlMinutes * 60 * 1000)
        const otp = generateOTP()
        const otpHash = await hashPassword(otp)

        if (process.env.NODE_ENV !== 'production') {
            console.log('\n' + '='.repeat(40))
            console.log(`[OTP] Current Time: ${new Date().toISOString()}`)
            console.log(`[OTP] Expiry Time: ${expires.toISOString()} (TTL: ${otpTtlMinutes}m)`)
            console.log(`[OTP] Sending dual-channel OTP for identifier: ${maskPII(searchIdentifier)}`)
            console.log('='.repeat(40) + '\n')
        }

        await prisma.verificationCode.upsert({
            where: { identifier: searchIdentifier },
            update: { code: otpHash, expiresAt: expires, type: 'LOGIN', createdAt: now },
            create: { identifier: searchIdentifier, code: otpHash, expiresAt: expires, type: 'LOGIN', createdAt: now }
        })

        const isPhone = !!normalizedPhone
        try {
            let smsSent = false
            let emailSent = false
            if (isPhone) {
                smsSent = await sendOTPSMS(searchIdentifier, otp, otpTtlMinutes)
                const emailToSend = user?.email || budolUser?.email
                if (emailToSend && emailToSend.includes('@')) {
                    emailSent = await sendOTPEmail(
                        emailToSend,
                        otp,
                        user?.name || budolUser?.name || user?.phoneNumber || budolUser?.phoneNumber || 'User',
                        otpTtlMinutes
                    )
                }
                if (!smsSent && !emailSent) {
                    throw new Error('otp_delivery_failed_phone')
                }
            } else {
                emailSent = await sendOTPEmail(searchIdentifier, otp, user?.name || budolUser?.name || 'User', otpTtlMinutes)
                const phoneToSend = user?.phoneNumber || budolUser?.phoneNumber
                if (phoneToSend) {
                    smsSent = await sendOTPSMS(phoneToSend, otp, otpTtlMinutes)
                }
                if (!emailSent) {
                    throw new Error('otp_delivery_failed_email')
                }
            }
        } catch (sendError) {
            await createAuditLog(user?.id || null, 'SECURITY_OTP_DELIVERY_FAILED', request, {
                entity: 'Auth',
                status: 'FAILURE',
                details: 'OTP delivery failed',
                metadata: {
                    identifier: maskPII(searchIdentifier),
                    error: sendError?.message || 'delivery_failure'
                }
            })
            return NextResponse.json(
                { error: 'Unable to send verification code right now. Please try again.' },
                { status: 503, headers: responseHeaders }
            )
        }

        await createAuditLog(user?.id || null, 'SECURITY_OTP_SENT', request, {
            entity: 'Auth',
            status: 'SUCCESS',
            details: 'Verification code dispatched',
            metadata: {
                identifier: maskPII(searchIdentifier),
                channels: isPhone ? 'SMS_EMAIL' : 'EMAIL_SMS',
                ttlMinutes: otpTtlMinutes
            }
        })

        return genericResponse

    } catch (error) {
        console.error('OTP API Error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500, headers: { 'Cache-Control': 'no-store' } }
        )
    }
}

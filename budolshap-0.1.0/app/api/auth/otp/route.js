import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendOTPSMS } from '@/lib/sms'
import { sendOTPEmail } from '@/lib/email'
import { rateLimit } from '@/lib/rate-limit'
import { normalizePhone } from '@/lib/utils/phone-utils'

// Generate a 6-digit random code
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(request) {
    try {
        const body = await request.json()
        let { identifier, action } = body // identifier can be email or phone

        if (!identifier) {
            return NextResponse.json({ error: 'Identifier is required' }, { status: 400 })
        }

        // Normalize identifier if it's a phone number
        const normalizedPhone = normalizePhone(identifier);
        const searchIdentifier = normalizedPhone || identifier.toLowerCase();

        // Rate Limiting
        const ip = request.headers.get('x-forwarded-for') || 'unknown-ip'
        const { success } = await rateLimit(`otp:${ip}:${searchIdentifier}`, 5, 60 * 10) // 5 attempts per 10 mins

        if (!success) {
            return NextResponse.json({ error: 'Too many OTP requests. Please try again later.' }, { status: 429 })
        }

        if (action === 'send') {
            // Find user
            const user = await prisma.user.findFirst({
                where: {
                    OR: [
                        { email: searchIdentifier },
                        { phoneNumber: searchIdentifier }
                    ]
                }
            })

            let budolUser = null;

            if (!user) {
                // Check if user exists in BudolID (Centralized Identity)
                // This allows users who exist in the ecosystem but not locally to login via OTP
                try {
                    const BUDOL_ID_URL = process.env.BUDOL_ID_URL || 'http://localhost:8000';
                    const checkUrl = `${BUDOL_ID_URL}/auth/check-phone?phone=${encodeURIComponent(searchIdentifier)}`;
                    console.log(`[OTP] Checking BudolID for ${searchIdentifier} at ${checkUrl}`);
                    
                    const budolResponse = await fetch(checkUrl, {
                        headers: { 'Accept': 'application/json' },
                        cache: 'no-store'
                    });

                    if (budolResponse.ok) {
                        const budolData = await budolResponse.json();
                        if (budolData.exists) {
                            console.log(`[OTP] User found in BudolID: ${searchIdentifier}. Allowing OTP for sync.`);
                            // Capture BudolID user data for email sending
                            budolUser = budolData;
                        } else {
                             return NextResponse.json({ error: 'Account not found' }, { status: 404 })
                        }
                    } else {
                        // If check fails, assume user doesn't exist to be safe
                        return NextResponse.json({ error: 'Account not found' }, { status: 404 })
                    }
                } catch (checkError) {
                    console.error('[OTP] Failed to check BudolID:', checkError);
                    // Fallback to local check result
                    return NextResponse.json({ error: 'Account not found' }, { status: 404 })
                }
            }

            const OTP_TTL_MINUTES = parseInt(process.env.OTP_TTL_MINUTES || '30', 10)
            const expires = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000)

            // Debug: log current time and calculated expiry
            console.log(`[OTP] Current Time: ${new Date().toISOString()}`);
            console.log(`[OTP] Expiry Time: ${expires.toISOString()} (TTL: ${OTP_TTL_MINUTES}m)`);

            let otp = generateOTP()

            // Upsert OTP record with a NEW code and refreshed expiry
            await prisma.verificationCode.upsert({
                where: { identifier: searchIdentifier },
                update: { code: otp, expiresAt: expires, type: 'LOGIN' },
                create: { identifier: searchIdentifier, code: otp, expiresAt: expires, type: 'LOGIN' }
            })

            // Dual-Channel Delivery (PCI DSS & BSP Compliant)
            const isPhone = !!normalizedPhone;
            
            console.log(`[OTP] Sending dual-channel OTP for identifier: ${searchIdentifier}`);
            if (isPhone) {
                // Primary: SMS
                console.log(`[OTP] Sending SMS to ${searchIdentifier}`);
                await sendOTPSMS(searchIdentifier, otp, OTP_TTL_MINUTES)
                
                // Secondary: Email (Always send to email as backup if we have it locally or from BudolID)
                const emailToSend = user?.email || budolUser?.email;
                if (emailToSend && emailToSend.includes('@')) {
                    console.log(`[OTP] Sending Email to ${emailToSend}`);
                    await sendOTPEmail(emailToSend, otp, user?.name || budolUser?.name || user?.phoneNumber || budolUser?.phoneNumber || 'User', OTP_TTL_MINUTES)
                }
            } else {
                // Primary: Email
                console.log(`[OTP] Sending Email to ${searchIdentifier}`);
                await sendOTPEmail(searchIdentifier, otp, user?.name || budolUser?.name || 'User', OTP_TTL_MINUTES)

                // Secondary: SMS (if phone number is available)
                const phoneToSend = user?.phoneNumber || budolUser?.phoneNumber;
                if (phoneToSend) {
                     console.log(`[OTP] Sending SMS to ${phoneToSend}`);
                     await sendOTPSMS(phoneToSend, otp, OTP_TTL_MINUTES)
                }
            }

            return NextResponse.json({ message: 'Verification code sent successfully' })
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

    } catch (error) {
        console.error('OTP API Error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

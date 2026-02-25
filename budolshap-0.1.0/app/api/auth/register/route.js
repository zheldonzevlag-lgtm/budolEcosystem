import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, generateEmailToken, generateOTP } from '@/lib/auth'
import { sendVerificationEmail, sendOTPEmail } from '@/lib/email'
import { sendOTPSMS } from '@/lib/sms'
import { rateLimit } from '@/lib/rate-limit'
import { getSystemSettings } from '@/lib/settings'
import { triggerRealtimeEvent } from '@/lib/realtime'
import { registerWithBudolId, loginWithBudolId } from '@/lib/api/budolIdClient'
import { normalizePhone } from '@/lib/utils/phone-utils'
import { createAuditLog } from '@/lib/audit'

export async function POST(request) {
    try {
        const body = await request.json()
        let { name, email, password, phoneNumber, deviceFingerprint, image, registrationType, _honey } = body

        // Anti-spam: Honeypot check
        if (_honey) {
            console.warn(`[Spam Detected] Honeypot field filled by IP: ${request.headers.get('x-forwarded-for')}`);
            await createAuditLog(null, 'SPAM_ATTEMPT', request, {
                details: 'Honeypot field filled during registration',
                status: 'FAILURE',
                metadata: { spamField: '_honey' }
            });
            return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
        }

        // Normalize phone number for consistent storage
        const normalizedPhone = normalizePhone(phoneNumber);
        if (phoneNumber && !normalizedPhone) {
            return NextResponse.json({ error: 'Invalid phone number format' }, { status: 400 });
        }

        phoneNumber = normalizedPhone; // Use normalized phone for everything below

        const isQuickReg = registrationType === 'phone_only';

        if (isQuickReg) {
            if (!phoneNumber) return NextResponse.json({ error: 'Phone number is required for quick registration' }, { status: 400 });
            // For quick reg, we allow empty email/name/password and generate them
            if (!name) name = phoneNumber;
            if (!email) email = `user_${phoneNumber.replace(/[^0-9]/g, '')}@budolID.local`;
            if (!password) password = Math.random().toString(36).slice(-10); // Auto-gen pass
        } else {
            if (!name || !email || !password || !phoneNumber) {
                return NextResponse.json(
                    { error: 'Missing required fields (Name, Email, Password, Phone Number)' },
                    { status: 400 }
                )
            }
        }

        // Rate Limiting
        const ip = request.headers.get('x-forwarded-for') || 'unknown-ip'
        const limitKey = `register:${ip}:${email}`

        let registerLimit = 5;
        try {
            const settings = await getSystemSettings()
            if (settings.registerLimit) registerLimit = settings.registerLimit
        } catch (e) {
            console.error("Failed to fetch settings for rate limit:", e)
        }

        const { success, remaining, reset } = await rateLimit(limitKey, registerLimit, 60 * 60)

        if (!success) {
            return NextResponse.json(
                { error: 'Too many registration attempts. Please try again later.' },
                { status: 429, headers: { 'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString() } }
            )
        }

        if (password.length < 6) {
            return NextResponse.json(
                { error: 'Password must be at least 6 characters' },
                { status: 400 }
            )
        }

        // Check if user already exists locally (Source of Truth for "Fix" mode)
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { email },
                    { phoneNumber }
                ]
            }
        })

        if (existingUser) {
            if (existingUser.phoneNumber === phoneNumber) {
                return NextResponse.json({ error: 'Phone number already registered' }, { status: 400 })
            }
            return NextResponse.json({ error: 'Email already registered' }, { status: 400 })
        }

        // 1. Eco-Sync: Register with budolID (Centralized Identity & Anti-Fraud)
        let budolIdResult;
        try {
            const nameParts = name.trim().split(' ');
            const firstName = nameParts[0];
            const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

            budolIdResult = await registerWithBudolId({
                email,
                password,
                firstName,
                lastName,
                phoneNumber,
                registrationIp: ip,
                deviceFingerprint: deviceFingerprint || 'unknown-device',
                profilePicture: image // Pass the profile picture for trust scoring
            });

            console.log('[Eco-Sync] Successfully registered in budolID:', budolIdResult.userId);

            // Check for high-risk flags from budolID
            if (budolIdResult.fraudAnalysis?.risk === 'CRITICAL') {
                return NextResponse.json(
                    { error: 'Security verification failed. Please contact support.' },
                    { status: 403 }
                );
            }
        } catch (error) {
            console.error('[Eco-Sync] budolID registration failed:', error.message);
            
            // FIX: If user exists in budolID but NOT locally (checked above), allow local creation
            // This handles dev/test desync scenarios
            if (error.message.includes('registered') || error.message.includes('exists') || error.message.includes('Duplicate')) {
                 console.warn('[Eco-Sync] User exists in budolID but not locally. Attempting sync via login check.');
                 
                 try {
                     // Try to login with the provided credentials to verify ownership and get ID
                     const loginResult = await loginWithBudolId(email || phoneNumber, password);
                     
                     console.log('[Eco-Sync] Credentials verified. Syncing existing user from budolID.');
                     budolIdResult = {
                         userId: loginResult.user.id,
                         fraudAnalysis: loginResult.user.fraudAnalysis || { risk: 'UNKNOWN', score: 0 }
                     };
                 } catch (loginError) {
                    console.warn('[Eco-Sync] Sync failed: Credentials invalid or service error.', loginError.message);
                    return NextResponse.json(
                        { error: 'Account already exists. Please login with your existing credentials.' },
                        { status: 409 }
                    );
                }
            } else {
                // For other errors (e.g. service down), fail or fallback depending on policy
                // Here we return error as per original logic, unless it's a connectivity issue where we might want to allow offline mode
                const errorMessage = error.message.includes('budolID registration failed')
                    ? 'Centralized Identity service is currently unavailable. Please try again later.'
                    : error.message;

                return NextResponse.json(
                    { error: errorMessage },
                    { status: 503 }
                );
            }
        }

        // Hash password (locally for budolShap fallback, though budolID is the source of truth)
        const hashedPassword = await hashPassword(password)

        // Generate verification token or OTP
        // For quick registration (phone_only), we use a numeric OTP
        const verificationToken = isQuickReg ? generateOTP(6) : generateEmailToken();

        // Create user locally in budolShap
        // We use the same ID as budolID for perfect synchronization
        const userId = budolIdResult.userId;
        const user = await prisma.user.create({
            data: {
                id: userId,
                name,
                email,
                password: hashedPassword,
                phoneNumber,
                image: image || '',
                cart: {},
                accountType: 'BUYER',
                emailVerified: false,
                emailVerifyToken: verificationToken,
                metadata: {
                    budolId: userId,
                    fraudScore: budolIdResult.fraudAnalysis?.score || 0,
                    riskLevel: budolIdResult.fraudAnalysis?.risk || 'LOW',
                    registrationIp: ip,
                    isQuickRegistration: isQuickReg
                }
            },
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
                emailVerified: true,
                createdAt: true,
                accountType: true
            }
        })

        // Notify Admin via Realtime
        await triggerRealtimeEvent('admin-notifications', 'user-registered', {
            id: user.id,
            name: user.name,
            email: user.email,
            createdAt: user.createdAt,
            riskLevel: budolIdResult.fraudAnalysis?.risk
        });

        // Log registration to audit trail
        await createAuditLog(user.id, 'USER_REGISTERED', request, {
            entity: 'User',
            entityId: user.id,
            status: 'SUCCESS',
            details: `New user registration via ${isQuickReg ? 'Quick Reg' : 'Standard'}`,
            metadata: {
                email: user.email,
                riskLevel: budolIdResult.fraudAnalysis?.risk,
                fraudScore: budolIdResult.fraudAnalysis?.score
            }
        });

        // Send verification (Email + SMS for Quick Registration)
        try {
            if (isQuickReg) {
                // Dual-channel OTP for quick registration
                await Promise.all([
                    sendOTPEmail(email, verificationToken, name),
                    sendOTPSMS(phoneNumber, verificationToken)
                ]);
                console.log(`[Register] Dual-channel OTP sent to ${email} and ${phoneNumber}`);

                // Forensic Log: OTP Sent
                await createAuditLog(user.id, 'SECURITY_OTP_SENT', request, {
                    entity: 'Auth',
                    entityId: user.id,
                    status: 'SUCCESS',
                    details: `OTP sent to ${phoneNumber} (SMS) and ${email} (Email) for Quick Registration`,
                    metadata: {
                        phone: phoneNumber,
                        email: email,
                        type: 'DUAL_CHANNEL'
                    }
                });
            } else {
                // Standard email verification link
                await sendVerificationEmail(email, verificationToken, name)
            }
        } catch (error) {
            console.error('Failed to send verification:', error)
            // Continue registration even if sending fails
        }

        return NextResponse.json({
            message: 'User registered and synchronized with budolID',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                emailVerified: user.emailVerified,
                accountType: user.accountType,
                image: user.image
            }
        })

    } catch (error) {
        console.error('Registration Error:', error)
        return NextResponse.json(
            { error: error.message || 'An error occurred during registration' },
            { status: 500 }
        )
    }
}


import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword, generateToken, hashPassword, COOKIE_OPTIONS } from '@/lib/auth'
import { loginWithBudolId } from '@/lib/api/budolIdClient'
import { rateLimit } from '@/lib/rate-limit'
import { getSystemSettings } from '@/lib/settings'
import { createAuditLog } from '@/lib/audit'
import { normalizePhone } from '@/lib/utils/phone-utils'
import { sendOTPSMS } from '@/lib/sms'
import { sendOTPEmail } from '@/lib/email'

// Generate a 6-digit random code
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(request) {
    try {
        const body = await request.json()
        let { email, password } = body

        // Normalize email/phone for consistent lookup
        const normalizedPhone = normalizePhone(email);
        const searchIdentifier = normalizedPhone || email.toLowerCase();

        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email and password are required' },
                { status: 400 }
            )
        }

        // Rate Limiting
        const ip = request.headers.get('x-forwarded-for') || 'unknown-ip'
        const limitKey = `login:${ip}:${email}` // Limit by IP + Email specific

        // Fetch dynamic settings
        let loginLimit = 10;
        try {
            const settings = await getSystemSettings()
            if (settings.loginLimit) loginLimit = settings.loginLimit
        } catch (e) {
            console.error("Failed to fetch settings for rate limit:", e)
        }

        const { success, remaining, reset } = await rateLimit(limitKey, loginLimit, 15 * 60) // 15 mins window

        if (!success) {
            return NextResponse.json(
                { error: 'Too many login attempts. Please try again later.' },
                { status: 429, headers: { 'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString() } }
            )
        }

        // Find user by email or phone
        let user = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: searchIdentifier },
                    { phoneNumber: searchIdentifier }
                ]
            }
        })

        if (!user) {
            // Attempt to sync from budolID if not found locally
            try {
                // If it's an OTP login, we can't use loginWithBudolId (needs password)
                // We'll handle OTP sync further down if we find a valid OTP code
                const isOtp = body.isOtp || /^[0-9]{6}$/.test(password);
                
                if (!isOtp) {
                    console.log(`[Login Sync] User not found locally. Attempting sync from budolID for ${searchIdentifier}`);
                    const budolLogin = await loginWithBudolId(searchIdentifier, password);
                    
                    if (budolLogin && budolLogin.user) {
                         // Create local user
                         const hashedPassword = await hashPassword(password);
                         
                         // Handle name parsing if budolID returns separate fields
                         const name = budolLogin.user.name || `${budolLogin.user.firstName || ''} ${budolLogin.user.lastName || ''}`.trim() || 'Budol User';
                         
                         user = await prisma.user.create({
                             data: {
                                 id: budolLogin.user.id,
                                 name: name,
                                 email: budolLogin.user.email,
                                 phoneNumber: budolLogin.user.phoneNumber,
                                 password: hashedPassword,
                                 image: budolLogin.user.profilePicture || '',
                                 accountType: 'BUYER', // Default
                                 emailVerified: budolLogin.user.emailVerified || false,
                                 metadata: {
                                     budolId: budolLogin.user.id,
                                     syncedAt: new Date().toISOString(),
                                     source: 'login_sync'
                                 }
                             }
                         });
                         
                         console.log(`[Login Sync] Successfully synced user ${user.id} from budolID`);
                    }
                }
            } catch (syncError) {
                // Ignore sync error and proceed to return "User not found"
                console.warn('[Login Sync] Sync failed:', syncError.message);
            }
        }

        // Handle OTP Sync (User exists in BudolID, has valid OTP, but not in local DB)
        const isOtp = body.isOtp || /^[0-9]{6}$/.test(password)
        if (!user && isOtp) {
             const otpRecord = await prisma.verificationCode.findFirst({
                where: {
                    identifier: searchIdentifier,
                    code: password,
                    expiresAt: { gt: new Date() }
                }
            })

            if (otpRecord) {
                console.log(`[Login Sync] Valid OTP found for non-local user ${searchIdentifier}. Attempting to fetch profile from BudolID.`);
                try {
                     // We need to fetch the user profile from BudolID. 
                     // Since we don't have a password, we'll use the check-phone endpoint (or similar) 
                     // and trust the OTP verification as proof of identity.
                     const BUDOL_ID_URL = process.env.BUDOL_ID_URL || 'http://localhost:8000';
                     // Use a privileged call or assume check-phone returns enough info
                     // Note: Ideally we should have a 'getUserByPhone' admin endpoint. 
                     // For now, we'll try to use what we get from check-phone or create a placeholder.
                     
                     const checkUrl = `${BUDOL_ID_URL}/auth/check-phone?phone=${encodeURIComponent(searchIdentifier)}`;
                     const budolResponse = await fetch(checkUrl, { headers: { 'Accept': 'application/json' } });
                     
                     if (budolResponse.ok) {
                         const budolData = await budolResponse.json();
                         if (budolData.exists && budolData.user) {
                             const budolUser = budolData.user;
                             const name = budolUser.name || `${budolUser.firstName || ''} ${budolUser.lastName || ''}`.trim() || 'Budol User';
                             
                             // Create local user
                             user = await prisma.user.create({
                                 data: {
                                     id: budolUser.id || `synced_${Date.now()}`,
                                     name: name,
                                     email: budolUser.email || `${searchIdentifier}@placeholder.budol`, // Fallback if email missing
                                     phoneNumber: searchIdentifier,
                                     password: 'OTP_MANAGED_USER', // No password known
                                     image: budolUser.profilePicture || '',
                                     accountType: 'BUYER',
                                     emailVerified: true, // OTP verified
                                     metadata: {
                                         budolId: budolUser.id,
                                         syncedAt: new Date().toISOString(),
                                         source: 'otp_sync'
                                     }
                                 }
                             });
                             console.log(`[Login Sync] Created local user via OTP sync: ${user.id}`);
                         }
                     }
                } catch (e) {
                    console.error('[Login Sync] Failed to sync via OTP:', e);
                }
            }
        }

        if (!user) {
            // Log failed login attempt for unknown user
            await createAuditLog(null, 'LOGIN_FAILED', request, {
                entity: 'Auth',
                status: 'FAILURE',
                details: `Login failed: User not found (${email})`,
                metadata: { email, ip }
            });

            // Check if this looks like a budolID/ecosystem account
            const isEcosystemEmail = email.toLowerCase().endsWith('@budolpay.com') || 
                                   email.toLowerCase().endsWith('@budolid.com');
            
            if (isEcosystemEmail) {
                return NextResponse.json(
                    { error: 'Ecosystem account detected. Please use the "Login with budolID" button below.' },
                    { status: 401 }
                )
            }

            return NextResponse.json(
                { error: isOtp ? 'Invalid or expired verification code' : 'Invalid email or password' },
                { status: 401 }
            )
        }

        // Check if it's an OTP login
        // isOtp is already declared above
        let isValidPassword = false

        if (isOtp) {
            // Allow small clock skew (60s) when validating expiry
            const skewLeeway = 60 * 1000
            const otpRecord = await prisma.verificationCode.findFirst({
                where: {
                    identifier: searchIdentifier,
                    code: password,
                    expiresAt: { gt: new Date(Date.now() - skewLeeway) }
                }
            })

            if (otpRecord) {
                isValidPassword = true
                // Consume OTP
                await prisma.verificationCode.delete({ where: { id: otpRecord.id } })
            }
        } else {
            // Verify password
            isValidPassword = await verifyPassword(password, user.password)

            // If password is valid but stored as plain text (legacy), update to hash
            if (isValidPassword && !user.password.startsWith('$2')) {
                console.log(`[Login] Upgrading plain text password for user ${user.id}`);
                const hashedPassword = await hashPassword(password);
                await prisma.user.update({
                    where: { id: user.id },
                    data: { password: hashedPassword }
                });
            }

            if (!isValidPassword) {
                // Fallback: Try to authenticate against BudolID directly
                // This handles cases where the user updated their password in BudolID 
                // but it hasn't synced to BudolShap yet, or if the local password hash is stale.
                try {
                    console.log(`[Login] Local password failed for ${searchIdentifier}. Attempting fallback to BudolID.`);
                    const budolLogin = await loginWithBudolId(searchIdentifier, password);
                    
                    if (budolLogin && budolLogin.user) {
                        console.log(`[Login] BudolID fallback successful for ${searchIdentifier}`);
                        isValidPassword = true;
                        
                        // Update local password to match BudolID (so local login works next time)
                        const hashedPassword = await hashPassword(password);
                        await prisma.user.update({
                            where: { id: user.id },
                            data: { 
                                password: hashedPassword,
                                // Also trust the email verification status from BudolID
                                emailVerified: budolLogin.user.emailVerified !== undefined ? budolLogin.user.emailVerified : user.emailVerified
                            }
                        });
                    } else {
                        console.warn(`[Login] BudolID fallback returned no user for ${searchIdentifier}`);
                    }
                } catch (e) {
                    console.error(`[Login] BudolID fallback failed with error: ${e.message}`, e);
                }
            }
        }

        if (!isValidPassword) {
            await createAuditLog(user.id, 'LOGIN_FAILED', request, {
                status: 'FAILURE',
                details: isOtp ? 'Invalid OTP code' : 'Invalid password',
                entity: 'User',
                entityId: user.id
            });

            return NextResponse.json(
                { error: isOtp ? 'Invalid or expired verification code' : 'Invalid email or password' },
                { status: 401 }
            )
        }

        // Enforce OTP for password-based logins
        if (!isOtp) {
            const OTP_TTL_MINUTES = parseInt(process.env.OTP_TTL_MINUTES || '15', 10)
            const expires = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000)

            // Reuse existing non-expired OTP to avoid invalidating a code the user already received
            const existing = await prisma.verificationCode.findUnique({
                where: { identifier: searchIdentifier }
            })
            let otp = generateOTP()
            if (existing && existing.expiresAt > new Date()) {
                otp = existing.code
            }

            await prisma.verificationCode.upsert({
                where: { identifier: searchIdentifier },
                update: { code: otp, expiresAt: expires, type: 'LOGIN' },
                create: { identifier: searchIdentifier, code: otp, expiresAt: expires, type: 'LOGIN' }
            })

            // Send OTP
            const isPhone = !!normalizePhone(searchIdentifier);
            if (isPhone) {
                await sendOTPSMS(searchIdentifier, otp)
                if (user.email) await sendOTPEmail(user.email, otp, user.name || 'User')
            } else {
                await sendOTPEmail(searchIdentifier, otp, user.name || 'User')
                if (user.phoneNumber) await sendOTPSMS(user.phoneNumber, otp)
            }

            return NextResponse.json({
                status: 'OTP_REQUIRED',
                message: 'Verification code sent. Please enter it to continue.',
                identifier: searchIdentifier
            })
        }

        // Check if email/phone is verified
        if (!user.emailVerified && !isOtp) {
            return NextResponse.json(
                { error: 'Please verify your account before logging in.' },
                { status: 403 }
            )
        }

        // If logged in via OTP, we can consider the identifier verified
        if (isOtp && !user.emailVerified) {
            await prisma.user.update({
                where: { id: user.id },
                data: { emailVerified: true }
            })
        }

        // Determine session duration based on role
        // Buyers = 30 days (BudolShap persistent session)
        // Admins/Sellers = 24 hours (Stricter security)
        const isBuyer = !user.accountType || user.accountType === 'BUYER';
        const tokenDuration = isBuyer ? '30d' : '24h';
        const cookieMaxAge = isBuyer ? 60 * 60 * 24 * 30 : 60 * 60 * 24; // Seconds

        // Generate token
        const token = generateToken({
            userId: user.id,
            email: user.email,
            name: user.name,
            role: user.accountType
        }, tokenDuration)

        // Return user data (without password)
        const userData = {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
            emailVerified: user.emailVerified,
            cart: user.cart,
            accountType: user.accountType,
            isAdmin: user.isAdmin,
            isMember: user.isMember,
            isCoopMember: user.isCoopMember
        }

        // Create response with cookie
        const response = NextResponse.json({
            message: 'Login successful',
            user: userData,
            token,
            expiresIn: cookieMaxAge
        })

        // Set both cookies for backward compatibility
        console.log(`[Login API] Setting auth cookies for ${email}`);
        
        response.cookies.set('budolshap_token', token, {
            ...COOKIE_OPTIONS,
            maxAge: cookieMaxAge
        })

        response.cookies.set('token', token, {
            ...COOKIE_OPTIONS,
            maxAge: cookieMaxAge
        })

        // Log successful login
        await createAuditLog(user.id, 'LOGIN', request, {
            details: isOtp ? 'Login via OTP' : 'Login via Password',
            entity: 'User',
            entityId: user.id
        });

        return response
    } catch (error) {
        console.error('Login error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

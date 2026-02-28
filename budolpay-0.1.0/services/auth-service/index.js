const path = require('path');
// Load environment variables immediately
const envPath = path.resolve(__dirname, '../../.env');
require('dotenv').config({ path: envPath, override: true });

// DEBUG LOGGING
console.log('[DEBUG-AUTH] Starting Auth Service...');
console.log('[DEBUG-AUTH] Loading .env from:', envPath);
console.log('[DEBUG-AUTH] NODE_ENV:', process.env.NODE_ENV);

const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const axios = require('axios');
const { prisma } = require('@budolpay/database');
const { sendAccountCreationSuccess, sendOTP, sendVerificationSuccess } = require('@budolpay/notifications');
const { createAuditLog: createCentralizedAuditLog } = require('@budolpay/audit');

/**
 * Date Utilities for Asia/Manila Standard
 * Ensures compliance with BSP Circular 808
 */
const getNowUTC = () => new Date();
const getLegacyManilaISO = () => new Date().toISOString();
const getLegacyManilaDate = () => new Date();
const isLocal = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test' || process.env.LOCAL_IP === '127.0.0.1' || !!process.env.JEST_WORKER_ID;
console.log('[DEBUG-AUTH] isLocal determined as:', isLocal);


// NPC Compliance: PII Masking Helper
const maskPII = (str, type = 'AUTO') => {
    if (!str) return 'N/A';

    // Auto-detect type if not provided
    if (type === 'AUTO') {
        if (str.includes('@')) type = 'EMAIL';
        else if (/\d/.test(str) && str.length >= 7) type = 'PHONE';
        else type = 'NAME';
    }

    if (type === 'EMAIL') {
        const [user, domain] = str.split('@');
        return `${user.charAt(0)}${'*'.repeat(Math.max(0, user.length - 1))}@${domain}`;
    }

    if (type === 'PHONE') {
        const digits = str.replace(/\D/g, '');
        if (digits.length >= 10) {
            return `${digits.substring(0, 3)}${'*'.repeat(Math.max(0, digits.length - 6))}${digits.slice(-3)}`;
        }
        return '***' + digits.slice(-3);
    }

    if (type === 'NAME') {
        return `${str.charAt(0)}${'*'.repeat(Math.max(0, str.length - 1))}`;
    }

    return '***';
};

// Helper to generate OTP - supports testing
const generateOTP = () => {
    if (process.env.NODE_ENV === 'test' || !!process.env.JEST_WORKER_ID) return '123456';
    return Math.floor(100000 + Math.random() * 900000).toString();
};

const app = express();
const PORT = process.env.PORT || 8001;
const LOCAL_IP = process.env.LOCAL_IP;

if (!LOCAL_IP) {
    console.error('[Auth] CRITICAL: LOCAL_IP environment variable is not set. Service may not be network-aware.');
}

const GATEWAY_URL = process.env.NODE_ENV === 'development'
    ? `http://${LOCAL_IP || 'localhost'}:8080`
    : (process.env.GATEWAY_URL || `http://${LOCAL_IP || 'localhost'}:8080`);

// Helper to notify Gateway for real-time updates
const notifyAdmin = async (event, data) => {
    try {
        console.log(`[Auth] Attempting to notify Admin (${event}) at ${GATEWAY_URL}/internal/notify`);
        // Add a short timeout to prevent blocking critical user flows if Gateway is down
        const response = await axios.post(`${GATEWAY_URL}/internal/notify`, {
            isAdmin: true,
            event,
            data
        }, { timeout: 2000 });
        console.log(`[Auth] Admin notification (${event}) response:`, response.data);
    } catch (err) {
        console.error(`[Auth] Failed to notify Admin (${event}): ${err.message}`);
    }
};

// Helper to create forensic audit logs using centralized audit helper
const createAuditLog = async (req, userId, action, metadata = {}, entity = 'Security', entityId = null) => {
    try {
        const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        const userAgent = req.headers['user-agent'];

        // Use centralized audit helper with proper metadata structure
        const auditLog = await createCentralizedAuditLog({
            action,
            entity,
            entityId: entityId || userId,
            userId,
            metadata: {
                ...metadata,
                ipAddress,
                userAgent,
                device: req.body.deviceId || 'UNKNOWN_DEVICE',
                compliance: {
                    pci_dss: '10.2.2',
                    bsp: 'Circular 808'
                }
            },
            ipAddress
        });

        if (auditLog) {
            console.log(`[Audit] Logged action: ${action} for user: ${userId} (Entity: ${entity})`);
        } else {
            console.error(`[Audit] Failed to create audit log for action: ${action}`);
        }

        return auditLog;
    } catch (err) {
        console.error(`[Audit] Failed to create audit log: ${err.message}`);
        return null;
    }
};

app.use(cors());
app.use(express.json());

// Custom logging middleware for deep visibility
app.use((req, res, next) => {
    const start = Date.now();
    console.log(`\x1b[35m[Auth Request]\x1b[0m ${req.method} ${req.url} - ${new Date().toISOString()}`);
    if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
        // Only log body for non-sensitive routes
        if (!req.url.includes('login') && !req.url.includes('pin') && !req.url.includes('register')) {
            console.log(`[Auth Body]`, JSON.stringify(req.body, null, 2));
        } else {
            console.log(`[Auth Body] [REDACTED SENSITIVE DATA]`);
        }
    }

    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`\x1b[34m[Auth Response]\x1b[0m ${req.method} ${req.url} ${res.statusCode} (${duration}ms)`);
    });
    next();
});

// Vercel Support: Handle API prefix
const router = express.Router();
app.use('/api/auth', router);
app.use('/', router); // Fallback for direct calls

const JWT_SECRET = process.env.JWT_SECRET || 'GJ7Lxn0/kdV/KuZJ5xJ7Ip0RvMerrGW5n0gf44mfHgc=';
const BUDOL_ID_URL = process.env.BUDOL_ID_URL || `http://${LOCAL_IP || 'localhost'}:8000`;
console.log(`[budolPay-Auth] Ecosystem JWT_SECRET Loaded`);
console.log(`[budolPay-Auth] budolID SSO Service Link: ${BUDOL_ID_URL}`);

// SSO: Get App Info
router.get('/sso/app-info', async (req, res) => {
    const { apiKey } = req.query;
    const ecosystemApp = await prisma.ecosystemApp.findUnique({ where: { apiKey } });
    if (!ecosystemApp) return res.status(404).json({ error: 'Invalid Ecosystem App' });
    res.json(ecosystemApp);
});

// Middleware: Authenticate
const authenticate = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
        if (!user) return res.status(401).json({ error: 'User not found' });
        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid token' });
    }
};

// Verify Token & Get Profile (Mobile App Sync) - Universal Entry Point
app.get('/verify', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);

        // Universal User Lookup (Support SSO & Local)
        let user = null;

        // 1. Try lookup by ID (standard)
        if (decoded.userId || decoded.id || decoded.sub) {
            user = await prisma.user.findUnique({
                where: { id: decoded.userId || decoded.id || decoded.sub },
                include: { wallet: true }
            });
        }

        // 2. Try lookup by Email if ID failed or not present
        if (!user && decoded.email) {
            user = await prisma.user.findUnique({
                where: { email: decoded.email },
                include: { wallet: true }
            });
        }

        // 3. Universal Sync: Create user if missing but valid token
        if (!user && decoded.email) {
            console.log(`[Universal Sync] Creating missing user in budolPay: ${maskPII(decoded.email)}`);
            user = await prisma.user.create({
                data: {
                    id: decoded.sub || undefined, // Use budolID UUID if possible
                    email: decoded.email,
                    phoneNumber: decoded.phoneNumber || '0000000000',
                    firstName: decoded.firstName || '',
                    lastName: decoded.lastName || '',
                    passwordHash: 'SSO_MANAGED', // Password is managed by budolID
                    wallet: {
                        create: {
                            balance: 0.0,
                            currency: 'PHP'
                        }
                    }
                },
                include: { wallet: true }
            });
        }

        if (!user) return res.status(404).json({ error: 'User not found' });

        // Audit: Token Verification / Profile Sync
        // We log this as it accesses sensitive PII
        /* await createAuditLog(req, user.id, 'SECURITY_TOKEN_VERIFY', {
            status: 'SUCCESS',
            timestamp: getLegacyManilaISO()
        }, 'Security', user.id); */

        res.json({
            valid: true,
            user: {
                id: user.id,
                email: user.email,
                phoneNumber: user.phoneNumber, // Unmasked for profile edit
                firstName: user.firstName,     // Unmasked for profile edit
                lastName: user.lastName,       // Unmasked for profile edit
                kycTier: user.kycTier,
                kycStatus: user.kycStatus,
                role: user.role,
                trustedDevices: user.trustedDevices
            },
            // Include extra fields for compatibility if needed
            ecosystem: 'budol',
            decoded
        });
    } catch (error) {
        console.error('[Verify Error]', error);
        res.status(500).json({ error: error.message });
    }
});

// Update Profile (Compliance Aligned)
app.patch('/profile', authenticate, async (req, res) => {
    console.error('--- PROFILE PATCH RECEIVED ---', JSON.stringify(req.body));
    const { firstName, lastName, email } = req.body;
    const userId = req.user.id;

    // Strict Validation
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        console.error('--- VALIDATION FAILED: Invalid Email ---', email);
        return res.status(400).json({ error: 'Invalid email format' });
    }

    if (firstName !== undefined) {
        console.error('--- VALIDATION CHECK FIRST NAME ---', { firstName, trim: firstName.trim() });
        if (firstName.trim() === '') {
            console.error('--- VALIDATION FAILED: Empty First Name ---');
            return res.status(400).json({ error: 'First name cannot be empty' });
        }
    }

    if (lastName !== undefined) {
        console.error('--- VALIDATION CHECK LAST NAME ---', { lastName, trim: lastName.trim() });
        if (lastName.trim() === '') {
            console.error('--- VALIDATION FAILED: Empty Last Name ---');
            return res.status(400).json({ error: 'Last name cannot be empty' });
        }
    }

    try {
        const user = await prisma.user.findUnique({ where: { id: userId } });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Compliance: Restricted fields for verified users
        if (user.kycTier === 'FULLY_VERIFIED') {
            if (firstName && firstName !== user.firstName) {
                return res.status(400).json({ error: 'Legal first name cannot be changed for verified accounts. Please contact support.' });
            }
            if (lastName && lastName !== user.lastName) {
                return res.status(400).json({ error: 'Legal last name cannot be changed for verified accounts. Please contact support.' });
            }
        }

        // Check for duplicate email if email is being changed
        if (email && email !== user.email) {
            const existingUser = await prisma.user.findUnique({ where: { email } });
            if (existingUser) {
                return res.status(400).json({ error: 'Email is already in use by another account' });
            }
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                firstName: firstName || user.firstName,
                lastName: lastName || user.lastName,
                email: email || user.email,
            }
        });

        // Audit Log for Profile Update
        await createAuditLog(req, userId, 'PROFILE_UPDATE', {
            previous: {
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email
            },
            updated: {
                firstName: firstName || user.firstName,
                lastName: lastName || user.lastName,
                email: email || user.email
            },
            changes: {
                firstName: firstName && firstName !== user.firstName,
                lastName: lastName && lastName !== user.lastName,
                email: email && email !== user.email
            }
        }, 'User', userId);

        res.json({
            message: 'Profile updated successfully',
            user: {
                id: updatedUser.id,
                firstName: updatedUser.firstName,
                lastName: updatedUser.lastName,
                email: updatedUser.email,
                kycTier: updatedUser.kycTier,
                kycStatus: updatedUser.kycStatus
            }
        });
    } catch (error) {
        console.error('[Profile Update Error]', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

// Health Check
router.get('/health', (req, res) => {
    res.status(200).json({ status: 'Auth Service is healthy', timestamp: getLegacyManilaDate() });
});

// DEBUG: Check DB Columns
app.get('/debug/db-columns', async (req, res) => {
    try {
        const result = await prisma.$queryRaw`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'User' AND column_name IN ('pinHash', 'trustedDevices', 'biometricKeyId');
        `;
        res.json({
            url: process.env.DATABASE_URL,
            columns: result
        });
    } catch (error) {
        console.error('[Identify Error]', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * AI Security Engine - Spam Prevention Module
 * Analyzes registration patterns to identify high-risk accounts
 */
const aiAntiSpamEngine = {
    score: async (data) => {
        let riskScore = 0;
        const { email, firstName, lastName, phoneNumber } = data;

        // Pattern 1: Email Randomness (Spam indicator)
        const emailLocal = email ? email.split('@')[0] : '';
        console.log(`[AI Spam Debug] Analyzing: ${emailLocal}`);

        if (emailLocal && /[0-9]{4,}/.test(emailLocal)) {
            console.log('[AI Spam Debug] Pattern 1 Match: 4+ consecutive digits (+30)');
            riskScore += 30;
        }

        const letterCount = (emailLocal.match(/[a-z]/g) || []).length;
        if (emailLocal && letterCount < 3) {
            console.log(`[AI Spam Debug] Pattern 1 Match: Low letter count (${letterCount}) (+20)`);
            riskScore += 20;
        }

        // Pattern 2: Name Consistency
        if (firstName && lastName && firstName.toLowerCase() === lastName.toLowerCase()) {
            console.log('[AI Spam Debug] Pattern 2 Match: Name consistency (+25)');
            riskScore += 25;
        }
        if (firstName && firstName.length < 2) {
            console.log('[AI Spam Debug] Pattern 2 Match: Short first name (+15)');
            riskScore += 15;
        }
        if (lastName && lastName.length < 2) {
            console.log('[AI Spam Debug] Pattern 2 Match: Short last name (+15)');
            riskScore += 15;
        }

        // Pattern 3: Common Spam Domains (Temporary/Disposable)
        const disposableDomains = ['tempmail.com', '10minutemail.com', 'guerrillamail.com'];
        if (email && disposableDomains.some(d => email.endsWith(d))) {
            console.log('[AI Spam Debug] Pattern 3 Match: Disposable domain (+50)');
            riskScore += 50;
        }

        console.log(`[AI Spam Debug] Total Risk Score: ${riskScore}`);

        return {
            riskScore,
            isHighRisk: riskScore >= 70,
            analysis: riskScore >= 70 ? 'AI detected high-probability spam pattern.' : 'Low risk pattern detected.'
        };
    }
};

// Register (Global User - GoTyme Aligned)
app.post('/register', async (req, res) => {
    const { email, password, phoneNumber, firstName, lastName, pin, deviceId } = req.body;

    // AI Anti-Spam Check
    const spamAnalysis = await aiAntiSpamEngine.score({ email, firstName, lastName, phoneNumber });
    if (spamAnalysis.isHighRisk) {
        await createAuditLog(req, null, 'SECURITY_SPAM_REGISTRATION_BLOCKED', {
            email,
            riskScore: spamAnalysis.riskScore,
            reason: spamAnalysis.analysis
        }, 'Security');
        return res.status(403).json({
            error: 'Registration blocked by security policy.',
            reason: 'High-risk account pattern detected. Please use a valid personal email.'
        });
    }

    // Validation
    if (!phoneNumber) return res.status(400).json({ error: 'Mobile number is required' });
    if (pin && (pin.length !== 6 || isNaN(pin))) {
        return res.status(400).json({ error: 'PIN must be exactly 6 digits' });
    }

    try {
        const passwordHash = password ? await bcrypt.hash(password, 10) : 'SOCIAL_OR_MOBILE_ONLY';
        const pinHash = pin ? await bcrypt.hash(pin, 10) : null;
        // ALWAYS generate a real OTP as per user request
        const otpCode = generateOTP();
        const otpExpiresAt = new Date(getNowUTC().getTime() + 10 * 60 * 1000); // 10 mins

        // Initialize trusted devices with the current device if provided
        const trustedDevices = deviceId ? JSON.stringify([{
            deviceId,
            addedAt: getLegacyManilaDate(),
            lastUsed: getLegacyManilaDate(),
            isVerified: false // Becomes true after OTP verification
        }]) : null;

        const user = await prisma.user.create({
            data: {
                email: email || `${phoneNumber}@budolpay.local`,
                passwordHash,
                phoneNumber,
                firstName,
                lastName,
                pinHash,
                otpCode,
                otpExpiresAt,
                trustedDevices
            }
        });

        // Notify Admin about new user registration for real-time dashboard
        // We do NOT await these to prevent blocking the registration response
        prisma.user.count().then(totalUsers => {
            notifyAdmin('new_user', {
                count: totalUsers,
                user: {
                    id: user.id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    createdAt: user.createdAt
                }
            });
        }).catch(adminNotifyError => {
            console.error('[Admin Notification Error]', adminNotifyError);
        });

        // Notify user about successful account creation and send OTP
        // We do NOT await these to prevent blocking the registration response
        (async () => {
            try {
                // Determine delivery channel based on available info
                const deliveryType = (user.email && !user.email.endsWith('@budolpay.local') && user.phoneNumber)
                    ? 'BOTH'
                    : (user.phoneNumber ? 'SMS' : 'EMAIL');

                console.log(`[Registration] Sending OTP to ${maskPII(user.phoneNumber || user.email)} via ${deliveryType}`);

                if (user.email && !user.email.endsWith('@budolpay.local')) {
                    await sendAccountCreationSuccess(user.email, user.firstName || 'User', 'EMAIL');
                    // sendOTP now handles validation and will only send if applicable
                    await sendOTP(user.email, otpCode, deliveryType);
                }

                if (user.phoneNumber) {
                    await sendAccountCreationSuccess(user.phoneNumber, user.firstName || 'User', 'SMS');
                    // sendOTP now handles validation and will only send if applicable
                    await sendOTP(user.phoneNumber, otpCode, deliveryType);
                    // Always log OTP for visibility during dev/test
                    console.log(`[LOCAL] OTP for ${maskPII(user.phoneNumber)}: \x1b[33m${otpCode}\x1b[0m`);
                }
            } catch (notifError) {
                console.error('[Registration Notification Error]', notifError);
            }
        })();

        res.status(201).json({
            message: 'User registered successfully. Please verify OTP.',
            userId: user.id,
            requireOtp: true
        });
    } catch (error) {
        console.error('[Registration Error]', error);
        res.status(400).json({ error: error.message });
    }
});

/**
 * Quick Registration (Shopee Aligned)
 * Phase 1: Phone + OTP Only
 * Creates a temporary profile with UNVERIFIED status
 */
app.post('/register/quick', async (req, res) => {
    const { phoneNumber, deviceId, firstName } = req.body;

    if (!phoneNumber) return res.status(400).json({ error: 'Phone number is required' });

    // Normalize phone
    let normalizedPhone = phoneNumber.replace(/\D/g, '');
    if (normalizedPhone.startsWith('63')) {
        normalizedPhone = '0' + normalizedPhone.substring(2);
    }

    try {
        // Check existence
        const existing = await prisma.user.findFirst({
            where: {
                OR: [
                    { phoneNumber: phoneNumber },
                    { phoneNumber: normalizedPhone },
                    { phoneNumber: '+63' + normalizedPhone.substring(1) }
                ]
            }
        });

        if (existing) {
            return res.status(400).json({
                error: 'This number is already registered. Please sign in instead.',
                exists: true
            });
        }

        // OTP Generation - Real code as per user request
        const otpCode = generateOTP();
        const otpExpiresAt = new Date(getNowUTC().getTime() + 10 * 60 * 1000);

        // Trusted Devices init
        const trustedDevices = deviceId ? JSON.stringify([{
            deviceId,
            addedAt: getLegacyManilaDate(),
            lastUsed: getLegacyManilaDate(),
            isVerified: false
        }]) : null;

        const user = await prisma.user.create({
            data: {
                phoneNumber: normalizedPhone,
                firstName: firstName || 'Budol User',
                lastName: 'Quick-Reg',
                email: `${normalizedPhone}@budol.temp`, // Temporary internal email
                passwordHash: 'QUICK_REG_PENDING',
                otpCode,
                otpExpiresAt,
                trustedDevices,
                kycTier: 'BASIC',
                kycStatus: 'PENDING'
            }
        });

        // Audit Log
        await createAuditLog(req, user.id, 'SECURITY_QUICK_REG_INIT', {
            deviceId,
            mode: 'QUICK_PHONE_ONLY'
        }, 'Security', user.id);

        // Send OTP
        // We do NOT await this to prevent blocking the registration response
        const deliveryType = user.email && !user.email.endsWith('.temp') ? 'BOTH' : 'SMS';
        sendOTP(user.phoneNumber || user.email, otpCode, deliveryType).catch(err => console.error('[Quick Reg OTP Error]', err));
        if (isLocal) console.log(`[LOCAL] Quick-Reg OTP for ${maskPII(user.phoneNumber)}: \x1b[33m${otpCode}\x1b[0m`);

        res.status(201).json({
            message: 'Quick registration initiated. Please verify OTP.',
            userId: user.id,
            requireOtp: true
        });

    } catch (error) {
        console.error('[Quick Reg Error]', error);
        res.status(500).json({ error: error.message });
    }
});

// Check if email is already taken (Ecosystem-wide)
app.get('/check-email', async (req, res) => {
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    try {
        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase().trim() }
        });

        if (user) {
            return res.json({ exists: true, source: 'LOCAL' });
        }

        // Cross-check with budolID
        try {
            const budolIdRes = await axios.get(`${BUDOL_ID_URL}/auth/check-email?email=${encodeURIComponent(email)}`, { timeout: 3000 });
            if (budolIdRes.data && budolIdRes.data.exists) {
                return res.json({ exists: true, source: 'BUDOL_ID' });
            }
        } catch (e) {
            console.error(`[Auth Proxy] budolID check failed: ${e.message}`);
        }

        res.json({ exists: !!user });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Check if phone number is already taken (Ecosystem-wide)
app.get('/check-phone', async (req, res) => {
    const { phone } = req.query;
    if (!phone) return res.status(400).json({ error: 'Phone is required' });

    // Normalize phone for comparison
    let normalizedPhone = phone.replace(/\D/g, '');
    if (normalizedPhone.startsWith('63')) {
        normalizedPhone = '0' + normalizedPhone.substring(2);
    }

    try {
        // 1. Check Local DB
        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { phoneNumber: phone },
                    { phoneNumber: normalizedPhone },
                    { phoneNumber: '+63' + normalizedPhone.substring(1) }
                ]
            }
        });

        if (user) {
            return res.json({ exists: true, source: 'LOCAL' });
        }

        // 2. Cross-check with budolID (Unified Identity)
        try {
            console.log(`[Auth Proxy] Checking phone "${phone}" with budolID...`);
            const budolIdRes = await axios.get(`${BUDOL_ID_URL}/auth/check-phone?phone=${encodeURIComponent(phone)}`, { timeout: 3000 });
            if (budolIdRes.data && budolIdRes.data.exists) {
                console.log(`[Auth Proxy] Phone found in budolID ecosystem.`);
                return res.json({
                    exists: true,
                    source: 'BUDOL_ID',
                    email: budolIdRes.data.email,
                    name: budolIdRes.data.name
                });
            }
        } catch (e) {
            console.error(`[Auth Proxy] budolID check failed: ${e.message}`);
        }

        res.json({ exists: false });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Mobile Login - Phase 1: Identify & Challenge (GoTyme Style)
app.post('/login/mobile/identify', async (req, res) => {
    let { phoneNumber, deviceId } = req.body;

    if (!phoneNumber) return res.status(400).json({ error: 'Mobile number or email is required' });

    // Detect if input is an email
    const isEmail = phoneNumber.includes('@');
    let normalizedPhone = '';

    if (!isEmail) {
        // Normalize Phone Number (BSP Circular 808/1108 Aligned)
        // Strip everything except digits
        normalizedPhone = phoneNumber.replace(/\D/g, '');

        // Convert 639... to 09... for local DB consistency if needed
        if (normalizedPhone.startsWith('63')) {
            normalizedPhone = '0' + normalizedPhone.substring(2);
        }
    }

    try {
        // Search with exact match first, then with normalized phone or email
        let user;
        if (isEmail) {
            user = await prisma.user.findFirst({
                where: { email: phoneNumber.toLowerCase().trim() }
            });
        } else {
            user = await prisma.user.findFirst({
                where: {
                    OR: [
                        { phoneNumber: phoneNumber },
                        { phoneNumber: normalizedPhone },
                        { phoneNumber: '+63' + normalizedPhone.substring(1) }
                    ]
                }
            });
        }

        if (!user) {
            // 1. Cross-check with budolID for Mobile Identification
            try {
                console.log(`[Auth Sync] Identifying "${phoneNumber}" via budolID...`);
                // Use Identify or Check-Phone to find the user
                const budolIdRes = await axios.get(`${BUDOL_ID_URL}/auth/check-phone?phone=${encodeURIComponent(phoneNumber)}`, { timeout: 3000 });

                if (budolIdRes.data && budolIdRes.data.exists) {
                    console.log(`[Auth Sync] User found in budolID. Performing Auto-Sync for budolPay...`);

                    // Create user in budolPay with minimal data to allow login
                    user = await prisma.user.create({
                        data: {
                            id: budolIdRes.data.id || undefined,
                            email: budolIdRes.data.email || `${normalizedPhone}@budolpay.local`,
                            phoneNumber: normalizedPhone,
                            firstName: budolIdRes.data.name ? budolIdRes.data.name.split(' ')[0] : (budolIdRes.data.firstName || 'User'),
                            lastName: budolIdRes.data.name ? (budolIdRes.data.name.split(' ')[1] || '') : (budolIdRes.data.lastName || ''),
                            passwordHash: 'SSO_MANAGED', // Password remains in budolID
                            wallet: {
                                create: {
                                    balance: 0.0,
                                    currency: 'PHP'
                                }
                            }
                        }
                    });

                    console.log(`[Auth Sync] Auto-Sync complete. User ID: ${user.id}`);
                }
            } catch (syncError) {
                console.error(`[Auth Sync] budolID Sync failed: ${syncError.message}`);
            }
        }

        if (!user) {
            // Audit: Mobile Identification Failure
            await createAuditLog(req, null, 'SECURITY_MOBILE_IDENTIFY_FAILED', {
                identifier: phoneNumber,
                deviceId,
                reason: 'USER_NOT_FOUND'
            }, 'Security');
            return res.status(404).json({ error: 'Account not found' });
        }

        // Check Device Trust
        let isDeviceTrusted = false;
        if (user.trustedDevices && deviceId) {
            const devices = JSON.parse(user.trustedDevices);
            const device = devices.find(d => d.deviceId === deviceId && d.isVerified);
            if (device) isDeviceTrusted = true;
        }

        // Audit: Mobile Identification (Phase 1)
        await createAuditLog(req, user.id, 'SECURITY_MOBILE_IDENTIFY_SUCCESS', {
            deviceId,
            isDeviceTrusted
        }, 'Security', user.id);

        if (!isDeviceTrusted || !user.pinHash) {
            // New Device, Untrusted, OR No PIN set -> Trigger OTP
            const otpCode = generateOTP();
            const otpExpiresAt = new Date(getNowUTC().getTime() + 10 * 60 * 1000);

            await prisma.user.update({
                where: { id: user.id },
                data: { otpCode, otpExpiresAt, otpUpdatedAt: getNowUTC() }
            });

            // Dual-channel delivery if email is available
            const deliveryType = (user.email && !user.email.endsWith('@budolpay.local')) ? 'BOTH' : 'SMS';
            const recipient = user.phoneNumber || user.email;

            console.log(`[Identify] Sending login OTP to ${maskPII(recipient)} via ${deliveryType}`);
            console.log(`[DEBUG-OTP] Code: ${otpCode}, isLocal: ${isLocal}`);
            try {
                await sendOTP(recipient, otpCode, deliveryType);
                console.log(`[Identify] sendOTP resolved successfully`);
            } catch (err) {
                console.error(`[Identify] sendOTP failed: ${err.message}`);
            }
            // Always log OTP for visibility during dev/test
            console.log(`[LOCAL] Login OTP for ${maskPII(recipient)}: \x1b[33m${otpCode}\x1b[0m`);

            return res.json({
                status: 'OTP_REQUIRED',
                userId: user.id,
                user: {
                    id: user.id,
                    phoneNumber: maskPII(user.phoneNumber),
                    firstName: maskPII(user.firstName),
                    lastName: maskPII(user.lastName)
                },
                message: 'OTP sent to your registered mobile number'
            });
        }

        // Trusted Device -> Proceed to PIN or Biometrics
        console.log(`[Identify] Skipping OTP (Reason: Device Trusted AND PIN Set)`);
        res.json({
            status: 'AUTH_REQUIRED',
            userId: user.id,
            user: {
                id: user.id,
                phoneNumber: maskPII(user.phoneNumber),
                firstName: maskPII(user.firstName),
                lastName: maskPII(user.lastName)
            },
            methods: ['PIN', user.biometricKeyId ? 'BIOMETRIC' : null].filter(Boolean)
        });

    } catch (error) {
        console.error('[Identify Error]', error);
        res.status(500).json({ error: error.message });
    }
});

// Mobile Login - Phase 2: Verify PIN
app.post('/login/mobile/verify-pin', async (req, res) => {
    const { userId, pin, deviceId } = req.body;

    try {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return res.status(401).json({ error: 'User not found' });

        if (!user.pinHash) {
            return res.status(403).json({
                status: 'PIN_SETUP_REQUIRED',
                error: 'PIN not set for this account.',
                message: 'Your PIN needs to be set up. Redirecting to PIN setup...'
            });
        }

        const isPinValid = await bcrypt.compare(pin, user.pinHash);
        if (!isPinValid) {
            // Audit: Mobile PIN Failure
            await createAuditLog(req, user.id, 'SECURITY_MOBILE_LOGIN_PIN_FAILED', {
                method: 'PIN',
                deviceId: deviceId,
                status: 'FAILURE',
                reason: 'INCORRECT_PIN'
            }, 'Security', user.id);
            return res.status(401).json({ error: 'Incorrect PIN' });
        }

        // Update last used for device
        if (user.trustedDevices && deviceId) {
            let devices = JSON.parse(user.trustedDevices);
            devices = devices.map(d => d.deviceId === deviceId ? { ...d, lastUsed: getLegacyManilaDate() } : d);
            await prisma.user.update({
                where: { id: userId },
                data: { trustedDevices: JSON.stringify(devices) }
            });
        }

        const token = jwt.sign({ userId: user.id, role: user.role, type: 'MOBILE' }, JWT_SECRET, { expiresIn: '30d' }); // Longer session for mobile

        // Audit: Mobile PIN Login
        await createAuditLog(req, user.id, 'SECURITY_MOBILE_LOGIN_PIN', {
            method: 'PIN',
            deviceId: deviceId,
            status: 'SUCCESS',
            timestamp: getLegacyManilaISO()
        }, 'Security', user.id);

        res.json({
            token,
            user: {
                id: user.id,
                phoneNumber: maskPII(user.phoneNumber),
                firstName: user.firstName,
                lastName: user.lastName
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Mobile Login - Phase 3: Setup PIN (for users without one)
app.post('/login/mobile/setup-pin', async (req, res) => {
    const { userId, pin } = req.body;

    if (!pin || pin.length !== 6 || isNaN(pin)) {
        return res.status(400).json({ error: 'PIN must be exactly 6 digits' });
    }

    try {
        const pinHash = await bcrypt.hash(pin, 10);
        const user = await prisma.user.update({
            where: { id: userId },
            data: { pinHash }
        });

        // Audit: Mobile PIN Setup
        await createAuditLog(req, user.id, 'SECURITY_MOBILE_PIN_SETUP', {
            status: 'SUCCESS',
            timestamp: getLegacyManilaISO()
        }, 'Security', user.id);

        // Generate full token after successful PIN setup
        const token = jwt.sign(
            { userId: user.id, role: user.role, type: 'MOBILE', isVerified: true, hasPin: true },
            JWT_SECRET,
            { expiresIn: '30d' }
        );

        res.json({
            message: 'PIN set successfully',
            token,
            user: {
                id: user.id,
                phoneNumber: maskPII(user.phoneNumber),
                firstName: user.firstName,
                lastName: user.lastName
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Resend OTP
app.post('/resend-otp', async (req, res) => {
    const { userId, type } = req.body; // type can be 'EMAIL', 'SMS', or 'BOTH'
    console.log(`[Resend-OTP] Request received for userId: ${userId}, type: ${type}`);

    try {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            console.error(`[Resend-OTP] User not found: ${userId}`);
            return res.status(404).json({ error: 'User not found' });
        }

        // Rate limiting: Check if an OTP was sent recently (e.g., within the last 60 seconds)
        const now = getNowUTC();
        if (user.otpUpdatedAt && (now - new Date(user.otpUpdatedAt)) < 60000) {
            console.warn(`[Resend-OTP] Rate limit hit for user ${userId}`);
            return res.status(429).json({
                error: 'Too many requests. Please wait 60 seconds before requesting another OTP.',
                retryAfter: 60
            });
        }

        const otpCode = generateOTP();
        const otpExpiresAt = new Date(now.getTime() + 10 * 60 * 1000);

        await prisma.user.update({
            where: { id: userId },
            data: {
                otpCode,
                otpExpiresAt,
                otpUpdatedAt: now
            }
        });

        // Determine delivery channel
        let deliveryType = type || 'BOTH';
        if (deliveryType === 'BOTH' && (!user.email || user.email.endsWith('@budolpay.local'))) {
            deliveryType = 'SMS';
        }

        const recipient = user.phoneNumber || user.email;
        console.log(`[Resend-OTP] Resending OTP to ${maskPII(recipient)} via ${deliveryType}`);
        console.log(`[DEBUG-OTP] Code: ${otpCode}, isLocal: ${isLocal}`);

        // Use the provider-agnostic notification package
        try {
            await sendOTP(recipient, otpCode, deliveryType);
            console.log(`[Resend-OTP] sendOTP resolved successfully`);
        } catch (err) {
            console.error(`[Resend-OTP] sendOTP failed: ${err.message}`);
        }

        // Always log OTP for visibility during dev/test
        console.log(`[LOCAL] Resent OTP for ${maskPII(recipient)}: \x1b[33m${otpCode}\x1b[0m`);

        // Audit: OTP Resent
        await createAuditLog(req, user.id, 'SECURITY_OTP_RESENT', {
            type: deliveryType,
            timestamp: getLegacyManilaISO()
        }, 'Security', user.id);

        res.json({ message: 'OTP resent successfully', userId: user.id });
    } catch (error) {
        console.error('[Resend-OTP Error]', error);
        res.status(500).json({ error: error.message });
    }
});

// Verify OTP
app.post('/verify-otp', async (req, res) => {
    const { userId, otp, type, deviceId } = req.body; // type can be 'EMAIL', 'SMS', 'BOTH', 'KYC', or 'DEVICE'
    try {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return res.status(404).json({ error: 'User not found' });

        if (user.otpCode !== otp) {
            return res.status(400).json({ error: 'Invalid OTP code' });
        }

        if (user.otpExpiresAt < getNowUTC()) {
            return res.status(400).json({ error: 'OTP code has expired' });
        }

        // Update verification status
        const updateData = {
            otpCode: null,
            otpExpiresAt: null,
        };

        if (type === 'EMAIL' || type === 'BOTH') updateData.emailVerified = true;
        if (type === 'SMS' || type === 'BOTH') updateData.phoneVerified = true;

        // Handle Device Trust Verification
        if (deviceId && user.trustedDevices) {
            let devices = JSON.parse(user.trustedDevices);
            const deviceIndex = devices.findIndex(d => d.deviceId === deviceId);
            if (deviceIndex !== -1) {
                devices[deviceIndex].isVerified = true;
                devices[deviceIndex].lastUsed = getLegacyManilaDate();
            } else {
                // New device being verified
                devices.push({
                    deviceId,
                    addedAt: getLegacyManilaDate(),
                    lastUsed: getLegacyManilaDate(),
                    isVerified: true
                });
            }
            updateData.trustedDevices = JSON.stringify(devices);
        } else if (deviceId && !user.trustedDevices) {
            updateData.trustedDevices = JSON.stringify([{
                deviceId,
                addedAt: getLegacyManilaDate(),
                lastUsed: getLegacyManilaDate(),
                isVerified: true
            }]);
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: updateData
        });

        // Audit: OTP Verified
        await createAuditLog(req, user.id, 'SECURITY_OTP_VERIFIED', {
            type,
            deviceId,
            status: 'SUCCESS',
            timestamp: getLegacyManilaISO()
        }, 'Security', user.id);

        // Notify user about successful verification
        try {
            if (type === 'KYC') {
                await sendVerificationSuccess(user.email, user.firstName || 'User', 'ACCOUNT', 'BOTH');
            } else {
                if (type === 'EMAIL' || type === 'BOTH') {
                    await sendVerificationSuccess(user.email, user.firstName || 'User', 'EMAIL', 'EMAIL');
                }
                if ((type === 'SMS' || type === 'BOTH') && user.phoneNumber) {
                    await sendVerificationSuccess(user.phoneNumber, user.firstName || 'User', 'SMS', 'SMS');
                }
            }
        } catch (notifError) {
            console.error('[Verification Notification Error]', notifError);
        }

        // If it was a device verification login, return a token immediately
        if (deviceId) {
            const hasPin = !!updatedUser.pinHash;
            // If no PIN is set, we return a limited token or just the status to force PIN setup
            const token = jwt.sign(
                { userId: updatedUser.id, role: updatedUser.role, type: 'MOBILE', isVerified: true, hasPin },
                JWT_SECRET,
                { expiresIn: hasPin ? '30d' : '10m' } // Limited session if no PIN
            );

            return res.json({
                status: hasPin ? 'SUCCESS' : 'PIN_SETUP_REQUIRED',
                message: hasPin ? 'Device verified and login successful' : 'Device verified. Please set up your 6-digit PIN.',
                token,
                user: {
                    id: updatedUser.id,
                    phoneNumber: maskPII(updatedUser.phoneNumber),
                    firstName: updatedUser.firstName,
                    lastName: updatedUser.lastName
                },
                needsPinSetup: !hasPin
            });
        }

        res.json({ message: 'Verification successful', user: { emailVerified: updatedUser.emailVerified, phoneVerified: updatedUser.phoneVerified } });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// SSO Login
app.post('/sso/login', async (req, res) => {
    const { email, password, apiKey } = req.body;
    try {
        // 1. Verify App
        const ecosystemApp = await prisma.ecosystemApp.findUnique({ where: { apiKey } });
        if (!ecosystemApp) return res.status(403).json({ error: 'App not authorized for SSO' });

        // 2. Verify User
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // 3. Create Ecosystem-wide Token
        const token = jwt.sign(
            {
                userId: user.id,
                role: user.role,
                issuer: 'budolID-SSO',
                apps: ['budolPay', 'budolShap', 'budolExpress']
            },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        // 4. Register Session
        await prisma.session.create({
            data: {
                userId: user.id,
                token,
                appId: ecosystemApp.name,
                expiresAt: new Date(getNowUTC().getTime() + 7 * 24 * 60 * 60 * 1000)
            }
        });

        // Audit: Session Created
        await createAuditLog(req, user.id, 'SECURITY_SESSION_CREATED', {
            method: 'SSO_LOGIN',
            timestamp: getLegacyManilaISO()
        }, 'Security', user.id);

        res.json({
            token,
            redirectUri: `${ecosystemApp.redirectUri}?token=${token}`,
            user: { id: user.id, email: maskPII(user.email), role: user.role }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Logout (Internal)
app.post('/logout', async (req, res) => {
    const { userId } = req.body;
    try {
        if (userId) {
            // Audit: Logout
            await createAuditLog(req, userId, 'SECURITY_LOGOUT', {
                status: 'SUCCESS',
                timestamp: getLegacyManilaISO()
            }, 'Security', userId);
        }
        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        console.error('[Logout Error]', error);
        res.status(500).json({ error: error.message });
    }
});

// Legacy Login (Internal)
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });

        // Audit: Standard Web Login
        await createAuditLog(req, user.id, 'WEB_LOGIN', {
            method: 'PASSWORD',
            status: 'SUCCESS',
            timestamp: getLegacyManilaISO()
        });

        res.json({ token, user: { id: user.id, email: maskPII(user.email), role: user.role } });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- PIN & BIOMETRIC MANAGEMENT ---

// Update PIN
app.post('/pin/update', async (req, res) => {
    const { userId, oldPin, newPin } = req.body;

    if (newPin.length !== 6 || isNaN(newPin)) {
        return res.status(400).json({ error: 'PIN must be exactly 6 digits' });
    }

    try {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return res.status(404).json({ error: 'User not found' });

        if (user.pinHash) {
            const isPinValid = await bcrypt.compare(oldPin, user.pinHash);
            if (!isPinValid) return res.status(401).json({ error: 'Current PIN is incorrect' });
        }

        const newPinHash = await bcrypt.hash(newPin, 10);
        await prisma.user.update({
            where: { id: userId },
            data: { pinHash: newPinHash }
        });

        // Audit: Mobile PIN setup success
        await createAuditLog(req, user.id, 'SECURITY_MOBILE_PIN_SETUP_SUCCESS', {
            status: 'SUCCESS',
            timestamp: getLegacyManilaISO()
        }, 'Security', user.id);

        res.json({
            message: 'PIN updated successfully'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Biometric Registration Challenge (GoTyme Standard)
app.post('/biometric/register-challenge', async (req, res) => {
    const { userId } = req.body;
    try {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return res.status(404).json({ error: 'User not found' });

        // In a real WebAuthn implementation, we'd generate a random challenge
        const challenge = Math.random().toString(36).substring(2);

        // Save challenge temporarily (e.g., in Redis or DB)
        // For simulation, we'll just return it
        res.json({
            challenge,
            user: {
                id: user.id,
                name: maskPII(user.email),
                displayName: `${maskPII(user.firstName)} ${maskPII(user.lastName)}`
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Biometric Registration Verify
app.post('/biometric/register-verify', async (req, res) => {
    const { userId, credentialId, publicKey } = req.body;
    try {
        await prisma.user.update({
            where: { id: userId },
            data: {
                biometricKeyId: credentialId,
                biometricPublicKey: Buffer.from(publicKey, 'base64')
            }
        });
        res.json({ message: 'Biometrics registered successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Biometric Login Verify
app.post('/biometric/login-verify', async (req, res) => {
    const { userId, deviceId, signature } = req.body;
    try {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || !user.biometricKeyId) return res.status(401).json({ error: 'Biometrics not registered' });

        // Verify device trust
        if (user.trustedDevices && deviceId) {
            const devices = JSON.parse(user.trustedDevices);
            const device = devices.find(d => d.deviceId === deviceId && d.isVerified);
            if (!device) return res.status(403).json({ error: 'Device not trusted for biometrics' });
        }

        // In real WebAuthn, we'd verify the signature against the publicKey
        // For simulation, we assume signature is valid if provided
        if (!signature) {
            // Audit: Mobile Biometric Failure
            await createAuditLog(req, user.id, 'SECURITY_MOBILE_LOGIN_BIOMETRIC_FAILED', {
                method: 'BIOMETRIC',
                deviceId: deviceId,
                status: 'FAILURE',
                reason: 'MISSING_SIGNATURE'
            }, 'Security', user.id);
            return res.status(400).json({ error: 'Biometric signature required' });
        }

        const token = jwt.sign({ userId: user.id, role: user.role, type: 'BIOMETRIC' }, JWT_SECRET, { expiresIn: '30d' });

        // Audit: Mobile Biometric Login
        await createAuditLog(req, user.id, 'SECURITY_MOBILE_LOGIN_BIOMETRIC', {
            method: 'BIOMETRIC',
            deviceId: deviceId,
            status: 'SUCCESS',
            timestamp: getLegacyManilaISO()
        }, 'Security', user.id);

        res.json({
            token,
            user: { id: user.id, phoneNumber: maskPII(user.phoneNumber), firstName: maskPII(user.firstName) }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Global Verify Token (For all apps) - Consolidate with the main authenticated /verify endpoint above
// The authenticated endpoint at line ~182 handles this securely with middleware.
// app.get('/verify', ... removed duplicate ...);


app.get('/health', (req, res) => res.json({ status: 'OK', service: 'auth-service', version: 'v3.2.0' }));

// User Search (Used for Send Money recipient lookup)
app.get('/user/find', async (req, res) => {
    const { email, phone } = req.query;

    if (!email && !phone) {
        return res.status(400).json({ error: 'Email or Phone is required' });
    }

    try {
        const where = email ? { email } : { phoneNumber: phone };
        // 1. Try local database first
        let user = await prisma.user.findUnique({
            where,
            select: {
                id: true,
                email: true,
                phoneNumber: true,
                firstName: true,
                lastName: true
            }
        });

        // 2. If not found, try to sync from budolID SSO
        if (!user) {
            const identifier = email || phone;
            const param = email ? `email=${email}` : `phone=${phone}`;
            console.log(`[User Find] User ${maskPII(identifier)} not found locally, checking budolID...`);
            const SSO_URL = process.env.SSO_SERVICE_URL || `http://${LOCAL_IP}:8000`;
            const axios = require('axios');

            try {
                const ssoRes = await axios.get(`${SSO_URL}/auth/user/find?${param}`);
                const ssoUser = ssoRes.data;

                if (ssoUser) {
                    console.log(`[User Find] Found user ${maskPII(identifier)} in budolID, syncing to local DB...`);

                    // Manual find and update/create to avoid upsert issues
                    const existingUser = await prisma.user.findUnique({ where: { id: ssoUser.id } });

                    if (existingUser) {
                        console.log(`[User Find] Updating existing local user ${ssoUser.id}`);
                        user = await prisma.user.update({
                            where: { id: ssoUser.id },
                            data: {
                                email: ssoUser.email,
                                phoneNumber: ssoUser.phoneNumber || existingUser.phoneNumber,
                                firstName: ssoUser.firstName,
                                lastName: ssoUser.lastName
                            },
                            select: {
                                id: true,
                                email: true,
                                phoneNumber: true,
                                firstName: true,
                                lastName: true
                            }
                        });
                    } else {
                        console.log(`[User Find] Creating new local user ${ssoUser.id}`);
                        user = await prisma.user.create({
                            data: {
                                id: ssoUser.id,
                                email: ssoUser.email,
                                phoneNumber: ssoUser.phoneNumber || `SYNC_${ssoUser.id.substring(0, 8)}`,
                                firstName: ssoUser.firstName,
                                lastName: ssoUser.lastName,
                                passwordHash: 'SSO_MANAGED',
                                wallet: {
                                    create: {
                                        balance: 0.0,
                                        currency: 'PHP'
                                    }
                                }
                            },
                            select: {
                                id: true,
                                email: true,
                                phoneNumber: true,
                                firstName: true,
                                lastName: true
                            }
                        });
                    }
                }
            } catch (ssoErr) {
                console.error(`[User Find] SSO Sync failed for ${identifier}:`, ssoErr.message);
            }
        }

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Final response PII Masking - Explicit object construction to ensure masking overrides
        const responseData = {
            id: user.id,
            email: maskPII(user.email),
            phoneNumber: maskPII(user.phoneNumber),
            firstName: maskPII(user.firstName),
            lastName: maskPII(user.lastName)
        };

        console.log(`[User Find] Returning masked data for ${maskPII(user.email)}`);
        res.json(responseData);
    } catch (error) {
        console.error('[User Find] Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Favorites Management
app.get('/favorites', authenticate, async (req, res) => {
    try {
        const favorites = await prisma.favoriteRecipient.findMany({
            where: { userId: req.user.id },
            include: {
                recipient: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phoneNumber: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        const maskedFavorites = favorites.map(f => ({
            ...f,
            recipient: f.recipient ? {
                ...f.recipient,
                email: maskPII(f.recipient.email),
                phoneNumber: maskPII(f.recipient.phoneNumber),
                firstName: maskPII(f.recipient.firstName),
                lastName: maskPII(f.recipient.lastName)
            } : null
        }));
        res.json(maskedFavorites);
    } catch (error) {
        console.error('[Favorites List Error]', error);
        res.status(500).json({ error: 'Failed to fetch favorites' });
    }
});

app.post('/favorites', authenticate, async (req, res) => {
    const { recipientId, alias } = req.body;

    if (!recipientId) return res.status(400).json({ error: 'Recipient ID is required' });

    try {
        const favorite = await prisma.favoriteRecipient.upsert({
            where: {
                userId_recipientId: {
                    userId: req.user.id,
                    recipientId: recipientId
                }
            },
            update: { alias },
            create: {
                userId: req.user.id,
                recipientId: recipientId,
                alias
            },
            include: {
                recipient: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phoneNumber: true
                    }
                }
            }
        });

        // Mask PII in response
        const maskedFavorite = {
            ...favorite,
            recipient: favorite.recipient ? {
                ...favorite.recipient,
                email: maskPII(favorite.recipient.email),
                phoneNumber: maskPII(favorite.recipient.phoneNumber),
                firstName: maskPII(favorite.recipient.firstName),
                lastName: maskPII(favorite.recipient.lastName)
            } : null
        };

        res.json({ message: 'Favorite updated successfully', favorite: maskedFavorite });
    } catch (error) {
        console.error('[Add Favorite Error]', error);
        res.status(500).json({ error: 'Failed to update favorite' });
    }
});

app.delete('/favorites/:recipientId', authenticate, async (req, res) => {
    const { recipientId } = req.params;

    try {
        await prisma.favoriteRecipient.delete({
            where: {
                userId_recipientId: {
                    userId: req.user.id,
                    recipientId: recipientId
                }
            }
        });
        res.json({ message: 'Favorite removed successfully' });
    } catch (error) {
        console.error('[Delete Favorite Error]', error);
        res.status(500).json({ error: 'Failed to remove favorite' });
    }
});

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`[budolPay-Auth] Service running on http://localhost:${PORT}`);
        // Keep alive for local development terminals
        setInterval(() => { }, 1000000);
    });
}

module.exports = { app, maskPII };

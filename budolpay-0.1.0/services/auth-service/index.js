const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const axios = require('axios');
const { prisma } = require('@budolpay/database');
const { sendAccountCreationSuccess, sendOTP, sendVerificationSuccess } = require('@budolpay/notifications');
const path = require('path');

/**
 * Date Utilities for Asia/Manila Standard
 * Ensures compliance with BSP Circular 808
 */
const getNowUTC = () => new Date();
const getLegacyManilaISO = () => new Date().toISOString();
const getLegacyManilaDate = () => new Date();
require('dotenv').config({ path: path.resolve(__dirname, '../../.env'), override: true });

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
        const response = await axios.post(`${GATEWAY_URL}/internal/notify`, {
            isAdmin: true,
            event,
            data
        });
        console.log(`[Auth] Admin notification (${event}) response:`, response.data);
    } catch (err) {
        console.error(`[Auth] Failed to notify Admin (${event}): ${err.message}`);
        if (err.response) {
            console.error(`[Auth] Error response:`, err.response.data);
        }
    }
};

// Helper to create forensic audit logs (PCI DSS 10.2.2 & BSP Circular 808 Aligned)
const createAuditLog = async (req, userId, action, metadata = {}, entity = 'Security', entityId = null) => {
    try {
        const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        const userAgent = req.headers['user-agent'];
        
        const log = await prisma.auditLog.create({
            data: {
                userId,
                action,
                entity,
                entityId: entityId || userId,
                ipAddress,
                userAgent,
                device: req.body.deviceId || 'UNKNOWN_DEVICE',
                metadata: {
                    ...metadata,
                    compliance: {
                        pci_dss: '10.2.2',
                        bsp: 'Circular 808'
                    },
                    timestamp: getLegacyManilaISO()
                }
            },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                }
            }
        });
        console.log(`[Audit] Logged action: ${action} for user: ${userId} (Entity: ${entity})`);
        
        // Notify Admin in Real-time (Provider Agnostic via Gateway)
        await notifyAdmin('AUDIT_LOG_CREATED', log);
    } catch (err) {
        console.error(`[Audit] Failed to create audit log: ${err.message}`);
    }
};

app.use(cors());
app.use(express.json());

// Vercel Support: Handle API prefix
const router = express.Router();
app.use('/api/auth', router);
app.use('/', router); // Fallback for direct calls

const JWT_SECRET = process.env.JWT_SECRET || 'GJ7Lxn0/kdV/KuZJ5xJ7Ip0RvMerrGW5n0gf44mfHgc=';
console.log(`[budolPay-Auth] Ecosystem JWT_SECRET Loaded`);

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

// Update Profile (Compliance Aligned)
app.patch('/profile', authenticate, async (req, res) => {
    const { firstName, lastName, email } = req.body;
    const userId = req.user.id;

    try {
        const user = await prisma.user.findUnique({ where: { id: userId } });

        // Compliance: Restricted fields for verified users
        if (user.kycTier === 'FULLY_VERIFIED') {
            if (firstName && firstName !== user.firstName) {
                return res.status(400).json({ error: 'Legal first name cannot be changed for verified accounts. Please contact support.' });
            }
            if (lastName && lastName !== user.lastName) {
                return res.status(400).json({ error: 'Legal last name cannot be changed for verified accounts. Please contact support.' });
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

// Register (Global User - GoTyme Aligned)
app.post('/register', async (req, res) => {
    const { email, password, phoneNumber, firstName, lastName, pin, deviceId } = req.body;
    
    // Validation
    if (!phoneNumber) return res.status(400).json({ error: 'Mobile number is required' });
    if (pin && (pin.length !== 6 || isNaN(pin))) {
        return res.status(400).json({ error: 'PIN must be exactly 6 digits' });
    }

    try {
        const passwordHash = password ? await bcrypt.hash(password, 10) : 'SOCIAL_OR_MOBILE_ONLY';
        const pinHash = pin ? await bcrypt.hash(pin, 10) : null;
        // LOCAL BYPASS: Use fixed OTP for local development
        const isLocal = process.env.LOCAL_IP || !process.env.VERCEL;
        const otpCode = isLocal ? '123456' : Math.floor(100000 + Math.random() * 900000).toString();
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
        try {
            const totalUsers = await prisma.user.count();
            await notifyAdmin('new_user', { 
                count: totalUsers,
                user: {
                    id: user.id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    createdAt: user.createdAt
                }
            });
        } catch (adminNotifyError) {
            console.error('[Admin Notification Error]', adminNotifyError);
        }

        // Notify user about successful account creation and send OTP
        try {
            if (user.email && !user.email.endsWith('@budolpay.local')) {
                await sendAccountCreationSuccess(user.email, user.firstName || 'User', 'EMAIL');
                await sendOTP(user.email, otpCode, 'EMAIL');
            }
            
            if (user.phoneNumber) {
                await sendAccountCreationSuccess(user.phoneNumber, user.firstName || 'User', 'SMS');
                await sendOTP(user.phoneNumber, otpCode, 'SMS');
                if (isLocal) {
                    console.log(`[LOCAL] OTP for ${user.phoneNumber}: ${otpCode}`);
                }
            }
        } catch (notifError) {
            console.error('[Registration Notification Error]', notifError);
        }

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

// Mobile Login - Phase 1: Identify & Challenge (GoTyme Style)
app.post('/login/mobile/identify', async (req, res) => {
    let { phoneNumber, deviceId } = req.body;
    
    if (!phoneNumber) return res.status(400).json({ error: 'Mobile number is required' });

    // Normalize Phone Number (BSP Circular 808/1108 Aligned)
    // Strip everything except digits
    let normalizedPhone = phoneNumber.replace(/\D/g, '');
    
    // Convert 639... to 09... for local DB consistency if needed
    if (normalizedPhone.startsWith('63')) {
        normalizedPhone = '0' + normalizedPhone.substring(2);
    }

    try {
        // Search with exact match first, then with normalized
        let user = await prisma.user.findFirst({
            where: {
                OR: [
                    { phoneNumber: phoneNumber },
                    { phoneNumber: normalizedPhone },
                    { phoneNumber: '+63' + normalizedPhone.substring(1) }
                ]
            }
        });
        
        if (!user) {
            // Audit: Mobile Identification Failure
            await createAuditLog(req, null, 'SECURITY_MOBILE_IDENTIFY_FAILED', {
                phoneNumber,
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
            // LOCAL BYPASS: Use fixed OTP for local development
            const isLocal = process.env.LOCAL_IP || !process.env.VERCEL;
            const otpCode = isLocal ? '123456' : Math.floor(100000 + Math.random() * 900000).toString();
            const otpExpiresAt = new Date(getNowUTC().getTime() + 10 * 60 * 1000);

            await prisma.user.update({
                where: { id: user.id },
                data: { otpCode, otpExpiresAt }
            });

            await sendOTP(user.phoneNumber, otpCode, 'SMS');

            if (isLocal) {
            console.log(`[LOCAL] OTP for ${user.phoneNumber}: ${otpCode}`);
        }

        return res.json({ 
            status: 'OTP_REQUIRED', 
            userId: user.id,
            user: {
                id: user.id,
                phoneNumber: user.phoneNumber,
                firstName: user.firstName,
                lastName: user.lastName
            },
            message: 'OTP sent to your registered mobile number'
        });
        }

        // Trusted Device -> Proceed to PIN or Biometrics
        res.json({ 
            status: 'AUTH_REQUIRED', 
            userId: user.id,
            user: {
                id: user.id,
                phoneNumber: user.phoneNumber,
                firstName: user.firstName,
                lastName: user.lastName
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
                phoneNumber: user.phoneNumber, 
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
                phoneNumber: user.phoneNumber,
                firstName: user.firstName,
                lastName: user.lastName
            }
        });
    } catch (error) {
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
                    phoneNumber: updatedUser.phoneNumber,
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
            user: { id: user.id, email: user.email, role: user.role } 
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

        res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
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
                name: user.email,
                displayName: `${user.firstName} ${user.lastName}`
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
            user: { id: user.id, phoneNumber: user.phoneNumber, firstName: user.firstName } 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Global Verify Token (For all apps)
app.get('/verify', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // --- UNIVERSAL PROPAGATION LOGIC ---
        // If the token is valid from budolID but user is missing in budolPay, create them.
        let user = null;
        if (decoded.email) {
            user = await prisma.user.findUnique({
                where: { email: decoded.email },
                include: { wallet: true }
            });
        } else if (decoded.userId || decoded.id || decoded.sub) {
            user = await prisma.user.findUnique({
                where: { id: decoded.userId || decoded.id || decoded.sub },
                include: { wallet: true }
            });
        }

        if (!user && decoded.email) {
            console.log(`[Universal Sync] Creating missing user in budolPay: ${decoded.email}`);
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
        // ----------------------------------

        res.json({ 
            valid: true, 
            user,
            decoded,
            ecosystem: 'budol' 
        });
    } catch (error) {
        console.error('[Verify Error]', error);
        res.status(401).json({ error: 'Invalid or expired ecosystem token' });
    }
});

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
            console.log(`[User Find] User ${identifier} not found locally, checking budolID...`);
            const SSO_URL = process.env.SSO_SERVICE_URL || `http://${LOCAL_IP}:8000`;
            const axios = require('axios');
            
            try {
                const ssoRes = await axios.get(`${SSO_URL}/auth/user/find?${param}`);
                const ssoUser = ssoRes.data;

                if (ssoUser) {
                    console.log(`[User Find] Found user ${identifier} in budolID, syncing to local DB...`);
                    
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

        res.json(user);
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
        res.json(favorites);
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
        res.json({ message: 'Favorite updated successfully', favorite });
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

app.listen(PORT, () => {
    console.log(`[budolPay-Auth] Service running on http://localhost:${PORT}`);
    // Keep alive for local development terminals
    setInterval(() => {}, 1000000);
});

module.exports = app;

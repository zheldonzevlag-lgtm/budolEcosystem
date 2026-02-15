const nodemailer = require('nodemailer');
const axios = require('axios');
const { prisma } = require('@budolpay/database');
require('dotenv').config();

/**
 * Shared Notification Package for BudolPay Ecosystem
 * Compliance: BSP Circular 808, PCI DSS 10.2.2, NPC Data Privacy Act
 * Provider-Agnostic Engine with Dynamic Settings Sync
 */

/**
 * Enhanced maskPII helper with type auto-detection for NPC compliance.
 * @param {string} str - The string to mask.
 * @param {string} type - The type of PII ('EMAIL', 'PHONE', 'NAME', or 'AUTO').
 * @returns {string} The masked string.
 */
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

// Simple in-memory cache to reduce DB hits
let settingsCache = null;
let lastFetch = 0;
const CACHE_TTL = 60000; // 1 minute

const getSystemSettings = async (forceRefresh = false) => {
    const now = Date.now();
    if (!forceRefresh && settingsCache && (now - lastFetch < CACHE_TTL)) {
        return settingsCache;
    }

    try {
        // Fetch all settings as key-value pairs
        const settingsList = await prisma.systemSetting.findMany({
            where: { isActive: true }
        });

        // Transform into a flat object
        const settings = settingsList.reduce((acc, curr) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {});

        if (Object.keys(settings).length === 0) {
            console.warn("[Notification] System settings not found or empty, using defaults.");
            return {
                emailProvider: "GOOGLE",
                smsProvider: "CONSOLE"
            };
        }

        settingsCache = settings;
        lastFetch = now;
        return settings;
    } catch (error) {
        console.error("[Notification] Failed to fetch system settings:", error);
        return { emailProvider: "GOOGLE", smsProvider: "CONSOLE" };
    }
};

const createTransporter = (settings) => {
    const provider = settings.emailProvider || 'GOOGLE';
    
    if (provider === 'BREVO') {
        return nodemailer.createTransport({
            host: 'smtp-relay.brevo.com',
            port: parseInt(settings.smtpPort) || 587,
            auth: {
                user: settings.smtpUser || process.env.BREVO_USER,
                pass: settings.brevoApiKey || settings.smtpPass || process.env.BREVO_PASS
            }
        });
    } else if (provider === 'GMASS') {
        return nodemailer.createTransport({
            host: 'smtp.gmass.co',
            port: parseInt(settings.smtpPort) || 587,
            auth: {
                user: settings.smtpUser || process.env.GMASS_USER,
                pass: settings.gmassApiKey || settings.smtpPass || process.env.GMASS_PASS
            }
        });
    } else {
        // Default to Google
        return nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: settings.smtpUser || process.env.EMAIL_USER,
                pass: settings.smtpPass || process.env.EMAIL_PASS
            }
        });
    }
};

const sendEmail = async (to, subject, text, html) => {
    try {
        const settings = await getSystemSettings();
        const transporter = createTransporter(settings);
        const from = settings.smtpFrom || process.env.EMAIL_USER || 'no-reply@budolpay.com';
        
        const info = await transporter.sendMail({
            from: `"budolPay" <${from}>`,
            to,
            subject,
            text,
            html
        });
        console.log(`[Notification] Email sent to ${maskPII(to)} via ${settings.emailProvider}: ${info.messageId}`);
        return true;
    } catch (err) {
        console.error(`[Notification] Email failed: ${err.message}`);
        return false;
    }
};

const sendSMS = async (to, message) => {
    try {
        const settings = await getSystemSettings();
        const provider = settings.smsProvider || 'CONSOLE';
        const phone = to.startsWith('0') ? '63' + to.substring(1) : to;

        console.log(`[Notification] Sending SMS to ${maskPII(to)} via ${provider}`);

        if (provider === 'ZERIX') {
            await axios.get(`https://api.zerixtext.com/api/v1/send`, {
                params: {
                    apiKey: settings.zerixApiKey,
                    number: phone,
                    message: message
                }
            });
        } else if (provider === 'ITEXTMO') {
            await axios.post(`https://www.itexmo.com/php_api/api.php`, {
                1: phone,
                2: message,
                3: settings.itextmoApiKey,
                passwd: settings.itextmoClientCode
            });
        } else if (provider === 'BREVO_SMS' || provider === 'BREVO') {
            await axios.post('https://api.brevo.com/v3/transactionalSMS/sms', {
                type: 'transactional',
                unicodeEnabled: true,
                sender: 'budolPay',
                recipient: phone,
                content: message
            }, {
                headers: { 'api-key': settings.brevoSmsApiKey || settings.brevoApiKey }
            });
        } else if (provider === 'VIBER') {
            await axios.post('https://chatapi.viber.com/pa/send_message', {
                receiver: phone,
                type: 'text',
                text: message,
                sender: { name: 'budolPay' }
            }, {
                headers: { 'X-Viber-Auth-Token': settings.viberApiKey }
            });
        } else {
            // Highlight 6-digit OTP in console log if present
            const highlightedMessage = message.replace(/(\d{6})/, '\x1b[33m$1\x1b[0m');
            console.log(`[CONSOLE SMS] To: ${maskPII(to)}, Message: ${highlightedMessage}`);
        }
        
        return true;
    } catch (err) {
        console.error(`[Notification] SMS failed: ${err.message}`);
        return false;
    }
};

const sendOTP = async (to, otp, type = 'EMAIL') => {
    const subject = 'Your budolPay Verification Code';
    const message = `Your verification code is: ${otp}. This code will expire in 10 minutes.`;
    
    console.log(`[Notification] sendOTP triggered for ${maskPII(to)} via ${type} (OTP: \x1b[33m${otp}\x1b[0m)`);

    if (type === 'EMAIL' || type === 'BOTH') {
        const emailTo = to.includes('@') ? to : null;
        if (emailTo) {
            await sendEmail(emailTo, subject, message, `<p>${message}</p>`);
        } else {
            console.warn(`[Notification] Skipping email delivery: Invalid address "${to}"`);
        }
    }
    if (type === 'SMS' || type === 'BOTH') {
        // Simple regex to check if it's a phone number (digits and optional +)
        const isPhone = /^[+0-9]+$/.test(to.replace(/\s/g, ''));
        if (isPhone) {
            await sendSMS(to, message);
        } else {
            console.warn(`[Notification] Skipping SMS delivery: "${to}" does not look like a phone number`);
        }
    }
};

const sendAccountCreationSuccess = async (to, firstName, type = 'BOTH') => {
    const subject = 'Welcome to budolPay!';
    const message = `Hi ${firstName}, your budolPay account has been successfully created. Welcome to the ecosystem!`;
    
    console.log(`[Notification] sendAccountCreationSuccess for ${maskPII(to)} (${maskPII(firstName, 'NAME')})`);

    if (type === 'EMAIL' || type === 'BOTH') {
        await sendEmail(to, subject, message, `<h1>Welcome!</h1><p>${message}</p>`);
    }
    if (type === 'SMS' || type === 'BOTH') {
        await sendSMS(to, message);
    }
};

const sendVerificationSuccess = async (to, firstName) => {
    const subject = 'Account Verified - budolPay';
    const message = `Hi ${firstName}, your account has been successfully verified. You can now use all BudolPay features.`;
    
    console.log(`[Notification] sendVerificationSuccess for ${maskPII(to)} (${maskPII(firstName, 'NAME')})`);
    
    await sendEmail(to, subject, message, `<p>${message}</p>`);
};

const sendKycSuccess = async (to, firstName, type = 'BOTH') => {
    const subject = 'KYC Verification Approved';
    const message = `Hi ${firstName}, your KYC documents have been reviewed and approved.`;
    
    console.log(`[Notification] sendKycSuccess for ${maskPII(to)} (${maskPII(firstName, 'NAME')})`);

    if (type === 'EMAIL' || type === 'BOTH') {
        await sendEmail(to, subject, message, `<p>${message}</p>`);
    }
    if (type === 'SMS' || type === 'BOTH') {
        await sendSMS(to, message);
    }
};

const sendNotification = async (to, subject, message, type = 'BOTH') => {
    console.log(`[Notification] sendNotification to ${maskPII(to)}`);
    if (type === 'EMAIL' || type === 'BOTH') {
        await sendEmail(to, subject, message, `<p>${message}</p>`);
    }
    if (type === 'SMS' || type === 'BOTH') {
        await sendSMS(to, message);
    }
};

module.exports = {
    sendOTP,
    sendEmail,
    sendSMS,
    sendNotification,
    sendAccountCreationSuccess,
    sendVerificationSuccess,
    sendKycSuccess
};

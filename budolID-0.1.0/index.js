require('dotenv').config();
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { triggerRealtimeEvent } = require('./utils/realtime');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { normalizePhilippinePhone, isValidE164Phone } = require('./utils/phoneNormalization');

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

const crypto = require('crypto');
const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL
        }
    }
});
const BUDOLPAY_DATABASE_URL = process.env.BUDOLPAY_DATABASE_URL;
if (!BUDOLPAY_DATABASE_URL) {
    console.error('FATAL: BUDOLPAY_DATABASE_URL environment variable is required');
    process.exit(1);
}
const budolPayPrisma = new PrismaClient({
    datasources: {
        db: {
            url: BUDOLPAY_DATABASE_URL
        }
    }
});

// Debug connection on startup
prisma.$connect()
    .then(async () => {
        console.log('✅ Connected to Database');

        // Auto-seed core apps if missing
        const localIP = process.env.LOCAL_IP || '192.168.1.2';
        const isProd = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
        
        const coreApps = [
            { 
                name: 'budolPay', 
                apiKey: process.env.BUDOLPAY_API_KEY || crypto.randomBytes(16).toString('hex'), 
                redirectUri: isProd ? 'https://budolpay.vercel.app/api/auth/callback' : `http://${localIP}:3000/api/auth/callback` 
            },
            { 
                name: 'budolShap', 
                apiKey: process.env.BUDOLSHAP_API_KEY || crypto.randomBytes(16).toString('hex'), 
                redirectUri: isProd ? 'https://budolshap-kappa.vercel.app/auth/callback' : `http://${localIP}:3001/auth/callback` 
            }
        ];

        for (const app of coreApps) {
            const existingApp = await prisma.ecosystemApp.findUnique({ where: { apiKey: app.apiKey } });
            
            if (!existingApp) {
                console.log(`[Seed] Creating core app: ${app.name}`);
                await prisma.ecosystemApp.create({
                    data: {
                        name: app.name,
                        apiKey: app.apiKey,
                        apiSecret: require('crypto').randomBytes(32).toString('hex'),
                        redirectUri: app.redirectUri
                    }
                });
            } else {
                // REPAIR LOGIC: If we are in production but the database has a local IP, fix it!
                const hasLocalIP = existingApp.redirectUri.includes('192.168.') || existingApp.redirectUri.includes('localhost');
                
                if (isProd && hasLocalIP) {
                    console.log(`[Seed] Repairing redirectUri for ${app.name} in production environment`);
                    await prisma.ecosystemApp.update({
                        where: { apiKey: app.apiKey },
                        data: { redirectUri: app.redirectUri }
                    });
                } else if (!isProd && !hasLocalIP) {
                    // Also repair if we are in dev but database has a prod URL (convenience for developers)
                    console.log(`[Seed] Updating redirectUri for ${app.name} to local environment`);
                    await prisma.ecosystemApp.update({
                        where: { apiKey: app.apiKey },
                        data: { redirectUri: app.redirectUri }
                    });
                }
            }
        }
        console.log('✅ Core Ecosystem Apps verified/seeded');

        return prisma.$queryRaw`SELECT current_schema()`;
    })
    .then(schema => {
        console.log('📊 Database Schema:', schema);
    })
    .catch(err => {
        console.error('❌ Database Connection Error:', err.message);
        console.error('🔗 URL used:', process.env.DATABASE_URL ? process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@') : 'undefined');
    });
const app = express();
const PORT = process.env.PORT || 8000;

// Security headers
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
}));

// Rate Limiting
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { error: 'Too many login attempts. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});
if (!process.env.JWT_SECRET) {
    console.error('FATAL: JWT_SECRET environment variable is required');
    process.exit(1);
}
const JWT_SECRET = process.env.JWT_SECRET;

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

const buildPhoneCandidates = (phone) => {
    const normalizedPhone = normalizePhilippinePhone(phone);
    if (!normalizedPhone) {
        return null;
    }

    const normalizedDigits = normalizedPhone.replace(/\D/g, '');
    const localNumber = `0${normalizedDigits.slice(-10)}`;
    const localNoZero = normalizedDigits.slice(-10);

    const exactCandidates = Array.from(new Set([
        normalizedPhone,
        normalizedDigits,
        localNumber,
        localNoZero
    ]));

    const digitCandidates = Array.from(new Set([
        normalizedDigits,
        localNumber,
        localNoZero
    ]));

    return {
        normalizedPhone,
        exactCandidates,
        digitCandidates
    };
};

const findPhoneInSchemas = async (client, schemas, phoneCandidates) => {
    for (const schema of schemas) {
        try {
            const results = await client.$queryRawUnsafe(
                `SELECT id, "phoneNumber", email, "firstName", "lastName"
                 FROM "${schema}"."User"
                 WHERE "phoneNumber" = ANY($1::text[])
                    OR regexp_replace(coalesce("phoneNumber", ''), '[^0-9]', '', 'g') = ANY($2::text[])
                 LIMIT 1`,
                phoneCandidates.exactCandidates,
                phoneCandidates.digitCandidates
            );
            if (Array.isArray(results) && results.length > 0) {
                return {
                    user: results[0],
                    schema
                };
            }
        } catch (error) {
            console.warn(`[budolID] Skipping schema "${schema}" due to error:`, error.message);
        }
    }
    return {
        user: null,
        schema: null
    };
};

const isPhoneExistingInBudolPay = async (phoneCandidates) => {
    try {
        const found = await findPhoneInSchemas(budolPayPrisma, ['public', 'budolpay'], phoneCandidates);
        return found.user;
    } catch (error) {
        console.warn('[budolID] budolPay phone check skipped:', error.message);
        return null;
    }
};

const syncUserToBudolPay = async ({ id, email, passwordHash, phoneNumber, firstName, lastName }) => {
    const phoneCandidates = buildPhoneCandidates(phoneNumber);
    if (!phoneCandidates) {
        throw new Error('Cannot sync invalid phone number to budolPay');
    }

    const existingUser = await budolPayPrisma.user.findFirst({
        where: {
            OR: [
                { id },
                { email },
                ...phoneCandidates.exactCandidates.map((candidate) => ({ phoneNumber: candidate }))
            ]
        }
    });

    const syncData = {
        email,
        passwordHash,
        phoneNumber: phoneCandidates.normalizedPhone,
        firstName,
        lastName
    };

    if (existingUser) {
        await budolPayPrisma.user.update({
            where: { id: existingUser.id },
            data: syncData
        });
        return existingUser.id;
    }

    const created = await budolPayPrisma.user.create({
        data: {
            id,
            ...syncData
        }
    });

    return created.id;
};

app.use(cors());
app.use(express.json());

if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
    app.listen(PORT, '0.0.0.0', () => {
        const localIP = process.env.LOCAL_IP || '192.168.1.2';
        console.log(`budolID SSO Service running on http://0.0.0.0:${PORT}`);
        console.log(`Local LAN access at http://${localIP}:${PORT}`);
    });
}

// Request logger
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
    next();
});

// Health check endpoint
app.get('/', (req, res) => {
    res.status(200).json({ status: 'ok', service: 'budolID SSO', endpoints: ['/api/health', '/login', '/register'] });
});

app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'UP', service: 'budolID', timestamp: new Date().toISOString() });
});

// 0. Serve Login Page
app.get('/login', (req, res) => {
    const { apiKey, redirect_uri, error, email, password } = req.query;
    console.log(`[GET /login] apiKey: ${apiKey}, error: ${error}, email: ${email}`);
    const activeApiKey = apiKey || process.env.BUDOLPAY_API_KEY || 'bp_b31ea1888dcb2ba76fdbb776ea8f5b7a';
    const activeRedirectUri = redirect_uri || '';
    const preservedEmail = email || '';
    const preservedPassword = password || '';

    const errorBanner = error ? `
        <div class="login-alert" role="alert" aria-live="polite">
            <div class="login-alert-icon" aria-hidden="true">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 9v4"></path>
                    <path d="M12 17h.01"></path>
                    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"></path>
                </svg>
            </div>
            <div>
                <strong>Invalid credentials.</strong>
                <span>Check your email and password, then try again.</span>
            </div>
        </div>
    ` : '';

    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>budolID Login</title>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
            <style>
                :root {
                    color-scheme: light;
                    --page-bg-start: #020617;
                    --page-bg-end: #0f172a;
                    --card-bg: rgba(255, 255, 255, 0.96);
                    --card-border: rgba(148, 163, 184, 0.18);
                    --muted: #64748b;
                    --text: #0f172a;
                    --primary: #2563eb;
                    --primary-dark: #1d4ed8;
                    --primary-soft: rgba(37, 99, 235, 0.12);
                    --surface: #f8fafc;
                    --field-border: #cbd5e1;
                    --field-focus: rgba(37, 99, 235, 0.2);
                    --danger-bg: #fff1f2;
                    --danger-border: #fecdd3;
                    --danger-text: #be123c;
                }

                * {
                    box-sizing: border-box;
                }

                body {
                    margin: 0;
                    min-height: 100vh;
                    font-family: 'Inter', Arial, sans-serif;
                    color: var(--text);
                    background:
                        radial-gradient(circle at top, rgba(37, 99, 235, 0.18), transparent 34%),
                        linear-gradient(180deg, var(--page-bg-start) 0%, var(--page-bg-end) 100%);
                }

                .login-page {
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 16px;
                }

                .login-shell {
                    width: 100%;
                    max-width: 400px;
                    background: var(--card-bg);
                    border: 1px solid var(--card-border);
                    border-radius: 24px;
                    box-shadow: 0 30px 60px rgba(15, 23, 42, 0.38);
                    overflow: hidden;
                    backdrop-filter: blur(12px);
                }

                .login-body {
                    padding: 24px 20px 20px;
                }

                .brand-badge {
                    width: 60px;
                    height: 60px;
                    margin: 0 auto 14px;
                    border-radius: 999px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: linear-gradient(135deg, rgba(37, 99, 235, 0.16), rgba(14, 165, 233, 0.16));
                    color: var(--primary);
                    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.9);
                }

                .brand-title {
                    margin: 0;
                    text-align: center;
                    font-size: 1.75rem;
                    line-height: 1.1;
                    font-weight: 900;
                    letter-spacing: -0.04em;
                }

                .brand-title span {
                    color: var(--primary);
                }

                .brand-copy {
                    margin: 8px 0 0;
                    text-align: center;
                    color: var(--muted);
                    font-size: 0.875rem;
                    line-height: 1.5;
                }

                .login-alert {
                    display: flex;
                    gap: 10px;
                    align-items: flex-start;
                    padding: 12px 14px;
                    margin: 18px 0 18px;
                    border-radius: 14px;
                    border: 1px solid var(--danger-border);
                    background: var(--danger-bg);
                    color: var(--danger-text);
                }

                .login-alert-icon {
                    width: 30px;
                    height: 30px;
                    border-radius: 999px;
                    flex: 0 0 auto;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: rgba(244, 63, 94, 0.12);
                }

                .login-alert strong,
                .login-alert span {
                    display: block;
                }

                .login-alert strong {
                    font-size: 0.875rem;
                    margin-bottom: 2px;
                }

                .login-alert span {
                    font-size: 0.75rem;
                    line-height: 1.5;
                }

                .login-form {
                    margin-top: 20px;
                }

                .field-group + .field-group,
                .login-submit {
                    margin-top: 14px;
                }

                .field-label {
                    display: block;
                    margin-bottom: 6px;
                    color: var(--muted);
                    font-size: 0.6875rem;
                    font-weight: 800;
                    letter-spacing: 0.12em;
                    text-transform: uppercase;
                }

                .field-input {
                    width: 100%;
                    padding: 12px 14px;
                    border-radius: 14px;
                    border: 1px solid var(--field-border);
                    background: #ffffff;
                    color: var(--text);
                    font: inherit;
                    transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
                }

                .field-input::placeholder {
                    color: #94a3b8;
                }

                .field-input:focus {
                    outline: none;
                    border-color: var(--primary);
                    box-shadow: 0 0 0 4px var(--field-focus);
                    transform: translateY(-1px);
                }

                .login-submit {
                    width: 100%;
                    border: 0;
                    border-radius: 16px;
                    padding: 13px 16px;
                    background: linear-gradient(135deg, var(--primary) 0%, #3b82f6 100%);
                    color: #ffffff;
                    font: inherit;
                    font-weight: 800;
                    font-size: 0.9375rem;
                    cursor: pointer;
                    box-shadow: 0 18px 30px rgba(37, 99, 235, 0.28);
                    transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
                }

                .login-submit:hover {
                    background: linear-gradient(135deg, var(--primary-dark) 0%, #2563eb 100%);
                    transform: translateY(-1px);
                    box-shadow: 0 20px 34px rgba(37, 99, 235, 0.34);
                }

                .login-submit:focus {
                    outline: none;
                    box-shadow: 0 0 0 4px var(--field-focus), 0 18px 30px rgba(37, 99, 235, 0.28);
                }

                .login-footer {
                    margin-top: 22px;
                    padding-top: 18px;
                    border-top: 1px solid rgba(226, 232, 240, 0.9);
                    text-align: center;
                }

                .support-link,
                .signup-link {
                    color: var(--primary);
                    text-decoration: none;
                    font-weight: 700;
                }

                .support-link:hover,
                .signup-link:hover {
                    text-decoration: underline;
                }

                .support-link {
                    display: inline-block;
                    margin-bottom: 10px;
                    font-size: 0.875rem;
                }

                .support-copy {
                    margin: 0;
                    color: #94a3b8;
                    font-size: 0.75rem;
                    line-height: 1.5;
                }

                .shield-footer {
                    padding: 14px 20px 16px;
                    text-align: center;
                    background: var(--surface);
                    border-top: 1px solid rgba(226, 232, 240, 0.9);
                    color: #94a3b8;
                    font-size: 0.7rem;
                    font-weight: 800;
                    letter-spacing: 0.18em;
                    text-transform: uppercase;
                }

                .shield-footer span {
                    color: var(--primary);
                }

                @media (max-width: 480px) {
                    .login-page {
                        padding: 12px;
                    }

                    .login-body {
                        padding: 20px 16px 18px;
                    }

                    .brand-title {
                        font-size: 1.5rem;
                    }
                }
            </style>
        </head>
        <body>
            <main class="login-page">
                <section class="login-shell">
                    <div class="login-body">
                        <div class="brand-badge" aria-hidden="true">
                            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg>
                        </div>

                        <h1 class="brand-title">budol<span>ID</span></h1>
                        <p class="brand-copy">The secure universal identity for the ecosystem.</p>

                        ${errorBanner}

                        <form action="/auth/sso/login-form" method="POST" class="login-form">
                            <input type="hidden" name="apiKey" value="${escapeHtml(activeApiKey)}" />
                            <input type="hidden" name="redirect_uri" value="${escapeHtml(activeRedirectUri)}" />

                            <div class="field-group">
                                <label class="field-label" for="emailInput">Email Address</label>
                                <input 
                                    id="emailInput"
                                    type="email" 
                                    name="email"
                                    value="${escapeHtml(preservedEmail)}"
                                    required
                                    autocomplete="email"
                                    class="field-input"
                                    placeholder="juan@budolpay.com"
                                />
                            </div>

                            <div class="field-group">
                                <label class="field-label" for="passwordInput">Password</label>
                                <input 
                                    type="password" 
                                    name="password"
                                    id="passwordInput"
                                    value="${escapeHtml(preservedPassword)}"
                                    required
                                    autocomplete="current-password"
                                    class="field-input"
                                    placeholder="••••••••"
                                />
                            </div>

                            <button 
                                type="submit" 
                                class="login-submit"
                            >
                                Sign In
                            </button>
                        </form>
                    </div>

                    <div class="login-footer">
                        <a href="/forgot-password?apiKey=${escapeHtml(activeApiKey)}" class="support-link">Forgot your password?</a>
                        <p class="support-copy">
                            Don't have an account?
                            <a href="/register?apiKey=${escapeHtml(activeApiKey)}" class="signup-link">Create Account</a>
                        </p>
                    </div>

                    <div class="shield-footer">
                        Protected by budol<span>Shield</span>
                    </div>
                </section>
            </main>
        </body>
        </html>
    `);
});

// 0.1 Serve Register Page
app.get('/register', (req, res) => {
    const { apiKey } = req.query;
    const isBudolPay = apiKey === (process.env.BUDOLPAY_API_KEY || 'bp_b31ea1888dcb2ba76fdbb776ea8f5b7a');
    const primaryColor = isBudolPay ? 'rose' : 'blue';
    const brandName = isBudolPay ? 'Pay' : 'ID';
    const activeApiKey = apiKey || process.env.BUDOLPAY_API_KEY || 'bp_b31ea1888dcb2ba76fdbb776ea8f5b7a';

    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Create Account - budol${brandName}</title>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
            <style>
                :root {
                    --primary: ${primaryColor === 'rose' ? '#e11d48' : '#2563eb'};
                    --primary-dark: ${primaryColor === 'rose' ? '#be123c' : '#1d4ed8'};
                    --primary-soft: ${primaryColor === 'rose' ? 'rgba(225, 29, 72, 0.14)' : 'rgba(37, 99, 235, 0.14)'};
                    --ring: ${primaryColor === 'rose' ? 'rgba(225, 29, 72, 0.2)' : 'rgba(37, 99, 235, 0.2)'};
                }

                * { box-sizing: border-box; }

                body {
                    margin: 0;
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 16px;
                    font-family: 'Inter', Arial, sans-serif;
                    color: #0f172a;
                    background:
                        radial-gradient(circle at top, var(--primary-soft), transparent 34%),
                        linear-gradient(180deg, #020617 0%, #0f172a 100%);
                }

                body > div {
                    width: 100%;
                    max-width: 420px;
                    background: rgba(255, 255, 255, 0.97);
                    border: 1px solid rgba(148, 163, 184, 0.18);
                    border-radius: 24px;
                    box-shadow: 0 30px 60px rgba(15, 23, 42, 0.38);
                    overflow: hidden;
                }

                body > div > div:first-child {
                    padding: 24px 20px 20px;
                }

                body > div > div:last-child {
                    padding: 14px 20px 16px;
                    text-align: center;
                    background: #f8fafc;
                    border-top: 1px solid #e2e8f0;
                    color: #94a3b8;
                    font-size: 0.7rem;
                    font-weight: 800;
                    letter-spacing: 0.18em;
                    text-transform: uppercase;
                }

                body > div > div:last-child span {
                    color: var(--primary);
                }

                body > div > div:first-child > div:first-child {
                    display: flex;
                    justify-content: center;
                    margin-bottom: 16px;
                }

                body > div > div:first-child > div:first-child > div {
                    width: 64px;
                    height: 64px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 999px;
                    background: linear-gradient(135deg, var(--primary-soft), rgba(14, 165, 233, 0.08));
                    border: 1px solid rgba(148, 163, 184, 0.16);
                    color: var(--primary);
                    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.9);
                }

                h1 {
                    margin: 0;
                    text-align: center;
                    font-size: 1.75rem;
                    line-height: 1.1;
                    font-weight: 900;
                    letter-spacing: -0.04em;
                    color: #0f172a;
                }

                h1 span {
                    color: var(--primary);
                }

                body > div > div:first-child > p {
                    margin: 8px 0 0;
                    text-align: center;
                    color: #64748b;
                    font-size: 0.875rem;
                    line-height: 1.5;
                }

                #captcha-container > div {
                    margin-top: 20px;
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 20px;
                    padding: 16px;
                    max-width: 320px;
                    margin-left: auto;
                    margin-right: auto;
                }

                #captcha-container > div > div:first-child {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin-bottom: 12px;
                }

                #captcha-container > div > div:first-child > div {
                    width: 36px;
                    height: 36px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 10px;
                    color: var(--primary);
                }

                #captcha-container h3 {
                    margin: 0;
                    font-size: 0.875rem;
                    letter-spacing: 0.02em;
                    text-transform: uppercase;
                    color: #0a58d4ff;
                }

                #captcha-container > div > p:first-of-type {
                    margin: 0 0 12px;
                    font-size: 0.6875rem;
                    font-weight: 600;
                    letter-spacing: 0.12em;
                    text-transform: uppercase;
                    color: #64748b;
                }

                #captcha-container .space-y-4 > * + * {
                    margin-top: 12px;
                }

                #captcha-container .space-y-4 > div:first-child {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                    background: #ffffff;
                    padding: 6px 10px;
                    border-radius: 10px;
                    border: 1px solid #e2e8f0;
                    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.95);
                    color: #1349c5ff;
                    font-size: 1.375rem;
                    font-weight: 700;
                }

                #captcha-input {
                    width: 18px;
                    padding: 5px 6px;
                    border-radius: 8px;
                    border: 1px solid #cbd5e1;
                    background: #f8fafc;
                    text-align: center;
                    font: inherit;
                    color: #1349c5ff;
                    font-size: 1rem;
                }

                #registerForm {
                    margin-top: 16px;
                }

                #registerForm > * + *,
                #captcha-container + #registerForm > * + * {
                    margin-top: 12px;
                }

                .grid.grid-cols-2 {
                    display: grid;
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                    gap: 12px;
                }

                #registerForm label,
                #captcha-container label {
                    display: block;
                    margin-bottom: 6px;
                    color: #64748b;
                    font-size: 0.6875rem;
                    font-weight: 800;
                    letter-spacing: 0.12em;
                    text-transform: uppercase;
                }

                #registerForm input[type="text"],
                #registerForm input[type="email"],
                #registerForm input[type="tel"],
                #registerForm input[type="password"],
                #registerForm input[type="number"],
                #captcha-input {
                    width: 100%;
                    padding: 11px 14px;
                    border-radius: 14px;
                    border: 1px solid #cbd5e1;
                    background: #ffffff;
                    color: #0f172a;
                    font: inherit;
                    transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
                }

                #registerForm input[type="password"] {
                    padding-right: 42px;
                }

                #registerForm input::placeholder,
                #captcha-input::placeholder {
                    color: #94a3b8ff;
                }

                #registerForm input:focus,
                #captcha-input:focus {
                    outline: none;
                    border-color: var(--primary);
                    box-shadow: 0 0 0 3px var(--ring);
                    transform: translateY(-1px);
                }

                #registerForm .relative {
                    position: relative;
                }

                #registerForm button[onclick^="togglePassword"] {
                    position: absolute;
                    right: 10px;
                    top: 50%;
                    transform: translateY(-50%);
                    border: 0;
                    padding: 5px;
                    border-radius: 10px;
                    background: transparent;
                    color: #94a3b8;
                    cursor: pointer;
                }

                #emailSpinner,
                #emailStatus,
                #phoneSpinner,
                #phoneStatus,
                #confirmPasswordSpinner,
                #confirmPasswordStatus {
                    position: absolute;
                    top: 50%;
                    transform: translateY(-50%);
                    right: 10px;
                }

                #confirmPasswordSpinner,
                #confirmPasswordStatus {
                    right: 38px;
                }

                #verify-captcha-btn,
                #submitBtn {
                    width: 100%;
                    border: 0;
                    border-radius: 16px;
                    padding: 12px 16px;
                    background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
                    color: #ffffff;
                    font: inherit;
                    font-weight: 700;
                    cursor: pointer;
                    box-shadow: 0 18px 30px color-mix(in srgb, var(--primary) 28%, transparent);
                    transition: transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease;
                }

                #verify-captcha-btn {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                }

                #verify-captcha-btn svg {
                    width: 18px;
                    height: 18px;
                    flex: 0 0 18px;
                }

                #verify-captcha-btn:hover,
                #submitBtn:hover {
                    transform: translateY(-1px);
                    filter: brightness(0.98);
                }

                #submitBtn:disabled {
                    opacity: 0.55;
                    cursor: not-allowed;
                    box-shadow: none;
                }

                #captcha-error,
                #emailError,
                #phoneError,
                #confirmPasswordError {
                    margin-top: 6px;
                    font-size: 0.6875rem;
                    font-weight: 700;
                    color: #dc2626;
                }

                .flex.items-start.gap-3.py-2 {
                    display: flex;
                    align-items: flex-start;
                    gap: 10px;
                    padding: 6px 0;
                }

                #terms {
                    width: 16px;
                    height: 16px;
                    margin-top: 3px;
                    accent-color: var(--primary);
                }

                label[for="terms"] {
                    margin: 0;
                    font-size: 0.6875rem;
                    line-height: 1.5;
                    text-transform: none;
                    letter-spacing: 0;
                    font-weight: 500;
                    color: #64748b;
                }

                #message {
                    margin-top: 12px;
                    text-align: center;
                    font-size: 0.875rem;
                    font-weight: 600;
                }

                #message + div {
                    margin-top: 20px;
                    padding-top: 18px;
                    border-top: 1px solid #e2e8f0;
                    text-align: center;
                }

                #message + div p {
                    margin: 0;
                    color: #64748b;
                    font-size: 0.875rem;
                }

                a {
                    color: var(--primary);
                    text-decoration: none;
                    font-weight: 700;
                }

                a:hover {
                    text-decoration: underline;
                }

                .spinner {
                    animation: spin 1s linear infinite;
                    border: 2px solid #e2e8f0;
                    border-top: 2px solid #ef4444;
                    border-radius: 50%;
                    width: 18px;
                    height: 18px;
                }

                .spinner-valid { border-top-color: #10b981 !important; }

                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                .input-valid { border-color: #10b981 !important; }
                .input-invalid { border-color: #ef4444 !important; }
                .border-red-500 { border-color: #ef4444 !important; }
                .bg-red-50 { background: #fef2f2 !important; }
                .text-red-500 { color: #ef4444 !important; }
                .text-green-500 { color: #22c55e !important; }
                .text-red-600 { color: #dc2626 !important; }
                .text-green-600 { color: #16a34a !important; }
                .font-semibold { font-weight: 600 !important; }
                .hidden { display: none !important; }

                @media (max-width: 480px) {
                    body { padding: 12px; }
                    body > div > div:first-child { padding: 20px 16px 18px; }
                    .grid.grid-cols-2 { grid-template-columns: 1fr; }
                    #captcha-container .space-y-4 > div:first-child {
                        gap: 10px;
                        font-size: 1rem;
                    }
                }
            </style>
        </head>
        <body class="min-h-screen bg-slate-700 flex items-center justify-center p-4">
            <div>
                <div>
                    <div class="flex justify-center mb-4">
                        <div>
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                        </div>
                    </div>
                    
                    <h1 class="font-family-poppins">
                        <span class="color-primary">budol</span>${brandName}
                    </h1>
                    <p>
                        Create your universal ecosystem account.
                    </p>

                    <div id="captcha-container">
                        <div>
                            <div>
                                <div>
                                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                                <h3>Security Gatekeeper</h3>
                            </div>
                            
                            <p>Shield Challenge: Solve to proceed</p>
                            
                            <div class="space-y-4">
                                <div>
                                    <span id="captcha-n1">0</span>
                                    <span id="captcha-op" class="text-slate-300">+</span>
                                    <span id="captcha-n2">0</span>
                                    <span class="text-slate-300">=</span>
                                    <input
                                        type="number"
                                        id="captcha-input"
                                        placeholder="?"
                                        required
                                    />
                                </div>
                                
                                <p id="captcha-error" class="hidden">Verification failed. Try again.</p>
                                
                                <button
                                    type="button"
                                    id="verify-captcha-btn"
                                >
                                    <span>Verify Challenge</span>
                                    <svg width="18" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </div>

                        </div>
                    </div>

                    <form id="registerForm" class="hidden">
                        <input type="hidden" name="apiKey" value="${escapeHtml(activeApiKey)}" />
                        
                        <div class="grid grid-cols-2">
                            <div>
                                <label>First Name</label>
                                <input type="text" id="firstName" required placeholder="Juan">
                            </div>
                            <div>
                                <label>Last Name</label>
                                <input type="text" id="lastName" required placeholder="Dela Cruz">
                            </div>
                        </div>

                        <div>
                            <label>Email Address</label>
                            <div class="relative">
                                <input type="email" id="email" required placeholder="jon@budolpay.com">
                                <div id="emailSpinner" class="hidden">
                                    <div class="spinner"></div>
                                </div>
                                <div id="emailStatus" class="hidden">
                                    <svg class="w-5 h-5 text-green-500 hidden" id="emailValidIcon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                                    <svg class="w-5 h-5 text-red-500 hidden" id="emailInvalidIcon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                </div>
                            </div>
                            <p id="emailError" class="hidden"></p>
                        </div>

                        <div>
                            <label>Phone Number</label>
                            <div class="relative">
                                <input type="tel" id="phoneNumber" required placeholder="09123456789">
                                <div id="phoneSpinner" class="hidden">
                                    <div class="spinner"></div>
                                </div>
                                <div id="phoneStatus" class="hidden">
                                    <svg class="w-5 h-5 text-green-500 hidden" id="phoneValidIcon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                                    <svg class="w-5 h-5 text-red-500 hidden" id="phoneInvalidIcon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                </div>
                            </div>
                            <p id="phoneError" class="hidden"></p>
                        </div>

                        <div>
                            <label>Password</label>
                            <div class="relative">
                                <input 
                                    type="password" 
                                    id="password" 
                                    required 
                                    placeholder="••••••••"
                                >
                                <button type="button" onclick="togglePassword('password', this)">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="eye-icon"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="eye-off-icon hidden"><path d="M9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" y1="2" x2="22" y2="22"/></svg>
                                </button>
                            </div>
                        </div>

                        <div>
                            <label>Confirm Password</label>
                            <div class="relative">
                                <input 
                                    type="password" 
                                    id="confirmPassword" 
                                    required 
                                    placeholder="••••••••"
                                >
                                <button type="button" onclick="togglePassword('confirmPassword', this)">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="eye-icon"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="eye-off-icon hidden"><path d="M9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" y1="2" x2="22" y2="22"/></svg>
                                </button>
                                <div id="confirmPasswordSpinner" class="hidden">
                                    <div class="spinner"></div>
                                </div>
                                <div id="confirmPasswordStatus" class="hidden">
                                    <svg class="w-5 h-5 text-green-500 hidden" id="confirmPasswordValidIcon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                                    <svg class="w-5 h-5 text-red-500 hidden" id="confirmPasswordInvalidIcon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                </div>
                            </div>
                            <p id="confirmPasswordError" class="hidden"></p>
                        </div>

                        <div class="flex items-start gap-3 py-2">
                            <input type="checkbox" id="terms" required>
                            <label for="terms">
                                I agree to the <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>. I understand my data is protected under the <span>Philippine Data Privacy Act of 2012</span>.
                            </label>
                        </div>

                        <button type="submit" id="submitBtn">
                            Create Account
                        </button>
                    </form>

                    <div id="message" class="hidden"></div>

                    <div>
                        <p>
                            Already have an account? 
                            <a href="/login?apiKey=${escapeHtml(activeApiKey)}">Sign In</a>
                        </p>
                    </div>
                </div>
                <div>
                    <p>
                        Protected by budol<span>Shield</span>
                    </p>
                </div>
            </div>

            <script>
                document.addEventListener('DOMContentLoaded', () => {
                    console.log('BudolID Registration Script Initialized');
                    
                    // --- CAPTCHA Logic (Server-Side) ---
                    const captchaContainer = document.getElementById('captcha-container');
                    const registerForm = document.getElementById('registerForm');
                    const captchaN1 = document.getElementById('captcha-n1');
                    const captchaN2 = document.getElementById('captcha-n2');
                    const captchaOp = document.getElementById('captcha-op');
                    const captchaInput = document.getElementById('captcha-input');
                    const verifyBtn = document.getElementById('verify-captcha-btn');
                    const captchaError = document.getElementById('captcha-error');

                    let currentCaptchaToken = '';

                    async function generateChallenge() {
                        try {
                            const res = await fetch('/auth/captcha/generate');
                            const data = await res.json();
                            currentCaptchaToken = data.token;
                            captchaN1.textContent = data.n1;
                            captchaN2.textContent = data.n2;
                            captchaOp.textContent = data.op;
                            captchaInput.value = '';
                            captchaError.classList.add('hidden');
                            captchaInput.classList.remove('border-red-500', 'bg-red-50');
                        } catch (err) {
                            console.error('Failed to load CAPTCHA:', err);
                        }
                    }

                    verifyBtn.addEventListener('click', async () => {
                        try {
                            const res = await fetch('/auth/captcha/verify', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ token: currentCaptchaToken, answer: parseInt(captchaInput.value) })
                            });
                            const data = await res.json();
                            if (data.valid) {
                                captchaContainer.classList.add('hidden');
                                registerForm.classList.remove('hidden');
                                // Store verified token in hidden field
                                let tokenInput = document.getElementById('captchaVerifiedToken');
                                if (!tokenInput) {
                                    tokenInput = document.createElement('input');
                                    tokenInput.type = 'hidden';
                                    tokenInput.name = 'captchaToken';
                                    tokenInput.id = 'captchaVerifiedToken';
                                    document.getElementById('registerForm').appendChild(tokenInput);
                                }
                                tokenInput.value = data.verifiedToken;
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            } else {
                                captchaError.textContent = data.error || 'Verification failed. Try again.';
                                captchaError.classList.remove('hidden');
                                captchaInput.classList.add('border-red-500', 'bg-red-50');
                                setTimeout(() => { generateChallenge(); }, 1000);
                            }
                        } catch (err) {
                            captchaError.textContent = 'Network error. Try again.';
                            captchaError.classList.remove('hidden');
                        }
                    });

                    generateChallenge();
                    // ---------------------

                    const activeApiKey = "${activeApiKey}";
                    const emailInput = document.getElementById('email');
                    const phoneInput = document.getElementById('phoneNumber');
                    const passwordInput = document.getElementById('password');
                    const confirmPasswordInput = document.getElementById('confirmPassword');
                    const termsCheckbox = document.getElementById('terms');
                    const submitBtn = document.getElementById('submitBtn');
                    
                    let isEmailValid = false;
                    let isPhoneValid = false;
                    let isConfirmPasswordValid = false;

                    function updateSubmitBtn() {
                        submitBtn.disabled = !(isEmailValid && isPhoneValid && isConfirmPasswordValid && termsCheckbox.checked);
                    }

                    // Debounce helper
                    function debounce(func, wait) {
                        let timeout;
                        return function executedFunction(...args) {
                            const later = () => {
                                clearTimeout(timeout);
                                func(...args);
                            };
                            clearTimeout(timeout);
                            timeout = setTimeout(later, wait);
                        };
                    }

                    // Email Validation
                    const validateEmail = debounce(async (email) => {
                        const emailError = document.getElementById('emailError');
                        const spinner = document.getElementById('emailSpinner');
                        const spinnerEl = spinner.querySelector('.spinner');
                        const status = document.getElementById('emailStatus');
                        const validIcon = document.getElementById('emailValidIcon');
                        const invalidIcon = document.getElementById('emailInvalidIcon');

                        spinnerEl.classList.remove('spinner-valid');

                        if (!email) {
                            emailInput.classList.remove('input-valid', 'input-invalid');
                            emailError.classList.add('hidden');
                            status.classList.add('hidden');
                            spinner.classList.add('hidden');
                            isEmailValid = false;
                            updateSubmitBtn();
                            return;
                        }

                        // 1. Format Check (escaped for Node.js backticks)
                        const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
                        if (!emailRegex.test(email)) {
                            spinner.classList.add('hidden');
                            emailInput.classList.add('input-invalid');
                            emailInput.classList.remove('input-valid');
                            emailError.textContent = 'Invalid email format';
                            emailError.classList.remove('hidden');
                            status.classList.remove('hidden');
                            validIcon.classList.add('hidden');
                            invalidIcon.classList.remove('hidden');
                            isEmailValid = false;
                            updateSubmitBtn();
                            return;
                        }

                        // 2. Availability Check
                        spinner.classList.remove('hidden');
                        status.classList.add('hidden');
                        emailError.classList.add('hidden');

                        try {
                            const res = await fetch('/auth/check-email?email=' + encodeURIComponent(email));
                            const data = await res.json();
                            if (data.exists) {
                                spinner.classList.add('hidden');
                                status.classList.remove('hidden');
                                emailInput.classList.add('input-invalid');
                                emailInput.classList.remove('input-valid');
                                emailError.textContent = 'Email already registered';
                                emailError.classList.remove('hidden');
                                validIcon.classList.add('hidden');
                                invalidIcon.classList.remove('hidden');
                                isEmailValid = false;
                            } else {
                                spinnerEl.classList.add('spinner-valid');
                                setTimeout(() => {
                                    spinner.classList.add('hidden');
                                    status.classList.remove('hidden');
                                    emailInput.classList.add('input-valid');
                                    emailInput.classList.remove('input-invalid');
                                    emailError.classList.add('hidden');
                                    validIcon.classList.remove('hidden');
                                    invalidIcon.classList.add('hidden');
                                    isEmailValid = true;
                                    updateSubmitBtn();
                                }, 500);
                            }
                        } catch (err) {
                            console.error('Email check error:', err);
                            spinner.classList.add('hidden');
                        }
                        updateSubmitBtn();
                    }, 500);

                    // Phone Validation
                    const validatePhone = debounce(async (phone) => {
                        const phoneError = document.getElementById('phoneError');
                        const spinner = document.getElementById('phoneSpinner');
                        const spinnerEl = spinner.querySelector('.spinner');
                        const status = document.getElementById('phoneStatus');
                        const validIcon = document.getElementById('phoneValidIcon');
                        const invalidIcon = document.getElementById('phoneInvalidIcon');

                        spinnerEl.classList.remove('spinner-valid');

                        if (!phone) {
                            phoneInput.classList.remove('input-valid', 'input-invalid');
                            phoneError.classList.add('hidden');
                            status.classList.add('hidden');
                            spinner.classList.add('hidden');
                            isPhoneValid = false;
                            updateSubmitBtn();
                            return;
                        }

                        // 1. Format Check (Philippine format, escaped for Node.js backticks)
                        const phoneRegex = /^(09|9|63|\\+639)\\d{9}$/;
                        if (!phoneRegex.test(phone)) {
                            spinner.classList.add('hidden');
                            phoneInput.classList.add('input-invalid');
                            phoneInput.classList.remove('input-valid');
                            phoneError.textContent = 'Use 09xxxxxxxxx, 9xxxxxxxxx, 63xxxxxxxxxx, or +639xxxxxxxxx';
                            phoneError.classList.remove('hidden');
                            status.classList.remove('hidden');
                            validIcon.classList.add('hidden');
                            invalidIcon.classList.remove('hidden');
                            isPhoneValid = false;
                            updateSubmitBtn();
                            return;
                        }

                        // 2. Availability Check
                        spinner.classList.remove('hidden');
                        status.classList.add('hidden');
                        phoneError.classList.add('hidden');

                        try {
                            const res = await fetch('/auth/check-phone?phone=' + encodeURIComponent(phone));
                            const data = await res.json();
                            if (data.exists) {
                                spinner.classList.add('hidden');
                                status.classList.remove('hidden');
                                phoneInput.classList.add('input-invalid');
                                phoneInput.classList.remove('input-valid');
                                phoneError.textContent = 'Phone already registered';
                                phoneError.classList.remove('hidden');
                                validIcon.classList.add('hidden');
                                invalidIcon.classList.remove('hidden');
                                isPhoneValid = false;
                            } else {
                                spinnerEl.classList.add('spinner-valid');
                                setTimeout(() => {
                                    spinner.classList.add('hidden');
                                    status.classList.remove('hidden');
                                    phoneInput.classList.add('input-valid');
                                    phoneInput.classList.remove('input-invalid');
                                    phoneError.classList.add('hidden');
                                    validIcon.classList.remove('hidden');
                                    invalidIcon.classList.add('hidden');
                                    isPhoneValid = true;
                                    updateSubmitBtn();
                                }, 500);
                            }
                        } catch (err) {
                            console.error('Phone check error:', err);
                            spinner.classList.add('hidden');
                        }
                        updateSubmitBtn();
                    }, 500);

                    // Confirm Password Validation
                    const validateConfirmPassword = debounce(async () => {
                        const password = passwordInput.value;
                        const confirmPassword = confirmPasswordInput.value;
                        const confirmPasswordError = document.getElementById('confirmPasswordError');
                        const spinner = document.getElementById('confirmPasswordSpinner');
                        const spinnerEl = spinner.querySelector('.spinner');
                        const status = document.getElementById('confirmPasswordStatus');
                        const validIcon = document.getElementById('confirmPasswordValidIcon');
                        const invalidIcon = document.getElementById('confirmPasswordInvalidIcon');

                        spinnerEl.classList.remove('spinner-valid');

                        if (!confirmPassword) {
                            confirmPasswordInput.classList.remove('input-valid', 'input-invalid');
                            confirmPasswordError.classList.add('hidden');
                            status.classList.add('hidden');
                            spinner.classList.add('hidden');
                            isConfirmPasswordValid = false;
                            updateSubmitBtn();
                            return;
                        }

                        // Show Spinner
                        spinner.classList.remove('hidden');
                        status.classList.add('hidden');
                        confirmPasswordError.classList.add('hidden');

                        // Simulate a check
                        setTimeout(() => {
                            spinner.classList.add('hidden');
                            status.classList.remove('hidden');

                            if (password !== confirmPassword) {
                                confirmPasswordInput.classList.add('input-invalid');
                                confirmPasswordInput.classList.remove('input-valid');
                                confirmPasswordError.textContent = 'Passwords do not match';
                                confirmPasswordError.classList.remove('hidden');
                                validIcon.classList.add('hidden');
                                invalidIcon.classList.remove('hidden');
                                isConfirmPasswordValid = false;
                            } else {
                                spinnerEl.classList.add('spinner-valid');
                                confirmPasswordInput.classList.add('input-valid');
                                confirmPasswordInput.classList.remove('input-invalid');
                                confirmPasswordError.classList.add('hidden');
                                validIcon.classList.remove('hidden');
                                invalidIcon.classList.add('hidden');
                                isConfirmPasswordValid = true;
                            }
                            updateSubmitBtn();
                        }, 500);
                    }, 300);

                    emailInput.addEventListener('input', (e) => {
                        const val = e.target.value.trim();
                        document.getElementById('emailSpinner').classList.remove('hidden');
                        document.getElementById('emailStatus').classList.add('hidden');
                        validateEmail(val);
                    });

                    phoneInput.addEventListener('input', (e) => {
                        let val = e.target.value.replace(/[^0-9+]/g, '').trim();
                        if (val.startsWith('+')) {
                            val = val.slice(0, 13);
                        } else {
                            val = val.slice(0, 11);
                        }
                        e.target.value = val;
                        document.getElementById('phoneSpinner').classList.remove('hidden');
                        document.getElementById('phoneStatus').classList.add('hidden');
                        validatePhone(val);
                    });

                    passwordInput.addEventListener('input', () => {
                        const password = passwordInput.value;
                        const hasNumber = /\\d/.test(password);
                        const hasSpecial = /[!@#$%^&*]/.test(password);
                        const isLongEnough = password.length >= 8;

                        if (password && (!hasNumber || !hasSpecial || !isLongEnough)) {
                            passwordInput.classList.add('input-invalid');
                            // You could add a password hint UI here if needed
                        } else {
                            passwordInput.classList.remove('input-invalid');
                        }

                        if (confirmPasswordInput.value) {
                            validateConfirmPassword();
                        }
                    });

                    termsCheckbox.addEventListener('change', updateSubmitBtn);

                    confirmPasswordInput.addEventListener('input', () => {
                        document.getElementById('confirmPasswordSpinner').classList.remove('hidden');
                        document.getElementById('confirmPasswordStatus').classList.add('hidden');
                        validateConfirmPassword();
                    });

                        document.getElementById('registerForm').addEventListener('submit', async (e) => {
                        e.preventDefault();
                        const messageDiv = document.getElementById('message');
                        const formData = {
                            firstName: document.getElementById('firstName').value,
                            lastName: document.getElementById('lastName').value,
                            email: document.getElementById('email').value,
                            phoneNumber: document.getElementById('phoneNumber').value,
                            password: document.getElementById('password').value,
                            captchaToken: document.getElementById('captchaVerifiedToken')?.value
                        };
                        try {
                            const res = await fetch('/auth/register', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(formData)
                            });
                            const data = await res.json();
                            if (res.ok) {
                                messageDiv.textContent = 'Account created successfully! Redirecting...';
                                messageDiv.className = 'mt-4 text-center text-sm font-semibold text-green-600';
                                messageDiv.classList.remove('hidden');
                                setTimeout(() => { window.location.href = '/login?apiKey=' + activeApiKey; }, 2000);
                            } else {
                                messageDiv.textContent = data.error || 'Registration failed';
                                messageDiv.className = 'mt-4 text-center text-sm font-semibold text-red-600';
                                messageDiv.classList.remove('hidden');
                            }
                        } catch (err) {
                            messageDiv.textContent = 'An error occurred. Please try again.';
                            messageDiv.className = 'mt-4 text-center text-sm font-semibold text-red-600';
                            messageDiv.classList.remove('hidden');
                        }
                    });
                });

                function togglePassword(inputId, btn) {
                    const input = document.getElementById(inputId);
                    const eyeIcon = btn.querySelector('.eye-icon');
                    const eyeOffIcon = btn.querySelector('.eye-off-icon');
                    if (input.type === 'password') {
                        input.type = 'text';
                        eyeIcon.classList.add('hidden');
                        eyeOffIcon.classList.remove('hidden');
                    } else {
                        input.type = 'password';
                        eyeIcon.classList.remove('hidden');
                        eyeOffIcon.classList.add('hidden');
                    }
                }
            </script>
        </body>
        </html>
    `);
});

// Serve Forgot Password Page
app.get('/forgot-password', (req, res) => {
    const { apiKey } = req.query;
    const activeApiKey = apiKey || process.env.BUDOLPAY_API_KEY || 'bp_b31ea1888dcb2ba76fdbb776ea8f5b7a';

    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Forgot Password - budolID</title>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
            <style>
                * { box-sizing: border-box; }

                body {
                    margin: 0;
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 24px;
                    font-family: 'Inter', Arial, sans-serif;
                    color: #0f172a;
                    background:
                        radial-gradient(circle at top, rgba(37, 99, 235, 0.16), transparent 34%),
                        linear-gradient(180deg, #020617 0%, #0f172a 100%);
                }

                body > div {
                    width: 100%;
                    max-width: 440px;
                    background: rgba(255, 255, 255, 0.97);
                    border: 1px solid rgba(148, 163, 184, 0.18);
                    border-radius: 28px;
                    box-shadow: 0 30px 60px rgba(15, 23, 42, 0.38);
                    overflow: hidden;
                }

                body > div > div:first-child {
                    padding: 36px 32px 28px;
                }

                body > div > div:last-child {
                    padding: 18px 24px 22px;
                    text-align: center;
                    background: #f8fafc;
                    border-top: 1px solid #e2e8f0;
                    color: #94a3b8;
                    font-size: 0.7rem;
                    font-weight: 800;
                    letter-spacing: 0.18em;
                    text-transform: uppercase;
                }

                body > div > div:last-child span { color: #2563eb; }

                body > div > div:first-child > div:first-child {
                    display: flex;
                    justify-content: center;
                    margin-bottom: 24px;
                }

                body > div > div:first-child > div:first-child > div {
                    width: 72px;
                    height: 72px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 999px;
                    background: linear-gradient(135deg, rgba(37, 99, 235, 0.16), rgba(14, 165, 233, 0.16));
                    color: #2563eb;
                }

                h1 {
                    margin: 0;
                    text-align: center;
                    font-size: 2rem;
                    line-height: 1.1;
                    font-weight: 900;
                    letter-spacing: -0.04em;
                    color: #0f172a;
                }

                h1 span { color: #2563eb; }

                body > div > div:first-child > p {
                    margin: 10px 0 0;
                    text-align: center;
                    color: #64748b;
                    font-size: 0.96rem;
                    line-height: 1.6;
                }

                #forgotForm {
                    margin-top: 28px;
                }

                #forgotForm > * + * {
                    margin-top: 18px;
                }

                #forgotForm label {
                    display: block;
                    margin-bottom: 8px;
                    color: #64748b;
                    font-size: 0.72rem;
                    font-weight: 800;
                    letter-spacing: 0.12em;
                    text-transform: uppercase;
                }

                #forgotForm input {
                    width: 100%;
                    padding: 14px 16px;
                    border-radius: 16px;
                    border: 1px solid #cbd5e1;
                    background: #ffffff;
                    color: #0f172a;
                    font: inherit;
                    transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
                }

                #forgotForm input::placeholder { color: #94a3b8; }

                #forgotForm input:focus {
                    outline: none;
                    border-color: #2563eb;
                    box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.2);
                    transform: translateY(-1px);
                }

                #forgotForm button {
                    width: 100%;
                    border: 0;
                    border-radius: 18px;
                    padding: 15px 18px;
                    background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
                    color: #ffffff;
                    font: inherit;
                    font-weight: 800;
                    cursor: pointer;
                    box-shadow: 0 18px 30px rgba(37, 99, 235, 0.28);
                }

                #message {
                    margin-top: 16px;
                    text-align: center;
                    font-size: 0.92rem;
                    font-weight: 600;
                }

                .text-red-600 { color: #dc2626 !important; }
                .text-green-600 { color: #16a34a !important; }
                .hidden { display: none !important; }

                #message + div {
                    margin-top: 28px;
                    padding-top: 24px;
                    border-top: 1px solid #e2e8f0;
                    text-align: center;
                }

                #message + div a {
                    color: #64748b;
                    text-decoration: none;
                    font-size: 0.92rem;
                    font-weight: 700;
                }

                #message + div a:hover { color: #2563eb; }

                @media (max-width: 480px) {
                    body { padding: 16px; }
                    body > div > div:first-child { padding: 28px 22px 22px; }
                }
            </style>
        </head>
        <body class="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div class="max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
                <div class="p-8">
                    <div class="flex justify-center mb-6">
                        <div class="bg-blue-500/10 p-4 rounded-full">
                            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-blue-500"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                        </div>
                    </div>
                    
                    <h1 class="text-xl font-black text-center text-slate-700 mb-2">
                        Reset <span class="text-blue-500">Password</span>
                    </h1>
                    <p class="text-slate-500 text-center text-sm mb-8">
                        Enter your email to receive a 6-digit OTP for password reset.
                    </p>

                    <form id="forgotForm" class="space-y-4">
                        <div>
                            <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Email Address</label>
                            <input 
                                type="email" 
                                id="email"
                                required
                                class="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-900"
                                placeholder="juan@budolpay.com"
                            />
                        </div>

                        <button 
                            type="submit" 
                            class="w-full bg-blue-500 text-white p-4 rounded-xl font-bold hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/30"
                        >
                            Send OTP
                        </button>
                    </form>

                    <div id="message" class="mt-4 text-center text-sm font-semibold hidden"></div>

                    <div class="mt-8 pt-6 border-t border-slate-100 text-center">
                        <a href="/login?apiKey=${escapeHtml(activeApiKey)}" class="text-sm font-semibold text-slate-400 hover:text-slate-600 transition-colors">
                            &larr; Back to Login
                        </a>
                    </div>
                </div>
                <div class="bg-slate-50 px-8 py-4 text-center">
                    <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                        Protected by budol<span class="text-blue-500">Shield</span>
                    </p>
                </div>
            </div>

            <script>
                document.getElementById('forgotForm').addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const email = document.getElementById('email').value;
                    const messageDiv = document.getElementById('message');
                    
                    try {
                        const res = await fetch('/auth/forgot-password', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ email })
                        });
                        const data = await res.json();
                        
                        messageDiv.textContent = data.message || data.error;
                        messageDiv.className = res.ok
                            ? 'mt-4 text-center text-sm font-semibold text-green-600'
                            : 'mt-4 text-center text-sm font-semibold text-red-600';
                        messageDiv.classList.remove('hidden');
                        
                        if (res.ok) {
                            setTimeout(() => {
                                window.location.href = \`/reset-password?email=\${email}&apiKey=${activeApiKey}\`;
                            }, 2000);
                        }
                    } catch (err) {
                        messageDiv.textContent = 'An error occurred. Please try again.';
                        messageDiv.className = 'mt-4 text-center text-sm font-semibold text-red-600';
                        messageDiv.classList.remove('hidden');
                    }
                });
            </script>
        </body>
        </html>
    `);
});

// Serve Reset Password Page (OTP + New Password)
app.get('/reset-password', (req, res) => {
    const { email, apiKey } = req.query;
    const activeApiKey = apiKey || process.env.BUDOLPAY_API_KEY || 'bp_b31ea1888dcb2ba76fdbb776ea8f5b7a';

    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Verify OTP - budolID</title>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
            <style>
                * { box-sizing: border-box; }

                body {
                    margin: 0;
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 24px;
                    font-family: 'Inter', Arial, sans-serif;
                    color: #0f172a;
                    background:
                        radial-gradient(circle at top, rgba(37, 99, 235, 0.16), transparent 34%),
                        linear-gradient(180deg, #020617 0%, #0f172a 100%);
                }

                body > div {
                    width: 100%;
                    max-width: 440px;
                    background: rgba(255, 255, 255, 0.97);
                    border: 1px solid rgba(148, 163, 184, 0.18);
                    border-radius: 28px;
                    box-shadow: 0 30px 60px rgba(15, 23, 42, 0.38);
                    overflow: hidden;
                }

                body > div > div:first-child {
                    padding: 36px 32px 28px;
                }

                body > div > div:last-child {
                    padding: 18px 24px 22px;
                    text-align: center;
                    background: #f8fafc;
                    border-top: 1px solid #e2e8f0;
                    color: #94a3b8;
                    font-size: 0.7rem;
                    font-weight: 800;
                    letter-spacing: 0.18em;
                    text-transform: uppercase;
                }

                body > div > div:last-child span { color: #2563eb; }

                body > div > div:first-child > div:first-child {
                    display: flex;
                    justify-content: center;
                    margin-bottom: 24px;
                }

                body > div > div:first-child > div:first-child > div {
                    width: 72px;
                    height: 72px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 999px;
                    background: linear-gradient(135deg, rgba(37, 99, 235, 0.16), rgba(14, 165, 233, 0.16));
                    color: #2563eb;
                }

                h1 {
                    margin: 0;
                    text-align: center;
                    font-size: 2rem;
                    line-height: 1.1;
                    font-weight: 900;
                    letter-spacing: -0.04em;
                    color: #0f172a;
                }

                h1 span { color: #2563eb; }

                body > div > div:first-child > p {
                    margin: 10px 0 0;
                    text-align: center;
                    color: #64748b;
                    font-size: 0.96rem;
                    line-height: 1.6;
                }

                #otpForm {
                    margin-top: 28px;
                }

                #otpForm > * + * {
                    margin-top: 18px;
                }

                #otpForm label {
                    display: block;
                    margin-bottom: 8px;
                    color: #64748b;
                    font-size: 0.72rem;
                    font-weight: 800;
                    letter-spacing: 0.12em;
                    text-transform: uppercase;
                }

                #otpForm input[type="text"],
                #otpForm input[type="password"] {
                    width: 100%;
                    padding: 14px 16px;
                    border-radius: 16px;
                    border: 1px solid #cbd5e1;
                    background: #ffffff;
                    color: #0f172a;
                    font: inherit;
                    transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
                }

                #otp {
                    text-align: center;
                    font-size: 2rem;
                    font-weight: 900;
                    letter-spacing: 0.45em;
                    padding-left: 1.2em;
                }

                #otpForm input[type="password"] {
                    padding-right: 46px;
                }

                #otpForm input::placeholder { color: #94a3b8; }

                #otpForm input:focus {
                    outline: none;
                    border-color: #2563eb;
                    box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.2);
                    transform: translateY(-1px);
                }

                #otpForm .relative {
                    position: relative;
                }

                #otpForm button[onclick^="togglePassword"] {
                    position: absolute;
                    right: 12px;
                    top: 50%;
                    transform: translateY(-50%);
                    border: 0;
                    padding: 6px;
                    border-radius: 10px;
                    background: transparent;
                    color: #94a3b8;
                    cursor: pointer;
                }

                #otpForm button[type="submit"] {
                    width: 100%;
                    border: 0;
                    border-radius: 18px;
                    padding: 15px 18px;
                    background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
                    color: #ffffff;
                    font: inherit;
                    font-weight: 800;
                    cursor: pointer;
                    box-shadow: 0 18px 30px rgba(37, 99, 235, 0.28);
                }

                #message {
                    margin-top: 16px;
                    text-align: center;
                    font-size: 0.92rem;
                    font-weight: 600;
                }

                .text-red-600 { color: #dc2626 !important; }
                .text-green-600 { color: #16a34a !important; }
                .hidden { display: none !important; }

                #message + div {
                    margin-top: 28px;
                    padding-top: 24px;
                    border-top: 1px solid #e2e8f0;
                    text-align: center;
                }

                #message + div a {
                    color: #64748b;
                    text-decoration: none;
                    font-size: 0.92rem;
                    font-weight: 700;
                }

                #message + div a:hover { color: #2563eb; }

                @media (max-width: 480px) {
                    body { padding: 16px; }
                    body > div > div:first-child { padding: 28px 22px 22px; }
                    #otp { font-size: 1.7rem; letter-spacing: 0.32em; }
                }
            </style>
        </head>
        <body class="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div class="max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
                <div class="p-8">
                    <div class="flex justify-center mb-6">
                        <div class="bg-blue-500/10 p-4 rounded-full">
                            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-blue-500"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                        </div>
                    </div>
                    
                    <h1 class="text-2xl font-black text-center text-slate-900 mb-2">
                        Verify <span class="text-blue-500">OTP</span>
                    </h1>
                    <p class="text-slate-500 text-center text-sm mb-8">
                        Enter the 6-digit OTP and your new password.
                    </p>

                    <form id="otpForm" class="space-y-4">
                        <input type="hidden" id="email" value="${escapeHtml(email)}" />
                        
                        <div>
                            <label class="block text-xs font-bold text-slate-500 uppercase mb-1">One-Time Password</label>
                            <input 
                                type="text" 
                                id="otp"
                                required
                                maxlength="6"
                                class="w-full p-4 text-center text-2xl tracking-[1em] font-black border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-900"
                                placeholder="000000"
                            />
                        </div>

                        <div>
                            <label class="block text-xs font-bold text-slate-500 uppercase mb-1">New Password</label>
                            <div class="relative group">
                                <input 
                                    type="password" 
                                    id="newPassword"
                                    required
                                    class="w-full p-3 pr-12 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-900"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onclick="togglePassword('newPassword', this)"
                                    class="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-blue-500 transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="eye-icon"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="eye-off-icon hidden"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" y1="2" x2="22" y2="22"/></svg>
                                </button>
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            class="w-full bg-blue-500 text-white p-4 rounded-xl font-bold hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/30"
                        >
                            Reset Password
                        </button>
                    </form>

                    <div id="message" class="mt-4 text-center text-sm font-semibold hidden"></div>

                    <div class="mt-8 pt-6 border-t border-slate-100 text-center">
                        <a href="/login?apiKey=${escapeHtml(activeApiKey)}" class="text-sm font-semibold text-slate-400 hover:text-slate-600 transition-colors">
                            &larr; Back to Login
                        </a>
                    </div>
                </div>
                <div class="bg-slate-50 px-8 py-4 text-center">
                    <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                        Protected by budol<span class="text-blue-500">Shield</span>
                    </p>
                </div>
            </div>

            <script>
                function togglePassword(inputId, btn) {
                    const input = document.getElementById(inputId);
                    const eyeIcon = btn.querySelector('.eye-icon');
                    const eyeOffIcon = btn.querySelector('.eye-off-icon');
                    
                    if (input.type === 'password') {
                        input.type = 'text';
                        eyeIcon.classList.add('hidden');
                        eyeOffIcon.classList.remove('hidden');
                    } else {
                        input.type = 'password';
                        eyeIcon.classList.remove('hidden');
                        eyeOffIcon.classList.add('hidden');
                    }
                }

                document.getElementById('otpForm').addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const email = document.getElementById('email').value;
                    const otp = document.getElementById('otp').value;
                    const newPassword = document.getElementById('newPassword').value;
                    const messageDiv = document.getElementById('message');
                    
                    try {
                        // 1. Verify OTP
                        const verifyRes = await fetch('/auth/verify-otp', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ email, otp })
                        });
                        const verifyData = await verifyRes.json();
                        
                        if (!verifyRes.ok) {
                            messageDiv.textContent = verifyData.error;
                            messageDiv.className = 'mt-4 text-center text-sm font-semibold text-red-600';
                            messageDiv.classList.remove('hidden');
                            return;
                        }

                        // 2. Reset Password
                        const resetRes = await fetch('/auth/reset-password', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ resetToken: verifyData.resetToken, newPassword })
                        });
                        const resetData = await resetRes.json();
                        
                        if (resetRes.ok) {
                            messageDiv.textContent = 'Password reset successful! Redirecting to login...';
                            messageDiv.className = 'mt-4 text-center text-sm font-semibold text-green-600';
                            messageDiv.classList.remove('hidden');
                            setTimeout(() => {
                                window.location.href = \`/login?apiKey=${activeApiKey}\`;
                            }, 2000);
                        } else {
                            messageDiv.textContent = resetData.error;
                            messageDiv.className = 'mt-4 text-center text-sm font-semibold text-red-600';
                            messageDiv.classList.remove('hidden');
                        }
                    } catch (err) {
                        messageDiv.textContent = 'An error occurred. Please try again.';
                        messageDiv.className = 'mt-4 text-center text-sm font-semibold text-red-600';
                        messageDiv.classList.remove('hidden');
                    }
                });
            </script>
        </body>
        </html>
    `);
});

// Helper for form submission
app.use(express.urlencoded({ extended: true }));
app.post('/auth/sso/login-form', loginLimiter, async (req, res) => {
    const { email, password, apiKey, redirect_uri } = req.body;

    // Ensure we have an apiKey, default to budolPay for ecosystem access
    const activeApiKey = apiKey || process.env.BUDOLPAY_API_KEY || 'bp_b31ea1888dcb2ba76fdbb776ea8f5b7a';

    try {
        const ecosystemApp = await prisma.ecosystemApp.findUnique({ where: { apiKey: activeApiKey } });
        if (!ecosystemApp) return res.status(403).send('Unauthorized Application: ' + activeApiKey);

        const user = await prisma.user.findUnique({ where: { email } });
        // WHY: Schema uses 'passwordHash' not 'password' — budolID stores bcrypt hashes
        if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
            console.log(`[POST /auth/sso/login-form] Login failed for ${email}. Redirecting with error=1`);
            return res.redirect(`/login?apiKey=${activeApiKey}&redirect_uri=${encodeURIComponent(redirect_uri || '')}&error=1&email=${encodeURIComponent(email)}`);
        }

        const token = jwt.sign(
            {
                sub: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                iss: 'budolID'
            },
            JWT_SECRET,
            { expiresIn: '1d' }
        );

        await prisma.session.create({
            data: {
                userId: user.id,
                appId: ecosystemApp.id,
                token,
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
            }
        });

        // Notify Ecosystem of SSO Login
        await triggerRealtimeEvent('ecosystem:sso', 'sso:login', {
            userId: user.id,
            email: user.email,
            appName: ecosystemApp.name
        });

        // Dynamic Redirection with Security Validation (Cybersecurity Law Compliance)
        let targetRedirectUri = ecosystemApp.redirectUri;
        
        if (redirect_uri) {
            try {
                const requestedUrl = new URL(redirect_uri);
                const allowedUrl = new URL(ecosystemApp.redirectUri);
                
                // Whitelist validation: check if domain/hostname matches or is a subdomain of the registered one
                // This prevents open redirect vulnerabilities
                const requestedHostname = requestedUrl.hostname.toLowerCase();
                const allowedHostname = allowedUrl.hostname.toLowerCase();

                if (requestedHostname === allowedHostname || 
                    requestedHostname.endsWith('.' + allowedHostname) ||
                    requestedHostname === 'localhost' ||
                    requestedHostname.startsWith('192.168.')) {
                    targetRedirectUri = redirect_uri;
                    console.log(`[SSO Login] Using dynamic redirect_uri: ${targetRedirectUri}`);
                } else {
                    console.warn(`[SSO Login] Blocked potentially unsafe redirect_uri: ${redirect_uri}. Falling back to: ${targetRedirectUri}`);
                }
            } catch (e) {
                console.error(`[SSO Login] Invalid redirect_uri format: ${redirect_uri}`);
            }
        }

        res.redirect(`${targetRedirectUri}${targetRedirectUri.includes('?') ? '&' : '?'}token=${token}`);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

// --- SSPR (Self-Service Password Reset) ---

// 1. Forgot Password - Generate OTP and simulate delivery via SMS & Email
app.post('/auth/forgot-password', async (req, res) => {
    const { email } = req.body;
    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            // Standard security practice: don't reveal if user exists
            return res.json({ message: "If an account exists, an OTP has been sent." });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

        // WHY: Schema uses 'otpCode' and 'otpExpiresAt' not 'otp'/'otpExpires'
        await prisma.user.update({
            where: { id: user.id },
            data: { otpCode: otp, otpExpiresAt: otpExpires }
        });

        // Send OTP via budolpay admin notification endpoint (reads SMTP settings from DB)
        try {
            const notifyUrl = process.env.BUDOLPAY_NOTIFY_URL || 'https://budolpay.vercel.app/api/auth/forgot-password/notify';
            const notifyRes = await fetch(notifyUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: email,
                    phone: user.phoneNumber,
                    otp: otp,
                    name: user.firstName || user.name || 'User'
                })
            });
            const notifyData = await notifyRes.json().catch(() => ({}));
            if (notifyRes.ok && (notifyData?.delivery?.email || notifyData?.delivery?.sms)) {
                console.log(`[ForgotPassword] OTP sent to ${maskPII(email)} via notification endpoint`);
            } else {
                console.error(`[ForgotPassword] Notification endpoint returned ${notifyRes.status}`);
                return res.status(503).json({
                    error: notifyData?.error || 'OTP delivery is currently unavailable. Please try again later.'
                });
            }
        } catch (notifyError) {
            console.error(`[ForgotPassword] Failed to call notification endpoint: ${notifyError.message}`);
            return res.status(503).json({
                error: 'OTP delivery is currently unavailable. Please try again later.'
            });
        }

        // Log SMS (SIMULATED - actual SMS requires Twilio/Semaphore integration)
        console.log(`[ForgotPassword] SMS to ${maskPII(user.phoneNumber)}: Your budolID OTP is ${otp}. Valid for 5m.`);

        res.json({ message: "If an account exists, an OTP has been sent." });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 0.2 Verify OTP and Provide Reset Token
app.post('/auth/verify-otp', async (req, res) => {
    const { email, otp } = req.body;
    try {
        const user = await prisma.user.findUnique({ where: { email } });

        // WHY: Schema uses otpCode/otpExpiresAt — check both match and not expired
        if (!user || user.otpCode !== otp || new Date() > user.otpExpiresAt) {
            return res.status(401).json({ error: "Invalid or expired OTP." });
        }

        // WHY: Schema has no resetToken/resetTokenExpires columns.
        //      We use a short-lived signed JWT as a stateless reset token instead.
        //      This avoids needing a DB migration and is equally secure.
        const resetToken = require('jsonwebtoken').sign(
            { sub: user.id, purpose: 'password_reset' },
            JWT_SECRET,
            { expiresIn: '10m' }
        );

        // Clear the OTP now that it has been consumed
        await prisma.user.update({
            where: { id: user.id },
            data: {
                otpCode: null,
                otpExpiresAt: null
            }
        });

        res.json({ resetToken });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 0.3 Reset Password
app.post('/auth/reset-password', async (req, res) => {
    const { resetToken, newPassword } = req.body;
    try {
        // WHY: resetToken is a signed JWT (stateless) — verify it cryptographically
        //      instead of looking it up in the DB (schema has no resetToken column).
        let decoded;
        try {
            decoded = require('jsonwebtoken').verify(resetToken, JWT_SECRET);
        } catch (jwtErr) {
            return res.status(401).json({ error: "Invalid or expired reset token." });
        }

        if (decoded.purpose !== 'password_reset') {
            return res.status(401).json({ error: "Invalid reset token purpose." });
        }

        const user = await prisma.user.findUnique({ where: { id: decoded.sub } });
        if (!user) {
            return res.status(401).json({ error: "User not found." });
        }

        // WHY: BSP compliance requires minimum 10 salt rounds; using 12
        const hashedPassword = await bcrypt.hash(newPassword, 12);

        // WHY: Schema field is 'passwordHash' not 'password'
        await prisma.user.update({
            where: { id: user.id },
            data: { passwordHash: hashedPassword }
        });

        res.json({ message: "Password reset successful. You can now login." });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 1. App Registration (Internal/Admin only in production)
app.post('/apps/register', async (req, res) => {
    const { name, redirectUri } = req.body;
    try {
        const app = await prisma.ecosystemApp.create({
            data: {
                name,
                redirectUri,
                apiKey: require('crypto').randomBytes(16).toString('hex'),
                apiSecret: require('crypto').randomBytes(32).toString('hex')
            }
        });
        res.status(201).json(app);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Check if email exists
app.get('/auth/check-email', async (req, res) => {
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    try {
        const user = await prisma.user.findUnique({
            where: { email },
            select: { id: true, email: true }
        });

        res.json({
            exists: !!user,
            message: user ? 'Email already registered in the ecosystem' : 'Email is available'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Check if phone number exists
app.get('/auth/check-phone', async (req, res) => {
    const { phone } = req.query;
    console.log(`\n📞 [budolID] Check Phone Request: "${phone}"`);

    if (!phone) return res.status(400).json({ error: 'Phone number is required' });

    try {
        const phoneCandidates = buildPhoneCandidates(phone);
        const normalizedPhone = phoneCandidates?.normalizedPhone;
        console.log(`🔍 [budolID] Normalized to: "${normalizedPhone}"`);

        if (!normalizedPhone) {
            console.log(`❌ [budolID] Normalization failed for: "${phone}"`);
            return res.status(400).json({ error: 'Invalid phone number format' });
        }

        let user = null;
        let foundSchema = null;
        let foundInBudolPay = null;

        const foundInBudolId = await findPhoneInSchemas(prisma, ['budolid', 'public'], phoneCandidates);
        if (foundInBudolId.user) {
            user = foundInBudolId.user;
            foundSchema = foundInBudolId.schema;
            console.log(`✅ [budolID] Found in "${foundSchema}":`, user);
        }

        if (!user) {
            foundInBudolPay = await isPhoneExistingInBudolPay(phoneCandidates);
            if (foundInBudolPay) {
                user = foundInBudolPay;
                foundSchema = 'budolpay.public';
                console.log(`✅ [budolID] Found in budolPay:`, user);
            }
        }

        if (!user) {
            console.log(`⚠️ [budolID] Phone "${phone}" NOT FOUND in any schema`);
        }

        res.json({
            exists: !!user,
            id: user ? user.id : null,
            normalizedPhone: normalizedPhone,
            foundAs: user ? user.phoneNumber : null,
            email: user ? user.email : null,
            name: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : null,
            firstName: user ? user.firstName : null,
            lastName: user ? user.lastName : null,
            schema: foundSchema,
            source: foundInBudolPay ? 'budolpay' : 'budolid',
            message: user ? `Phone number registered in ${foundSchema}` : 'Phone number is available'
        });
    } catch (error) {
        console.error(`❌ [budolID] Error checking phone:`, error);
        res.status(500).json({ error: error.message });
    }
});

// Server-side CAPTCHA Store (in-memory with expiration)
const captchaStore = new Map();

function generateCaptchaChallenge() {
    const n1 = Math.floor(Math.random() * 9) + 1;
    const n2 = Math.floor(Math.random() * 9) + 1;
    const op = Math.random() > 0.5 ? '+' : '-';
    let finalN1 = n1;
    let finalN2 = n2;
    if (op === '-' && n1 < n2) {
        finalN1 = n2;
        finalN2 = n1;
    }
    const answer = op === '+' ? finalN1 + finalN2 : finalN1 - finalN2;
    const token = require('crypto').randomBytes(32).toString('hex');
    captchaStore.set(token, { answer, createdAt: Date.now() });
    // Cleanup expired tokens (5 min TTL)
    for (const [key, val] of captchaStore) {
        if (Date.now() - val.createdAt > 5 * 60 * 1000) captchaStore.delete(key);
    }
    return { token, n1: finalN1, n2: finalN2, op };
}

// CAPTCHA: Generate Challenge
app.get('/auth/captcha/generate', (req, res) => {
    const challenge = generateCaptchaChallenge();
    res.json({ token: challenge.token, n1: challenge.n1, n2: challenge.n2, op: challenge.op });
});

// CAPTCHA: Verify Answer
app.post('/auth/captcha/verify', (req, res) => {
    const { token, answer } = req.body;
    const stored = captchaStore.get(token);
    if (!stored) {
        return res.status(400).json({ valid: false, error: 'CAPTCHA expired or invalid' });
    }
    captchaStore.delete(token); // One-time use
    if (parseInt(answer) === stored.answer) {
        // Issue a verified CAPTCHA token (valid for 5 minutes)
        const verifiedToken = require('crypto').randomBytes(32).toString('hex');
        captchaStore.set(verifiedToken, { verified: true, createdAt: Date.now() });
        res.json({ valid: true, verifiedToken });
    } else {
        res.json({ valid: false, error: 'Incorrect answer' });
    }
});

// 2. User Registration (Centralized)
app.post('/auth/register', async (req, res) => {
    const { email, password, firstName, lastName, phoneNumber, captchaToken } = req.body;
    try {
        // 0. CAPTCHA Verification (skip for quick registration and API calls)
        const isQuickReg = req.body.isQuickReg === true || req.body.registrationType === 'phone_only';
        if (!isQuickReg && !req.headers['x-api-key']) {
            if (!captchaToken) {
                return res.status(400).json({ error: 'CAPTCHA verification required' });
            }
            const captchaData = captchaStore.get(captchaToken);
            if (!captchaData || !captchaData.verified) {
                return res.status(400).json({ error: 'CAPTCHA expired or invalid. Please refresh and try again.' });
            }
            captchaStore.delete(captchaToken); // One-time use
        }

        // 1. CyberSecurity: Password Complexity Validation (BSP/PCI DSS)
        const passwordRegex = /^(?=.*\d)(?=.*[!@#$%^&*])(?=.*[a-z])(?=.*[A-Z]).{8,}$/;
        if (!isQuickReg && !passwordRegex.test(password)) {
            return res.status(400).json({ error: `SSO-SECURE: Password must be at least 8 characters and include uppercase, lowercase, number, and special character. (Debug: isQuickReg=${isQuickReg}, type=${req.body.registrationType})` });
        }

        // 2. NPC Compliance: Normalize phone number if provided
        let normalizedPhone = null;
        let phoneCandidates = null;
        if (phoneNumber) {
            phoneCandidates = buildPhoneCandidates(phoneNumber);
            normalizedPhone = phoneCandidates?.normalizedPhone;
            if (!normalizedPhone) {
                return res.status(400).json({ error: 'Invalid phone number format' });
            }
        }

        // 3. Data Integrity: Check if user already exists
        const existingUserByEmail = await prisma.user.findUnique({ where: { email } });
        if (existingUserByEmail) {
            return res.status(409).json({ error: 'Email already registered', code: 'P2002' });
        }

        if (normalizedPhone) {
            const existingUserByPhone = await prisma.user.findFirst({
                where: {
                    OR: phoneCandidates.exactCandidates.map((candidate) => ({ phoneNumber: candidate }))
                }
            });

            let existingLegacyByDigits = null;
            if (!existingUserByPhone) {
                const legacyResults = await prisma.$queryRawUnsafe(
                    `SELECT id, email, "phoneNumber"
                     FROM "User"
                     WHERE regexp_replace(coalesce("phoneNumber", ''), '[^0-9]', '', 'g') = ANY($1::text[])
                     LIMIT 1`,
                    phoneCandidates.digitCandidates
                );

                if (Array.isArray(legacyResults) && legacyResults.length > 0) {
                    existingLegacyByDigits = legacyResults[0];
                }
            }

            if (existingUserByPhone) {
                return res.status(409).json({ error: 'Phone number already registered', code: 'P2002' });
            }
            if (existingLegacyByDigits) {
                return res.status(409).json({ error: 'Phone number already registered', code: 'P2002' });
            }

            const existingInBudolPay = await isPhoneExistingInBudolPay(phoneCandidates);
            if (existingInBudolPay) {
                return res.status(409).json({ error: 'Phone number already registered', code: 'P2002' });
            }
        }

        // 4. Secure Storage: Strong Encryption (12 salt rounds for BSP compliance)
        const hashedPassword = await bcrypt.hash(password, 12);
        
        // WHY: Schema uses 'passwordHash' not 'password'
        const user = await prisma.user.create({
            data: {
                email,
                passwordHash: hashedPassword,
                firstName,
                lastName,
                phoneNumber: normalizedPhone
            }
        });

        try {
            await syncUserToBudolPay({
                id: user.id,
                email: user.email,
                passwordHash: user.passwordHash,
                phoneNumber: user.phoneNumber,
                firstName: user.firstName,
                lastName: user.lastName
            });
        } catch (syncError) {
            await prisma.user.delete({ where: { id: user.id } });
            return res.status(503).json({ error: 'Registration sync failed. Please retry.' });
        }

        // 5. BIR/BSP Audit Logging: Record creation event without exposing full PII
        console.log(`\n[AUDIT LOG] Account Created | Timestamp: ${new Date().toISOString()} | UserID: ${user.id} | Email: ${maskPII(email)} | Status: SUCCESS`);

        // Notify Ecosystem of New Registration
        await triggerRealtimeEvent('ecosystem:sso', 'sso:register', {
            userId: user.id,
            email: user.email
        });

        res.status(201).json({ message: 'User created in budolID', userId: user.id });
    } catch (error) {
        console.error('[Registration Error]:', error.message);
        if (error.code === 'P2002') {
            return res.status(409).json({ error: 'Email or phone number already registered', code: 'P2002' });
        }
        res.status(400).json({ error: 'Registration failed due to a system error' });
    }
});

// 2.1 Quick Registration (Shopee Style)
app.post('/auth/register/quick', async (req, res) => {
    const { phoneNumber, firstName, deviceId } = req.body;
    console.log('[Quick Reg] Attempt for:', phoneNumber);

    try {
        const phoneCandidates = buildPhoneCandidates(phoneNumber);
        const normalizedPhone = phoneCandidates?.normalizedPhone;
        if (!normalizedPhone) {
            return res.status(400).json({ error: 'Invalid phone number format' });
        }

        const existingUser = await prisma.user.findFirst({
            where: {
                OR: phoneCandidates.exactCandidates.map((candidate) => ({ phoneNumber: candidate }))
            }
        });

        let existingLegacyByDigits = null;
        if (!existingUser) {
            const legacyResults = await prisma.$queryRawUnsafe(
                `SELECT id, email, "phoneNumber"
                 FROM "User"
                 WHERE regexp_replace(coalesce("phoneNumber", ''), '[^0-9]', '', 'g') = ANY($1::text[])
                 LIMIT 1`,
                phoneCandidates.digitCandidates
            );
            if (Array.isArray(legacyResults) && legacyResults.length > 0) {
                existingLegacyByDigits = legacyResults[0];
            }
        }

        if (existingUser) {
            return res.status(409).json({ error: 'Phone number already registered', userId: existingUser.id });
        }
        if (existingLegacyByDigits) {
            return res.status(409).json({ error: 'Phone number already registered', userId: existingLegacyByDigits.id });
        }

        const existingInBudolPay = await isPhoneExistingInBudolPay(phoneCandidates);
        if (existingInBudolPay) {
            return res.status(409).json({ error: 'Phone number already registered', userId: existingInBudolPay.id });
        }

        // Create user with minimal info
        // We generate a random temporary password for quick registration
        const tempPassword = Math.random().toString(36).substring(7);
        const hashedPassword = await bcrypt.hash(tempPassword, 12); // Use 12 rounds for BSP compliance

        // WHY: Schema uses 'passwordHash' not 'password'
        const user = await prisma.user.create({
            data: {
                phoneNumber: normalizedPhone,
                firstName: firstName || normalizedPhone,
                lastName: firstName ? (req.body.lastName || '') : '',
                passwordHash: hashedPassword,
                email: `${normalizedPhone}@quick.budolpay.com`, // Temporary email
            }
        });

        try {
            await syncUserToBudolPay({
                id: user.id,
                email: user.email,
                passwordHash: user.passwordHash,
                phoneNumber: user.phoneNumber,
                firstName: user.firstName,
                lastName: user.lastName
            });
        } catch (syncError) {
            await prisma.user.delete({ where: { id: user.id } });
            return res.status(503).json({ error: 'Quick registration sync failed. Please retry.' });
        }

        console.log('[Quick Reg] Success for:', user.id);
        res.status(201).json({
            message: 'Quick registration successful',
            userId: user.id,
            phoneNumber: normalizedPhone
        });
    } catch (error) {
        console.error('[Quick Reg] Error:', error.message);
        res.status(400).json({ error: error.message });
    }
});

// 3. SSO Login (The main entry point for all apps)
app.post('/auth/sso/login', loginLimiter, async (req, res) => {
    const { email, password, apiKey } = req.body;
    console.log('[SSO Login API] Attempt for:', email, 'with apiKey:', apiKey);

    try {
        // Verify the requesting app
        const ecosystemApp = await prisma.ecosystemApp.findUnique({ where: { apiKey } });
        if (!ecosystemApp) {
            console.log('[SSO Login API] Invalid apiKey:', apiKey);
            return res.status(403).json({ error: 'Unauthorized Application' });
        }

        // Determine if the identifier is an email or phone number
        let user;
        let identifierType;

        // Check if it looks like a phone number (starts with +, 0, or 9 and has digits)
        const phoneRegex = /^[\+\d]\d{9,}$/;
        const isPhoneNumber = phoneRegex.test(email) && email.includes('9');

        if (isPhoneNumber) {
            // Normalize phone number
            const normalizedPhone = normalizePhilippinePhone(email);
            if (!normalizedPhone) {
                return res.status(400).json({ error: 'Invalid phone number format' });
            }

            // Find user by phone number
            user = await prisma.user.findFirst({
                where: { phoneNumber: normalizedPhone }
            });
            identifierType = 'phone';
        } else {
            // Assume it's an email
            user = await prisma.user.findUnique({
                where: { email: email }
            });
            identifierType = 'email';
        }

        // Verify user credentials
        // WHY: Schema uses 'passwordHash' not 'password'
        if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
            console.log(`[SSO Login API] Invalid credentials for ${identifierType}:`, email);
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate Ecosystem-wide JWT
        const token = jwt.sign(
            {
                sub: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                phoneNumber: user.phoneNumber,
                iss: 'budolID',
                jti: require('crypto').randomUUID(),
                loginMethod: identifierType
            },
            JWT_SECRET,
            { expiresIn: '1d' }
        );

        // Record the session
        await prisma.session.create({
            data: {
                userId: user.id,
                appId: ecosystemApp.id,
                token,
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
            }
        });

        // Notify Ecosystem of SSO Login (API)
        await triggerRealtimeEvent('ecosystem:sso', 'sso:login', {
            userId: user.id,
            email: user.email,
            appName: ecosystemApp.name,
            method: identifierType
        });

        console.log(`[SSO Login API] Success for ${identifierType}:`, email);
        res.json({
            token,
            redirectUri: ecosystemApp.redirectUri,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                phoneNumber: user.phoneNumber
            }
        });
    } catch (error) {
        console.error('[SSO Login API] Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// 4. Token Verification (Used by apps to validate tokens)
app.get('/auth/verify', async (req, res) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];

    console.log('[Verify] Header:', authHeader);

    if (!token) {
        console.log('[Verify] No token found');
        return res.status(401).json({ error: 'No token' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);

        // Fetch full user details from database to ensure names are present
        const user = await prisma.user.findUnique({
            where: { id: decoded.sub },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                avatarUrl: true
            }
        });

        if (!user) {
            console.log('[Verify] User not found for ID:', decoded.sub);
            return res.status(401).json({ error: 'User not found' });
        }

        console.log('[Verify] Success for:', user.email);
        res.json({ valid: true, user });
    } catch (error) {
        console.error('[Verify] Error:', error.message);
        res.status(401).json({ error: 'Invalid token', details: error.message });
    }
});

module.exports = app;

require('dotenv').config();
const express = require('express');
const { PrismaClient } = require('./generated/client');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const { normalizePhilippinePhone, isValidE164Phone } = require('./utils/phoneNormalization');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

// Debug connection on startup
prisma.$connect()
    .then(async () => {
        console.log('✅ Connected to Database');
        
        // Auto-seed core apps if missing
        const localIP = process.env.LOCAL_IP || '192.168.1.2';
        const coreApps = [
            { name: 'budolPay', apiKey: 'bp_key_2025', redirectUri: `http://${localIP}:3000/api/auth/callback` },
            { name: 'budolShap', apiKey: 'bs_key_2025', redirectUri: `http://${localIP}:3001/api/auth/sso/callback` }
        ];

        for (const app of coreApps) {
            await prisma.ecosystemApp.upsert({
                where: { apiKey: app.apiKey },
                update: { redirectUri: app.redirectUri },
                create: {
                    name: app.name,
                    apiKey: app.apiKey,
                    apiSecret: require('crypto').randomBytes(32).toString('hex'),
                    redirectUri: app.redirectUri
                }
            });
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
const JWT_SECRET = process.env.JWT_SECRET || 'GJ7Lxn0/kdV/KuZJ5xJ7Ip0RvMerrGW5n0gf44mfHgc=';

app.use(cors());
app.use(express.json());

app.listen(PORT, '0.0.0.0', () => {
    const localIP = process.env.LOCAL_IP || '192.168.1.2';
    console.log(`budolID SSO Service running on http://0.0.0.0:${PORT}`);
    console.log(`Local LAN access at http://${localIP}:${PORT}`);
});

// Request logger
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
    next();
});

// 0. Serve Login Page
app.get('/login', (req, res) => {
    const { apiKey } = req.query;
    // Fallback to budolPay if no apiKey is provided to prevent "Unauthorized Application" error
    const activeApiKey = apiKey || 'bp_key_2025';
    
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>budolID Login</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
            <style>
                body { font-family: 'Inter', sans-serif; }
            </style>
        </head>
        <body class="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div class="max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
                <div class="p-8">
                    <div class="flex justify-center mb-6">
                        <div class="bg-blue-500/10 p-4 rounded-full">
                            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-blue-500"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg>
                        </div>
                    </div>
                    
                    <h1 class="text-2xl font-black text-center text-slate-900 mb-2">
                        budol<span class="text-blue-500">ID</span>
                    </h1>
                    <p class="text-slate-500 text-center text-sm mb-8">
                        The secure universal identity for the ecosystem.
                    </p>

                    <form action="/auth/sso/login-form" method="POST" class="space-y-4">
                        <input type="hidden" name="apiKey" value="${activeApiKey}" />
                        
                        <div>
                            <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Email Address</label>
                            <input 
                                type="email" 
                                name="email"
                                required
                                class="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-900"
                                placeholder="name@example.com"
                            />
                        </div>

                        <div>
                            <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Password</label>
                            <input 
                                type="password" 
                                name="password"
                                required
                                class="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-900"
                                placeholder="••••••••"
                            />
                        </div>

                        <button 
                            type="submit" 
                            class="w-full bg-blue-500 text-white p-4 rounded-xl font-bold hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/30"
                        >
                            Sign In
                        </button>
                    </form>

                    <div class="mt-8 pt-6 border-t border-slate-100 text-center">
                        <a href="/forgot-password?apiKey=${activeApiKey}" class="text-sm font-semibold text-blue-500 hover:text-blue-600 transition-colors">
                            Forgot your password?
                        </a>
                    </div>
                </div>
                <div class="bg-slate-50 px-8 py-4 text-center">
                    <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                        Protected by budol<span class="text-blue-500">Shield</span>
                    </p>
                </div>
            </div>
        </body>
        </html>
    `);
});

// Serve Forgot Password Page
app.get('/forgot-password', (req, res) => {
    const { apiKey } = req.query;
    const activeApiKey = apiKey || 'bp_key_2025';

    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Forgot Password - budolID</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
            <style>
                body { font-family: 'Inter', sans-serif; }
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
                        Reset <span class="text-blue-500">Password</span>
                    </h1>
                    <p class="text-slate-500 text-center text-sm mb-8">
                        Enter your email to receive a 6-digit OTP via SMS and Email.
                    </p>

                    <form id="forgotForm" class="space-y-4">
                        <div>
                            <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Email Address</label>
                            <input 
                                type="email" 
                                id="email"
                                required
                                class="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-900"
                                placeholder="name@example.com"
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
                        <a href="/login?apiKey=${activeApiKey}" class="text-sm font-semibold text-slate-400 hover:text-slate-600 transition-colors">
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
                        
                        messageDiv.textContent = data.message;
                        messageDiv.className = 'mt-4 text-center text-sm font-semibold text-green-600';
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
    const activeApiKey = apiKey || 'bp_key_2025';

    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Verify OTP - budolID</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
            <style>
                body { font-family: 'Inter', sans-serif; }
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
                        <input type="hidden" id="email" value="${email}" />
                        
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
                            <input 
                                type="password" 
                                id="newPassword"
                                required
                                class="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-900"
                                placeholder="••••••••"
                            />
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
                        <a href="/login?apiKey=${activeApiKey}" class="text-sm font-semibold text-slate-400 hover:text-slate-600 transition-colors">
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
app.post('/auth/sso/login-form', async (req, res) => {
    const { email, password, apiKey } = req.body;
    
    // Ensure we have an apiKey, default to budolPay for ecosystem access
    const activeApiKey = apiKey || 'bp_key_2025';
    
    try {
        const ecosystemApp = await prisma.ecosystemApp.findUnique({ where: { apiKey: activeApiKey } });
        if (!ecosystemApp) return res.status(403).send('Unauthorized Application: ' + activeApiKey);

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).send('Invalid credentials');
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
            { expiresIn: '7d' }
        );

        await prisma.session.create({
            data: {
                userId: user.id,
                appId: ecosystemApp.id,
                token,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            }
        });

        res.redirect(`${ecosystemApp.redirectUri}?token=${token}`);
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
            return res.json({ message: "If an account exists, an OTP has been sent via SMS and Email." });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

        await prisma.user.update({
            where: { id: user.id },
            data: { otp, otpExpires }
        });

        // SIMULATED DUAL-CHANNEL DELIVERY (PCI DSS & BSP Compliant)
        console.log(`\n--- [SSPR DUAL-CHANNEL DELIVERY] ---`);
        console.log(`[EMAIL] To: ${email} | Subject: budolID Password Reset | Body: Your OTP is ${otp}`);
        console.log(`[SMS] To: ${user.phoneNumber || 'N/A'} | Body: budolID: Your password reset OTP is ${otp}. Valid for 5m.`);
        console.log(`------------------------------------\n`);

        res.json({ message: "If an account exists, an OTP has been sent via SMS and Email." });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 0.2 Verify OTP and Provide Reset Token
app.post('/auth/verify-otp', async (req, res) => {
    const { email, otp } = req.body;
    try {
        const user = await prisma.user.findUnique({ where: { email } });
        
        if (!user || user.otp !== otp || new Date() > user.otpExpires) {
            return res.status(401).json({ error: "Invalid or expired OTP." });
        }

        // Generate short-lived reset token
        const resetToken = require('crypto').randomBytes(32).toString('hex');
        const resetTokenExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        await prisma.user.update({
            where: { id: user.id },
            data: { 
                otp: null, 
                otpExpires: null,
                resetToken,
                resetTokenExpires
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
        const user = await prisma.user.findUnique({ where: { resetToken } });

        if (!user || new Date() > user.resetTokenExpires) {
            return res.status(401).json({ error: "Invalid or expired reset token." });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetToken: null,
                resetTokenExpires: null
            }
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
        // Normalize phone number before checking
        const normalizedPhone = normalizePhilippinePhone(phone);
        console.log(`🔍 [budolID] Normalized to: "${normalizedPhone}"`);
        
        if (!normalizedPhone) {
            console.log(`❌ [budolID] Normalization failed for: "${phone}"`);
            return res.status(400).json({ error: 'Invalid phone number format' });
        }
        
        // Search across both schemas: budolid and public
        const schemas = ['budolid', 'public'];
        let user = null;
        let foundSchema = null;

        for (const schema of schemas) {
            console.log(`📡 [budolID] Checking schema "${schema}" for "${normalizedPhone}"`);
            // Try normalized first
            const results = await prisma.$queryRawUnsafe(
                `SELECT id, "phoneNumber", name, email FROM "${schema}"."User" WHERE "phoneNumber" = $1 LIMIT 1`,
                normalizedPhone
            );
            
            if (results && results.length > 0) {
                user = results[0];
                foundSchema = schema;
                console.log(`✅ [budolID] Found in "${schema}":`, user);
                break;
            }

            // Try raw variations if normalized didn't work
            const rawDigits = phone.replace(/[^0-9]/g, '');
            const variations = [];
            if (rawDigits.startsWith('63') && rawDigits.length === 12) {
                variations.push('0' + rawDigits.substring(2));
            } else if (rawDigits.startsWith('0')) {
                variations.push(rawDigits);
            }

            for (const variation of variations) {
                console.log(`📡 [budolID] Checking variation "${variation}" in "${schema}"`);
                const varResults = await prisma.$queryRawUnsafe(
                    `SELECT id, "phoneNumber", name, email FROM "${schema}"."User" WHERE "phoneNumber" = $1 LIMIT 1`,
                    variation
                );
                if (varResults && varResults.length > 0) {
                    user = varResults[0];
                    foundSchema = schema;
                    console.log(`✅ [budolID] Found variation in "${schema}":`, user);
                    break;
                }
            }
            if (user) break;
        }
        
        if (!user) {
            console.log(`⚠️ [budolID] Phone "${phone}" NOT FOUND in any schema`);
        }

        res.json({ 
            exists: !!user,
            normalizedPhone: normalizedPhone,
            foundAs: user ? user.phoneNumber : null,
            schema: foundSchema,
            message: user ? `Phone number registered in ${foundSchema}` : 'Phone number is available'
        });
    } catch (error) {
        console.error(`❌ [budolID] Error checking phone:`, error);
        res.status(500).json({ error: error.message });
    }
});

// 2. User Registration (Centralized)
app.post('/auth/register', async (req, res) => {
    const { email, password, firstName, lastName, phoneNumber } = req.body;
    try {
        // Normalize phone number if provided
        let normalizedPhone = null;
        if (phoneNumber) {
            normalizedPhone = normalizePhilippinePhone(phoneNumber);
            if (!normalizedPhone) {
                return res.status(400).json({ error: 'Invalid phone number format' });
            }
        }

        // Check if user already exists by email
        const existingUserByEmail = await prisma.user.findUnique({ where: { email } });
        if (existingUserByEmail) {
            return res.status(409).json({ 
                error: 'Email already registered',
                code: 'P2002',
                userId: existingUserByEmail.id 
            });
        }

        // Check if phone number already exists
        if (normalizedPhone) {
            const existingUserByPhone = await prisma.user.findFirst({ where: { phoneNumber: normalizedPhone } });
            if (existingUserByPhone) {
                return res.status(409).json({ 
                    error: 'Phone number already registered',
                    code: 'P2002',
                    userId: existingUserByPhone.id 
                });
            }
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: { 
                email, 
                password: hashedPassword, 
                firstName, 
                lastName,
                phoneNumber: normalizedPhone
            }
        });
        res.status(201).json({ message: 'User created in budolID', userId: user.id });
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(409).json({ error: 'Email or phone number already registered', code: 'P2002' });
        }
        res.status(400).json({ error: error.message });
    }
});

// 2.1 Quick Registration (Shopee Style)
app.post('/auth/register/quick', async (req, res) => {
    const { phoneNumber, firstName, deviceId } = req.body;
    console.log('[Quick Reg] Attempt for:', phoneNumber);
    
    try {
        const normalizedPhone = normalizePhilippinePhone(phoneNumber);
        if (!normalizedPhone) {
            return res.status(400).json({ error: 'Invalid phone number format' });
        }

        // Check if phone number already exists
        const existingUser = await prisma.user.findFirst({ where: { phoneNumber: normalizedPhone } });
        if (existingUser) {
            return res.status(409).json({ error: 'Phone number already registered', userId: existingUser.id });
        }

        // Create user with minimal info
        // We generate a random temporary password for quick registration
        const tempPassword = Math.random().toString(36).substring(7);
        const hashedPassword = await bcrypt.hash(tempPassword, 10);
        
        const user = await prisma.user.create({
            data: {
                phoneNumber: normalizedPhone,
                firstName: firstName || 'Budol',
                lastName: 'User',
                password: hashedPassword,
                email: `${normalizedPhone}@quick.budolpay.com`, // Temporary email
            }
        });

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
app.post('/auth/sso/login', async (req, res) => {
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
        if (!user || !(await bcrypt.compare(password, user.password))) {
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
            { expiresIn: '7d' }
        );

        // Record the session
        await prisma.session.create({
            data: {
                userId: user.id,
                appId: ecosystemApp.id,
                token,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            }
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

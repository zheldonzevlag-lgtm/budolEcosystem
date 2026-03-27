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
                                placeholder="juan@budolpay.com"
                            />
                        </div>

                        <div>
                            <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Password</label>
                            <div class="relative group">
                                <input 
                                    type="password" 
                                    name="password"
                                    id="passwordInput"
                                    required
                                    class="w-full p-3 pr-12 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-900"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onclick="togglePassword('passwordInput', this)"
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
                            Sign In
                        </button>
                    </form>

                    <div class="mt-8 pt-6 border-t border-slate-100 text-center space-y-3">
                        <a href="/forgot-password?apiKey=${activeApiKey}" class="block text-sm font-semibold text-blue-500 hover:text-blue-600 transition-colors">
                            Forgot your password?
                        </a>
                        <p class="text-xs text-slate-400">
                            Don't have an account? 
                            <a href="/register?apiKey=${activeApiKey}" class="ml-1 font-bold text-blue-500 hover:underline">Create Account</a>
                        </p>
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
            </script>
        </body>
        </html>
    `);
});

// 0.1 Serve Register Page
app.get('/register', (req, res) => {
    const { apiKey } = req.query;
    const isBudolPay = apiKey === 'bp_key_2025';
    const primaryColor = isBudolPay ? 'rose' : 'blue';
    const brandName = isBudolPay ? 'Pay' : 'ID';
    const activeApiKey = apiKey || 'bp_key_2025';

    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Create Account - budol${brandName}</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
            <style>
                body { font-family: 'Inter', sans-serif; }
                .spinner {
                    animation: spin 1s linear infinite;
                    border: 2px solid #e2e8f0;
                    border-top: 2px solid #ef4444; /* Start Red as requested */
                    border-radius: 50%;
                    width: 20px;
                    height: 20px;
                }
                .spinner-valid { border-top-color: #10b981 !important; }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                .input-valid { border-color: #10b981 !important; }
                .input-invalid { border-color: #ef4444 !important; }
            </style>
        </head>
        <body class="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div class="max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
                <div class="p-8">
                    <div class="flex justify-center mb-6">
                        <div class="bg-${primaryColor}-500/10 p-6 rounded-full border-4 border-${primaryColor}-500/5 shadow-inner">
                            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-${primaryColor}-500"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                        </div>
                    </div>
                    
                    <h1 class="text-2xl font-black text-center text-slate-900 mb-2">
                        budol<span class="text-${primaryColor}-500">${brandName}</span>
                    </h1>
                    <p class="text-slate-500 text-center text-sm mb-8">
                        Create your universal ecosystem account.
                    </p>

                    <div id="captcha-container">
                        <div class="p-6 bg-slate-50 rounded-xl border-2 border-slate-100 mb-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div class="flex items-center gap-2 mb-4">
                                <div class="p-2 rounded-lg bg-${primaryColor}-100 text-${primaryColor}-600">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                                <h3 class="font-bold text-slate-800 uppercase tracking-tight">Security Gatekeeper</h3>
                            </div>
                            
                            <p class="text-xs text-slate-500 mb-4 font-bold uppercase tracking-wider">Shield Challenge: Solve to proceed</p>
                            
                            <div class="space-y-4">
                                <div class="flex items-center justify-center gap-4 text-3xl font-black text-slate-900 bg-white p-4 rounded-xl border-2 border-slate-100 shadow-inner">
                                    <span id="captcha-n1">0</span>
                                    <span id="captcha-op" class="text-slate-300">+</span>
                                    <span id="captcha-n2">0</span>
                                    <span class="text-slate-300">=</span>
                                    <input
                                        type="number"
                                        id="captcha-input"
                                        class="w-24 text-center border-3 border-transparent bg-slate-50 rounded-lg focus:outline-none focus:bg-white focus:border-${primaryColor}-500 transition-all text-slate-900"
                                        placeholder="?"
                                        required
                                    />
                                </div>
                                
                                <p id="captcha-error" class="text-xs text-red-500 text-center font-bold hidden animate-bounce">Verification failed. Try again.</p>
                                
                                <button
                                    type="button"
                                    id="verify-captcha-btn"
                                    class="w-full py-4 bg-${primaryColor}-600 hover:bg-${primaryColor}-700 text-white font-black rounded-xl transition-all shadow-lg shadow-${primaryColor}-500/20 flex items-center justify-center gap-3 group"
                                >
                                    <span>Verify Challenge</span>
                                    <svg class="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M14 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </div>
                            
                            <p class="text-[9px] text-slate-400 mt-4 text-center uppercase tracking-[0.2em] font-black">Powered by Budol Shield v1.0</p>
                        </div>
                    </div>

                    <form id="registerForm" class="space-y-4 hidden">
                        <input type="hidden" name="apiKey" value="${activeApiKey}" />
                        
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-xs font-bold text-slate-500 uppercase mb-1">First Name</label>
                                <input type="text" id="firstName" required class="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-${primaryColor}-500/50 text-slate-900" placeholder="Juan">
                            </div>
                            <div>
                                <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Last Name</label>
                                <input type="text" id="lastName" required class="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-${primaryColor}-500/50 text-slate-900" placeholder="Dela Cruz">
                            </div>
                        </div>

                        <div>
                            <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Email Address</label>
                            <div class="relative">
                                <input type="email" id="email" required class="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-${primaryColor}-500/50 text-slate-900" placeholder="juan@budolpay.com">
                                <div id="emailSpinner" class="absolute right-3 top-1/2 -translate-y-1/2 hidden">
                                    <div class="spinner"></div>
                                </div>
                                <div id="emailStatus" class="absolute right-3 top-1/2 -translate-y-1/2 hidden">
                                    <svg class="w-5 h-5 text-green-500 hidden" id="emailValidIcon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                                    <svg class="w-5 h-5 text-red-500 hidden" id="emailInvalidIcon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                </div>
                            </div>
                            <p id="emailError" class="text-[10px] text-red-500 mt-1 font-bold hidden"></p>
                        </div>

                        <div>
                            <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Phone Number</label>
                            <div class="relative">
                                <input type="tel" id="phoneNumber" required class="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-${primaryColor}-500/50 text-slate-900" placeholder="09123456789">
                                <div id="phoneSpinner" class="absolute right-3 top-1/2 -translate-y-1/2 hidden">
                                    <div class="spinner"></div>
                                </div>
                                <div id="phoneStatus" class="absolute right-3 top-1/2 -translate-y-1/2 hidden">
                                    <svg class="w-5 h-5 text-green-500 hidden" id="phoneValidIcon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                                    <svg class="w-5 h-5 text-red-500 hidden" id="phoneInvalidIcon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                </div>
                            </div>
                            <p id="phoneError" class="text-[10px] text-red-500 mt-1 font-bold hidden"></p>
                        </div>

                        <div>
                            <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Password</label>
                            <div class="relative group">
                                <input 
                                    type="password" 
                                    id="password" 
                                    required 
                                    class="w-full p-3 pr-12 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-${primaryColor}-500/50 text-slate-900" 
                                    placeholder="••••••••"
                                >
                                <button type="button" onclick="togglePassword('password', this)" class="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-${primaryColor}-500 transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="eye-icon"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="eye-off-icon hidden"><path d="M9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" y1="2" x2="22" y2="22"/></svg>
                                </button>
                            </div>
                        </div>

                        <div>
                            <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Confirm Password</label>
                            <div class="relative group">
                                <input 
                                    type="password" 
                                    id="confirmPassword" 
                                    required 
                                    class="w-full p-3 pr-12 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-${primaryColor}-500/50 text-slate-900" 
                                    placeholder="••••••••"
                                >
                                <button type="button" onclick="togglePassword('confirmPassword', this)" class="absolute right-3 top-12/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-${primaryColor}-500 transition-colors" style="top: 50%;">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="eye-icon"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="eye-off-icon hidden"><path d="M9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" y1="2" x2="22" y2="22"/></svg>
                                </button>
                                <div id="confirmPasswordSpinner" class="absolute right-10 top-1/2 -translate-y-1/2 hidden" style="right: 2.5rem;">
                                    <div class="spinner"></div>
                                </div>
                                <div id="confirmPasswordStatus" class="absolute right-10 top-1/2 -translate-y-1/2 hidden" style="right: 2.5rem;">
                                    <svg class="w-5 h-5 text-green-500 hidden" id="confirmPasswordValidIcon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                                    <svg class="w-5 h-5 text-red-500 hidden" id="confirmPasswordInvalidIcon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                </div>
                            </div>
                            <p id="confirmPasswordError" class="text-[10px] text-red-500 mt-1 font-bold hidden"></p>
                        </div>

                        <div class="flex items-start gap-3 py-2">
                            <input type="checkbox" id="terms" required class="mt-1 w-4 h-4 rounded border-slate-300 text-${primaryColor}-500 focus:ring-${primaryColor}-500/50">
                            <label for="terms" class="text-[10px] text-slate-500 leading-tight">
                                I agree to the <a href="#" class="font-bold text-${primaryColor}-500 hover:underline">Terms of Service</a> and <a href="#" class="font-bold text-${primaryColor}-500 hover:underline">Privacy Policy</a>. I understand my data is protected under the <span class="font-bold">Philippine Data Privacy Act of 2012</span>.
                            </label>
                        </div>

                        <button type="submit" id="submitBtn" class="w-full bg-${primaryColor}-500 text-white p-4 rounded-xl font-bold hover:bg-${primaryColor}-600 transition-colors shadow-lg shadow-${primaryColor}-500/30 disabled:opacity-50">
                            Create Account
                        </button>
                    </form>

                    <div id="message" class="mt-4 text-center text-sm font-semibold hidden"></div>

                    <div class="mt-8 pt-6 border-t border-slate-100 text-center">
                        <p class="text-sm text-slate-500">
                            Already have an account? 
                            <a href="/login?apiKey=${activeApiKey}" class="ml-1 font-bold text-${primaryColor}-500 hover:underline">Sign In</a>
                        </p>
                    </div>
                </div>
                <div class="bg-slate-50 px-8 py-4 text-center">
                    <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                        Protected by budol<span class="text-${primaryColor}-500">Shield</span>
                    </p>
                </div>
            </div>

            <script>
                document.addEventListener('DOMContentLoaded', () => {
                    console.log('BudolID Registration Script Initialized');
                    
                    // --- CAPTCHA Logic ---
                    const captchaContainer = document.getElementById('captcha-container');
                    const registerForm = document.getElementById('registerForm');
                    const captchaN1 = document.getElementById('captcha-n1');
                    const captchaN2 = document.getElementById('captcha-n2');
                    const captchaOp = document.getElementById('captcha-op');
                    const captchaInput = document.getElementById('captcha-input');
                    const verifyBtn = document.getElementById('verify-captcha-btn');
                    const captchaError = document.getElementById('captcha-error');

                    let correctAnswer = 0;

                    function generateChallenge() {
                        const n1 = Math.floor(Math.random() * 9) + 1;
                        const n2 = Math.floor(Math.random() * 9) + 1;
                        const op = Math.random() > 0.5 ? '+' : '-';
                        
                        let finalN1 = n1;
                        let finalN2 = n2;

                        if (op === '-' && n1 < n2) {
                            finalN1 = n2;
                            finalN2 = n1;
                        }

                        captchaN1.textContent = finalN1;
                        captchaN2.textContent = finalN2;
                        captchaOp.textContent = op;
                        correctAnswer = op === '+' ? finalN1 + finalN2 : finalN1 - finalN2;
                        captchaInput.value = '';
                        captchaError.classList.add('hidden');
                        captchaInput.classList.remove('border-red-500', 'bg-red-50');
                    }

                    verifyBtn.addEventListener('click', () => {
                        if (parseInt(captchaInput.value) === correctAnswer) {
                            captchaContainer.classList.add('hidden');
                            registerForm.classList.remove('hidden');
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        } else {
                            captchaError.classList.remove('hidden');
                            captchaInput.classList.add('border-red-500', 'bg-red-50');
                            setTimeout(() => {
                                generateChallenge();
                            }, 1000);
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
                        const phoneRegex = /^(09|\\+639)\\d{9}$/;
                        if (!phoneRegex.test(phone)) {
                            spinner.classList.add('hidden');
                            phoneInput.classList.add('input-invalid');
                            phoneInput.classList.remove('input-valid');
                            phoneError.textContent = 'Use 09xxxxxxxxx or +639xxxxxxxxx';
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
                            password: document.getElementById('password').value
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
        console.log(`[EMAIL] To: ${maskPII(email)} | Subject: budolID Password Reset | Body: Your OTP is \x1b[33m${otp}\x1b[0m`);
        console.log(`[SMS] To: ${maskPII(user.phoneNumber)} | Body: budolID: Your password reset OTP is \x1b[33m${otp}\x1b[0m. Valid for 5m.`);
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

            try {
                // Try normalized first (only select columns that are guaranteed to exist)
                const results = await prisma.$queryRawUnsafe(
                    `SELECT id, "phoneNumber", email, name FROM "${schema}"."User" WHERE "phoneNumber" = $1 LIMIT 1`,
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
                        `SELECT id, "phoneNumber", email, name FROM "${schema}"."User" WHERE "phoneNumber" = $1 LIMIT 1`,
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
            } catch (schemaError) {
                // If a specific schema (e.g. "budolid") doesn't exist in this environment,
                // don't fail the entire request – just log and continue checking others.
                console.warn(`⚠️ [budolID] Skipping schema "${schema}" due to error:`, schemaError.message);
                continue;
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
            name: user ? user.name : null,
            firstName: user ? user.firstName : null,
            lastName: user ? user.lastName : null,
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
        // 1. CyberSecurity: Password Complexity Validation (BSP/PCI DSS)
        // Skip for Quick Registration (Phone Only) where password is auto-generated
        const isQuickReg = req.body.isQuickReg === true || req.body.registrationType === 'phone_only';
        const passwordRegex = /^(?=.*\d)(?=.*[!@#$%^&*])(?=.*[a-z])(?=.*[A-Z]).{8,}$/;
        if (!isQuickReg && !passwordRegex.test(password)) {
            return res.status(400).json({ error: `SSO-SECURE: Password must be at least 8 characters and include uppercase, lowercase, number, and special character. (Debug: isQuickReg=${isQuickReg}, type=${req.body.registrationType})` });
        }

        // 2. NPC Compliance: Normalize phone number if provided
        let normalizedPhone = null;
        if (phoneNumber) {
            normalizedPhone = normalizePhilippinePhone(phoneNumber);
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
            const existingUserByPhone = await prisma.user.findFirst({ where: { phoneNumber: normalizedPhone } });
            if (existingUserByPhone) {
                return res.status(409).json({ error: 'Phone number already registered', code: 'P2002' });
            }
        }

        // 4. Secure Storage: Strong Encryption (12 salt rounds for BSP compliance)
        const hashedPassword = await bcrypt.hash(password, 12);
        
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                firstName,
                lastName,
                phoneNumber: normalizedPhone
            }
        });

        // 5. BIR/BSP Audit Logging: Record creation event without exposing full PII
        console.log(`\n[AUDIT LOG] Account Created | Timestamp: ${new Date().toISOString()} | UserID: ${user.id} | Email: ${maskPII(email)} | Status: SUCCESS`);

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
        const hashedPassword = await bcrypt.hash(tempPassword, 12); // Use 12 rounds for BSP compliance

        const user = await prisma.user.create({
            data: {
                phoneNumber: normalizedPhone,
                firstName: firstName || normalizedPhone,
                lastName: firstName ? (req.body.lastName || '') : '',
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

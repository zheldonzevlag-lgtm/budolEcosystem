require('dotenv').config();
const express = require('express');
const { PrismaClient } = require('./generated/client');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

// Debug connection on startup
prisma.$connect()
    .then(() => {
        console.log('✅ Connected to Database');
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
    res.send(`
        <html>
            <head>
                <title>budolID Login</title>
                <style>
                    body { font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #f1f5f9; }
                    .card { background: white; padding: 2rem; border-radius: 8px; shadow: 0 4px 6px rgba(0,0,0,0.1); width: 300px; }
                    input { width: 100%; padding: 0.5rem; margin: 0.5rem 0; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; }
                    button { width: 100%; padding: 0.75rem; background: #4f46e5; color: white; border: none; border-radius: 4px; cursor: pointer; }
                </style>
            </head>
            <body>
                <div class="card">
                    <h2>Login with budolID</h2>
                    <form action="/auth/sso/login-form" method="POST">
                        <input type="hidden" name="apiKey" value="${apiKey}" />
                        <input type="email" name="email" placeholder="Email" required />
                        <input type="password" name="password" placeholder="Password" required />
                        <button type="submit">Sign In</button>
                    </form>
                </div>
            </body>
        </html>
    `);
});

// Helper for form submission
app.use(express.urlencoded({ extended: true }));
app.post('/auth/sso/login-form', async (req, res) => {
    const { email, password, apiKey } = req.body;
    // ... logic same as /auth/sso/login but with redirect
    try {
        const ecosystemApp = await prisma.ecosystemApp.findUnique({ where: { apiKey } });
        if (!ecosystemApp) return res.status(403).send('Unauthorized Application');

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
    if (!phone) return res.status(400).json({ error: 'Phone number is required' });
    
    try {
        const user = await prisma.user.findFirst({
            where: { phoneNumber: phone },
            select: { id: true, phoneNumber: true }
        });
        
        res.json({ 
            exists: !!user,
            message: user ? 'Phone number already registered in the ecosystem' : 'Phone number is available'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 2. User Registration (Centralized)
app.post('/auth/register', async (req, res) => {
    const { email, password, firstName, lastName, phoneNumber } = req.body;
    try {
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(409).json({ 
                error: 'Email already registered',
                code: 'P2002', // Standardize on Prisma code for unique constraint
                userId: existingUser.id 
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: { 
                email, 
                password: hashedPassword, 
                firstName, 
                lastName,
                phoneNumber: phoneNumber || null
            }
        });
        res.status(201).json({ message: 'User created in budolID', userId: user.id });
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(409).json({ error: 'Email already registered', code: 'P2002' });
        }
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

        // Verify user credentials
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            console.log('[SSO Login API] Invalid credentials for:', email);
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
                iss: 'budolID',
                jti: require('crypto').randomUUID()
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

        console.log('[SSO Login API] Success for:', email);
        res.json({ token, redirectUri: ecosystemApp.redirectUri });
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

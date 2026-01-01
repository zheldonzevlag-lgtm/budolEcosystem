const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const { prisma } = require('@budolpay/database');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8001;
const JWT_SECRET = process.env.JWT_SECRET || 'budolpay-secret-key';

app.use(cors());
app.use(express.json());

// SSO: Get App Info
app.get('/sso/app-info', async (req, res) => {
    const { apiKey } = req.query;
    const ecosystemApp = await prisma.ecosystemApp.findUnique({ where: { apiKey } });
    if (!ecosystemApp) return res.status(404).json({ error: 'Invalid Ecosystem App' });
    res.json(ecosystemApp);
});

// Health Check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'Auth Service is healthy', timestamp: new Date() });
});

// Register (Global User)
app.post('/register', async (req, res) => {
    const { email, password, phoneNumber, firstName, lastName } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: {
                email,
                passwordHash: hashedPassword,
                phoneNumber,
                firstName,
                lastName,
                wallet: {
                    create: {
                        balance: 0.0,
                        currency: 'PHP'
                    }
                }
            }
        });
        res.status(201).json({ message: 'User registered successfully', userId: user.id });
    } catch (error) {
        res.status(400).json({ error: error.message });
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
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            }
        });

        res.json({ 
            token, 
            redirectUri: `${ecosystemApp.redirectUri}?token=${token}`,
            user: { id: user.id, email: user.email, role: user.role } 
        });
    } catch (error) {
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
        res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Global Verify Token (For all apps)
app.get('/verify', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        res.json({ 
            valid: true, 
            decoded,
            ecosystem: 'budol' 
        });
    } catch (error) {
        res.status(401).json({ error: 'Invalid or expired ecosystem token' });
    }
});

app.listen(PORT, () => {
    console.log(`budolID SSO Service running on port ${PORT}`);
});

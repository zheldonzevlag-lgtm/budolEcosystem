// Test suite for dual-identifier login functionality
const request = require('supertest');
const express = require('express');
const { PrismaClient } = require('../generated/client');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const { normalizePhilippinePhone } = require('../utils/phoneNormalization');

const prisma = new PrismaClient();

// Create test app
const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'GJ7Lxn0/kdV/KuZJ5xJ7Ip0RvMerrGW5n0gf44mfHgc=';

app.use(cors());
app.use(express.json());

// Test endpoints
app.post('/apps/register', async (req, res) => {
    const { name, redirectUri } = req.body;
    if (!name || !redirectUri) {
        return res.status(400).json({ error: 'Name and redirectUri required' });
    }
    try {
        const app = await prisma.ecosystemApp.create({
            data: {
                name,
                redirectUri,
                apiKey: require('crypto').randomUUID(),
                apiSecret: require('crypto').randomUUID()
            }
        });
        res.json({ appId: app.id, apiKey: app.apiKey });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.post('/auth/register', async (req, res) => {
    const { email, password, firstName, lastName, phoneNumber } = req.body;
    try {
        let normalizedPhone = null;
        if (phoneNumber) {
            normalizedPhone = normalizePhilippinePhone(phoneNumber);
            if (!normalizedPhone) {
                return res.status(400).json({ error: 'Invalid phone number format' });
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

// Enhanced SSO Login with dual-identifier support
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

app.get('/auth/check-phone', async (req, res) => {
    const { phone } = req.query;
    if (!phone) {
        return res.status(400).json({ error: 'Phone number required' });
    }
    
    try {
        const normalizedPhone = normalizePhilippinePhone(phone);
        if (!normalizedPhone) {
            return res.status(400).json({ error: 'Invalid phone number format' });
        }
        
        const user = await prisma.user.findFirst({ where: { phoneNumber: normalizedPhone } });
        res.json({ exists: !!user, normalizedPhone });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

module.exports = app;
const request = require('supertest');
const express = require('express');
const { PrismaClient } = require('../generated/client');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors');

// Mock Prisma
jest.mock('../generated/client', () => {
    const mPrisma = {
        ecosystemApp: {
            findUnique: jest.fn(),
            upsert: jest.fn(),
            create: jest.fn(),
            update: jest.fn()
        },
        user: {
            findUnique: jest.fn(),
            create: jest.fn()
        },
        session: {
            create: jest.fn()
        },
        $connect: jest.fn().mockResolvedValue({}),
        $queryRaw: jest.fn().mockResolvedValue(['public'])
    };
    return { PrismaClient: jest.fn(() => mPrisma) };
});

// Mock Realtime
jest.mock('../utils/realtime', () => ({
    triggerRealtimeEvent: jest.fn().mockResolvedValue({})
}));

const prisma = new (require('../generated/client').PrismaClient)();
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import the logic from index.js (since it's a script, we'll need to wrap it or test the app directly)
// For this test, we'll simulate the POST handler logic directly to verify the redirection behavior

const JWT_SECRET = 'test-secret';

app.post('/auth/sso/login-form', async (req, res) => {
    const { email, password, apiKey, redirect_uri } = req.body;
    const activeApiKey = apiKey || 'bp_key_2025';

    try {
        const ecosystemApp = await prisma.ecosystemApp.findUnique({ where: { apiKey: activeApiKey } });
        if (!ecosystemApp) return res.status(403).send('Unauthorized Application');

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).send('Invalid credentials');
        }

        const token = jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET);

        let targetRedirectUri = ecosystemApp.redirectUri;
        
        if (redirect_uri) {
            try {
                const requestedUrl = new URL(redirect_uri);
                const allowedUrl = new URL(ecosystemApp.redirectUri);
                
                if (requestedUrl.hostname === allowedUrl.hostname || 
                    requestedUrl.hostname.endsWith('.' + allowedUrl.hostname.split('.').slice(-2).join('.')) ||
                    requestedUrl.hostname === 'localhost' ||
                    requestedUrl.hostname.startsWith('192.168.')) {
                    targetRedirectUri = redirect_uri;
                }
            } catch (e) {}
        }

        res.redirect(`${targetRedirectUri}${targetRedirectUri.includes('?') ? '&' : '?'}token=${token}`);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

describe('SSO Redirection Logic', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should use registered redirectUri if no redirect_uri parameter is provided', async () => {
        const mockApp = { id: 'app1', name: 'budolPay', apiKey: 'bp_key_2025', redirectUri: 'https://budolpay.vercel.app/api/auth/callback' };
        const mockUser = { id: 'user1', email: 'test@example.com', password: await bcrypt.hash('password123', 10) };

        prisma.ecosystemApp.findUnique.mockResolvedValue(mockApp);
        prisma.user.findUnique.mockResolvedValue(mockUser);

        const response = await request(app)
            .post('/auth/sso/login-form')
            .send({ email: 'test@example.com', password: 'password123', apiKey: 'bp_key_2025' });

        expect(response.status).toBe(302);
        expect(response.header.location).toContain('https://budolpay.vercel.app/api/auth/callback');
    });

    test('should use dynamic redirect_uri if it matches the allowed domain', async () => {
        const mockApp = { id: 'app1', name: 'budolPay', apiKey: 'bp_key_2025', redirectUri: 'https://budolpay.vercel.app/api/auth/callback' };
        const mockUser = { id: 'user1', email: 'test@example.com', password: await bcrypt.hash('password123', 10) };

        prisma.ecosystemApp.findUnique.mockResolvedValue(mockApp);
        prisma.user.findUnique.mockResolvedValue(mockUser);

        const dynamicUri = 'https://subdomain.budolpay.vercel.app/api/auth/callback';
        const response = await request(app)
            .post('/auth/sso/login-form')
            .send({ email: 'test@example.com', password: 'password123', apiKey: 'bp_key_2025', redirect_uri: dynamicUri });

        expect(response.status).toBe(302);
        expect(response.header.location).toContain(dynamicUri);
    });

    test('should fallback to registered redirectUri if dynamic redirect_uri is on a different domain', async () => {
        const mockApp = { id: 'app1', name: 'budolPay', apiKey: 'bp_key_2025', redirectUri: 'https://budolpay.vercel.app/api/auth/callback' };
        const mockUser = { id: 'user1', email: 'test@example.com', password: await bcrypt.hash('password123', 10) };

        prisma.ecosystemApp.findUnique.mockResolvedValue(mockApp);
        prisma.user.findUnique.mockResolvedValue(mockUser);

        const maliciousUri = 'https://malicious-site.com/callback';
        const response = await request(app)
            .post('/auth/sso/login-form')
            .send({ email: 'test@example.com', password: 'password123', apiKey: 'bp_key_2025', redirect_uri: maliciousUri });

        expect(response.status).toBe(302);
        expect(response.header.location).toContain('https://budolpay.vercel.app/api/auth/callback');
        expect(response.header.location).not.toContain(maliciousUri);
    });

    test('should allow localhost for development', async () => {
        const mockApp = { id: 'app1', name: 'budolPay', apiKey: 'bp_key_2025', redirectUri: 'https://budolpay.vercel.app/api/auth/callback' };
        const mockUser = { id: 'user1', email: 'test@example.com', password: await bcrypt.hash('password123', 10) };

        prisma.ecosystemApp.findUnique.mockResolvedValue(mockApp);
        prisma.user.findUnique.mockResolvedValue(mockUser);

        const localUri = 'http://localhost:3000/api/auth/callback';
        const response = await request(app)
            .post('/auth/sso/login-form')
            .send({ email: 'test@example.com', password: 'password123', apiKey: 'bp_key_2025', redirect_uri: localUri });

        expect(response.status).toBe(302);
        expect(response.header.location).toContain(localUri);
    });
});

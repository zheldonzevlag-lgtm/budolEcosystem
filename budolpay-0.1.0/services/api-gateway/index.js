const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { createProxyMiddleware } = require('http-proxy-middleware');
const helmet = require('helmet');
const morgan = require('morgan');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env'), override: true });
const LOCAL_IP = process.env.LOCAL_IP;

if (!LOCAL_IP) {
    console.error('[Gateway] CRITICAL: LOCAL_IP environment variable is not set. Service may not be network-aware.');
}
console.log('[Gateway] DB URL:', process.env.DATABASE_URL ? 'Loaded' : 'Missing');
console.log(`[Gateway] Environment: ${process.env.NODE_ENV || 'production'}`);

const axios = require('axios');
const { Bonjour } = require('bonjour-service');
const Pusher = require('pusher');
const { prisma } = require('@budolpay/database');

/**
 * Date Utilities for Asia/Manila Standard
 */
const getNowUTC = () => new Date();
const getLegacyManilaISO = () => new Date().toISOString();
const getLegacyManilaDate = () => new Date();

const app = express();
const server = http.createServer(app);

// 1. GLOBAL MIDDLEWARE (Security, CORS, Logging) - MUST BE FIRST
app.use(cors({
    origin: '*', // Allow all for development
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true
}));
app.use(helmet({
    contentSecurityPolicy: false, // Disable for development
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(morgan('dev'));

// Custom logging middleware for deep visibility
app.use((req, res, next) => {
    const start = Date.now();
    console.log(`\x1b[36m[Gateway Request]\x1b[0m ${req.method} ${req.url} - ${new Date().toISOString()}`);
    if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
        // Only log body for non-sensitive routes
        if (!req.url.includes('login') && !req.url.includes('pin') && !req.url.includes('register')) {
            console.log(`[Gateway Body]`, JSON.stringify(req.body, null, 2));
        } else {
            console.log(`[Gateway Body] [REDACTED SENSITIVE DATA]`);
        }
    }

    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`\x1b[32m[Gateway Response]\x1b[0m ${req.method} ${req.url} ${res.statusCode} (${duration}ms)`);
    });
    next();
});

// Pusher instance (lazy loaded)
let pusher = null;

const initPusher = async (force = false) => {
    try {
        if (pusher && !force) return;

        const settings = await prisma.systemSetting.findMany({
            where: {
                key: {
                    in: [
                        'REALTIME_METHOD', 
                        'REALTIME_PUSHER_APP_ID', 
                        'REALTIME_PUSHER_KEY', 
                        'REALTIME_PUSHER_SECRET', 
                        'REALTIME_PUSHER_CLUSTER',
                        'PUSHER_APP_ID',
                        'PUSHER_KEY',
                        'PUSHER_SECRET',
                        'PUSHER_CLUSTER'
                    ]
                }
            }
        });

        const settingsMap = settings.reduce((acc, curr) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {});

        const method = settingsMap['REALTIME_METHOD'] || 'SWR';
        
        if (method === 'PUSHER' || process.env.PUSHER_APP_ID) {
            const appId = settingsMap['REALTIME_PUSHER_APP_ID'] || settingsMap['PUSHER_APP_ID'] || process.env.PUSHER_APP_ID || "2090861";
            const key = settingsMap['REALTIME_PUSHER_KEY'] || settingsMap['PUSHER_KEY'] || process.env.PUSHER_KEY || "7c449017a85bda0ae88a";
            const secret = settingsMap['REALTIME_PUSHER_SECRET'] || settingsMap['PUSHER_SECRET'] || process.env.PUSHER_SECRET || "2ceb82a5951aa226ce93";
            const cluster = settingsMap['REALTIME_PUSHER_CLUSTER'] || settingsMap['PUSHER_CLUSTER'] || process.env.PUSHER_CLUSTER || "ap1";

            if (appId && key && secret && cluster) {
                pusher = new Pusher({
                    appId,
                    key,
                    secret,
                    cluster,
                    useTLS: true
                });
                console.log(`[Pusher] Initialized successfully (Cluster: ${cluster})`);
            } else {
                console.warn('[Pusher] Configuration missing. Realtime events may not be delivered.');
                pusher = null;
            }
        } else {
            console.log(`[Realtime] Provider set to ${method}. Pusher disabled.`);
            pusher = null;
        }
    } catch (err) {
        console.error('[Pusher] Failed to initialize:', err.message);
    }
};

// Initial call
initPusher();

const JWT_SECRET = process.env.JWT_SECRET || 'GJ7Lxn0/kdV/KuZJ5xJ7Ip0RvMerrGW5n0gf44mfHgc=';

const { hasPermission, PERMISSIONS } = require('../../packages/database/rbac-config');

// Middleware to verify JWT and check for PIN requirement
const verifyToken = (req, res, next) => {
    // Development bypass: allow local requests or certain routes without full token validation if needed
    if (process.env.NODE_ENV === 'development') {
        // Still try to extract user info if token exists
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (token) {
            try {
                const decoded = jwt.verify(token, JWT_SECRET);
                req.user = decoded;
            } catch (err) {
                console.log('[Gateway] Dev Mode: Invalid token but continuing');
            }
        }
        return next();
    }

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        // If no token, we still want to proceed for public routes
        // But we ensure req.user is null
        req.user = null;
        return next();
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        
        // ... rest of the logic

        // RBAC Check for Admin Routes
        if (req.originalUrl.includes('/admin') && !hasPermission(decoded.role, PERMISSIONS.TRANSACTION_READ_ALL)) {
            console.warn(`[RBAC] Access Denied: User ${decoded.userId} with role ${decoded.role} attempted to access Admin route: ${req.originalUrl}`);
            return res.status(403).json({
                error: 'Forbidden',
                message: 'Admin privileges required for this route',
                compliance_alert: 'Unauthorized access attempts are logged under BSP Circular 808 standards.'
            });
        }

        // If the route is NOT /auth (where login happens) and it's a mobile user
        // We check if they have a PIN set if the token indicates it's missing
        const isAuthRoute = req.originalUrl.includes('/auth');
        const isMobile = decoded.type === 'MOBILE';

        if (isMobile && !isAuthRoute && decoded.hasPin === false) {
            return res.status(403).json({
                status: 'PIN_SETUP_REQUIRED',
                error: 'PIN setup required',
                message: 'You must set up a PIN before accessing this feature.'
            });
        }

        next();
    } catch (err) {
        // If token is invalid, let the microservice handle it or reject here
        // For now, we just pass to next() and let microservices do their own auth
        next();
    }
};

const PORT = process.env.PORT || 8080;
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Robust environment variable sanitization
const sanitizeUrl = (url) => {
    if (!url) return '';
    // Remove all whitespace including \r, \n, tabs, and spaces
    return url.toString().replace(/\s/g, '');
};

// Health Check for Vercel
app.get('/health', (req, res) => res.json({ 
    status: 'ok', 
    service: 'api-gateway',
    timestamp: getLegacyManilaISO()
}));

// Vercel Support: Handle API prefixes
const router = express.Router();
router.use(verifyToken); // Apply token verification to all routes in this router

app.use('/api/gateway', router);
app.use('/api/notify', router); 
app.use('/api', router); // Map /api/auth, /api/wallet, etc. to this router
app.use('/', router); // Fallback for direct calls

// Socket.io Connection Logic
io.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);
    
    socket.on('join', (userId) => {
        if (userId === 'admin') {
            socket.join('admin');
            console.log(`[Socket] Admin joined the global monitoring room`);
        } else if (userId) {
            socket.join(`user:${userId}`);
            console.log(`[Socket] User ${userId} joined their personal room`);
        }
    });

    // Support for 'subscribe' event from useRealtime hook (Standardization)
    socket.on('subscribe', (channel) => {
        if (channel === 'admin') {
            socket.join('admin');
            console.log(`[Socket] Client subscribed to admin channel`);
        } else if (channel && channel.startsWith('user:')) {
            socket.join(channel);
            console.log(`[Socket] Client subscribed to ${channel}`);
        } else if (channel) {
            socket.join(channel);
            console.log(`[Socket] Client subscribed to channel: ${channel}`);
        }
    });

    socket.on('disconnect', () => {
        console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
});

// Internal Notification Endpoint (for other services)
router.post(['/internal/notify', '/'], express.json(), async (req, res) => {
    const { userId, event, data, isAdmin } = req.body;

    // Ensure pusher is initialized if needed
    if (!pusher) await initPusher();

    // Trigger re-initialization if system config changed
    if (event === 'SYSTEM_CONFIG_CHANGED' || event === 'REALTIME_CONFIG_CHANGED') {
        console.log(`[Gateway] Realtime config change detected via ${event}. Re-initializing Pusher...`);
        await initPusher(true);
    }

    if (isAdmin) {
        // Socket.io
        io.to('admin').emit(event, data);
        
        // Pusher
        if (pusher) {
            pusher.trigger('admin', event, data);
        }
        
        console.log(`[Notification] Emitted ${event} to admin room/channel`);
        return res.json({ success: true });
    }

    if (userId && event) {
        // Socket.io
        io.to(`user:${userId}`).emit(event, data);
        
        // Pusher
        if (pusher) {
            pusher.trigger(`user-${userId}`, event, data);
        }

        console.log(`[Notification] Emitted ${event} to user:${userId}`);
        return res.json({ success: true });
    }
    res.status(400).json({ error: 'Missing userId or event' });
});

// Routes and Proxy configuration
const isConsolidated = process.env.VERCEL === '1' && !process.env.AUTH_SERVICE_URL; // Only consolidate if no specific URLs provided
const isDev = process.env.NODE_ENV === 'development';

const services = [
    {
        route: '/auth',
        target: sanitizeUrl(isDev ? `http://${LOCAL_IP}:8001` : (process.env.AUTH_SERVICE_URL || (isConsolidated ? '/api/auth' : `http://${LOCAL_IP}:8001`)))
    },
    {
        route: '/wallet',
        target: sanitizeUrl(isDev ? `http://${LOCAL_IP}:8002` : (process.env.WALLET_SERVICE_URL || (isConsolidated ? '/api/wallet' : `http://${LOCAL_IP}:8002`)))
    },
    {
        route: '/transactions',
        target: sanitizeUrl(isDev ? `http://${LOCAL_IP}:8003` : (process.env.TRANSACTION_SERVICE_URL || (isConsolidated ? '/api/tx' : `http://${LOCAL_IP}:8003`)))
    },
    {
        route: '/payments',
        target: sanitizeUrl(isDev ? `http://${LOCAL_IP}:8004` : (process.env.PAYMENT_GATEWAY_URL || (isConsolidated ? '/api/payment-gw' : `http://${LOCAL_IP}:8004`)))
    },
    {
        route: '/verification',
        target: sanitizeUrl(isDev ? `http://${LOCAL_IP}:8006` : (process.env.VERIFICATION_SERVICE_URL || (isConsolidated ? '/api/kyc' : `http://${LOCAL_IP}:8006`)))
    },
    {
        route: '/accounting',
        target: sanitizeUrl(isDev ? `http://${LOCAL_IP}:8005` : (process.env.ACCOUNTING_SERVICE_URL || (isConsolidated ? '/api/accounting' : `http://${LOCAL_IP}:8005`)))
    },
    {
        route: '/id',
        target: sanitizeUrl(isDev ? `http://${LOCAL_IP}:8000` : (isConsolidated ? '/api/id' : (process.env.ID_SERVICE_URL || `http://${LOCAL_IP}:8000`))),
        healthPath: '/api/health'
    }
];

// Internal Connectivity Test Route
router.get('/test-internal', async (req, res) => {
    const results = {};
    const bypassToken = (process.env.VERCEL_BYPASS_TOKEN || 'PRXvYV0n0D6uF8FIn02y').toString().trim();
    
    for (const service of services) {
        try {
            const target = service.target;
            if (!target || target.startsWith('http://localhost') || target.startsWith('/api')) {
                 results[service.route] = { status: 'skipped', target };
                 continue;
            }

            const healthPath = service.healthPath || '/health';
            const start = Date.now();
            const response = await axios.get(`${target}${healthPath}`, { 
                timeout: 5000,
                headers: {
                    'x-vercel-protection-bypass': bypassToken
                }
            });
            results[service.route] = {
                status: 'connected',
                target: target,
                latency: `${Date.now() - start}ms`,
                data: response.data
            };
        } catch (error) {
            results[service.route] = {
                status: 'failed',
                target: service.target,
                error: error.message,
                code: error.code,
                response: error.response ? error.response.status : 'no response'
            };
        }
    }
    res.json({
        gateway: 'ok',
        timestamp: getLegacyManilaISO(),
        connectivity: results
    });
});

// Health Check
router.get('/health', (req, res) => {
    res.json({ 
        status: 'API Gateway is healthy', 
        socketConnected: io.engine.clientsCount,
        timestamp: getLegacyManilaISO()
    });
});

// System Settings Route (Moved up for priority)
router.get('/system/settings', async (req, res) => {
    console.log(`[Gateway] Fetching system settings for: ${req.ip}`);
    try {
        const settings = await prisma.systemSetting.findMany();
        const settingsMap = settings.reduce((acc, curr) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {});

        // Format for mobile app
        const response = {
            realtime: {
                method: settingsMap['REALTIME_METHOD'] || 'SWR',
                pusher: {
                    key: settingsMap['PUSHER_KEY'],
                    cluster: settingsMap['PUSHER_CLUSTER']
                },
                socketio: {
                    url: settingsMap['SOCKETIO_URL']
                },
                swr: {
                    refreshInterval: parseInt(settingsMap['SWR_REFRESH_INTERVAL'] || '5000')
                }
            },
            maps: {
                enabledProviders: JSON.parse(settingsMap['ENABLED_MAP_PROVIDERS'] || '[]'),
                googleMapsKey: settingsMap['GOOGLE_MAPS_API_KEY'],
                geoapifyKey: settingsMap['GEOAPIFY_API_KEY'],
                radarKey: settingsMap['RADAR_API_KEY']
            }
        };

        console.log(`[Gateway] System settings fetched. Realtime method: ${response.realtime.method}`);
        res.json(response);
    } catch (err) {
        console.error('[Gateway] Failed to fetch system settings:', err.message);
        res.status(500).json({ error: 'Failed to fetch system settings' });
    }
});

// Apply Proxy Routes
services.forEach(({ route, target }) => {
    console.log(`[Gateway] Configuring proxy: ${route} -> ${target}`);
    app.use(route, createProxyMiddleware({
        target,
        changeOrigin: true,
        pathRewrite: {
            [`^${route}`]: '',
        },
        logLevel: 'debug',
        onProxyReq: (proxyReq, req, res) => {
            console.log(`[Proxy] Routing ${req.method} ${req.originalUrl} -> ${target}${proxyReq.path}`);
        },
        onError: (err, req, res) => {
            console.error(`[Proxy Error] ${route}:`, err.message);
            res.status(504).json({ error: 'Proxy Error', message: err.message });
        }
    }));
});

// 404 Handler for undefined routes
app.use((req, res) => {
    console.warn(`[Gateway] 404 - Not Found: ${req.method} ${req.originalUrl}`);
    res.status(404).json({
        error: 'NotFound',
        message: `The requested route ${req.method} ${req.path} was not found on this server.`,
        available_services: services.map(s => s.route)
    });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('[Gateway] Global Error:', err.stack);
    res.status(err.status || 500).json({
        error: err.name || 'InternalServerError',
        message: err.message || 'An unexpected error occurred in the Gateway',
        path: req.path
    });
});

// Start Server
server.listen(PORT, '0.0.0.0', () => {
    console.log(`[Gateway] Service running on http://${LOCAL_IP}:${PORT}`);
    console.log(`[Gateway] Local LAN access at http://${LOCAL_IP}:${PORT}`);

    // mDNS Advertisement for Mobile App Discovery
    if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
        try {
            const bonjour = new Bonjour();
            const service = bonjour.publish({
                name: 'budolpay-gateway',
                type: 'budolpay',
                protocol: 'tcp',
                port: PORT,
                txt: {
                    version: '1.0.0',
                    path: '/api'
                }
            });
            console.log(`[mDNS] Advertising service: ${service.name}._${service.type}._${service.protocol}.local on port ${service.port}`);
        } catch (err) {
            console.error('[mDNS] Failed to start advertisement:', err);
        }
    }
});

module.exports = app;

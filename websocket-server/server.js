require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');

const app = express();
const server = http.createServer(app);

// Security headers
app.use(helmet());

// Enable CORS for frontend requests
app.use(cors());
app.use(express.json());

const WS_ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',');
const WS_JWT_SECRET = process.env.WS_JWT_SECRET || process.env.JWT_SECRET;

if (!WS_JWT_SECRET) {
    console.error('FATAL: WS_JWT_SECRET or JWT_SECRET environment variable is required');
    process.exit(1);
}

const io = new Server(server, {
    cors: {
        origin: WS_ALLOWED_ORIGINS,
        methods: ["GET", "POST"]
    }
});

// WebSocket authentication middleware
io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) {
        return next(new Error('Authentication required'));
    }
    try {
        const decoded = jwt.verify(token, WS_JWT_SECRET);
        socket.user = decoded;
        next();
    } catch (err) {
        next(new Error('Invalid or expired token'));
    }
});

io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id} (user: ${socket.user.userId || 'unknown'})`);

    // Users can only subscribe to their own channels or admin channels
    socket.on('subscribe', (channelName) => {
        if (socket.user.role === 'ADMIN') {
            socket.join(channelName);
            console.log(`Admin ${socket.id} subscribed to ${channelName}`);
        } else if (
            channelName === `user:${socket.user.userId}` ||
            channelName === `user-${socket.user.userId}` ||
            channelName === `store:${socket.user.storeId}` ||
            channelName === `store-${socket.user.storeId}`
        ) {
            socket.join(channelName);
            console.log(`User ${socket.id} subscribed to ${channelName}`);
        } else {
            console.log(`Denied: ${socket.id} tried to subscribe to ${channelName}`);
        }
    });

    socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
    });
});

app.get('/', (req, res) => {
    res.json({ status: 'ok', service: 'budolPay WebSocket Server', endpoints: ['/trigger'] });
});

// Internal-only trigger endpoint - requires internal API key
const TRIGGER_API_KEY = process.env.TRIGGER_API_KEY;
if (!TRIGGER_API_KEY) {
    console.warn('WARNING: TRIGGER_API_KEY not set. /trigger endpoint will be disabled.');
}

app.post('/trigger', (req, res) => {
    if (!TRIGGER_API_KEY) {
        return res.status(503).json({ error: 'Trigger endpoint disabled: TRIGGER_API_KEY not configured' });
    }

    const apiKey = req.headers['x-api-key'];
    if (apiKey !== TRIGGER_API_KEY) {
        return res.status(401).json({ error: 'Unauthorized: Invalid API key' });
    }

    const { channel, event, data } = req.body;

    if (!channel || !event) {
        return res.status(400).json({ error: 'Missing channel or event' });
    }

    io.to(channel).emit(event, data);
    console.log(`Broadcasting to [${channel}]: ${event}`);

    res.json({ success: true });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
    console.log(`
    Socket.io Microservice Running!
    ----------------------------------
    PORT:    ${PORT}
    TRIGGER: /trigger
    ----------------------------------
    waiting for connections...
    `);
});

// Graceful Shutdown Handlers (Render/Production Support)
const gracefulShutdown = () => {
    console.log('Received kill signal, shutting down gracefully');
    server.close(() => {
        console.log('Closed out remaining connections');
        process.exit(0);
    });

    // Force close after 10s if not shut down
    setTimeout(() => {
        console.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

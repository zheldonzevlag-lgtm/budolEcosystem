require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// Enable CORS for frontend requests
app.use(cors());
app.use(express.json());

const io = new Server(server, {
    cors: {
        origin: "*", // Allow all origins for simplicity (Update this for production security!)
        methods: ["GET", "POST"]
    }
});

io.on('connection', (socket) => {
    console.log('🔌 Client connected:', socket.id);

    // Client subscribes to a channel (e.g., "store-123")
    socket.on('subscribe', (channelName) => {
        socket.join(channelName);
        console.log(`bucket 📥 Socket ${socket.id} subscribed to ${channelName}`);
    });

    socket.on('disconnect', () => {
        console.log('❌ Client disconnected:', socket.id);
    });
});

// Endpoint for Backend to trigger events
// The Next.js API will call this via HTTP POST
app.post('/trigger', (req, res) => {
    const { channel, event, data } = req.body;

    if (!channel || !event) {
        return res.status(400).json({ error: 'Missing channel or event' });
    }

    // Broadcast to the specific channel room
    io.to(channel).emit(event, data);
    console.log(`📢 Broadcasting to [${channel}]: ${event}`);

    res.json({ success: true });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
    console.log(`
    🚀 Socket.io Microservice Running!
    ----------------------------------
    PORT:    ${PORT}
    TRIGGER: /trigger
    ----------------------------------
    waiting for connections...
    `);
});

// Graceful Shutdown Handlers (Render/Production Support)
const gracefulShutdown = () => {
    console.log('🛑 Received kill signal, shutting down gracefully');
    server.close(() => {
        console.log('👋 Closed out remaining connections');
        process.exit(0);
    });

    // Force close after 10s if not shut down
    setTimeout(() => {
        console.error('⚠️ Could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

const { io } = require('budolshap-0.1.0/node_modules/socket.io-client');

const SOCKET_URL = 'https://budolws.duckdns.org';

console.log(`[verify-wss] Connecting to ${SOCKET_URL}...`);

const socket = io(SOCKET_URL, {
    transports: ['websocket'],
    reconnection: false,
    timeout: 10000
});

socket.on('connect', () => {
    console.log('[verify-wss] ✅ Successfully connected to WebSocket via WSS!');
    console.log('[verify-wss] Socket ID:', socket.id);
    socket.disconnect();
    process.exit(0);
});

socket.on('connect_error', (err) => {
    console.error('[verify-wss] ❌ Connection failed:', err.message);
    process.exit(1);
});

setTimeout(() => {
    console.error('[verify-wss] ❌ Connection timed out after 10s');
    process.exit(1);
}, 11000);

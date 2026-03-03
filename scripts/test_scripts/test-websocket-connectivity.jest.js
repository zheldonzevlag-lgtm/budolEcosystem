/**
 * Budol Ecosystem - WebSocket Connectivity Test
 * Purpose: Verifies Socket.io server connection and event triggers
 * Phase: Phase 3 Real-time Deployment
 */

const { io } = require('socket.io-client');
const axios = require('axios');

const SOCKET_URL = process.env.SOCKET_URL || 'http://localhost:4000';
const TRIGGER_URL = process.env.TRIGGER_URL || `${SOCKET_URL}/trigger`;

describe('WebSocket Connectivity & Logic (Phase 3)', () => {
    let socket;

    beforeAll((done) => {
        socket = io(SOCKET_URL, {
            transports: ['websocket'],
            forceNew: true,
            reconnection: false
        });

        socket.on('connect', () => {
            console.log(`[Test] ✅ Connected to ${SOCKET_URL}`);
            done();
        });

        socket.on('connect_error', (err) => {
            console.error(`[Test] ❌ Connection error: ${err.message}`);
            done(err);
        });
    });

    afterAll(() => {
        if (socket.connected) {
            socket.disconnect();
        }
    });

    test('T010: Client Subscribes to Channel', (done) => {
        const testChannel = 'test-channel-123';
        socket.emit('subscribe', testChannel);

        // No direct acknowledgment in the server.js for subscribe, 
        // so we verify by triggering an event next.
        done();
    });

    test('T011: Server Broadcasts Triggered Event', (done) => {
        const channel = 'order-updates';
        const eventName = 'status-changed';
        const testData = { orderId: 'ORD-TEST-001', status: 'SHIPPED' };

        // Subscribe to the channel first
        socket.emit('subscribe', channel);

        // Listen for the event
        socket.on(eventName, (data) => {
            try {
                expect(data).toEqual(testData);
                console.log(`[Test] 📢 Received event: ${eventName}`);
                done();
            } catch (error) {
                done(error);
            }
        });

        // Trigger the event via HTTP POST (simulating backend)
        // We wrap in a small timeout to ensure subscription is processed
        setTimeout(async () => {
            try {
                const response = await axios.post(TRIGGER_URL, {
                    channel,
                    event: eventName,
                    data: testData
                });
                expect(response.status).toBe(200);
                expect(response.data.success).toBe(true);
            } catch (error) {
                console.error(`[Test] ❌ Trigger failed: ${error.message}`);
                // Don't call done(error) here, let the socket timeout handle it if breadcast fails
            }
        }, 500);
    }, 10000); // 10s timeout
});

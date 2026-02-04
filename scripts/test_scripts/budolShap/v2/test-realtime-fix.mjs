import fetch from 'node-fetch';
import { io } from 'socket.io-client';

async function testRealtimeFix() {
    console.log('--- Testing Realtime Audit Log Fix ---');
    
    const GATEWAY_URL = 'http://localhost:8080';
    const INTERNAL_KEY = 'bs_key_2025';
    
    // 1. Connect to Socket.io
    console.log('1. Connecting to Socket.io Gateway...');
    const socket = io(GATEWAY_URL, {
        reconnectionAttempts: 3,
        timeout: 5000
    });

    socket.on('connect', () => {
        console.log('✅ Connected to Gateway');
        
        // 2. Subscribe to admin channel
        console.log('2. Subscribing to admin channel...');
        socket.emit('subscribe', 'admin');
    });

    socket.on('AUDIT_LOG_CREATED', (data) => {
        console.log('🎉 RECEIVED REALTIME AUDIT LOG:', data);
        process.exit(0);
    });

    socket.on('connect_error', (err) => {
        console.error('❌ Socket Connection Error:', err.message);
    });

    // 3. Trigger a dummy audit log event via internal notify
    setTimeout(async () => {
        console.log('3. Triggering dummy audit log event...');
        try {
            const payload = {
                event: 'AUDIT_LOG_CREATED',
                data: {
                    id: 'test-log-' + Date.now(),
                    action: 'LOGIN',
                    user: { name: 'Test User', email: 'test@example.com' },
                    timestamp: new Date().toISOString()
                },
                isAdmin: true
            };

            const res = await fetch(`${GATEWAY_URL}/internal/notify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-internal-key': INTERNAL_KEY
                },
                body: JSON.stringify(payload)
            });

            const result = await res.json();
            console.log('Gateway response:', result);
        } catch (error) {
            console.error('❌ Failed to trigger event:', error.message);
        }
    }, 2000);

    // Timeout after 10 seconds
    setTimeout(() => {
        console.error('❌ Timeout: Event not received');
        process.exit(1);
    }, 10000);
}

testRealtimeFix();

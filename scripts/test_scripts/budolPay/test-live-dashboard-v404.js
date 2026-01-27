const axios = require('axios');
const { io } = require('socket.io-client');

const LOCAL_IP = process.env.LOCAL_IP || 'localhost';
const GATEWAY_URL = process.env.GATEWAY_URL || `http://${LOCAL_IP}:8080`;
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || `http://${LOCAL_IP}:8001`;

async function testLiveDashboard() {
    console.log('--- Phase 5: Live Dashboard Real-time Test ---');
    
    // 1. Connect to Socket.io as Admin
    const socket = io(GATEWAY_URL);
    
    await new Promise((resolve) => {
        socket.on('connect', () => {
            console.log('[Socket] Connected to Gateway');
            socket.emit('join', 'admin');
            console.log('[Socket] Joined admin room');
            // Give it a moment to process the join
            setTimeout(resolve, 1000);
        });
    });

    socket.on('connect_error', (err) => {
        console.error('[Socket] Connection Error:', err.message);
    });

    let newUserEventReceived = false;

    socket.on('new_user', (data) => {
        console.log('[Socket] RECEIVED new_user event:', JSON.stringify(data, null, 2));
        newUserEventReceived = true;
    });

    // Also listen for other events just in case
    socket.onAny((event, ...args) => {
        console.log(`[Socket] Received event "${event}":`, args);
    });

    // 2. Simulate User Registration
    const testUser = {
        phoneNumber: `0999${Math.floor(1000000 + Math.random() * 9000000)}`,
        firstName: 'LiveTest',
        lastName: 'User',
        pin: '123456'
    };

    console.log(`[HTTP] Registering test user: ${testUser.phoneNumber}`);
    
    try {
        // 2a. Direct Gateway Notification Test
        console.log('[Test] Phase 5a: Testing Direct Gateway Notification...');
        await axios.post(`${GATEWAY_URL}/internal/notify`, {
            isAdmin: true,
            event: 'new_user',
            data: { count: 999, user: { firstName: 'GatewayDirect', lastName: 'Test' } }
        });
        
        console.log('[Test] Waiting 2 seconds for Direct event...');
        await new Promise(resolve => setTimeout(resolve, 2000));

        if (newUserEventReceived) {
            console.log('✅ SUCCESS: Gateway Direct Notification works!');
            newUserEventReceived = false; // Reset for next test
        } else {
            console.log('❌ FAILED: Gateway Direct Notification did NOT work.');
        }

        // 2b. Simulate User Registration
        console.log('[Test] Phase 5b: Testing Auth-Service Registration...');
        const response = await axios.post(`${AUTH_SERVICE_URL}/register`, testUser);
        console.log('[HTTP] Registration response:', response.data);
        
        // Wait for event to propagate
        console.log('[Test] Waiting 3 seconds for Socket.io event...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        if (newUserEventReceived) {
            console.log('✅ SUCCESS: Live dashboard received new_user event!');
        } else {
            console.log('❌ FAILED: Live dashboard did NOT receive new_user event.');
        }

    } catch (error) {
        console.error('❌ Error during registration:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
    } finally {
        socket.disconnect();
        process.exit(newUserEventReceived ? 0 : 1);
    }
}

testLiveDashboard();

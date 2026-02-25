require('dotenv').config();
const Lalamove = require('../services/lalamove');
const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function replayWebhook() {
    try {
        // 1. Hardcoded Lalamove Booking ID from user's latest order (Image 131-1)
        const lalamoveOrderId = '3390701368968175813';
        console.log(`Using latest Lalamove Order ID: ${lalamoveOrderId}`);

        // 2. Initialize Service to get secrets
        const lalamove = new Lalamove();

        // 2b. Need crypto
        const crypto = require('crypto');

        // 3. Construct Payload (mimicking the user's valid webhook)
        const timestamp = new Date().getTime().toString();
        const payload = {
            eventType: 'DRIVER_ASSIGNED',
            eventVersion: 'v3',
            eventId: crypto.randomUUID(),
            timestamp: Number(timestamp),
            data: {
                driver: {
                    driverId: '80557',
                    name: 'TestDriver 34567',
                    phone: '+631001234567',
                    plateNumber: 'VP9946964',
                    photo: '',
                    vehicleType: 'VAN' // Explicitly adding this to fix the icon too!
                },
                location: {
                    lat: 14.5500, // Manila coordinates for realism
                    lng: 121.0300
                },
                order: {
                    orderId: lalamoveOrderId
                }
            }
        };

        // 4. Generate Signature
        const signature = lalamove.generateSignature('POST', '', timestamp, JSON.stringify(payload)); // Webhook signature logic might be different?

        // Wait, Lalamove Service generateSignature is for OUTGOING API calls.
        // Incoming webhook verification uses: crypto.createHmac('sha256', this.webhookSecret).update(JSON.stringify(payload)).digest('hex')

        const hmac = crypto.createHmac('sha256', process.env.LALAMOVE_WEBHOOK_SECRET);
        const bodyContent = JSON.stringify(payload);
        const webhookSignature = hmac.update(bodyContent).digest('hex');

        console.log('Sending Self-Correction Webhook...');
        console.log('Payload:', JSON.stringify(payload, null, 2));

        // 5. Send Request
        const response = await axios.post('http://localhost:3000/api/webhooks/lalamove', payload, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `hmac ${webhookSignature}`, // Lalamove uses this format?
                // Checking lalamove.js verifyWebhookSignature:
                // It just checks if signature === expected. 
                // But how is it passed? Usually header 'X-Lalamove-Signature' or similar.
                // Let's check webhooks/lalamove/route.js to see how it extracts it.
                'x-lalamove-signature': webhookSignature,
                'x-lalamove-timestamp': timestamp
            }
        });

        console.log('Webhook Response:', response.status, response.data);

    } catch (error) {
        console.error('Error simulating webhook:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
    } finally {
        await prisma.$disconnect();
    }
}

replayWebhook();

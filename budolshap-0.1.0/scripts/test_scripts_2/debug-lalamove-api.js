/**
 * Debug script to see the full Lalamove API response
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const pathModule = require('path');
const axios = require('axios');
const crypto = require('crypto');

// Load production environment variables
const envPath = pathModule.join(__dirname, '..', '.env.production');
const envContent = fs.readFileSync(envPath, 'utf-8');

// Parse environment variables
const dbUrlMatch = envContent.match(/DATABASE_URL="([^"]+)"/);
const DATABASE_URL = dbUrlMatch[1].replace(/\n/g, '');

// Load Lalamove credentials
const clientIdMatch = envContent.match(/LALAMOVE_CLIENT_ID="?([^"\n]+)"?/);
const clientSecretMatch = envContent.match(/LALAMOVE_CLIENT_SECRET="?([^"\n]+)"?/);
const envMatch = envContent.match(/LALAMOVE_ENV="?([^"\n]+)"?/);

const LALAMOVE_CLIENT_ID = clientIdMatch ? clientIdMatch[1] : '';
const LALAMOVE_CLIENT_SECRET = clientSecretMatch ? clientSecretMatch[1] : '';
const LALAMOVE_ENV = envMatch ? envMatch[1] : 'sandbox';

const baseUrl = LALAMOVE_ENV === 'production'
    ? 'https://rest.lalamove.com'
    : 'https://rest.sandbox.lalamove.com';

const prisma = new PrismaClient({
    datasources: { db: { url: DATABASE_URL } }
});

function generateSignature(method, apiPath, timestamp, body = '') {
    const CRLF = String.fromCharCode(13, 10);
    const rawSignature = timestamp + CRLF + method + CRLF + apiPath + CRLF + CRLF + body;
    const signature = crypto
        .createHmac('sha256', LALAMOVE_CLIENT_SECRET)
        .update(rawSignature)
        .digest('hex');
    return signature;
}

async function main() {
    console.log('🔍 Finding latest Lalamove order...\n');

    const order = await prisma.order.findFirst({
        where: {
            shipping: {
                path: ['provider'],
                equals: 'lalamove'
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    if (!order) {
        console.log('❌ No Lalamove orders found');
        return;
    }

    const bookingId = order.shipping?.bookingId;
    console.log(`✅ Found order: ${order.id}`);
    console.log(`   Booking ID: ${bookingId}\n`);

    // Make direct API call to see full response
    console.log('📡 Fetching full order details from Lalamove API...\n');

    try {
        const timestamp = new Date().getTime().toString();
        const apiPath = `/v3/orders/${bookingId}`;
        const signature = generateSignature('GET', apiPath, timestamp);

        const response = await axios.get(`${baseUrl}${apiPath}`, {
            headers: {
                'Authorization': `hmac ${LALAMOVE_CLIENT_ID}:${timestamp}:${signature}`,
                'Accept': 'application/json',
                'Market': 'PH'
            }
        });

        console.log('✅ Full API Response saved to lalamove-api-response.json');

        // Save to file
        fs.writeFileSync(
            pathModule.join(__dirname, '..', 'lalamove-api-response.json'),
            JSON.stringify(response.data, null, 2)
        );

        // Show just the driver-related fields
        console.log('\n=== DRIVER INFORMATION ===');
        console.log('driverInfo:', response.data.driverInfo);
        console.log('driver:', response.data.driver);
        console.log('driverId:', response.data.driverId);
        console.log('status:', response.data.status);

    } catch (error) {
        console.error('\n❌ Error:', error.response?.data || error.message);
    }

    await prisma.$disconnect();
}

main();

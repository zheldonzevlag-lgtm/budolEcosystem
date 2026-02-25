import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Debugging Order Statuses ---');
    const order = await prisma.order.findFirst({
        where: {
            user: {
                name: { contains: 'Natasha' }
            }
        },
        include: {
            user: true
        }
    });

    if (!order) {
        console.log('No order found for Natasha');
        return;
    }

    console.log('Order ID:', order.id);
    console.log('Main Order Status:', order.status);
    console.log('Internal Shipping Status:', order.shipping?.status);

    if (order.shipping?.bookingId) {
        console.log('Booking ID:', order.shipping.bookingId);

        // Manual Track via API (Sandbox)
        const apiKey = process.env.LALAMOVE_CLIENT_ID;
        const apiSecret = process.env.LALAMOVE_CLIENT_SECRET;
        const baseUrl = 'https://rest.sandbox.lalamove.com';
        const timestamp = Date.now().toString();
        const method = 'GET';
        const path = `/v3/orders/${order.shipping.bookingId}`;
        const CRLF = String.fromCharCode(13, 10);
        const rawSignature = timestamp + CRLF + method + CRLF + path + CRLF + CRLF + '';
        const signature = crypto.createHmac('sha256', apiSecret).update(rawSignature).digest('hex');

        try {
            console.log('Fetching latest status from Lalamove API...');
            const response = await axios.get(`${baseUrl}${path}`, {
                headers: {
                    'Authorization': `hmac ${apiKey}:${timestamp}:${signature}`,
                    'Market': 'PH',
                    'Accept': 'application/json'
                }
            });
            console.log('Lalamove API Status:', response.data.data.status);
            console.log('Lalamove API Full Data (Status/Driver):', JSON.stringify({
                status: response.data.data.status,
                driver: response.data.data.driver
            }, null, 2));
        } catch (err) {
            console.error('Failed to fetch from Lalamove API:', err.response?.data || err.message);
        }
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

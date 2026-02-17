import fetch from 'node-fetch';
import { prisma } from '../../budolshap-0.1.0/lib/prisma.js';

const BASE_URL = 'http://localhost:3001'; // User screenshot shows port 3001

async function run() {
    console.log('Starting API Endpoint Test...');
    
    // 1. Create Test User in DB directly (to get a valid userId)
    const testUserId = `userapitest${Date.now()}`;
    try {
        await prisma.user.create({
            data: {
                id: testUserId,
                email: `apitest${Date.now()}@example.com`,
                name: 'API Test User',
                password: 'password',
                phoneNumber: `09${Date.now().toString().slice(-9)}`,
                image: ''
            }
        });
        console.log('Test User Created:', testUserId);

        // 2. Create Dummy Product
        const productId = `prodapi${Date.now()}`;
        const variationId = 'VARTEST';
        
        // We need a store first
        const store = await prisma.store.create({
            data: {
                name: 'API Test Store',
                description: 'Desc',
                userId: testUserId,
                address: 'Addr',
                username: `storeapi${Date.now()}`,
                email: `storeapi${Date.now()}@example.com`,
                contact: '09123456789',
                logo: 'logo.png'
            }
        });

        await prisma.product.create({
            data: {
                id: productId,
                name: 'API Product',
                description: 'Desc',
                price: 100,
                storeId: store.id,
                category: 'Test',
                images: [],
                inStock: true,
                mrp: 120,
                variation_matrix: [{ sku: variationId, price: 110, stock: 50 }]
            }
        });
        console.log('Test Product Created:', productId);

        // 3. Test PUT /api/cart (Sync)
        console.log('Testing PUT /api/cart...');
        const cartPayload = {
            userId: testUserId,
            cart: {
                [`${productId}_${variationId}`]: 5,
                [productId]: 2
            }
        };

        const putResponse = await fetch(`${BASE_URL}/api/cart`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cartPayload)
        });

        if (!putResponse.ok) {
            const txt = await putResponse.text();
            throw new Error(`PUT failed: ${putResponse.status} ${txt}`);
        }

        const putResult = await putResponse.json();
        console.log('PUT Result:', putResult);

        // 4. Test GET /api/cart (Fetch)
        console.log('Testing GET /api/cart...');
        const getResponse = await fetch(`${BASE_URL}/api/cart?userId=${testUserId}`);
        
        if (!getResponse.ok) {
            const txt = await getResponse.text();
            throw new Error(`GET failed: ${getResponse.status} ${txt}`);
        }

        const getResult = await getResponse.json();
        console.log('GET Result:', getResult);

        // 5. Verification
        if (getResult[`${productId}_${variationId}`] !== 5) {
            throw new Error(`Variation quantity mismatch! Expected 5, got ${getResult[`${productId}_${variationId}`]}`);
        }
        if (getResult[productId] !== 2) {
            throw new Error(`Standard product quantity mismatch! Expected 2, got ${getResult[productId]}`);
        }

        console.log('SUCCESS: API Endpoints are working correctly.');

    } catch (error) {
        console.error('TEST FAILED:', error);
    } finally {
        // Cleanup
        console.log('Cleaning up...');
        await prisma.user.delete({ where: { id: testUserId } }).catch(() => {});
        await prisma.$disconnect();
    }
}

run();

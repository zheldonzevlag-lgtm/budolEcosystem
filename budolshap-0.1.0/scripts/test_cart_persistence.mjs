
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const PORTS = [3000, 3001, 8000, 8080];

async function findBaseUrl() {
    for (const port of PORTS) {
        const url = `http://127.0.0.1:${port}/api/cart`;
        try {
            const res = await fetch(url + '?userId=probe');
            if (res.status !== 404 && res.status !== 500) { 
                console.log(`Found active server at ${url}`);
                return url;
            }
        } catch (e) {
            // Connection refused
        }
    }
    throw new Error('Could not find running server on common ports');
}

async function runTest() {
    console.log('--- Starting Cart Persistence Test (End-to-End) ---');
    
    let userId = null;
    let storeId = null;
    let productId = null;

    try {
        const BASE_URL = await findBaseUrl();
        console.log('Using Base URL:', BASE_URL);

        // 1. Setup Test Data (User, Store, Product)
        console.log('Setting up test data...');
        
        // Create User
        const user = await prisma.user.create({
            data: {
                id: `user_test_${Date.now()}`,
                email: `test_cart_${Date.now()}@example.com`,
                password: 'password123',
                name: 'Test User Cart Persistence',
                phoneNumber: `09${Date.now().toString().slice(-9)}`,
                image: ''
            }
        });
        userId = user.id;
        console.log('User created:', userId);

        // Create Store (for Product)
        const store = await prisma.store.create({
            data: {
                name: `Test Store ${Date.now()}`,
                description: 'Test Store Description',
                userId: userId, // Seller is the same user for simplicity
                address: 'Test Address',
                username: `store_${Date.now()}`,
                logo: 'logo.jpg',
                email: `store_${Date.now()}@example.com`,
                contact: '09123456789'
            }
        });
        storeId = store.id;
        console.log('Store created:', storeId);

        // Create Product
        const product = await prisma.product.create({
            data: {
                name: 'Test Product Persistence',
                description: 'Test Description',
                price: 100,
                mrp: 120,
                category: 'Test',
                images: ['test.jpg'],
                storeId: storeId,
                inStock: true
            }
        });
        productId = product.id;
        console.log('Product created:', productId);

        // 2. Prepare Cart Payload
        const TEST_ITEMS = {
            [productId]: 2
            // We can add variation logic later if needed
        };

        // 3. PUT (Save Cart) - Simulating Logout Sync
        console.log('Simulating Logout Sync (PUT)...');
        const putResponse = await fetch(BASE_URL, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: userId,
                cart: TEST_ITEMS
            })
        });

        if (!putResponse.ok) {
            const errorData = await putResponse.text();
            console.error('PUT Error Body:', errorData);
            throw new Error(`PUT failed: ${putResponse.status} ${putResponse.statusText}`);
        }
        const putResult = await putResponse.json();
        console.log('PUT Result:', putResult);

        // Verify keys match
        const savedKeys = Object.keys(putResult);
        const expectedKeys = Object.keys(TEST_ITEMS);
        if (savedKeys.length !== expectedKeys.length) {
            console.error('Mismatch in item count!', savedKeys.length, 'vs', expectedKeys.length);
        } else {
            console.log('Item count matches.');
        }

        // 4. GET (Fetch Cart) - Simulating Login Fetch
        console.log('Simulating Login Fetch (GET)...');
        const getResponse = await fetch(`${BASE_URL}?userId=${userId}`);
        
        if (!getResponse.ok) {
            throw new Error(`GET failed: ${getResponse.status} ${getResponse.statusText}`);
        }
        const getResult = await getResponse.json();
        console.log('GET Result:', getResult);

        // Verify content
        let mismatch = false;
        for (const [key, qty] of Object.entries(TEST_ITEMS)) {
            if (getResult[key] !== qty) {
                console.error(`Mismatch for ${key}: expected ${qty}, got ${getResult[key]}`);
                mismatch = true;
            }
        }

        if (!mismatch) {
            console.log('SUCCESS: Cart persisted and retrieved correctly.');
        } else {
            console.error('FAILURE: Data mismatch.');
        }

    } catch (error) {
        console.error('Test Failed:', error);
    } finally {
        console.log('Cleaning up...');
        // Cleanup in reverse order of dependencies
        // CartItem cascades from Cart and Product
        // Cart cascades from User
        // Product cascades from Store
        // Store cascades from User (userId)
        
        if (productId) {
            try {
                await prisma.product.delete({ where: { id: productId } });
                console.log('Product deleted');
            } catch (e) { console.error('Error deleting product', e); }
        }
        if (storeId) {
            try {
                await prisma.store.delete({ where: { id: storeId } });
                console.log('Store deleted');
            } catch (e) { console.error('Error deleting store', e); }
        }
        if (userId) {
            try {
                // This deletes the user, and via cascade, the Store (if not deleted), Cart, and CartItems
                await prisma.user.delete({ where: { id: userId } });
                console.log('User deleted');
            } catch (e) { console.error('Error deleting user', e); }
        }
        
        await prisma.$disconnect();
    }
}

runTest();

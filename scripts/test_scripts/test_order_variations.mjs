import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env manually
const envPath = path.resolve(__dirname, '../../budolshap-0.1.0/.env');
console.log('Loading .env from:', envPath);
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
            const value = valueParts.join('=').trim().replace(/^"|"$/g, '');
            process.env[key.trim()] = value;
        }
    });
}

async function run() {
    console.log('Connecting to DB...');
    const { prisma } = await import('../../budolshap-0.1.0/lib/prisma.js');
    
    const testEmail = `test_order_${Date.now()}@example.com`;
    let userId = null;
    let storeId = null;
    let productId = null;
    let cartId = null;

    try {
        // 1. Create Test User
        console.log('Creating test user...');
        const user = await prisma.user.create({
            data: {
                id: `user_${Date.now()}`,
                email: testEmail,
                password: 'password123',
                name: 'Test Order User',
                phoneNumber: `09${Date.now().toString().slice(-9)}`,
                image: ''
            }
        });
        userId = user.id;

        // 2. Create Store
        console.log('Creating test store...');
        const store = await prisma.store.create({
            data: {
                name: 'Test Store Order',
                description: 'Test Description',
                userId: userId,
                address: 'Test Address',
                username: `store_order_${Date.now()}`,
                logo: 'logo.jpg',
                email: `store_${Date.now()}@example.com`,
                contact: '09123456789'
            }
        });
        storeId = store.id;

        // 3. Create Product with Variations
        console.log('Creating test product...');
        const product = await prisma.product.create({
            data: {
                name: 'Test Product Order Variations',
                description: 'Test Description',
                price: 100,
                mrp: 120,
                inStock: true,
                category: 'Test',
                images: ['test.jpg'],
                storeId: storeId,
                variation_matrix: [
                    { sku: 'VAR-A', price: 100, stock: 10 },
                    { sku: 'VAR-B', price: 120, stock: 10 }
                ]
            }
        });
        productId = product.id;

        // 4. Create Cart and Add Items
        console.log('Creating cart...');
        const cart = await prisma.cart.create({
            data: { userId: userId }
        });
        cartId = cart.id;

        console.log('Adding items to cart (VAR-A and VAR-B)...');
        await prisma.cartItem.createMany({
            data: [
                { cartId: cartId, productId: productId, variationId: 'VAR-A', quantity: 1 },
                { cartId: cartId, productId: productId, variationId: 'VAR-B', quantity: 1 }
            ]
        });

        // Verify Cart
        const cartItemsBefore = await prisma.cartItem.findMany({ where: { cartId: cartId } });
        console.log('Cart Items Before Order:', cartItemsBefore.length);
        if (cartItemsBefore.length !== 2) throw new Error('Failed to add items to cart');

        // 5. Simulate Order Creation (Checkout VAR-A only)
        console.log('Simulating Checkout for VAR-A...');
        const orderItems = [
            { productId: productId, variationId: 'VAR-A', quantity: 1 }
        ];

        // 5.1 Cleanup Logic (Replicating the fix)
        console.log('Running Cleanup Logic...');
        const cartCleanupConditions = orderItems.map(item => ({
            productId: item.productId,
            variationId: item.variationId || null
        }));

        const deleteResult = await prisma.cartItem.deleteMany({
            where: {
                cart: { userId },
                OR: cartCleanupConditions
            }
        });
        console.log('Deleted count:', deleteResult.count);

        // 6. Verify Cart State
        const cartItemsAfter = await prisma.cartItem.findMany({ where: { cartId: cartId } });
        console.log('Cart Items After Order:', cartItemsAfter.map(i => `${i.productId} - ${i.variationId}`));
        
        if (cartItemsAfter.length !== 1) {
            throw new Error(`Expected 1 item remaining, found ${cartItemsAfter.length}`);
        }
        if (cartItemsAfter[0].variationId !== 'VAR-B') {
            throw new Error(`Expected VAR-B to remain, found ${cartItemsAfter[0].variationId}`);
        }
        console.log('SUCCESS: Only VAR-A was removed. VAR-B remains.');

        // 7. Simulate Order Cancellation (Restoring VAR-A)
        console.log('Simulating Order Cancellation (Restore VAR-A)...');
        
        // Check if item exists (Replicating fix)
        const itemToRestore = { productId: productId, variationId: 'VAR-A', quantity: 1 };
        
        const existingItem = await prisma.cartItem.findFirst({
            where: {
                cartId: cartId,
                productId: itemToRestore.productId,
                variationId: itemToRestore.variationId
            }
        });

        if (existingItem) {
            await prisma.cartItem.update({
                where: { id: existingItem.id },
                data: { quantity: existingItem.quantity + itemToRestore.quantity }
            });
        } else {
            await prisma.cartItem.create({
                data: {
                    cartId: cartId,
                    productId: itemToRestore.productId,
                    variationId: itemToRestore.variationId,
                    quantity: itemToRestore.quantity
                }
            });
        }

        // 8. Verify Restoration
        const cartItemsFinal = await prisma.cartItem.findMany({ where: { cartId: cartId } });
        console.log('Cart Items Final:', cartItemsFinal.map(i => `${i.productId} - ${i.variationId}`));
        
        if (cartItemsFinal.length !== 2) {
            throw new Error('Failed to restore item');
        }
        const restoredItem = cartItemsFinal.find(i => i.variationId === 'VAR-A');
        if (!restoredItem) throw new Error('VAR-A not found in cart');
        
        console.log('SUCCESS: VAR-A restored correctly.');

    } catch (error) {
        console.error('TEST FAILED:', error);
    } finally {
        // Cleanup
        console.log('Cleaning up...');
        if (userId) await prisma.user.delete({ where: { id: userId } }).catch(e => console.error('Cleanup user failed', e));
        await prisma.$disconnect();
    }
}

run();

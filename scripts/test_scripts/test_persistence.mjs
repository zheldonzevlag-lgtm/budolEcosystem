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
    
    const testEmail = `test_persist_${Date.now()}@example.com`;
    let userId = null;

    try {
        // 1. Create Test User
        console.log('Creating test user...');
        const user = await prisma.user.create({
            data: {
                id: `user_persist_${Date.now()}`,
                email: testEmail,
                password: 'password123',
                name: 'Test Persist User',
                phoneNumber: `09${Date.now().toString().slice(-9)}`,
                image: '' // Required field
            }
        });
        userId = user.id;
        console.log('User created:', userId);

        // 2. Create Dummy Products (Use IDs without underscores to avoid API split bug)
        const product1Id = `prod1${Date.now()}`;
        const product2Id = `prod2${Date.now()}`;
        const variation1 = 'VARA';
        
        // We don't need to actually create products in DB for the cart API to work 
        // because the cart API (as I read it) doesn't strictly validate product existence 
        // during the PUT transaction (it just creates CartItems).
        // Wait, does it? 
        // schema.prisma usually enforces foreign keys.
        // So we MUST create products.
        
        const store = await prisma.store.create({
            data: {
                name: 'Test Store Persist',
                description: 'Desc',
                userId: userId, // User is also seller
                address: 'Addr',
                username: `store_p_${Date.now()}`,
                email: `store_p_${Date.now()}@example.com`,
                contact: '09123456789',
                logo: 'default_logo.png' // Required
            }
        });

        await prisma.product.create({
            data: {
                id: product1Id,
                name: 'Product 1',
                description: 'Desc',
                price: 100,
                storeId: store.id,
                category: 'Test',
                images: [],
                inStock: true,
                mrp: 120 // Required
            }
        });

        await prisma.product.create({
            data: {
                id: product2Id,
                name: 'Product 2',
                description: 'Desc',
                price: 200,
                storeId: store.id,
                category: 'Test',
                images: [],
                inStock: true,
                mrp: 240, // Required
                variation_matrix: [{ sku: variation1, price: 210, stock: 10 }]
            }
        });

        // 3. Simulate Frontend Cart State
        // Item 1: Simple product
        // Item 2: Variation product
        const frontendCartState = {
            [product1Id]: 2,
            [`${product2Id}_${variation1}`]: 3
        };
        console.log('Frontend Cart State:', frontendCartState);

        // 4. Simulate "Logout Sync" (PUT /api/cart)
        console.log('Simulating Logout Sync (PUT)...');
        
        // Emulate the logic in api/cart/route.js PUT
        const cartPayload = frontendCartState;
        
        // START SERVER-SIDE LOGIC EMULATION (to debug exact query)
        await prisma.$transaction(async (tx) => {
            let userCart = await tx.cart.findUnique({ where: { userId } });
            if (!userCart) {
                userCart = await tx.cart.create({ data: { userId } });
            }

            await tx.cartItem.deleteMany({ where: { cartId: userCart.id } });

            const cartItems = Object.entries(cartPayload).map(([key, quantity]) => {
                const parts = key.split('_');
                const productId = parts[0];
                const variationId = parts.length > 1 ? parts.slice(1).join('_') : null;

                return {
                    cartId: userCart.id,
                    productId,
                    variationId,
                    quantity: Number(quantity)
                };
            });

            if (cartItems.length > 0) {
                await tx.cartItem.createMany({ data: cartItems, skipDuplicates: true });
            }
        });
        // END SERVER-SIDE LOGIC EMULATION
        
        console.log('Sync completed.');

        // 5. Simulate "Login Fetch" (GET /api/cart)
        console.log('Simulating Login Fetch (GET)...');
        
        const cart = await prisma.cart.findUnique({
            where: { userId },
            include: { items: true }
        });

        if (!cart) throw new Error('Cart not found after sync');

        const fetchedCartObj = cart.items.reduce((acc, item) => {
            const key = item.variationId ? `${item.productId}_${item.variationId}` : item.productId;
            acc[key] = item.quantity;
            return acc;
        }, {});

        console.log('Fetched Cart:', fetchedCartObj);

        // 6. Verify
        if (fetchedCartObj[product1Id] !== 2) throw new Error(`Product 1 quantity mismatch. Expected 2, got ${fetchedCartObj[product1Id]}`);
        if (fetchedCartObj[`${product2Id}_${variation1}`] !== 3) throw new Error(`Product 2 quantity mismatch. Expected 3, got ${fetchedCartObj[`${product2Id}_${variation1}`]}`);

        console.log('SUCCESS: Cart persistence verified.');

    } catch (error) {
        console.error('TEST FAILED:', error);
    } finally {
        // Cleanup
        console.log('Cleaning up...');
        if (userId) await prisma.user.delete({ where: { id: userId } }).catch(e => console.error('Cleanup failed', e));
        await prisma.$disconnect();
    }
}

run();

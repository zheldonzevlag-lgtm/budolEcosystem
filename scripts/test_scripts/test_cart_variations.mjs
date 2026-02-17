import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Setup __dirname for ES modules
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
            // Only set if not already set (or force set?) - let's force set for test
            process.env[key.trim()] = value;
        }
    });
} else {
    console.warn('Warning: .env file not found at', envPath);
}

// Import prisma after env is loaded
// Note: We need to use dynamic import if we want to ensure env is loaded first,
// but since we are at top level, we just do the env loading before importing if possible.
// But imports are hoisted.
// So we should use dynamic import for prisma.

async function run() {
    console.log('Connecting to DB...');
    // Update path to point to budolshap-0.1.0/lib/prisma.js
    const { prisma } = await import('../../budolshap-0.1.0/lib/prisma.js');
    
    const testEmail = `test_cart_${Date.now()}@example.com`;
    let userId = null;
    let productId = null;
    let cartId = null;
    let storeId = null;

    try {
        // 1. Create Test User
        console.log('Creating test user...');
        const user = await prisma.user.create({
            data: {
                id: `user_${Date.now()}`,
                email: testEmail,
                password: 'password123',
                name: 'Test User Cart',
                phoneNumber: `09${Date.now().toString().slice(-9)}`,
                image: ''
            }
        });
        userId = user.id;
        console.log('User created:', userId);

        // 1.5 Create Store (Required for Product)
        console.log('Creating test store...');
        const store = await prisma.store.create({
            data: {
                name: 'Test Store',
                description: 'Test Store Description',
                userId: userId,
                address: 'Test Address',
                username: `store_${Date.now()}`,
                logo: 'logo.jpg',
                email: 'store@example.com',
                contact: '09123456789'
            }
        });
        storeId = store.id;

        // 2. Create Test Product with Variations
        console.log('Creating test product...');
        const product = await prisma.product.create({
            data: {
                name: 'Test Product Variations',
                description: 'Test Description',
                price: 100,
                mrp: 120,
                inStock: true,
                category: 'Test',
                images: ['test.jpg'],
                storeId: storeId, // Link to store instead of sellerId directly if schema requires it
                variation_matrix: [
                    { sku: 'VAR-1', price: 100, stock: 10, tier_index: [0] },
                    { sku: 'VAR-2', price: 120, stock: 10, tier_index: [1] }
                ],
                tier_variations: [
                    { name: 'Color', options: ['Red', 'Blue'] }
                ]
            }
        });
        productId = product.id;
        console.log('Product created:', productId);

        // 3. Mimic "Add to Cart" logic (API PUT)
        console.log('Testing Cart Update Logic...');
        
        // Frontend sends:
        const cartPayload = {
            [`${productId}_VAR-1`]: 2,
            [`${productId}_VAR-2`]: 1,
            [productId]: 5 // Base product (no variation)
        };

        // API Logic mimic:
        // Get or Create Cart
        let userCart = await prisma.cart.findUnique({
            where: { userId }
        });

        if (!userCart) {
            userCart = await prisma.cart.create({
                data: { userId }
            });
        }
        cartId = userCart.id;

        // Transform payload
        const cartItems = Object.entries(cartPayload).map(([key, quantity]) => {
            const parts = key.split('_');
            const pId = parts[0];
            const vId = parts.length > 1 ? parts.slice(1).join('_') : null;
            return { cartId: userCart.id, productId: pId, variationId: vId, quantity: Number(quantity) };
        });

        console.log('Transformed items:', cartItems);

        // Atomic Transaction
        await prisma.$transaction([
            prisma.cartItem.deleteMany({ where: { cartId: userCart.id } }),
            prisma.cartItem.createMany({ data: cartItems })
        ]);

        console.log('Cart updated in DB.');

        // 4. Verify DB State
        const savedItems = await prisma.cartItem.findMany({
            where: { cartId: userCart.id }
        });

        console.log('Saved items in DB:', savedItems);

        // Checks
        const itemVar1 = savedItems.find(i => i.variationId === 'VAR-1');
        const itemVar2 = savedItems.find(i => i.variationId === 'VAR-2');
        const itemBase = savedItems.find(i => i.variationId === null);

        if (itemVar1 && itemVar1.quantity === 2) console.log('✅ VAR-1 Correct');
        else console.error('❌ VAR-1 Incorrect');

        if (itemVar2 && itemVar2.quantity === 1) console.log('✅ VAR-2 Correct');
        else console.error('❌ VAR-2 Incorrect');

        if (itemBase && itemBase.quantity === 5) console.log('✅ Base Product Correct');
        else console.error('❌ Base Product Incorrect');

        // 5. Verify GET transformation logic
        console.log('Testing GET Transformation Logic...');
        const cartObj = savedItems.reduce((acc, item) => {
            const key = item.variationId ? `${item.productId}_${item.variationId}` : item.productId;
            acc[key] = item.quantity;
            return acc;
        }, {});

        console.log('Reconstructed Cart Object:', cartObj);
        
        if (cartObj[`${productId}_VAR-1`] === 2) console.log('✅ VAR-1 Reconstructed Correctly');
        if (cartObj[`${productId}_VAR-2`] === 1) console.log('✅ VAR-2 Reconstructed Correctly');
        if (cartObj[productId] === 5) console.log('✅ Base Product Reconstructed Correctly');

    } catch (error) {
        console.error('Test Failed:', error);
    } finally {
        // Cleanup
        console.log('Cleaning up...');
        if (cartId) {
            try { await prisma.cartItem.deleteMany({ where: { cartId } }); } catch (e) { console.error('Error deleting CartItems', e); }
            try { await prisma.cart.delete({ where: { id: cartId } }); } catch (e) { console.error('Error deleting Cart', e); }
        }
        if (productId) {
            try { await prisma.product.delete({ where: { id: productId } }); } catch (e) { console.error('Error deleting Product', e); }
        }
        if (storeId) {
            try { await prisma.store.delete({ where: { id: storeId } }); } catch (e) { console.error('Error deleting Store', e); }
        }
        if (userId) {
            try { await prisma.user.delete({ where: { id: userId } }); } catch (e) { console.error('Error deleting User', e); }
        }
        await prisma.$disconnect();
    }
}

run();

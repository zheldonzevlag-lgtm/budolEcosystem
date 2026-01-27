require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

async function testWysiwygProduct() {
    console.log('========================================');
    console.log('  TESTING WYSIWYG PRODUCT CREATION');
    console.log('========================================\n');

    try {
        // 1. Login
        console.log('📋 STEP 1: Logging in...');
        const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'ui_tester_2@example.com', // Using the same test user as other scripts
                password: 'password123'
            })
        });

        if (!loginResponse.ok) throw new Error(`Login failed: ${loginResponse.status}`);
        const loginData = await loginResponse.json();
        const token = loginData.token;
        const userId = loginData.user.id;
        console.log('✅ Login successful\n');

        // 2. Get Store
        console.log('📋 STEP 2: Getting user store...');
        const storeResponse = await fetch(`${BASE_URL}/api/stores/user/${userId}`);
        if (!storeResponse.ok) throw new Error('Failed to get store');
        const store = await storeResponse.json();
        console.log(`✅ Store found: ${store.name} (${store.id})\n`);

        // 3. Create Product with HTML Description
        console.log('📋 STEP 3: Creating product with HTML description...');
        const htmlDescription = '<h1>Test Product</h1><p>This is a <strong>bold</strong> description with <em>italics</em> and a list:</p><ul><li>Item 1</li><li>Item 2</li></ul>';

        const productPayload = {
            name: 'WYSIWYG Test Product ' + Date.now(),
            description: htmlDescription,
            mrp: 1000,
            price: 800,
            images: ['https://via.placeholder.com/300'],
            category: 'Electronics',
            storeId: store.id
        };

        const createResponse = await fetch(`${BASE_URL}/api/products`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(productPayload)
        });

        if (!createResponse.ok) {
            const errText = await createResponse.text();
            throw new Error(`Failed to create product: ${createResponse.status} - ${errText}`);
        }

        const product = await createResponse.json();
        console.log(`✅ Product created: ${product.name} (${product.id})\n`);

        // 4. Verify Description
        console.log('📋 STEP 4: Verifying description content...');
        if (product.description === htmlDescription) {
            console.log('✅ SUCCESS: Description matches HTML content exactly.');
        } else {
            console.error('❌ FAILURE: Description mismatch.');
            console.log('Expected:', htmlDescription);
            console.log('Actual:', product.description);
        }

    } catch (error) {
        console.error('\n❌ TEST FAILED:', error.message);
    }
}

testWysiwygProduct();

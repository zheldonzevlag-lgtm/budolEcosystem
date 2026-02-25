import { prisma } from '../../lib/prisma.js';

async function testVariations() {
    console.log('--- Testing Product Variations Schema ---');
    try {
        // Try to fetch a product and check for variation fields
        const product = await prisma.product.findFirst();
        
        if (product) {
            console.log('Product found:', product.name);
            console.log('Parent SKU:', product.parent_sku);
            console.log('Tier Variations:', JSON.stringify(product.tier_variations));
            console.log('Variation Matrix:', JSON.stringify(product.variation_matrix));
            
            // Check if fields are accessible (even if null)
            const hasFields = 'parent_sku' in product && 'tier_variations' in product && 'variation_matrix' in product;
            console.log('Schema has variation fields:', hasFields);
        } else {
            console.log('No products found in database to test.');
        }

    } catch (e) {
        console.error('❌ Schema test failed:');
        console.error(e.message);
        if (e.message.includes('Unknown field')) {
            console.log('\nTIP: You need to run "npx prisma generate" to update the Prisma Client.');
        }
    } finally {
        await prisma.$disconnect();
    }
}

testVariations();

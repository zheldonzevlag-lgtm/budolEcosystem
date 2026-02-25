const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkBloat() {
    console.log('Checking database bloat due to base64 images...');
    
    try {
        const products = await prisma.product.findMany({
            select: {
                id: true,
                name: true,
                images: true
            }
        });

        let base64Count = 0;
        let totalBase64Size = 0;
        let productsWithBase64 = [];

        for (const product of products) {
            let hasBase64 = false;
            let productBase64Size = 0;

            // Handle images array (Postgres) or string (fallback)
            let images = [];
            if (Array.isArray(product.images)) {
                images = product.images;
            } else if (typeof product.images === 'string') {
                // Try parsing if it's a JSON string, otherwise treat as single string
                try {
                    images = JSON.parse(product.images);
                } catch (e) {
                    images = [product.images];
                }
            }

            if (!Array.isArray(images)) {
                images = [images];
            }

            for (const img of images) {
                if (typeof img === 'string' && img.startsWith('data:image')) {
                    hasBase64 = true;
                    base64Count++;
                    // Estimate size in bytes
                    const size = Buffer.byteLength(img, 'utf8');
                    totalBase64Size += size;
                    productBase64Size += size;
                }
            }

            if (hasBase64) {
                productsWithBase64.push({
                    id: product.id,
                    name: product.name,
                    size: (productBase64Size / 1024).toFixed(2) + ' KB'
                });
            }
        }

        console.log('\n--- Results ---');
        console.log(`Total products scanned: ${products.length}`);
        console.log(`Total base64 images found: ${base64Count}`);
        console.log(`Total size of base64 images: ${(totalBase64Size / 1024 / 1024).toFixed(2)} MB`);
        
        if (productsWithBase64.length > 0) {
            console.log('\nProducts with base64 images:');
            productsWithBase64.forEach(p => {
                console.log(`- [${p.id}] ${p.name}: ${p.size}`);
            });
        } else {
            console.log('\nNo base64 images found in products.');
        }

    } catch (error) {
        console.error('Error checking database bloat:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkBloat();

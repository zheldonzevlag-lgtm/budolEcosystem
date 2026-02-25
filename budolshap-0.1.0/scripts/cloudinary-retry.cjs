const { PrismaClient } = require('@prisma/client');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

async function retryUploads() {
    console.log('Starting background job: Retry failed image uploads to Cloudinary...');

    try {
        const products = await prisma.product.findMany({
            where: {
                // Find products with images that might be base64 strings
                // This is a naive check, we'll refine it in the loop
                images: {
                    contains: 'data:image'
                }
            }
        });

        console.log(`Found ${products.length} products potentially needing image upload retry.`);

        for (const product of products) {
            let images = [];
            let updatedImages = [];
            let needsUpdate = false;

            // Normalize images
            if (Array.isArray(product.images)) {
                images = product.images;
            } else if (typeof product.images === 'string') {
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
                    console.log(`Uploading image for product ${product.id} (${product.name})...`);
                    try {
                        const uploadResult = await cloudinary.uploader.upload(img, {
                            folder: 'budolshap_products',
                        });
                        console.log(`Upload successful: ${uploadResult.secure_url}`);
                        updatedImages.push(uploadResult.secure_url);
                        needsUpdate = true;
                    } catch (uploadError) {
                        console.error(`Failed to upload image for product ${product.id}:`, uploadError.message);
                        updatedImages.push(img); // Keep original if upload fails again
                    }
                } else {
                    updatedImages.push(img);
                }
            }

            if (needsUpdate) {
                console.log(`Updating product ${product.id} with new image URLs...`);
                await prisma.product.update({
                    where: { id: product.id },
                    data: {
                        images: updatedImages
                    }
                });
                console.log(`Product ${product.id} updated.`);
            }
        }

        console.log('Retry job completed.');

    } catch (error) {
        console.error('Error in retry job:', error);
    } finally {
        await prisma.$disconnect();
    }
}

retryUploads();

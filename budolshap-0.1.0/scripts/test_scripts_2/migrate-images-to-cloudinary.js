/**
 * Migration Script: Convert Base64 Product Images to Cloudinary
 * 
 * This script:
 * 1. Fetches all products from the database
 * 2. Identifies products with base64 images
 * 3. Uploads those images to Cloudinary
 * 4. Updates the database with Cloudinary URLs
 * 
 * Run with: node scripts/migrate-images-to-cloudinary.js
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const { PrismaClient } = require('@prisma/client')
const cloudinary = require('cloudinary').v2

const prisma = new PrismaClient()

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
})

async function migrateImagesToCloudinary() {
    console.log('🚀 Starting migration of product images to Cloudinary...\n')

    try {
        // Fetch all products
        const products = await prisma.product.findMany({
            select: {
                id: true,
                name: true,
                images: true,
            }
        })

        console.log(`📦 Found ${products.length} total products\n`)

        let migratedCount = 0
        let skippedCount = 0
        let errorCount = 0

        for (const product of products) {
            console.log(`\n📝 Processing: ${product.name} (${product.id})`)

            // Parse images (they're stored as JSON)
            let images = []
            try {
                images = typeof product.images === 'string'
                    ? JSON.parse(product.images)
                    : product.images
            } catch (e) {
                images = Array.isArray(product.images) ? product.images : []
            }

            if (!Array.isArray(images) || images.length === 0) {
                console.log('   ⏭️  No images found, skipping...')
                skippedCount++
                continue
            }

            // Check if images are already Cloudinary URLs
            const hasBase64 = images.some(img =>
                typeof img === 'string' && img.startsWith('data:image/')
            )

            if (!hasBase64) {
                console.log('   ✅ Already using Cloudinary URLs, skipping...')
                skippedCount++
                continue
            }

            // Upload base64 images to Cloudinary
            const cloudinaryUrls = []
            for (let i = 0; i < images.length; i++) {
                const image = images[i]

                if (typeof image === 'string' && image.startsWith('data:image/')) {
                    console.log(`   📤 Uploading image ${i + 1}/${images.length}...`)

                    try {
                        const uploadResult = await cloudinary.uploader.upload(image, {
                            folder: 'budolshap/products',
                            resource_type: 'auto',
                        })

                        cloudinaryUrls.push(uploadResult.secure_url)
                        console.log(`   ✅ Uploaded: ${uploadResult.secure_url}`)
                    } catch (uploadError) {
                        console.error(`   ❌ Upload failed: ${uploadError.message}`)
                        // Keep the original base64 if upload fails
                        cloudinaryUrls.push(image)
                    }
                } else {
                    // Already a URL, keep it
                    cloudinaryUrls.push(image)
                }
            }

            // Update product in database
            try {
                await prisma.product.update({
                    where: { id: product.id },
                    data: { images: cloudinaryUrls }
                })
                console.log(`   💾 Updated database with ${cloudinaryUrls.length} Cloudinary URLs`)
                migratedCount++
            } catch (updateError) {
                console.error(`   ❌ Database update failed: ${updateError.message}`)
                errorCount++
            }
        }

        console.log('\n' + '='.repeat(60))
        console.log('📊 Migration Summary:')
        console.log('='.repeat(60))
        console.log(`✅ Migrated: ${migratedCount} products`)
        console.log(`⏭️  Skipped: ${skippedCount} products (already using Cloudinary)`)
        console.log(`❌ Errors: ${errorCount} products`)
        console.log(`📦 Total: ${products.length} products`)
        console.log('='.repeat(60))

        if (migratedCount > 0) {
            console.log('\n🎉 Migration completed successfully!')
            console.log('💡 You can now safely increase order limits to 20-50 per page.')
        } else {
            console.log('\n✨ No migration needed - all products already use Cloudinary!')
        }

    } catch (error) {
        console.error('\n❌ Migration failed:', error)
        throw error
    } finally {
        await prisma.$disconnect()
    }
}

// Run the migration
migrateImagesToCloudinary()
    .catch((error) => {
        console.error('Fatal error:', error)
        process.exit(1)
    })

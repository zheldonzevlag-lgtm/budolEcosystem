import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { triggerRealtimeEvent } from '@/lib/realtime'
import { isValidImage, isValidVideo } from '@/lib/imageUtils'
import { deleteCloudinaryAsset, deleteCloudinaryImage } from '@/lib/cloudinary'

// Helper to extract URL from image string or object
const getImageUrl = (img) => {
    if (!img) return null;
    if (typeof img === 'string') return img;
    if (typeof img === 'object' && img.url) return img.url;
    return null;
};

// GET single product
export async function GET(request, { params }) {
    try {
        const { productId } = await params

        const product = await prisma.product.findUnique({
            where: { id: productId },
            include: {
                store: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        logo: true,
                        email: true,
                        contact: true,
                        address: true,
                        addresses: {
                            where: { isDefault: true },
                            take: 1
                        }
                    }
                },
                rating: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                image: true
                            }
                        }
                    },
                    orderBy: {
                        createdAt: 'desc'
                    }
                }
            }
        })

        if (!product) {
            return NextResponse.json(
                { error: 'Product not found' },
                { status: 404 }
            )
        }

        let images = product.images
        if (typeof images === 'string') {
            try {
                images = JSON.parse(images)
            } catch (e) {
                images = [images]
            }
        }
        if (!Array.isArray(images)) {
            images = images ? [images] : []
        }

        let videos = product.videos
        if (typeof videos === 'string') {
            try {
                videos = JSON.parse(videos)
            } catch (e) {
                videos = [videos]
            }
        }
        if (!Array.isArray(videos)) {
            videos = videos ? [videos] : []
        }

        return NextResponse.json({ ...product, images, videos })
    } catch (error) {
        console.error('Error fetching product:', error)
        return NextResponse.json(
            { error: 'Failed to fetch product' },
            { status: 500 }
        )
    }
}

// PUT update product
export async function PUT(request, { params }) {
    try {
        const { productId } = await params
        const body = await request.json()

        // Fetch existing product to compare images
        const existingProduct = await prisma.product.findUnique({
            where: { id: productId }
        });

        if (!existingProduct) {
            return NextResponse.json(
                { error: 'Product not found' },
                { status: 404 }
            )
        }

        // Handle Image Deletion (Main Images)
        if (body.images) {
            const oldImages = Array.isArray(existingProduct.images) ? existingProduct.images : [];
            const newImages = Array.isArray(body.images) ? body.images : [];

            const oldUrls = new Set(oldImages.map(getImageUrl).filter(Boolean));
            const newUrls = new Set(newImages.map(getImageUrl).filter(Boolean));

            // Find images present in old but missing in new
            const deletedUrls = [...oldUrls].filter(url => !newUrls.has(url));

            if (deletedUrls.length > 0) {
                console.log(`[Product Update] Deleting ${deletedUrls.length} removed images from Cloudinary...`);
                // Process deletions in background to not block response too much, 
                // but usually better to await to ensure consistency or log errors.
                // We'll await to be safe.
                await Promise.all(deletedUrls.map(url => deleteCloudinaryImage(url)));
            }
        }

        // Handle Image Deletion (Variation Images)
        if (body.variation_matrix) {
            const oldVars = Array.isArray(existingProduct.variation_matrix) ? existingProduct.variation_matrix : [];
            const newVars = Array.isArray(body.variation_matrix) ? body.variation_matrix : [];

            const oldVarUrls = new Set(oldVars.map(v => getImageUrl(v.image)).filter(Boolean));
            const newVarUrls = new Set(newVars.map(v => getImageUrl(v.image)).filter(Boolean));

            const deletedVarUrls = [...oldVarUrls].filter(url => !newVarUrls.has(url));

            if (deletedVarUrls.length > 0) {
                console.log(`[Product Update] Deleting ${deletedVarUrls.length} removed variation images from Cloudinary...`);
                await Promise.all(deletedVarUrls.map(url => deleteCloudinaryImage(url)));
            }
        }

        if (body.videos !== undefined) {
            const oldVideos = Array.isArray(existingProduct.videos) ? existingProduct.videos : [];
            const newVideos = Array.isArray(body.videos) ? body.videos : [];

            const oldUrls = new Set(oldVideos.map(getImageUrl).filter(Boolean));
            const newUrls = new Set(newVideos.map(getImageUrl).filter(Boolean));

            const deletedUrls = [...oldUrls].filter(url => !newUrls.has(url));

            if (deletedUrls.length > 0) {
                await Promise.all(deletedUrls.map(url => deleteCloudinaryAsset(url, 'video')));
            }
        }

        if (body.price !== undefined && Number(body.price) <= 0) {
            return NextResponse.json(
                { error: 'Price must be greater than ₱0.00' },
                { status: 400 }
            )
        }

        // Auto-lookup category name if categoryId is updated
        let categoryName = body.category;
        if (body.categoryId && !body.category) {
            const catData = await prisma.category.findUnique({
                where: { id: body.categoryId },
                select: { name: true }
            });
            if (catData) categoryName = catData.name;
        }

        const updateData = {
            ...(body.name && { name: body.name }),
            ...(body.description && { description: body.description }),
            ...(body.mrp !== undefined && { mrp: Number(body.mrp) }),
            ...(body.price !== undefined && { price: Number(body.price) }),
            ...(body.stock !== undefined && { stock: Number(body.stock) }),
            ...(body.images && { images: (Array.isArray(body.images) ? body.images : (body.images ? [body.images] : [])).filter(isValidImage) }),
            ...(body.videos !== undefined && { videos: (Array.isArray(body.videos) ? body.videos : (body.videos ? [body.videos] : [])).filter(isValidVideo) }),
            ...(categoryName && { category: categoryName }),
            ...(body.categoryId && { categoryId: body.categoryId }),
            ...(body.inStock !== undefined && { inStock: body.inStock }),
            ...(body.parent_sku !== undefined && { parent_sku: body.parent_sku }),
            ...(body.tier_variations !== undefined && { tier_variations: body.tier_variations }),
            ...(body.variation_matrix !== undefined && { variation_matrix: body.variation_matrix }),
            ...(body.weight !== undefined && { weight: Number(body.weight) }),
            ...(body.length !== undefined && { length: Number(body.length) }),
            ...(body.width !== undefined && { width: Number(body.width) }),
            ...(body.height !== undefined && { height: Number(body.height) }),
            ...(body.condition && { condition: body.condition }),
            ...(body.preOrder !== undefined && { preOrder: body.preOrder })
        };

        // Dynamically add hidden_combos to avoid Prisma validation errors if client is stale
        if (body.hidden_combos !== undefined) {
            updateData['hidden_combos'] = body.hidden_combos || [];
        }

        const product = await prisma.product.update({
            where: { id: productId },
            data: updateData,
            include: {
                store: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        logo: true
                    }
                }
            }
        })

        // Realtime Broadcast
        await triggerRealtimeEvent('marketplace-updates', 'product-updated', product)

        return NextResponse.json(product)
    } catch (error) {
        console.error('Error updating product:', error)
        return NextResponse.json(
            { error: 'Failed to update product' },
            { status: 500 }
        )
    }
}

// DELETE product
export async function DELETE(request, { params }) {
    try {
        const { productId } = await params

        // Fetch product to get images before deletion
        const product = await prisma.product.findUnique({
            where: { id: productId }
        });

        if (product) {
            console.log(`[Product Delete] Cleaning up images for product ${productId}...`);

            // Collect all images to delete
            const imagesToDelete = [];

            // Main images
            if (Array.isArray(product.images)) {
                product.images.forEach(img => {
                    const url = getImageUrl(img);
                    if (url) imagesToDelete.push(url);
                });
            }

            // Variation images
            if (Array.isArray(product.variation_matrix)) {
                product.variation_matrix.forEach(v => {
                    const url = getImageUrl(v.image);
                    if (url) imagesToDelete.push(url);
                });
            }

            // Delete from Cloudinary
            if (imagesToDelete.length > 0) {
                console.log(`[Product Delete] Removing ${imagesToDelete.length} media assets from Cloudinary...`);
                await Promise.all(imagesToDelete.map(url => deleteCloudinaryImage(url)));
            }

            if (Array.isArray(product.videos) && product.videos.length > 0) {
                const videoUrls = product.videos.map(url => getImageUrl(url)).filter(Boolean)
                if (videoUrls.length > 0) {
                    await Promise.all(videoUrls.map(url => deleteCloudinaryAsset(url, 'video')))
                }
            }
        }

        await prisma.product.delete({
            where: { id: productId }
        })

        return NextResponse.json({ message: 'Product deleted successfully' })
    } catch (error) {
        console.error('Error deleting product:', error)
        return NextResponse.json(
            { error: 'Failed to delete product' },
            { status: 500 }
        )
    }
}

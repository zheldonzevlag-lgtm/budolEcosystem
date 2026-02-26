import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { triggerRealtimeEvent } from '@/lib/realtime'
import { isValidImage, isValidVideo } from '@/lib/imageUtils'

export const maxDuration = 300;
export const config = {
    api: {
        bodyParser: {
            sizeLimit: '50mb',
        },
    },
};

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category');
        const search = searchParams.get('search');
        const storeId = searchParams.get('storeId');
        const ids = searchParams.get('ids'); // comma separated ids
        let limit = parseInt(searchParams.get('limit')) || 20;
        const offset = parseInt(searchParams.get('offset')) || 0;
        if (limit > 100) limit = 100;

        const where = {};
        const conditions = [];

        if (category) {
            conditions.push({
                OR: [
                    { category: category },
                    { categoryData: { slug: category } }
                ]
            });
        }

        if (storeId) where.storeId = storeId;

        if (ids) {
            where.id = {
                in: ids.split(',')
            };
        }

        if (search) {
            conditions.push({
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { description: { contains: search, mode: 'insensitive' } },
                ]
            });
        }

        if (conditions.length > 0) {
            where.AND = conditions;
        }

        // Only filter by inStock if we're not fetching specific IDs
        if (!ids) {
            where.inStock = true;
        }

        const products = await prisma.product.findMany({
            where,
            include: {
                store: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        logo: true,
                        address: true,
                        addresses: {
                            where: {
                                isDefault: true
                            },
                            take: 1
                        }
                    },
                },
                rating: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                image: true,
                            },
                        },
                    },
                },
                categoryData: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        icon: true,
                        parent: {
                            select: {
                                id: true,
                                name: true,
                                slug: true,
                                icon: true,
                                parent: {
                                    select: {
                                        name: true,
                                        parent: {
                                            select: {
                                                name: true
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                orderItems: {
                    select: {
                        quantity: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip: offset,
        });

        const productsWithSold = products.map(product => {
            const sold = product.orderItems.reduce((acc, item) => acc + item.quantity, 0);

            // Ensure images is always an array
            let images = product.images;
            if (typeof images === 'string') {
                try {
                    images = JSON.parse(images);
                } catch (e) {
                    images = [images];
                }
            }
            if (!Array.isArray(images)) {
                images = images ? [images] : [];
            }

            let videos = product.videos;
            if (typeof videos === 'string') {
                try {
                    videos = JSON.parse(videos);
                } catch (e) {
                    videos = [videos];
                }
            }
            if (!Array.isArray(videos)) {
                videos = videos ? [videos] : [];
            }

            const { orderItems, ...rest } = product;
            // Construct full category path
            let categoryFull = product.category;
            if (product.categoryData) {
                const parts = [];
                if (product.categoryData.parent?.parent?.name) parts.push(product.categoryData.parent.parent.name);
                if (product.categoryData.parent?.name) parts.push(product.categoryData.parent.name);
                parts.push(product.categoryData.name);
                categoryFull = parts.join(' > ');
            }

            return {
                ...rest,
                images,
                videos,
                sold,
                categoryFull,
                categorySlug: product.categoryData?.slug || product.category?.toLowerCase().replace(/\s+/g, '-')
            };
        });

        return NextResponse.json(productsWithSold);
    } catch (error) {
        console.error('Error fetching products:', error);
        return NextResponse.json(
            { error: 'Failed to fetch products' },
            { status: 500 }
        );
    }
}

// POST create new product
export async function POST(request) {
    try {
        const body = await request.json()
        let {
            name, description, mrp, price, stock, images, videos, categoryId, storeId, category,
            parent_sku, tier_variations, variation_matrix,
            weight, length, width, height, condition, preOrder
        } = body

        if (!name || !description || !mrp || !price || !images || !categoryId || !storeId) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            )
        }

        // Auto-lookup category name if missing but categoryId exists
        if (!category && categoryId) {
            const catData = await prisma.category.findUnique({
                where: { id: categoryId },
                select: { name: true }
            });
            if (catData) category = catData.name;
        }

        if (!category) {
            return NextResponse.json(
                { error: 'Category name is required' },
                { status: 400 }
            )
        }

        // Verify store exists and is active
        const store = await prisma.store.findUnique({
            where: { id: storeId }
        })

        if (!store) {
            return NextResponse.json(
                { error: 'Store not found' },
                { status: 404 }
            )
        }

        if (!store.isActive) {
            return NextResponse.json(
                { error: 'Store is not active' },
                { status: 403 }
            )
        }

        const product = await prisma.product.create({
            data: {
                name,
                description,
                mrp: Number(mrp),
                price: Number(price),
                stock: stock ? Number(stock) : 0,
                images: (Array.isArray(images) ? images : (images ? [images] : [])).filter(isValidImage),
                videos: (Array.isArray(videos) ? videos : (videos ? [videos] : [])).filter(isValidVideo),
                category,
                categoryId,
                storeId,
                parent_sku: parent_sku || null,
                tier_variations: tier_variations || [],
                variation_matrix: variation_matrix || [],
                weight: weight ? Number(weight) : 0,
                length: length ? Number(length) : 0,
                width: width ? Number(width) : 0,
                height: height ? Number(height) : 0,
                condition: condition || 'New',
                preOrder: preOrder || false
            },
            include: {
                store: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        logo: true
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
                    }
                },
                categoryData: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        icon: true
                    }
                },
                orderItems: {
                    select: {
                        quantity: true
                    }
                }
            }
        })

        const sold = product.orderItems.reduce((acc, item) => acc + item.quantity, 0)
        const { orderItems, ...productData } = product

        const payload = { ...productData, sold }

        // Realtime Broadcast
        await triggerRealtimeEvent('marketplace-updates', 'product-added', payload)

        return NextResponse.json(payload, { status: 201 })
    } catch (error) {
        console.error('Error creating product:', error)
        return NextResponse.json(
            { error: 'Failed to create product' },
            { status: 500 }
        )
    }
}

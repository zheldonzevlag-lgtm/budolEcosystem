import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { triggerRealtimeEvent } from '@/lib/realtime'
import { isValidImage, isValidVideo } from '@/lib/imageUtils'

export const dynamic = 'force-dynamic'
export const revalidate = 0
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

            // Determine location based on store address
            let location = 'Domestic';
            const storeAddress = product.store?.addresses?.[0] || {};
            const province = storeAddress.province || '';
            const city = storeAddress.city || '';

            if (province.toLowerCase().includes('metro manila') || city.toLowerCase().includes('metro manila') || province.toLowerCase() === 'ncr') {
                location = 'Metro Manila';
            } else if (['bulacan', 'pampanga', 'tarlac', 'bataan', 'zambales', 'nueva ecija', 'aurora', 'pangasinan', 'la union', 'ilocos norte', 'ilocos sur', 'cagayan', 'isabela', 'nueva vizcaya', 'quirino', 'batanes', 'abra', 'apayao', 'benguet', 'ifugao', 'kalinga', 'mountain province'].some(p => province.toLowerCase().includes(p))) {
                location = 'North Luzon';
            } else if (['cavite', 'laguna', 'batangas', 'rizal', 'quezon', 'oriental mindoro', 'occidental mindoro', 'marinduque', 'romblon', 'palawan', 'albay', 'camarines norte', 'camarines sur', 'catanduanes', 'masbate', 'sorsogon'].some(p => province.toLowerCase().includes(p))) {
                location = 'South Luzon';
            } else if (['aklan', 'antique', 'capiz', 'guimaras', 'iloilo', 'negros occidental', 'bohol', 'cebu', 'negros oriental', 'siquijor', 'biliran', 'eastern samar', 'leyte', 'northern samar', 'samar', 'southern leyte'].some(p => province.toLowerCase().includes(p))) {
                location = 'Visayas';
            } else if (['zamboanga', 'bukidnon', 'camiguin', 'lanao', 'misamis', 'compostela', 'davao', 'cotabato', 'sarangani', 'sultan kudarat', 'agusan', 'dinagat', 'surigao', 'basilan', 'maguindanao', 'sulu', 'tawi-tawi'].some(p => province.toLowerCase().includes(p))) {
                location = 'Mindanao';
            }

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
                location,
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
            parent_sku, tier_variations, variation_matrix, hidden_combos,
            weight, length, width, height, condition, preOrder
        } = body

        if (!name || !description || price === undefined || mrp === undefined || !images || !categoryId || !storeId) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            )
        }

        // Validate price is greater than 0
        if (Number(price) <= 0) {
            return NextResponse.json(
                { error: 'Price must be greater than ₱0.00. Use 0.01 for minimal pricing.' },
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

        // Fetch System Settings for limits
        const settings = await prisma.systemSettings.findUnique({
            where: { id: 'default' },
            select: { maxProductImages: true, maxProductVideos: true }
        });

        const maxImages = settings?.maxProductImages ?? 12;
        const maxVideos = settings?.maxProductVideos ?? 0;

        const imagesArray = (Array.isArray(images) ? images : (images ? [images] : [])).filter(isValidImage);
        const videosArray = (Array.isArray(videos) ? videos : (videos ? [videos] : [])).filter(isValidVideo);

        if (imagesArray.length > maxImages) {
            return NextResponse.json(
                { error: `Maximum of ${maxImages} images allowed.` },
                { status: 400 }
            );
        }

        if (videosArray.length > maxVideos) {
            return NextResponse.json(
                { error: `Maximum of ${maxVideos} videos allowed.` },
                { status: 400 }
            );
        }

        const productData = {
            name,
            description,
            mrp: Number(mrp),
            price: Number(price),
            stock: stock ? Number(stock) : 0,
            images: imagesArray,
            videos: videosArray,
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
        };

        // Dynamically add hidden_combos to avoid Prisma validation errors if client is stale
        if (hidden_combos !== undefined) {
            productData['hidden_combos'] = hidden_combos || [];
        }

        const product = await prisma.product.create({
            data: productData,
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
        const { orderItems, ...productRest } = product

        const payload = { ...productRest, sold }

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

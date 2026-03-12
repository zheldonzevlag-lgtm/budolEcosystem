const { PrismaClient } = require('./budolshap-0.1.0/node_modules/@prisma/client');

const prisma = new PrismaClient();

const shopeeCategories = [
    {
        name: 'Electronics',
        slug: 'electronics',
        icon: 'Smartphone',
        sub: [
            {
                name: 'Mobile Devices & Gadgets',
                slug: 'mobile-gadgets',
                icon: 'Smartphone',
                sub: [
                    { name: 'Smartphones', slug: 'smartphones', icon: 'Smartphone' },
                    { name: 'Tablets', slug: 'tablets', icon: 'Tablet' },
                    { name: 'Smartwatches', slug: 'smartwatches', icon: 'Watch' },
                    { name: 'Mobile Accessories', slug: 'mobile-accessories', icon: 'Smartphone' }
                ]
            },
            {
                name: 'Computers & Laptops',
                slug: 'computers-laptops',
                icon: 'Laptop',
                sub: [
                    { name: 'Laptops', slug: 'laptops', icon: 'Laptop' },
                    { name: 'Desktops', slug: 'desktops', icon: 'Tv' },
                    { name: 'Computer Components', slug: 'computer-components', icon: 'Cpu' }
                ]
            },
            {
                name: 'Audio',
                slug: 'audio',
                icon: 'Headphones',
                sub: [
                    { name: 'Headphones & Headsets', slug: 'headphones', icon: 'Headphones' },
                    { name: 'Speakers', slug: 'speakers', icon: 'Speaker' },
                    { name: 'Home Audio', slug: 'home-audio', icon: 'Music' }
                ]
            }
        ]
    },
    {
        name: 'Fashion',
        slug: 'fashion',
        icon: 'Shirt',
        sub: [
            {
                name: "Women's Fashion",
                slug: 'womens-fashion',
                icon: 'Shirt',
                sub: [
                    { name: 'Dresses', slug: 'womens-dresses', icon: 'Shirt' },
                    { name: 'Tops & Blouses', slug: 'womens-tops', icon: 'Shirt' },
                    { name: 'Shoes', slug: 'womens-shoes', icon: 'Footprints' }
                ]
            },
            {
                name: "Men's Fashion",
                slug: 'mens-fashion',
                icon: 'Shirt',
                sub: [
                    { name: 'T-Shirts & Polos', slug: 'mens-shirts', icon: 'Shirt' },
                    { name: 'Pants & Shorts', slug: 'mens-pants', icon: 'Shirt' },
                    { name: 'Shoes', slug: 'mens-shoes', icon: 'Footprints' }
                ]
            }
        ]
    },
    {
        name: 'Home & Living',
        slug: 'home-living',
        icon: 'Home',
        sub: [
            {
                name: 'Furniture',
                slug: 'furniture',
                icon: 'Sofa',
                sub: [
                    { name: 'Living Room Furniture', slug: 'living-room-furniture', icon: 'Sofa' },
                    { name: 'Bedroom Furniture', slug: 'bedroom-furniture', icon: 'Bed' },
                    { name: 'Office Furniture', slug: 'office-furniture', icon: 'Briefcase' }
                ]
            },
            {
                name: 'Kitchenware',
                slug: 'kitchenware',
                icon: 'Utensils',
                sub: [
                    { name: 'Cookware', slug: 'cookware', icon: 'Utensils' },
                    { name: 'Dinnerware', slug: 'dinnerware', icon: 'Utensils' },
                    { name: 'Kitchen Tools', slug: 'kitchen-tools', icon: 'Wrench' }
                ]
            }
        ]
    },
    {
        name: 'Beauty & Personal Care',
        slug: 'beauty-personal-care',
        icon: 'Sparkles',
        sub: [
            {
                name: 'Skincare',
                slug: 'skincare',
                icon: 'Sparkles',
                sub: [
                    { name: 'Face Mask', slug: 'face-mask', icon: 'Sparkles' },
                    { name: 'Moisturizer', slug: 'moisturizer', icon: 'Droplets' },
                    { name: 'Sunscreen', slug: 'sunscreen', icon: 'Sun' }
                ]
            },
            {
                name: 'Makeup',
                slug: 'makeup',
                icon: 'Sparkles',
                sub: [
                    { name: 'Lipstick', slug: 'lipstick', icon: 'Sparkles' },
                    { name: 'Foundation', slug: 'foundation', icon: 'Sparkles' }
                ]
            }
        ]
    },
    {
        name: 'Sports & Outdoors',
        slug: 'sports-outdoors',
        icon: 'Dumbbell',
        sub: [
            {
                name: 'Sports Equipment',
                slug: 'sports-equipment',
                icon: 'Dumbbell',
                sub: [
                    { name: 'Gym & Fitness', slug: 'gym-fitness', icon: 'Dumbbell' },
                    { name: 'Outdoor Recreation', slug: 'outdoor-recreation', icon: 'Tent' }
                ]
            }
        ]
    },
    {
        name: 'Food & Beverages',
        slug: 'food-beverages',
        icon: 'UtensilsCrossed',
        sub: [
            {
                name: 'Groceries',
                slug: 'groceries',
                icon: 'ShoppingCart',
                sub: [
                    { name: 'Snacks', slug: 'snacks', icon: 'Apple' },
                    { name: 'Beverages', slug: 'beverages', icon: 'Coffee' }
                ]
            }
        ]
    },
    {
        name: 'Health & Wellness',
        slug: 'health-wellness',
        icon: 'HeartPulse',
        sub: [
            {
                name: 'Medical Supplies',
                slug: 'medical-supplies',
                icon: 'Stethoscope',
                sub: [
                    { name: 'First Aid', slug: 'first-aid', icon: 'PlusCircle' },
                    { name: 'Health Monitors', slug: 'health-monitors', icon: 'Activity' }
                ]
            },
            {
                name: 'Vitamins & Supplements',
                slug: 'vitamins-supplements',
                icon: 'Pill',
                sub: [
                    { name: 'Multivitamins', slug: 'multivitamins', icon: 'Pill' },
                    { name: 'Weight Management', slug: 'weight-management', icon: 'Scale' }
                ]
            }
        ]
    },
    {
        name: 'Toys, Games & Collectibles',
        slug: 'toys-games-collectibles',
        icon: 'Gamepad2',
        sub: [
            {
                name: 'Toys',
                slug: 'toys',
                icon: 'Blocks',
                sub: [
                    { name: 'Action Figures', slug: 'action-figures', icon: 'User' },
                    { name: 'Dolls & Plush Toys', slug: 'dolls-plush', icon: 'Heart' },
                    { name: 'Educational Toys', slug: 'educational-toys', icon: 'GraduationCap' }
                ]
            },
            {
                name: 'Games',
                slug: 'games',
                icon: 'Dice5',
                sub: [
                    { name: 'Board Games', slug: 'board-games', icon: 'Grid' },
                    { name: 'Card Games', slug: 'card-games', icon: 'Layers' }
                ]
            }
        ]
    },
    {
        name: 'Pet Supplies',
        slug: 'pet-supplies',
        icon: 'PawPrint',
        sub: [
            {
                name: 'Dog Supplies',
                slug: 'dog-supplies',
                icon: 'Dog',
                sub: [
                    { name: 'Dog Food', slug: 'dog-food', icon: 'Bone' },
                    { name: 'Dog Accessories', slug: 'dog-accessories', icon: 'Clover' }
                ]
            },
            {
                name: 'Cat Supplies',
                slug: 'cat-supplies',
                icon: 'Cat',
                sub: [
                    { name: 'Cat Food', slug: 'cat-food', icon: 'Milk' },
                    { name: 'Cat Toys', slug: 'cat-toys', icon: 'Mouse' }
                ]
            }
        ]
    },
    {
        name: 'Books & Stationery',
        slug: 'books-stationery',
        icon: 'BookOpen',
        sub: [
            {
                name: 'Books',
                slug: 'books',
                icon: 'Book',
                sub: [
                    { name: 'Fiction', slug: 'fiction-books', icon: 'BookOpen' },
                    { name: 'Non-Fiction', slug: 'non-fiction-books', icon: 'Book' },
                    { name: 'Educational Books', slug: 'educational-books', icon: 'GraduationCap' }
                ]
            },
            {
                name: 'Stationery',
                slug: 'stationery',
                icon: 'PenTool',
                sub: [
                    { name: 'Writing Materials', slug: 'writing-materials', icon: 'Pen' },
                    { name: 'Paper Products', slug: 'paper-products', icon: 'FileText' }
                ]
            }
        ]
    },
    {
        name: 'Babies & Kids',
        slug: 'babies-kids',
        icon: 'Baby',
        sub: [
            {
                name: 'Baby Care',
                slug: 'baby-care',
                icon: 'Baby',
                sub: [
                    { name: 'Diapers & Wipes', slug: 'diapers-wipes', icon: 'Trash2' },
                    { name: 'Baby Bath & Body', slug: 'baby-bath', icon: 'Bath' }
                ]
            },
            {
                name: 'Kids Fashion',
                slug: 'kids-fashion',
                icon: 'Shirt',
                sub: [
                    { name: 'Boys Fashion', slug: 'boys-fashion', icon: 'User' },
                    { name: 'Girls Fashion', slug: 'girls-fashion', icon: 'User' }
                ]
            }
        ]
    },
    {
        name: 'Automotive',
        slug: 'automotive',
        icon: 'Car',
        sub: [
            {
                name: 'Car Parts',
                slug: 'car-parts',
                icon: 'Settings',
                sub: [
                    { name: 'Tires & Wheels', slug: 'tires-wheels', icon: 'Circle' },
                    { name: 'Engine Parts', slug: 'engine-parts', icon: 'Cpu' }
                ]
            },
            {
                name: 'Car Accessories',
                slug: 'car-accessories',
                icon: 'Car',
                sub: [
                    { name: 'Interior Accessories', slug: 'interior-accessories', icon: 'Home' },
                    { name: 'Exterior Accessories', slug: 'exterior-accessories', icon: 'Sun' }
                ]
            }
        ]
    }
];

async function seedCategories(categoryList, parentId = null, level = 1) {
    for (const cat of categoryList) {
        console.log(`🌱 Processing Level ${level}: ${cat.name}`);
        
        const upserted = await prisma.category.upsert({
            where: { slug: cat.slug },
            update: {
                name: cat.name,
                level: level,
                parentId: parentId,
                icon: cat.icon || null,
                isActive: true
            },
            create: {
                name: cat.name,
                slug: cat.slug,
                level: level,
                parentId: parentId,
                icon: cat.icon || null,
                isActive: true
            }
        });

        if (cat.sub && cat.sub.length > 0) {
            await seedCategories(cat.sub, upserted.id, level + 1);
        }
    }
}

async function main() {
    try {
        console.log('🚀 Starting expanded 3-level category upload...');
        
        // Clear existing categories to fix level 0 issues
        const clear = await prisma.category.deleteMany({});
        console.log(`🗑️ Cleared ${clear.count} existing categories.`);

        await seedCategories(shopeeCategories);
        
        console.log('\n✨ Expanded 3-level category upload complete!');
    } catch (error) {
        console.error('❌ Error uploading categories:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();

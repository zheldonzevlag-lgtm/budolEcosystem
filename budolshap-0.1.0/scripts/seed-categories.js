import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedCategories() {
    try {
        console.log('🌱 Seeding categories...');

        const categories = [
            { name: 'Electronics', slug: 'electronics', icon: 'Cpu' },
            { name: 'Fashion', slug: 'fashion', icon: 'Shirt' },
            { name: 'Home & Living', slug: 'home-living', icon: 'Home' },
            { name: 'Beauty', slug: 'beauty', icon: 'Sparkles' },
            { name: 'Accessories', slug: 'accessories', icon: 'Watch' }
        ];

        for (const cat of categories) {
            await prisma.category.upsert({
                where: { slug: cat.slug },
                update: {},
                create: {
                    name: cat.name,
                    slug: cat.slug,
                    icon: cat.icon,
                    isActive: true,
                    level: 0
                }
            });
            console.log(`✅ Category created: ${cat.name}`);
        }

        // Update existing products to link to these categories
        console.log('\n🔗 Linking products to categories...');
        const products = await prisma.product.findMany();
        const electronics = await prisma.category.findUnique({ where: { slug: 'electronics' } });
        const accessories = await prisma.category.findUnique({ where: { slug: 'accessories' } });

        for (const product of products) {
            let categoryId = null;
            if (product.category === 'Electronics') categoryId = electronics.id;
            if (product.category === 'Accessories') categoryId = accessories.id;

            if (categoryId) {
                await prisma.product.update({
                    where: { id: product.id },
                    data: { categoryId }
                });
                console.log(`✅ Linked ${product.name} to category`);
            }
        }

        console.log('\n✅ Categories seeded and linked successfully!');
    } catch (error) {
        console.error('❌ Error seeding categories:', error);
    } finally {
        await prisma.$disconnect();
    }
}

seedCategories();

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const userId = '8b23b71b-c27e-4964-a15a-ead0b563ea8d'; // Reynaldo Galvez
    
    try {
        // 1. Get or Create Store
        let store = await prisma.store.findUnique({ where: { userId: userId } });
        if (!store) {
            store = await prisma.store.create({
                data: {
                    userId: userId,
                    name: 'Test Store',
                    username: 'teststore_' + Date.now(),
                    description: 'A test store',
                    address: '123 Test St, Test City',
                    logo: 'https://via.placeholder.com/150',
                    email: 'teststore@example.com',
                    contact: '09123456789',
                    status: 'APPROVED',
                    isActive: true
                }
            });
            console.log('Store created:', store.id);
        } else {
            console.log('Store already exists:', store.id);
        }

        // 2. Get or Create Address
        let address = await prisma.address.findFirst({ where: { userId: userId } });
        if (!address) {
            address = await prisma.address.create({
                data: {
                    userId: userId,
                    name: 'Reynaldo Galvez',
                    email: 'reynaldomgalvez@gmail.com',
                    phone: '09123456780',
                    street: 'Test Street',
                    barangay: 'Test Barangay',
                    city: 'Test City',
                    state: 'Test State',
                    zip: '1234'
                }
            });
            console.log('Address created:', address.id);
        } else {
            console.log('Address already exists:', address.id);
        }

        // 3. Create Product
        const product = await prisma.product.create({
            data: {
                storeId: store.id,
                name: 'Test Product',
                description: 'A test product',
                mrp: 1800.00,
                price: 1500.00,
                images: ['https://via.placeholder.com/300'],
                category: 'ELECTRONICS'
            }
        });
        console.log('Product created:', product.id);

        // 4. Create Order
        const order = await prisma.order.create({
            data: {
                userId: userId,
                storeId: store.id,
                addressId: address.id,
                total: 1500.00,
                status: 'ORDER_PLACED',
                paymentMethod: 'BUDOL_PAY',
                orderItems: {
                    create: [
                        {
                            productId: product.id,
                            quantity: 1,
                            price: 1500.00
                        }
                    ]
                }
            }
        });
        console.log('Order created:', order.id);

    } catch (error) {
        console.error('Error seeding data:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();

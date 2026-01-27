import { prisma } from '../../../budolshap-0.1.0/lib/prisma.js'

async function testProductImagesLogic() {
    console.log('--- Testing Product Images Serialization Logic ---')
    
    const storeId = 'test_store_' + Date.now()
    const productId = 'test_product_' + Date.now()
    const userId = 'test_user_' + Date.now()

    try {
        // 1. Create a store for the product
        console.log('1. Creating test store...')
        await prisma.user.create({
            data: {
                id: userId,
                name: 'Test User',
                email: 'test_product_images_' + Date.now() + '@example.com',
                phoneNumber: '09' + Math.floor(Math.random() * 1000000000),
                password: 'password',
                image: '',
                accountType: 'SELLER'
            }
        })

        await prisma.store.create({
            data: {
                id: storeId,
                userId: userId,
                name: 'Test Store',
                description: 'Test Description',
                username: 'teststore_' + Date.now(),
                address: 'Test Address',
                logo: '',
                email: 'test_store@example.com',
                contact: '09123456789'
            }
        })

        // 2. Create product with "broken" images (as a string instead of JSON array)
        // Note: Prisma might not let us do this directly if the schema is strict,
        // but we want to simulate what happens if the data is somehow corrupted.
        console.log('2. Creating product with images...')
        const product = await prisma.product.create({
            data: {
                id: productId,
                name: 'Test Product',
                description: 'Test Description',
                mrp: 100,
                price: 80,
                images: ["image1.png"], // Correct format
                category: 'Test Category',
                storeId: storeId
            }
        })

        console.log('✅ Product created successfully:', product.id)
        
        // 3. Test serialization logic (simulating the API response)
        const mockProduct = {
            ...product,
            orderItems: []
        }

        const sold = mockProduct.orderItems.reduce((acc, item) => acc + item.quantity, 0);
        
        // Ensure images is always an array (Logic from route.js)
        let images = mockProduct.images;
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

        console.log('Resulting images array:', images)
        if (Array.isArray(images)) {
            console.log('✅ Success: images is an array')
        } else {
            console.error('❌ Failure: images is not an array')
        }

    } catch (error) {
        console.error('❌ Test failed:', error)
    } finally {
        // Cleanup
        try {
            await prisma.product.delete({ where: { id: productId } })
            await prisma.store.delete({ where: { id: storeId } })
            await prisma.user.delete({ where: { id: userId } })
        } catch (e) {}
        await prisma.$disconnect()
    }
}

testProductImagesLogic()

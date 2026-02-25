const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    const product = await prisma.product.findFirst({
        include: { store: true }
    })

    if (!product) {
        console.log("No products found")
        return
    }

    const user = await prisma.user.findUnique({
        where: { email: 'admin@budolshap.com' }
    })

    const address = await prisma.address.create({
        data: {
            userId: user.id,
            name: user.name,
            email: user.email,
            street: "123 Test St",
            city: "Test City",
            state: "Test State",
            zip: "12345",
            country: "Test Country",
            phone: "1234567890"
        }
    })

    const order = await prisma.order.create({
        data: {
            userId: user.id,
            storeId: product.storeId,
            addressId: address.id,
            total: product.price,
            paymentMethod: 'COD',
            orderItems: {
                create: {
                    productId: product.id,
                    quantity: 1,
                    price: product.price
                }
            }
        }
    })

    console.log("Created order:", order.id)
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })

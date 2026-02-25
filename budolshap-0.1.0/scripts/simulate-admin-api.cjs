const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const adminUserInclude = {
    store: {
        select: {
            id: true,
            name: true,
            username: true,
            status: true,
            isActive: true
            // note: logo is missing here
        }
    },
    _count: {
        select: {
            buyerOrders: true,
            Address: true,
            ratings: true
        }
    }
}

async function main() {
    const users = await prisma.user.findMany({
        include: adminUserInclude,
        orderBy: {
            createdAt: 'desc'
        },
        take: 10
    })

    users.forEach(u => {
        console.log(`User: ${u.name}, Email: ${u.email}`)
        console.log(`- Image field: "${u.image}" (type: ${typeof u.image})`)
        console.log(`- Has Store: ${!!u.store}`)
        if (u.store) {
            console.log(`  - Store Logo Selected: ${u.store.logo !== undefined}`)
        }
        console.log('---')
    })
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())

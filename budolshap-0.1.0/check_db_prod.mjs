import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: "postgresql://budolpostgres:r00tPassword2026!@budol-db-production.cnu6imkq689x.ap-southeast-1.rds.amazonaws.com:5432/budolid"
        }
    }
})

async function main() {
    try {
        console.log("Checking records in production database...")
        const userCount = await prisma.user.count()
        const productCount = await prisma.product.count()
        const storeCount = await prisma.store.count()

        console.log(`User count: ${userCount}`)
        console.log(`Product count: ${productCount}`)
        console.log(`Store count: ${storeCount}`)

        if (productCount > 0) {
            const firstProducts = await prisma.product.findMany({ take: 5 })
            console.log("Sample products:", JSON.stringify(firstProducts, null, 2))
        }

        if (userCount > 0) {
            const firstUsers = await prisma.user.findMany({ take: 5, select: { id: true, name: true, email: true } })
            console.log("Sample users:", JSON.stringify(firstUsers, null, 2))
        }

    } catch (error) {
        console.error("Error checking database:", error)
    } finally {
        await prisma.$disconnect()
    }
}

main()

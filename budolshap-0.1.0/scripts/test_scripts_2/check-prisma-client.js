const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkPrismaClient() {
    console.log('Checking Prisma Client...')

    if (prisma.storeAddress) {
        console.log('✅ prisma.storeAddress is defined')
        try {
            const count = await prisma.storeAddress.count()
            console.log(`✅ Connection successful. Count: ${count}`)
        } catch (e) {
            console.log('❌ Connection failed:', e.message)
        }
    } else {
        console.log('❌ prisma.storeAddress is UNDEFINED')
        console.log('Available models:', Object.keys(prisma).filter(k => !k.startsWith('_') && !k.startsWith('$')))
    }
}

checkPrismaClient()
    .catch(console.error)
    .finally(() => prisma.$disconnect())

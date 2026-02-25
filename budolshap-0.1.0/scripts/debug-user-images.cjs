const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    const users = await prisma.user.findMany({
        select: {
            id: true,
            name: true,
            email: true,
            image: true,
            accountType: true,
            store: {
                select: {
                    name: true,
                    logo: true
                }
            }
        }
    })

    const summary = users.map(u => ({
        name: u.name,
        email: u.email,
        imageLength: u.image ? u.image.length : 0,
        hasImage: !!u.image && u.image !== '',
        isSeller: !!u.store,
        storeLogoLength: u.store?.logo ? u.store.logo.length : 0
    }))

    console.log(JSON.stringify(summary, null, 2))
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())

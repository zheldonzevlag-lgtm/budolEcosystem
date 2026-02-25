const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    const users = await prisma.user.findMany({
        select: {
            name: true,
            image: true,
            store: {
                select: {
                    logo: true
                }
            }
        },
        where: {
            name: { in: ['Online Micro', 'Tony Stark'] }
        }
    })

    users.forEach(u => {
        console.log(`User: ${u.name}`)
        console.log(`  User Image: ${u.image}`)
        console.log(`  Store Logo: ${u.store?.logo}`)
        console.log(`  Identical: ${u.image === u.store?.logo}`)
        console.log('---')
    })
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())

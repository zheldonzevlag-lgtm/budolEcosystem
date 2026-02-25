
import { PrismaClient } from '@prisma/client-custom-v4'
const prisma = new PrismaClient()

async function main() {
    const users = await prisma.user.findMany({
        where: { name: { contains: 'Natasha' } }
    })

    console.log('Users found:', users.length)
    users.forEach(u => {
        console.log(`ID: ${u.id}, Name: ${u.name}, Email: ${u.email}`)
    })
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())

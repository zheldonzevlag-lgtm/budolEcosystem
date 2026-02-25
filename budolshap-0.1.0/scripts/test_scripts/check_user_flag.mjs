import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
    const user = await prisma.user.findUnique({
        where: { email: 'reynaldomgalvez@gmail.com' },
        select: { id: true, email: true, isAdmin: true, accountType: true }
    })
    console.log(user)
}
main().finally(() => prisma.$disconnect())

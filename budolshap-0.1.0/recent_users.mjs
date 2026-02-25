import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const recentUsers = await prisma.user.findMany({
    orderBy: {
      createdAt: 'desc'
    },
    take: 5,
    select: {
      id: true,
      name: true,
      email: true,
      phoneNumber: true,
      createdAt: true
    }
  })

  console.log('Most recent users:', JSON.stringify(recentUsers, null, 2))
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

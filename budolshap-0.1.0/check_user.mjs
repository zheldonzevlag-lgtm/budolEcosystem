import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const phoneNumber = '+639176543281'
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { phoneNumber: phoneNumber },
        { phoneNumber: '9176543281' },
        { phoneNumber: '09176543281' }
      ]
    }
  })

  if (user) {
    console.log('User found:', JSON.stringify(user, null, 2))
  } else {
    console.log('User not found with phone number:', phoneNumber)
    const allUsers = await prisma.user.findMany({
        take: 5,
        select: {
            id: true,
            email: true,
            phoneNumber: true,
            name: true
        }
    })
    console.log('Sample users in DB:', JSON.stringify(allUsers, null, 2))
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

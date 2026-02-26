import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const user = await prisma.user.findFirst({
    where: {
      name: {
        contains: 'Tony Stark'
      }
    }
  })

  if (user) {
    console.log('Tony Stark found:', JSON.stringify(user, null, 2))
  } else {
    console.log('Tony Stark not found')
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

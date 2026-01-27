import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  // Check if prisma is initialized correctly
  if (!prisma.order) {
    console.log('Available models:', Object.keys(prisma).filter(k => !k.startsWith('_') && !k.startsWith('$')))
    return
  }
  const order = await prisma.order.findFirst({
    where: { isPaid: false },
    include: {
      user: true,
      store: true
    }
  })
  console.log(JSON.stringify(order, null, 2))
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect())

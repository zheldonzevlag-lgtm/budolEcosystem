import { prisma } from '../../budolshap-0.1.0/lib/prisma.js'

async function listUsers() {
  try {
    const users = await prisma.user.findMany({
      take: 10,
      select: {
        email: true,
        name: true,
        accountType: true
      }
    })
    
    console.log('📋 Recent Users in BudolShap:')
    users.forEach(u => console.log(`- ${u.email} (${u.name}) [${u.accountType}]`))
    
    if (users.length === 0) {
      console.log('⚠️ No users found in database.')
    }
  } catch (error) {
    console.error('❌ Error listing users:', error)
  } finally {
    await prisma.$disconnect()
  }
}

listUsers()

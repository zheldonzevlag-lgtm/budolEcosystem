import { PrismaClient } from '@prisma/client'

async function checkBudolIDUser() {
  const email = 'caspermilan80@gmail.com'
  const prismaBudolID = new PrismaClient({
    datasources: {
      db: {
        url: 'postgresql://postgres:r00t@localhost:5432/budolid?schema=public'
      }
    }
  })

  try {
    const user = await prismaBudolID.user.findUnique({
      where: { email }
    })
    
    if (user) {
      console.log('✅ BudolID User found:', {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: user.emailVerified
      })
    } else {
      console.log('❌ BudolID User not found:', email)
    }
  } catch (error) {
    console.error('❌ Error checking BudolID user:', error)
  } finally {
    await prismaBudolID.$disconnect()
  }
}

checkBudolIDUser()

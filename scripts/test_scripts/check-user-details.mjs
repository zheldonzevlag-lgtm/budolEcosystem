import { prisma } from '../../budolshap-0.1.0/lib/prisma.js'

async function checkUser() {
  const email = 'carpermilan80@gmail.com'
  try {
    const user = await prisma.user.findUnique({
      where: { email }
    })
    
    if (user) {
      console.log('✅ User found:', {
        id: user.id,
        email: user.email,
        name: user.name,
        accountType: user.accountType,
        role: user.role,
        emailVerified: user.emailVerified,
        hasPassword: !!user.password
      })
    } else {
      console.log('❌ User not found:', email)
    }
  } catch (error) {
    console.error('❌ Error checking user:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkUser()

import { prisma } from '../../budolshap-0.1.0/lib/prisma.js'

async function fixUserEmail() {
  const oldEmail = 'carpermilan80@gmail.com'
  const newEmail = 'caspermilan80@gmail.com'
  
  try {
    const user = await prisma.user.update({
      where: { email: oldEmail },
      data: { email: newEmail }
    })
    
    console.log('✅ User email updated successfully!')
    console.log('Old Email:', oldEmail)
    console.log('New Email:', user.email)
  } catch (error) {
    console.error('❌ Error updating user email:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixUserEmail()

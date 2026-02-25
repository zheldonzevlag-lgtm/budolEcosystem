require('dotenv').config({ path: '.env.production' });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function setAdminFlag() {
    const email = 'admin@budolshap.com';
    console.log(`🔧 Updating isAdmin flag for: ${email}`);

    try {
        const updatedUser = await prisma.user.update({
            where: { email },
            data: {
                isAdmin: true,
                accountType: 'ADMIN' // Reinforced
            }
        });

        console.log('✅ User updated successfully!');
        console.log('User Details:', {
            id: updatedUser.id,
            email: updatedUser.email,
            isAdmin: updatedUser.isAdmin,
            accountType: updatedUser.accountType
        });

    } catch (error) {
        console.error('❌ Error updating user:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

setAdminFlag();

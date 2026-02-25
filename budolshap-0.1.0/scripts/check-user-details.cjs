const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const userId = '8b23b71b-c27e-4964-a15a-ead0b563ea8d'; // Reynaldo Galvez
    
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                Address: true,
                store: true
            }
        });
        
        console.log('User found:', !!user);
        if (user) {
            console.log('Addresses:', user.Address.length);
            console.log('Store:', user.store ? user.store.id : 'None');
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();

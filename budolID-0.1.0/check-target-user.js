const { PrismaClient } = require('./generated/client');
const prisma = new PrismaClient({
    datasources: {
        db: {
            url: "postgresql://postgres:r00t@localhost:5432/budolshap_1db?schema=budolid&search_path=budolid"
        }
    }
});

async function main() {
    const targetEmail = 'richmondzevlag@gmail.com';
    try {
        console.log(`Checking for email: ${targetEmail} in budolid schema...`);
        const user = await prisma.user.findUnique({
            where: { email: targetEmail }
        });
        
        if (user) {
            console.log('✅ FOUND USER:');
            console.log(JSON.stringify(user, null, 2));
        } else {
            console.log('❌ USER NOT FOUND');
        }
    } catch (e) {
        console.error('Error querying database:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    // Update budolPay
    await prisma.ecosystemApp.update({
        where: { apiKey: 'bp_key_2025' },
        data: { redirectUri: 'http://localhost:3000/api/auth/callback' }
    });

    // Update budolShap
    await prisma.ecosystemApp.update({
        where: { apiKey: 'bs_key_2025' },
        data: { redirectUri: 'http://localhost:3001/api/auth/sso/callback' }
    });

    // Update budolExpress
    await prisma.ecosystemApp.update({
        where: { apiKey: 'be_key_2025' },
        data: { redirectUri: 'http://localhost:3002/api/auth/sso/callback' }
    });

    console.log('Successfully updated redirect URIs to localhost');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    // Update budolPay
    await prisma.ecosystemApp.update({
        where: { apiKey: 'bp_b31ea1888dcb2ba76fdbb776ea8f5b7a' },
        data: { redirectUri: 'http://localhost:3000/api/auth/callback' }
    });

    // Update budolShap
    await prisma.ecosystemApp.update({
        where: { apiKey: 'bs_ac2bca9790f9b70f4e21c8a3c2812917' },
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

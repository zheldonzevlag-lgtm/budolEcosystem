const { PrismaClient } = require('D:/IT Projects/budolEcosystem/budolshap-0.1.0/node_modules/@prisma/client');
const { PrismaClient: IDClient } = require('D:/IT Projects/budolEcosystem/budolID-0.1.0/generated/client');

async function verify() {
    const idPrisma = new IDClient({
        datasources: { db: { url: "postgresql://postgres:r00t@localhost:5432/budolshap_1db?schema=budolid&search_path=budolid" } }
    });
    const shapPrisma = new PrismaClient({
        datasources: { db: { url: "postgresql://postgres:r00t@localhost:5432/budolshap_1db?schema=public" } }
    });

    const email = 'reynaldomgalvez@gmail.com';
    const idUser = await idPrisma.user.findUnique({ where: { email } });
    const shapUser = await shapPrisma.user.findUnique({ where: { email } });

    console.log(`budolID ID: ${idUser?.id}`);
    console.log(`budolShap ID: ${shapUser?.id}`);
    
    if (idUser && shapUser && idUser.id === shapUser.id) {
        console.log('✅ IDs match perfectly!');
    } else {
        console.log('❌ IDs still mismatch or user missing.');
    }

    await idPrisma.$disconnect();
    await shapPrisma.$disconnect();
}

verify();

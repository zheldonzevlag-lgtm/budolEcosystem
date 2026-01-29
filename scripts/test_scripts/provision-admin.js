const { PrismaClient } = require('../../budolID-0.1.0/generated/client');
const bcrypt = require('bcryptjs');

async function main() {
    // 1. budolID (Isolated Schema)
    const budolIDPrisma = new PrismaClient({
        datasources: {
            db: {
                url: "postgresql://postgres:r00t@localhost:5432/budolshap_1db?schema=budolid&search_path=budolid"
            }
        }
    });

    const email = 'reynaldomgalvez@gmail.com';
    const password = 'tr@1t0r';
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        console.log(`--- Provisioning Admin: ${email} ---`);

        // 1. Create in budolID
        console.log('1. Upserting user in budolID (schema: budolid)...');
        const budolIDUser = await budolIDPrisma.user.upsert({
            where: { email },
            update: { 
                password: hashedPassword,
                role: 'ADMIN',
                isVerified: true
            },
            create: {
                email,
                password: hashedPassword,
                firstName: 'Reynaldo',
                lastName: 'Galvez',
                role: 'ADMIN',
                isVerified: true
            }
        });
        console.log(`✅ User created/updated in budolID with ID: ${budolIDUser.id}`);

        // 2. Create in budolShap (public schema)
        const { PrismaClient: ShapClient } = require('../../budolshap-0.1.0/node_modules/@prisma/client');
        const budolShapPrisma = new ShapClient({
            datasources: {
                db: {
                    url: "postgresql://postgres:r00t@localhost:5432/budolshap_1db?schema=public"
                }
            }
        });

        console.log('2. Upserting user in budolShap (schema: public)...');
        const budolShapUser = await budolShapPrisma.user.upsert({
            where: { email },
            update: {
                password: hashedPassword,
                role: 'ADMIN',
                isAdmin: true,
                accountType: 'ADMIN'
            },
            create: {
                id: budolIDUser.id, 
                email,
                password: hashedPassword,
                name: 'Reynaldo Galvez',
                phoneNumber: '09170000000', 
                image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
                role: 'ADMIN',
                isAdmin: true,
                accountType: 'ADMIN',
                emailVerified: true
            }
        });
        console.log(`✅ User created/updated in budolShap with ID: ${budolShapUser.id}`);

    } catch (error) {
        console.error('❌ Provisioning failed:', error);
    } finally {
        await budolIDPrisma.$disconnect();
    }
}

main();

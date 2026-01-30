const { PrismaClient } = require('D:/IT Projects/budolEcosystem/budolshap-0.1.0/node_modules/@prisma/client');
const { PrismaClient: IDClient } = require('D:/IT Projects/budolEcosystem/budolID-0.1.0/generated/client');

async function fixAdminId() {
    const idPrisma = new IDClient({
        datasources: {
            db: {
                url: "postgresql://postgres:r00t@localhost:5432/budolshap_1db?schema=budolid&search_path=budolid"
            }
        }
    });

    const shapPrisma = new PrismaClient({
        datasources: {
            db: {
                url: "postgresql://postgres:r00t@localhost:5432/budolshap_1db?schema=public"
            }
        }
    });

    const email = 'reynaldomgalvez@gmail.com';

    try {
        // 1. Get user from budolID
        const idUser = await idPrisma.user.findUnique({ where: { email } });
        if (!idUser) {
            console.error('User not found in budolID');
            return;
        }
        console.log(`budolID ID: ${idUser.id}`);

        // 2. Get user from budolShap
        const shapUser = await shapPrisma.user.findUnique({ where: { email } });
        if (shapUser && shapUser.id !== idUser.id) {
            console.log(`ID mismatch! shap ID: ${shapUser.id}. Fixing via sequenced operations...`);
            
            const oldId = shapUser.id;
            const newId = idUser.id;

            // 1. Rename old user email to avoid unique constraint conflict
            await shapPrisma.user.update({
                where: { id: oldId },
                data: { 
                    email: `old_${Date.now()}_${shapUser.email}`,
                    phoneNumber: `old_${Date.now()}_${shapUser.phoneNumber}`
                }
            });
            console.log('Renamed old user to avoid constraints');

            // 2. Create the new user record first (so foreign keys can point to it)
            await shapPrisma.user.create({
                data: {
                    id: newId,
                    email: idUser.email,
                    password: idUser.password,
                    name: shapUser.name || 'Reynaldo Galvez',
                    phoneNumber: shapUser.phoneNumber || '09170000000',
                    image: shapUser.image || '',
                    role: 'ADMIN',
                    isAdmin: true,
                    accountType: 'ADMIN',
                    emailVerified: true
                }
            });
            console.log(`Created new user record with ID: ${newId}`);

            // 3. Update references in a transaction
            await shapPrisma.$transaction([
                shapPrisma.$executeRawUnsafe(`UPDATE "Order" SET "userId" = '${newId}' WHERE "userId" = '${oldId}'`),
                shapPrisma.$executeRawUnsafe(`UPDATE "Address" SET "userId" = '${newId}' WHERE "userId" = '${oldId}'`),
                shapPrisma.$executeRawUnsafe(`UPDATE "AuditLog" SET "userId" = '${newId}' WHERE "userId" = '${oldId}'`),
                shapPrisma.$executeRawUnsafe(`UPDATE "Cart" SET "userId" = '${newId}' WHERE "userId" = '${oldId}'`),
                shapPrisma.$executeRawUnsafe(`UPDATE "Rating" SET "userId" = '${newId}' WHERE "userId" = '${oldId}'`),
                shapPrisma.$executeRawUnsafe(`UPDATE "Chat" SET "buyerId" = '${newId}' WHERE "buyerId" = '${oldId}'`),
                shapPrisma.$executeRawUnsafe(`UPDATE "Chat" SET "sellerId" = '${newId}' WHERE "sellerId" = '${oldId}'`),
                shapPrisma.$executeRawUnsafe(`UPDATE "Message" SET "senderId" = '${newId}' WHERE "senderId" = '${oldId}'`),
                shapPrisma.$executeRawUnsafe(`UPDATE "Store" SET "userId" = '${newId}' WHERE "userId" = '${oldId}'`)
            ]);
            console.log('Updated references');

            // 4. Delete the old user record
            await shapPrisma.user.delete({ where: { id: oldId } });
            
            console.log(`✅ Fixed! New budolShap ID: ${newId}`);
        } else if (!shapUser) {
            console.log('User not found in budolShap. Creating...');
            const newUser = await shapPrisma.user.create({
                data: {
                    id: idUser.id,
                    email: idUser.email,
                    password: idUser.password,
                    name: 'Reynaldo Galvez',
                    phoneNumber: '09170000000',
                    role: 'ADMIN',
                    isAdmin: true,
                    accountType: 'ADMIN',
                    emailVerified: true
                }
            });
            console.log(`✅ Created! budolShap ID: ${newUser.id}`);
        } else {
            console.log('✅ IDs already match.');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await idPrisma.$disconnect();
        await shapPrisma.$disconnect();
    }
}

fixAdminId();

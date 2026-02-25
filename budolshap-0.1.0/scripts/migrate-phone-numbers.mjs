import { PrismaClient } from '@prisma/client';
import { normalizePhone } from '../lib/utils/phone-utils.js';

const prisma = new PrismaClient();

async function migratePhoneNumbers() {
    console.log('🚀 Starting Database Phone Normalization Migration...');
    
    let totalUpdated = 0;

    try {
        // 1. Migrate User.phoneNumber
        console.log('\n👤 Migrating User table...');
        const users = await prisma.user.findMany({
            select: { id: true, phoneNumber: true }
        });

        console.log(`Found ${users.length} users.`);

        for (const user of users) {
            const normalized = normalizePhone(user.phoneNumber);
            if (normalized && normalized !== user.phoneNumber) {
                try {
                    await prisma.user.update({
                        where: { id: user.id },
                        data: { phoneNumber: normalized }
                    });
                    console.log(`✅ Updated User ${user.id}: ${user.phoneNumber} -> ${normalized}`);
                    totalUpdated++;
                } catch (err) {
                    console.error(`❌ Failed to update User ${user.id}: ${err.message}`);
                }
            } else {
                console.log(`⏭️ Skipping User ${user.id}: ${user.phoneNumber} (Already normalized or invalid)`);
            }
        }

        // 2. Migrate Store.contact
        console.log('\n🏪 Migrating Store table...');
        const stores = await prisma.store.findMany({
            select: { id: true, contact: true }
        });

        for (const store of stores) {
            const normalized = normalizePhone(store.contact);
            if (normalized && normalized !== store.contact) {
                try {
                    await prisma.store.update({
                        where: { id: store.id },
                        data: { contact: normalized }
                    });
                    console.log(`✅ Updated Store ${store.id}: ${store.contact} -> ${normalized}`);
                    totalUpdated++;
                } catch (err) {
                    console.error(`❌ Failed to update Store ${store.id}: ${err.message}`);
                }
            }
        }

        // 3. Migrate Address.phone
        console.log('\n📍 Migrating Address table...');
        const addresses = await prisma.address.findMany({
            select: { id: true, phone: true }
        });

        for (const addr of addresses) {
            const normalized = normalizePhone(addr.phone);
            if (normalized && normalized !== addr.phone) {
                try {
                    await prisma.address.update({
                        where: { id: addr.id },
                        data: { phone: normalized }
                    });
                    console.log(`✅ Updated Address ${addr.id}: ${addr.phone} -> ${normalized}`);
                    totalUpdated++;
                } catch (err) {
                    console.error(`❌ Failed to update Address ${addr.id}: ${err.message}`);
                }
            }
        }

        // 4. Migrate StoreAddress.phone
        console.log('\n🏬 Migrating StoreAddress table...');
        const storeAddresses = await prisma.storeAddress.findMany({
            select: { id: true, phone: true }
        });

        for (const sAddr of storeAddresses) {
            const normalized = normalizePhone(sAddr.phone);
            if (normalized && normalized !== sAddr.phone) {
                try {
                    await prisma.storeAddress.update({
                        where: { id: sAddr.id },
                        data: { phone: normalized }
                    });
                    console.log(`✅ Updated StoreAddress ${sAddr.id}: ${sAddr.phone} -> ${normalized}`);
                    totalUpdated++;
                } catch (err) {
                    console.error(`❌ Failed to update StoreAddress ${sAddr.id}: ${err.message}`);
                }
            }
        }

        console.log(`\n✨ Migration complete. Total records updated: ${totalUpdated}`);

    } catch (error) {
        console.error('💥 Migration failed critically:', error);
    } finally {
        await prisma.$disconnect();
    }
}

migratePhoneNumbers();

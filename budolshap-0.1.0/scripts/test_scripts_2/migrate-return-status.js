import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function migrate() {
    console.log('🚀 Starting Return Status Migration...');

    try {
        // 1. Migrate PICKED_UP to SHIPPED for consistency with new granular statuses
        const pickedUpCount = await prisma.return.count({
            where: { status: 'PICKED_UP' }
        });

        if (pickedUpCount > 0) {
            console.log(`📦 Migrating ${pickedUpCount} returns from PICKED_UP to SHIPPED...`);
            const result = await prisma.return.updateMany({
                where: { status: 'PICKED_UP' },
                data: { status: 'SHIPPED' }
            });
            console.log(`✅ Successfully migrated ${result.count} records.`);
        } else {
            console.log('ℹ️ No PICKED_UP returns found to migrate.');
        }

        // 2. Set default deadlines for existing DELIVERED returns that don't have one
        const deliveredNoDeadline = await prisma.return.count({
            where: {
                status: 'DELIVERED',
                deadline: null
            }
        });

        if (deliveredNoDeadline > 0) {
            console.log(`⏰ Setting 2-day deadline for ${deliveredNoDeadline} DELIVERED returns...`);
            const deadline = new Date();
            deadline.setDate(deadline.getDate() + 2);

            const result = await prisma.return.updateMany({
                where: {
                    status: 'DELIVERED',
                    deadline: null
                },
                data: { deadline: deadline }
            });
            console.log(`✅ Successfully updated ${result.count} records.`);
        } else {
            console.log('ℹ️ No DELIVERED returns found without a deadline.');
        }

        console.log('🎉 Migration completed successfully!');
    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

migrate();

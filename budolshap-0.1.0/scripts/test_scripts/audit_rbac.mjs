import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Auditing User RBAC ---');
    const users = await prisma.user.findMany({
        select: {
            id: true,
            email: true,
            accountType: true,
            role: true,
            isAdmin: true,
            permissions: true,
            store: {
                select: {
                    id: true,
                    status: true
                }
            }
        }
    });

    console.log(`Total users found: ${users.length}`);
    console.table(users.map(u => ({
        id: u.id,
        email: u.email,
        type: u.accountType,
        role: u.role,
        isAdmin: u.isAdmin,
        permissionsCount: Array.isArray(u.permissions) ? u.permissions.length : 0,
        hasStore: !!u.store,
        storeStatus: u.store?.status || 'N/A'
    })));

    // Analyze inconsistencies
    const inconsistent = users.filter(u => {
        if (u.accountType === 'ADMIN' && !u.isAdmin) return true;
        if (u.isAdmin && u.accountType !== 'ADMIN') return true;
        if (u.accountType === 'SELLER' && !u.store) return true;
        return false;
    });

    if (inconsistent.length > 0) {
        console.warn('\n--- Inconsistent Users Detected ---');
        console.table(inconsistent.map(u => ({
            email: u.email,
            type: u.accountType,
            isAdmin: u.isAdmin,
            hasStore: !!u.store
        })));
    } else {
        console.log('\nNo obvious inconsistencies detected.');
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

import { PrismaClient } from '@prisma/client';
import { ROLES, ROLE_PERMISSIONS } from '../../lib/rbac.js';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Syncing User RBAC Roles and Permissions ---');
    
    const users = await prisma.user.findMany({
        include: {
            store: true
        }
    });

    console.log(`Found ${users.length} users to process.`);

    for (const user of users) {
        let targetRole = user.role;
        let targetIsAdmin = user.isAdmin;
        let targetAccountType = user.accountType;

        // 1. Determine correct role based on accountType and store status
        if (user.accountType === 'ADMIN') {
            targetRole = ROLES.ADMIN;
            targetIsAdmin = true;
        } else if (user.accountType === 'SELLER' || user.store) {
            targetRole = ROLES.SELLER;
            targetIsAdmin = false;
            targetAccountType = 'SELLER';
        } else {
            targetRole = ROLES.BUYER;
            targetIsAdmin = false;
            targetAccountType = 'BUYER';
        }

        // 2. Get standard permissions for the target role
        const standardPermissions = ROLE_PERMISSIONS[targetRole] || [];

        // 3. Update user if changes are needed
        const needsUpdate = 
            user.role !== targetRole || 
            user.isAdmin !== targetIsAdmin || 
            user.accountType !== targetAccountType ||
            JSON.stringify(user.permissions) !== JSON.stringify(standardPermissions);

        if (needsUpdate) {
            console.log(`Updating user ${user.email}:`);
            console.log(`  - Role: ${user.role} -> ${targetRole}`);
            console.log(`  - IsAdmin: ${user.isAdmin} -> ${targetIsAdmin}`);
            console.log(`  - AccountType: ${user.accountType} -> ${targetAccountType}`);
            console.log(`  - Permissions: ${Array.isArray(user.permissions) ? user.permissions.length : 0} -> ${standardPermissions.length}`);

            await prisma.user.update({
                where: { id: user.id },
                data: {
                    role: targetRole,
                    isAdmin: targetIsAdmin,
                    accountType: targetAccountType,
                    permissions: standardPermissions
                }
            });
            console.log(`✅ Updated ${user.email}`);
        } else {
            console.log(`User ${user.email} is already up to date.`);
        }
    }

    console.log('\n--- Sync Complete ---');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

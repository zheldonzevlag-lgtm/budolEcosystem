import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Mirroring lib/rbac.js logic since we can't easily import ES modules in this script environment without extra config
const PERMISSIONS = {
    PRODUCTS_VIEW: 'products:view',
    PRODUCTS_CREATE: 'products:create',
    PRODUCTS_EDIT: 'products:edit',
    PRODUCTS_DELETE: 'products:delete',
    PRODUCTS_APPROVE: 'products:approve',
    STORES_VIEW: 'stores:view',
    STORES_CREATE: 'stores:create',
    STORES_EDIT: 'stores:edit',
    STORES_DELETE: 'stores:delete',
    STORES_APPROVE: 'stores:approve',
    ORDERS_VIEW: 'orders:view',
    ORDERS_EDIT: 'orders:edit',
    ORDERS_PROCESS: 'orders:process',
    USERS_VIEW: 'users:view',
    USERS_EDIT: 'users:edit',
    USERS_DELETE: 'users:delete',
    USERS_MANAGE_ROLES: 'users:manage_roles',
    PAYOUTS_VIEW: 'payouts:view',
    PAYOUTS_APPROVE: 'payouts:approve',
    TRANSACTIONS_VIEW: 'transactions:view',
    SETTINGS_VIEW: 'settings:view',
    SETTINGS_EDIT: 'settings:edit',
    AUDIT_LOGS_VIEW: 'audit_logs:view',
};

const ROLES = {
    ADMIN: 'ADMIN',
    MANAGER: 'MANAGER',
    STAFF: 'STAFF',
    SELLER: 'SELLER',
    BUYER: 'BUYER',
};

const ROLE_PERMISSIONS = {
    [ROLES.ADMIN]: Object.values(PERMISSIONS),
    [ROLES.MANAGER]: [
        PERMISSIONS.PRODUCTS_VIEW,
        PERMISSIONS.PRODUCTS_APPROVE,
        PERMISSIONS.STORES_VIEW,
        PERMISSIONS.STORES_APPROVE,
        PERMISSIONS.ORDERS_VIEW,
        PERMISSIONS.USERS_VIEW,
        PERMISSIONS.PAYOUTS_VIEW,
        PERMISSIONS.TRANSACTIONS_VIEW,
        PERMISSIONS.SETTINGS_VIEW,
        PERMISSIONS.AUDIT_LOGS_VIEW,
    ],
    [ROLES.STAFF]: [
        PERMISSIONS.PRODUCTS_VIEW,
        PERMISSIONS.STORES_VIEW,
        PERMISSIONS.ORDERS_VIEW,
        PERMISSIONS.USERS_VIEW,
        PERMISSIONS.TRANSACTIONS_VIEW,
    ],
    [ROLES.SELLER]: [
        PERMISSIONS.PRODUCTS_VIEW,
        PERMISSIONS.PRODUCTS_CREATE,
        PERMISSIONS.PRODUCTS_EDIT,
        PERMISSIONS.PRODUCTS_DELETE,
        PERMISSIONS.ORDERS_VIEW,
        PERMISSIONS.ORDERS_PROCESS,
        PERMISSIONS.TRANSACTIONS_VIEW,
    ],
    [ROLES.BUYER]: [
        PERMISSIONS.PRODUCTS_VIEW,
        PERMISSIONS.ORDERS_VIEW,
    ],
};

async function main() {
    console.log('--- Starting RBAC Assignment ---');
    const users = await prisma.user.findMany({
        include: { store: true }
    });

    for (const user of users) {
        console.log(`Processing user: ${user.email} (Type: ${user.accountType}, Role: ${user.role})`);
        
        let targetRole = user.role;
        let targetIsAdmin = user.isAdmin;
        let targetPermissions = user.permissions;

        // 1. Determine the best role based on accountType if current role is default 'USER' or invalid
        if (user.role === 'USER' || !Object.values(ROLES).includes(user.role)) {
            if (user.accountType === 'ADMIN') {
                targetRole = ROLES.ADMIN;
            } else if (user.accountType === 'SELLER' || user.store) {
                targetRole = ROLES.SELLER;
            } else {
                targetRole = ROLES.BUYER;
            }
        }

        // 2. Sync isAdmin flag
        if (targetRole === ROLES.ADMIN || targetRole === ROLES.MANAGER) {
            targetIsAdmin = true;
        } else {
            // Keep existing isAdmin if it was explicitly set, otherwise false
            // But usually only ADMIN/MANAGER should have it
            if (user.accountType !== 'ADMIN') {
                targetIsAdmin = false;
            }
        }

        // 3. Assign permissions based on the determined role
        targetPermissions = ROLE_PERMISSIONS[targetRole] || [];

        // 4. Update the user
        await prisma.user.update({
            where: { id: user.id },
            data: {
                role: targetRole,
                isAdmin: targetIsAdmin,
                permissions: targetPermissions,
                // Ensure accountType matches the role if possible
                accountType: (targetRole === ROLES.ADMIN || targetRole === ROLES.MANAGER || targetRole === ROLES.STAFF) 
                    ? 'ADMIN' 
                    : (targetRole === ROLES.SELLER ? 'SELLER' : 'BUYER')
            }
        });

        console.log(`  Updated to -> Role: ${targetRole}, isAdmin: ${targetIsAdmin}, AccountType: ${user.accountType === 'ADMIN' && targetRole !== 'ADMIN' ? 'ADMIN (preserved)' : (targetRole === ROLES.ADMIN ? 'ADMIN' : (targetRole === ROLES.SELLER ? 'SELLER' : 'BUYER'))}`);
    }

    console.log('\n--- RBAC Assignment Complete ---');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

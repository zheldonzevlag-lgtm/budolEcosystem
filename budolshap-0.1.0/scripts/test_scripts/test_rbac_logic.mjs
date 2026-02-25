import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PERMISSIONS = {
    SETTINGS_EDIT: 'settings:edit',
    PRODUCTS_VIEW: 'products:view',
};

async function testRBAC(email, requiredPermission) {
    console.log(`\nTesting RBAC for: ${email}`);
    console.log(`Required Permission: ${requiredPermission}`);

    const user = await prisma.user.findUnique({
        where: { email },
        select: {
            email: true,
            isAdmin: true,
            accountType: true,
            role: true,
            permissions: true
        }
    });

    if (!user) {
        console.error('User not found');
        return;
    }

    const isUserAdmin = user.isAdmin === true || user.accountType === 'ADMIN';
    const explicitPermissions = user.permissions || [];
    const hasExplicit = Array.isArray(explicitPermissions) && explicitPermissions.includes(requiredPermission);
    
    // Simulating hasPermission logic
    const authorized = hasExplicit || (isUserAdmin && user.role === 'ADMIN');

    console.log(`Is Admin: ${isUserAdmin}`);
    console.log(`Role: ${user.role}`);
    console.log(`Has Explicit Permission: ${hasExplicit}`);
    console.log(`Total Authorization Result: ${authorized ? 'AUTHORIZED' : 'DENIED'}`);
}

async function main() {
    await testRBAC('reynaldomgalvez@gmail.com', PERMISSIONS.SETTINGS_EDIT);
    await testRBAC('caspermilan80@gmail.com', PERMISSIONS.SETTINGS_EDIT);
    await testRBAC('caspermilan80@gmail.com', PERMISSIONS.PRODUCTS_VIEW);
}

main().catch(console.error).finally(() => prisma.$disconnect());

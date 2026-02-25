import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function testSync() {
    console.log('--- Starting RBAC Sync Test ---');
    
    try {
        // 1. Find a non-admin user to test with
        const user = await prisma.user.findFirst({
            where: { accountType: 'BUYER' }
        });

        if (!user) {
            console.log('No BUYER user found to test with.');
            return;
        }

        console.log(`Testing with user: ${user.email} (Role: ${user.role}, AccountType: ${user.accountType})`);

        // 2. Simulate the sync logic
        let targetRole = 'BUYER';
        const standardPermissions = ['products:view', 'orders:view']; // From lib/rbac.js

        console.log(`Target Role: ${targetRole}`);
        console.log(`Target Permissions: ${JSON.stringify(standardPermissions)}`);

        // 3. Update the user
        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: {
                role: targetRole,
                permissions: standardPermissions,
                isAdmin: false
            }
        });

        console.log('User updated successfully.');
        console.log(`Updated Role: ${updatedUser.role}`);
        console.log(`Updated Permissions: ${JSON.stringify(updatedUser.permissions)}`);

        // 4. Verify a seller user
        const seller = await prisma.user.findFirst({
            where: { accountType: 'SELLER' }
        });

        if (seller) {
            console.log(`Found seller: ${seller.email}`);
            const sellerPermissions = ['products:view', 'products:create', 'products:edit', 'products:delete', 'orders:view', 'orders:process', 'transactions:view'];
            
            const updatedSeller = await prisma.user.update({
                where: { id: seller.id },
                data: {
                    role: 'SELLER',
                    permissions: sellerPermissions,
                    isAdmin: false
                }
            });
            console.log(`Seller ${seller.email} updated to role SELLER with ${sellerPermissions.length} permissions.`);
        }

    } catch (error) {
        console.error('Test failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testSync();

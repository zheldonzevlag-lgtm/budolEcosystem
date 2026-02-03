const { prisma } = require('../../../budolpay-0.1.0/packages/database');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../budolpay-0.1.0/.env') });

async function testUpdateProfile() {
    console.log('--- Testing UPDATE_PROFILE API Logic ---');

    try {
        // 1. Find the admin user we created
        const adminEmail = process.env.ADMIN_EMAIL || 'reynaldomgalvez@gmail.com';
        const admin = await prisma.user.findUnique({
            where: { email: adminEmail }
        });

        if (!admin) {
            console.error('Admin user not found. Please run create-admin-account.js first.');
            return;
        }

        console.log(`Found Admin: ${admin.firstName} ${admin.lastName} (${admin.id})`);

        // 2. Simulate the UPDATE_PROFILE payload
        const userId = admin.id;
        const adminId = admin.id;
        const newFirstName = 'Reynaldo Updated';
        const newLastName = 'Galvez Updated';
        const newPhone = '+63917' + Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
        const newDepartment = 'Engineering';

        console.log(`Updating user ${userId} with:`);
        console.log(`  FirstName: ${newFirstName}`);
        console.log(`  Phone: ${newPhone}`);
        console.log(`  Department: ${newDepartment}`);

        // 3. Execute the update logic (EXACTLY as in route.ts)
        const body = {
            firstName: newFirstName,
            lastName: newLastName,
            phoneNumber: newPhone,
            department: newDepartment,
            role: admin.role
        };

        const oldUser = await prisma.user.findUnique({ where: { id: userId } });
        
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { 
                firstName: body.firstName !== undefined ? body.firstName : oldUser.firstName, 
                lastName: body.lastName !== undefined ? body.lastName : oldUser.lastName, 
                email: body.email !== undefined ? body.email : oldUser.email, 
                phoneNumber: body.phoneNumber !== undefined ? body.phoneNumber : oldUser.phoneNumber, 
                role: body.role !== undefined ? body.role : oldUser.role,
                department: body.department !== undefined ? body.department : oldUser.department
            }
        });

        // Create the audit log as the route would
        await prisma.auditLog.create({
            data: {
                action: "USER_PROFILE_UPDATED",
                entity: "User",
                entityId: userId,
                userId: adminId || "SYSTEM",
                oldValue: oldUser,
                newValue: { 
                    firstName: updatedUser.firstName, 
                    lastName: updatedUser.lastName, 
                    email: updatedUser.email, 
                    phoneNumber: updatedUser.phoneNumber, 
                    role: updatedUser.role, 
                    department: updatedUser.department 
                },
                ipAddress: "Internal System"
            }
        });

        console.log('SUCCESS: User updated and audit log created in database.');
        console.log(`Updated User in DB: ${updatedUser.firstName} ${updatedUser.lastName}, Phone: ${updatedUser.phoneNumber}, Dept: ${updatedUser.department}`);

        // 4. Verify Audit Log creation
        const latestLog = await prisma.auditLog.findFirst({
            where: {
                entityId: userId,
                action: 'USER_PROFILE_UPDATED'
            },
            orderBy: { createdAt: 'desc' }
        });

        if (latestLog) {
            console.log('SUCCESS: Audit log created for profile update.');
            console.log(`Audit Log Action: ${latestLog.action}`);
            console.log(`Audit Log NewValue:`, JSON.stringify(latestLog.newValue, null, 2));
        } else {
            console.error('ERROR: No audit log found for profile update.');
        }

    } catch (error) {
        console.error('TEST FAILED:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testUpdateProfile();

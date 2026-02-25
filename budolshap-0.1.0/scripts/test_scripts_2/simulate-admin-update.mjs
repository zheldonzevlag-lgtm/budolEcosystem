import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const prisma = new PrismaClient();

async function simulateAdminUpdate() {
    const email = 'galvezjon59@gmail.com';
    const adminEmail = 'admin@budolshap.com'; // Simulating an admin acting
    const newName = 'Tony Stark';
    const newAccountType = 'BUYER';
    
    console.log(`🔄 Simulating admin update for ${email} to ${newName} (${newAccountType})...`);

    try {
        // 0. Ensure Admin user exists for logging
        let admin = await prisma.user.findUnique({ where: { email: adminEmail } });
        if (!admin) {
             console.log('Creating mock admin for audit logs...');
             admin = await prisma.user.create({
                 data: {
                     id: crypto.randomUUID(),
                     email: adminEmail,
                     name: 'System Admin',
                     password: 'MOCK_PASSWORD_HASH',
                     phoneNumber: '+639000000000',
                     image: 'https://ui-avatars.com/api/?name=System+Admin',
                     accountType: 'ADMIN',
                     isAdmin: true
                 }
             });
         }

        // 1. Get the local user to get their ID and metadata
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            console.error('User not found in local database');
            return;
        }

        const ssoUserId = user.metadata?.ssoUserId;
        if (!ssoUserId) {
            console.error('ssoUserId not found in metadata');
            return;
        }

        // 2. Call the budolID update (as the API would do)
        const BUDOL_ID_URL = process.env.BUDOL_ID_URL || 'http://127.0.0.1:8000';
        
        const nameParts = newName.trim().split(/\s+/);
        const ssoProfileUpdate = {
            firstName: nameParts[0],
            lastName: nameParts.slice(1).join(' ') || '',
            role: newAccountType === 'ADMIN' ? 'ADMIN' : 'USER'
        };

        console.log(`📡 Syncing to budolID (${BUDOL_ID_URL}/users/${ssoUserId}/profile)...`);
        const response = await fetch(`${BUDOL_ID_URL}/users/${ssoUserId}/profile`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(ssoProfileUpdate),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `budolID update failed: ${response.status}`);
        }

        const ssoResult = await response.json();
        console.log('✅ budolID sync successful:', ssoResult);

        // 3. Update local database (as the API would do)
        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: {
                name: newName,
                accountType: newAccountType,
                isAdmin: newAccountType === 'ADMIN'
            }
        });

        console.log('✅ Local update successful:', updatedUser.name, updatedUser.accountType);

        // 4. Create Compliance Audit Log (PCI DSS Requirement 10)
        console.log('📝 Recording compliance audit log...');
        const auditLog = await prisma.auditLog.create({
            data: {
                userId: admin.id,
                action: 'ADMIN_USER_UPDATE',
                metadata: {
                    targetUserId: user.id,
                    targetEmail: email,
                    changes: {
                        name: { from: user.name, to: newName },
                        accountType: { from: user.accountType, to: newAccountType },
                        isAdmin: { from: user.isAdmin, to: newAccountType === 'ADMIN' }
                    },
                    sync: {
                        service: 'budolID',
                        ssoUserId: ssoUserId,
                        status: 'SUCCESS'
                    },
                    compliance: {
                        standard: 'PCI DSS v4.0 Requirement 10.2.1.3',
                        reason: 'Administrative profile and privilege modification'
                    }
                }
            }
        });
        console.log('✅ Audit log recorded:', auditLog.id);

    } catch (error) {
        console.error('Error during simulation:', error);
    } finally {
        await prisma.$disconnect();
    }
}

simulateAdminUpdate();
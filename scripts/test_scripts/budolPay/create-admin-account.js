
const { prisma } = require('d:/IT Projects/budolEcosystem/budolpay-0.1.0/packages/database/index.js');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../budolpay-0.1.0/.env') });

async function createAdmin() {
    console.log('--- Phase 2: Admin Account Creation (Environment Driven) ---');
    
    // Retrieve from environment variables for security (PCI DSS 8.2)
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminPhone = process.env.ADMIN_PHONE || '+639170000001';
    
    if (!adminEmail || !adminPassword) {
        console.error('ERROR: ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env file.');
        process.exit(1);
    }
    
    try {
        console.log(`Hashing password for ${adminEmail}...`);
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(adminPassword, salt);
        
        console.log('Checking if user already exists...');
        const existingUser = await prisma.user.findUnique({
            where: { email: adminEmail }
        });
        
        if (existingUser) {
            console.log('User already exists. Updating role to ADMIN and resetting password...');
            const updatedUser = await prisma.user.update({
                where: { email: adminEmail },
                data: {
                    passwordHash: hashedPassword,
                    role: 'ADMIN',
                    firstName: 'Reynaldo',
                    lastName: 'Galvez',
                    phoneVerified: true,
                    emailVerified: true
                }
            });

            // Phase 2: Forensic Audit Log for Account Update (PCI DSS 10.2.2)
            await prisma.auditLog.create({
                data: {
                    action: 'ADMIN_ACCOUNT_UPDATED',
                    userId: updatedUser.id,
                    entity: 'Security',
                    entityId: updatedUser.id,
                    ipAddress: '127.0.0.1', // Bootstrap script
                    userAgent: 'Budol Bootstrap Engine/1.0',
                    metadata: {
                        method: 'create-admin-account.js',
                        target_email: adminEmail,
                        compliance: {
                            pci_dss: '10.2.2',
                            bsp: 'Circular 808'
                        }
                    }
                }
            });
            console.log('SUCCESS: Admin account updated and forensic log created.');
        } else {
            console.log('Creating new admin user...');
            const newUser = await prisma.user.create({
                data: {
                    email: adminEmail,
                    passwordHash: hashedPassword,
                    phoneNumber: adminPhone,
                    firstName: 'Reynaldo',
                    lastName: 'Galvez',
                    role: 'ADMIN',
                    phoneVerified: true,
                    emailVerified: true
                }
            });

            // Phase 2: Forensic Audit Log for Account Creation (PCI DSS 10.2.2)
            await prisma.auditLog.create({
                data: {
                    action: 'ADMIN_ACCOUNT_CREATED',
                    userId: newUser.id,
                    entity: 'Security',
                    entityId: newUser.id,
                    ipAddress: '127.0.0.1', // Bootstrap script
                    userAgent: 'Budol Bootstrap Engine/1.0',
                    metadata: {
                        method: 'create-admin-account.js',
                        target_email: adminEmail,
                        compliance: {
                            pci_dss: '10.2.2',
                            bsp: 'Circular 808'
                        }
                    }
                }
            });
            console.log('SUCCESS: Admin account created with ID:', newUser.id, 'and forensic log created.');
        }

        // Phase 5: Verification
        console.log('\n--- Phase 5: Verification ---');
        const verifiedUser = await prisma.user.findUnique({
            where: { email: adminEmail }
        });

        if (verifiedUser && verifiedUser.role === 'ADMIN') {
            const isPasswordValid = await bcrypt.compare(adminPassword, verifiedUser.passwordHash);
            if (isPasswordValid) {
                console.log('VERIFIED: Admin account exists with correct role and password (derived from ENV).');
            } else {
                throw new Error('Verification failed: Password mismatch!');
            }
        } else {
            throw new Error('Verification failed: User not found or role is not ADMIN!');
        }

    } catch (error) {
        console.error('FAILED to create admin:', error.message);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

createAdmin();

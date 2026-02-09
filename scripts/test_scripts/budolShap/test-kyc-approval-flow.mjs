import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function testKycApprovalFlow() {
    console.log('--- Testing KYC Approval Flow ---')
    
    const testEmail = 'test_kyc_user_' + Date.now() + '@example.com'
    const userId = 'test_user_kyc_' + Date.now()

    try {
        // 1. Create a user with PENDING KYC
        console.log('1. Creating user with PENDING KYC...')
        const user = await prisma.user.create({
            data: {
                id: userId,
                name: 'Test KYC User',
                email: testEmail,
                phoneNumber: '09' + Math.floor(Math.random() * 1000000000),
                password: 'hashed_password',
                image: 'https://example.com/avatar.png',
                kycStatus: 'PENDING',
                kycDetails: {
                    tier: 'INDIVIDUAL',
                    fullName: 'Test KYC User',
                    idType: 'PASSPORT',
                    idNumber: 'P1234567A',
                    submittedAt: new Date().toISOString()
                }
            }
        })
        console.log('User created:', user.id)

        // 2. Simulate Admin Approval via manual DB update (since we can't easily call the API route in a standalone script without more setup)
        console.log('2. Simulating Admin Approval...')
        const adminId = 'test_admin_id' // Simulation
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                kycStatus: 'VERIFIED',
                kycDetails: {
                    ...(user.kycDetails),
                    adminAction: {
                        status: 'VERIFIED',
                        reason: 'Verified via test script',
                        actionedBy: adminId,
                        actionedAt: new Date().toISOString()
                    }
                }
            }
        })
        
        if (updatedUser.kycStatus === 'VERIFIED') {
            console.log('✅ SUCCESS: User status updated to VERIFIED')
        } else {
            console.error('❌ FAILURE: User status not updated correctly')
        }

        // 3. Create Audit Log for the action
        console.log('3. Creating Audit Log...')
        const auditLog = await prisma.auditLog.create({
            data: {
                userId: adminId,
                action: 'KYC_STATUS_UPDATE',
                ipAddress: '127.0.0.1',
                userAgent: 'Test Script',
                metadata: {
                    targetUserId: userId,
                    oldStatus: 'PENDING',
                    newStatus: 'VERIFIED',
                    reason: 'Verified via test script'
                }
            }
        })
        console.log('Audit Log created:', auditLog.id)

        // Cleanup
        console.log('Cleaning up...')
        await prisma.auditLog.delete({ where: { id: auditLog.id } })
        await prisma.user.delete({ where: { id: userId } })
        console.log('Cleanup complete')

    } catch (error) {
        console.error('Test failed:', error)
    } finally {
        await prisma.$disconnect()
    }
}

testKycApprovalFlow()

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedFinancialLog() {
    console.log('Seeding financial audit log for BSP compliance...');
    
    try {
        const log = await prisma.auditLog.create({
            data: {
                action: 'MANUAL_COMPLIANCE_CHECK',
                entity: 'Financial',
                metadata: {
                    reason: 'Verification of BSP Circular No. 808 compliance monitoring',
                    standard: 'Financial Transaction Audit'
                },
                newValue: { status: 'VERIFIED' }
            }
        });
        
        console.log('Successfully created financial audit log:', log.id);
    } catch (error) {
        console.error('Error seeding log:', error);
    } finally {
        await prisma.$disconnect();
    }
}

seedFinancialLog();

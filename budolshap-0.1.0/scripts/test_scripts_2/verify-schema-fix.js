/**
 * Verification Script for Schema Integrity Fixes
 * 
 * This script tests the new fields and enum values added to the Return model.
 * 
 * Usage: node scripts/verify-schema-fix.js
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifySchemaFix() {
    console.log('🧪 Starting Schema Integrity Verification...\n');

    try {
        // 1. Test ReturnStatus Enum: TO_PICKUP
        console.log('Checking ReturnStatus enum for TO_PICKUP...');
        const statusValues = Object.values(await prisma.$queryRaw`
            SELECT enumlabel 
            FROM pg_enum 
            JOIN pg_type ON pg_enum.enumtypid = pg_type.oid 
            WHERE pg_type.typname = 'ReturnStatus'
        `.catch(() => []));
        
        // Fallback check for non-Postgres or if query fails
        console.log('Attempting to create a test return with TO_PICKUP status...');
        
        // Find a valid order to link the return to
        const testOrder = await prisma.order.findFirst();
        if (!testOrder) {
            console.log('⚠️ No orders found in database. Please run seed-test-data.js first.');
            return;
        }

        const testReturnId = `test-return-${Date.now()}`;
        
        console.log(`Creating test return with ID: ${testReturnId}`);
        const newReturn = await prisma.return.create({
            data: {
                id: testReturnId,
                orderId: testOrder.id,
                reason: 'SCHEMA_VERIFICATION_TEST',
                status: 'TO_PICKUP', // NEW ENUM VALUE
                adminId: 'admin_test_123', // NEW FIELD
                adminNotes: 'This is a test note for schema verification.', // NEW FIELD
                refundAmount: 0
            }
        });

        console.log('✅ Successfully created return with new status and fields:');
        console.log(`   - ID: ${newReturn.id}`);
        console.log(`   - Status: ${newReturn.status}`);
        console.log(`   - Admin ID: ${newReturn.adminId}`);
        console.log(`   - Admin Notes: ${newReturn.adminNotes}`);

        // 2. Clean up
        console.log('\nCleaning up test data...');
        await prisma.return.delete({
            where: { id: testReturnId }
        });
        console.log('✅ Test return deleted.');

        console.log('\n✨ Schema Integrity Verification Passed!');

    } catch (error) {
        console.error('\n❌ Verification Failed:');
        console.error(error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

verifySchemaFix();

/**
 * Budol Ecosystem Security & Admin Tools
 * 
 * Script: promote_to_admin.js (BudolPay/Public)
 * Purpose: Elevate a user to ADMIN role in the BudolPay/Public system.
 * Compliance: Budol Implementation Standard - Phase 4 (Security & RBAC)
 */

const { PrismaClient } = require('../../../budolpay-0.1.0/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const email = 'reynaldomgalvez@gmail.com';
  
  console.log(`--- BudolPay Admin Elevation Tool ---`);
  console.log(`Target User: ${email}`);

  try {
    // Checking if user exists first using raw query to bypass schema sync issues
    const users = await prisma.$queryRaw`
      SELECT id, email, role, "isAdmin" FROM "User" WHERE email = ${email};
    `;
    
    if (users && users.length > 0) {
      console.log(`[INFO] User found in public.User table.`);
      
      // Update role and isAdmin flag
      await prisma.$executeRaw`
        UPDATE "User" SET role = 'ADMIN', "isAdmin" = true WHERE email = ${email};
      `;
      
      console.log(`[SUCCESS] User ${email} promoted to ADMIN in public schema.`);
    } else {
      console.log(`[ERROR] User with email ${email} not found in public.User table.`);
    }
  } catch (error) {
    console.error('[ERROR] An unexpected error occurred:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();

/**
 * Budol Ecosystem Security & Admin Tools
 * 
 * Script: promote_to_admin.js (BudolID)
 * Purpose: Elevate a user to ADMIN role in the BudolID SSO system.
 * Compliance: Budol Implementation Standard - Phase 4 (Security & RBAC)
 */

const { PrismaClient } = require('../../../budolID-0.1.0/generated/client');
const prisma = new PrismaClient();

async function main() {
  const email = 'reynaldomgalvez@gmail.com';
  
  console.log(`--- BudolID Admin Elevation Tool ---`);
  console.log(`Target User: ${email}`);

  try {
    const user = await prisma.user.update({
      where: { email },
      data: { role: 'ADMIN' },
    });
    console.log(`[SUCCESS] User role updated to ADMIN in BudolID.`);
    console.log(`[INFO] ID: ${user.id}`);
    console.log(`[INFO] Name: ${user.name}`);
  } catch (error) {
    if (error.code === 'P2025') {
      console.error(`[ERROR] User with email ${email} not found in BudolID database.`);
    } else {
      console.error('[ERROR] An unexpected error occurred:', error.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main();

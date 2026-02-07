const { PrismaClient } = require('../generated/client');
const prisma = new PrismaClient();

async function syncUsers() {
  console.log('🔄 Starting user synchronization from public to budolid schema...');

  try {
    // 1. Fetch all users from public schema
    const publicUsers = await prisma.$queryRawUnsafe(
      'SELECT id, "phoneNumber", email, name, password, "createdAt", "updatedAt" FROM "public"."User"'
    );
    console.log(`📊 Found ${publicUsers.length} users in public schema.`);

    // 2. Fetch all users from budolid schema
    const budolidUsers = await prisma.user.findMany({
      select: { email: true, phoneNumber: true }
    });
    const budolidEmails = new Set(budolidUsers.map(u => u.email));
    const budolidPhones = new Set(budolidUsers.map(u => u.phoneNumber).filter(p => p));

    console.log(`📊 Found ${budolidUsers.length} users in budolid schema.`);

    let syncedCount = 0;
    let skippedCount = 0;

    // 3. Sync missing users
    for (const user of publicUsers) {
      const isDuplicate = budolidEmails.has(user.email) || (user.phoneNumber && budolidPhones.has(user.phoneNumber));

      if (!isDuplicate) {
        console.log(`➕ Syncing user: ${user.email} (${user.phoneNumber || 'no phone'})`);
        
        // Split name into first and last name if possible
        const nameParts = (user.name || '').split(' ');
        const firstName = nameParts[0] || 'User';
        const lastName = nameParts.slice(1).join(' ') || 'Legacy';

        await prisma.user.create({
          data: {
            email: user.email,
            password: user.password,
            phoneNumber: user.phoneNumber,
            firstName: firstName,
            lastName: lastName,
            name: user.name,
            role: 'USER',
            isVerified: true,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
          }
        });
        syncedCount++;
      } else {
        skippedCount++;
      }
    }

    console.log(`\n✅ Synchronization complete!`);
    console.log(`📈 Synced: ${syncedCount}`);
    console.log(`⏭️  Skipped: ${skippedCount}`);

  } catch (error) {
    console.error('❌ Sync failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

syncUsers();

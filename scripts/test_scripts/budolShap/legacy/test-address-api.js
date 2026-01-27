const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- Testing Address API Coordinate Saving ---');
  
  // Find a test user
  const user = await prisma.user.findFirst();
  if (!user) {
    console.error('No user found to test with.');
    return;
  }
  
  console.log(`Using user: ${user.name} (${user.id})`);
  
  const testAddress = {
    userId: user.id,
    name: 'Test Map Address',
    email: 'test@example.com',
    street: 'Test Street',
    city: 'Test City',
    state: 'Test State',
    zip: '1234',
    country: 'Philippines',
    phone: '+639123456789',
    barangay: 'Test Barangay',
    latitude: 14.5995,
    longitude: 120.9842
  };
  
  try {
    // 1. Create address
    console.log('Creating address with coordinates...');
    const created = await prisma.address.create({
      data: testAddress
    });
    
    console.log('Created address:', {
      id: created.id,
      latitude: created.latitude,
      longitude: created.longitude
    });
    
    if (created.latitude === 14.5995 && created.longitude === 120.9842) {
      console.log('✅ Success: Coordinates saved correctly.');
    } else {
      console.error('❌ Error: Coordinates did not match.');
    }
    
    // 2. Cleanup
    console.log('Cleaning up test address...');
    await prisma.address.delete({
      where: { id: created.id }
    });
    console.log('Cleanup complete.');
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();

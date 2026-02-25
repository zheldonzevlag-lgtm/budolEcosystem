
/** @jest-environment node */
const { PrismaClient } = require('@prisma/client-custom-v4');
const prisma = new PrismaClient();

describe('Store Address Optional Fields Verification', () => {
  let userId;
  let storeId;

  beforeAll(async () => {
    // Create a test user
    const user = await prisma.user.create({
      data: {
        id: `user_store_opt_${Date.now()}`,
        name: 'Store Opt Test User',
        email: `test_store_opt_${Date.now()}@example.com`,
        password: 'password123',
        phoneNumber: `09${Date.now().toString().slice(-9)}`,
        image: 'default.jpg',
      },
    });
    userId = user.id;

    // Create a test store
    const store = await prisma.store.create({
      data: {
        userId: userId,
        name: 'Optional Fields Store',
        description: 'Test Store Description',
        status: 'APPROVED',
        username: `store_opt_${Date.now()}`,
        address: 'Test Address String',
        logo: 'logo.jpg',
        email: `store_opt_${Date.now()}@example.com`,
        contact: '09123456789',
      },
    });
    storeId = store.id;
  });

  afterAll(async () => {
    // Cleanup
    if (storeId) {
      await prisma.storeAddress.deleteMany({ where: { storeId } });
      await prisma.store.delete({ where: { id: storeId } });
    }
    if (userId) {
      await prisma.user.delete({ where: { id: userId } });
    }
    await prisma.$disconnect();
  });

  test('should create store address without district and zip', async () => {
    const addressData = {
      storeId,
      phone: '09123456789',
      // district: missing
      // zip: missing
      city: 'Test City',
      province: 'Test Province',
      detailedAddress: '123 Test St',
      country: 'Philippines',
      label: 'Work',
      isDefault: true
    };

    const address = await prisma.storeAddress.create({
      data: {
        ...addressData,
        district: null, // Simulate API handling
        zip: null
      }
    });

    expect(address.id).toBeDefined();
    expect(address.district).toBeNull();
    expect(address.zip).toBeNull();
    expect(address.city).toBe('Test City');
  });
});

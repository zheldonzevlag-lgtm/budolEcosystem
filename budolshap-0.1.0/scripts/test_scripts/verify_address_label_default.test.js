
/** @jest-environment node */
const { PrismaClient } = require('@prisma/client-custom-v4');
const prisma = new PrismaClient();

describe('Address Label and Default Logic', () => {
  let userId;
  let storeId;

  beforeAll(async () => {
    // Create a test user
    const user = await prisma.user.create({
      data: {
        id: `user_lbl_${Date.now()}`,
        name: 'Label Test User',
        email: `test_label_${Date.now()}@example.com`,
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
        name: 'Label Test Store',
        description: 'Test Store Description',
        status: 'APPROVED',
        username: `store_lbl_${Date.now()}`,
        address: 'Test Address String',
        logo: 'logo.jpg',
        email: `store_lbl_${Date.now()}@example.com`,
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
      await prisma.address.deleteMany({ where: { userId } });
      await prisma.user.delete({ where: { id: userId } });
    }
    await prisma.$disconnect();
  });

  describe('User Address (Address Model)', () => {
    let address1Id;
    let address2Id;

    test('should create address with label and isDefault=true', async () => {
      const address = await prisma.address.create({
        data: {
          userId,
          name: 'Home Address',
          phone: '09123456789',
          email: 'test@example.com',
          street: '123 Home St',
          city: 'Home City',
          state: 'Home Province',
          zip: '1000',
          country: 'Philippines',
          label: 'Home',
          isDefault: true
        },
      });
      address1Id = address.id;
      expect(address.label).toBe('Home');
      expect(address.isDefault).toBe(true);
    });

    test('should create second address with isDefault=true and unset previous default', async () => {
      // Simulate the API logic: unset previous default first
      await prisma.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false }
      });

      const address = await prisma.address.create({
        data: {
          userId,
          name: 'Work Address',
          phone: '09123456789',
          email: 'test@example.com',
          street: '456 Work St',
          city: 'Work City',
          state: 'Work Province',
          zip: '2000',
          country: 'Philippines',
          label: 'Work',
          isDefault: true
        },
      });
      address2Id = address.id;
      expect(address.label).toBe('Work');
      expect(address.isDefault).toBe(true);

      // Verify first address is no longer default
      const address1 = await prisma.address.findUnique({ where: { id: address1Id } });
      expect(address1.isDefault).toBe(false);
    });
  });

  describe('Store Address (StoreAddress Model)', () => {
    test('should create store address with label', async () => {
      const address = await prisma.storeAddress.create({
        data: {
          storeId,
          phone: '09123456789',
          district: 'District 1',
          province: 'Province 1',
          city: 'City 1',
          detailedAddress: 'Detailed Address 1',
          zip: '3000',
          country: 'Philippines',
          label: 'Branch 1',
          isDefault: true
        },
      });
      expect(address.label).toBe('Branch 1');
      expect(address.isDefault).toBe(true);
    });
  });
});

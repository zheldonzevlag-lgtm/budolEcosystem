
/** @jest-environment node */
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { PrismaClient } = require('@prisma/client-custom-v4');
const prisma = new PrismaClient();

describe('Comprehensive Address Scenarios', () => {
  let userId;
  let storeId;

  beforeAll(async () => {
    // Create a test user
    const user = await prisma.user.create({
      data: {
        id: `user_${Date.now()}`,
        name: 'Test Address User',
        email: `test_address_${Date.now()}@example.com`,
        password: 'password123',
        phoneNumber: `09${Date.now().toString().slice(-9)}`, // Random phone
        image: 'default.jpg',
      },
    });
    userId = user.id;

    // Create a test store
    const store = await prisma.store.create({
      data: {
        userId: userId,
        name: 'Test Address Store',
        description: 'Test Store Description',
        status: 'APPROVED',
        username: `store_${Date.now()}`,
        address: 'Test Address String',
        logo: 'logo.jpg',
        email: `store_${Date.now()}@example.com`,
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
    test('should create address with barangay', async () => {
      const address = await prisma.address.create({
        data: {
          userId,
          name: 'With Barangay',
          phone: '09123456789',
          email: 'test@example.com',
          street: '123 Street',
          city: 'Test City',
          state: 'Test Province',
          barangay: 'Test Barangay',
          zip: '1234',
          country: 'Philippines',
          isDefault: true,
        },
      });
      expect(address.barangay).toBe('Test Barangay');
      expect(address.isDefault).toBe(true);
    });

    test('should create address without barangay', async () => {
      const address = await prisma.address.create({
        data: {
          userId,
          name: 'Without Barangay',
          phone: '09123456789',
          email: 'test@example.com',
          street: '456 Street',
          city: 'Test City',
          state: 'Test Province',
          // barangay omitted
          zip: '1234',
          country: 'Philippines',
        },
      });
      expect(address.barangay).toBeNull();
    });

    test('should update address to remove barangay', async () => {
      const address = await prisma.address.create({
        data: {
          userId,
          name: 'To Remove Barangay',
          phone: '09123456789',
          email: 'test@example.com',
          street: '789 Street',
          city: 'Test City',
          state: 'Test Province',
          barangay: 'Initial Barangay',
          zip: '1234',
          country: 'Philippines',
        },
      });

      const updated = await prisma.address.update({
        where: { id: address.id },
        data: { barangay: null },
      });
      expect(updated.barangay).toBeNull();
    });

    test('should create address without zip', async () => {
      const address = await prisma.address.create({
        data: {
          userId,
          name: 'Without Zip',
          phone: '09123456789',
          email: 'test@example.com',
          street: '123 Street',
          city: 'Test City',
          state: 'Test Province',
          barangay: 'Test Barangay',
          // zip omitted
          country: 'Philippines',
        },
      });
      expect(address.zip).toBeNull();
    });
  });

  describe('Store Address (StoreAddress Model)', () => {
    test('should create store address with barangay', async () => {
      const address = await prisma.storeAddress.create({
        data: {
          storeId,
          phone: '09123456789',
          district: 'Test Region',
          province: 'Test Province',
          city: 'Test City',
          barangay: 'Test Barangay',
          detailedAddress: '123 Store St',
          zip: '1234',
          country: 'Philippines',
        },
      });
      expect(address.barangay).toBe('Test Barangay');
      expect(address.province).toBe('Test Province');
    });

    test('should create store address without barangay', async () => {
      const address = await prisma.storeAddress.create({
        data: {
          storeId,
          phone: '09123456789',
          district: 'Test Region',
          province: 'Test Province',
          city: 'Test City',
          // barangay omitted
          detailedAddress: '456 Store St',
          zip: '1234',
          country: 'Philippines',
        },
      });
      expect(address.barangay).toBeNull();
    });

    test('should update store address to remove barangay', async () => {
      const address = await prisma.storeAddress.create({
        data: {
          storeId,
          phone: '09123456789',
          district: 'Test Region',
          province: 'Test Province',
          city: 'Test City',
          barangay: 'Initial Barangay',
          detailedAddress: '789 Store St',
          zip: '1234',
          country: 'Philippines',
        },
      });

      const updated = await prisma.storeAddress.update({
        where: { id: address.id },
        data: { barangay: null },
      });
      expect(updated.barangay).toBeNull();
    });

    test('should create store address without zip', async () => {
      const address = await prisma.storeAddress.create({
        data: {
          storeId,
          phone: '09123456789',
          district: 'Test Region',
          province: 'Test Province',
          city: 'Test City',
          barangay: 'Test Barangay',
          detailedAddress: '123 Store St',
          // zip omitted
          country: 'Philippines',
        },
      });
      expect(address.zip).toBeNull();
    });
  });
});

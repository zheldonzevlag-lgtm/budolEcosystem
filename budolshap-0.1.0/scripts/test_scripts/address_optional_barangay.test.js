
/** @jest-environment node */
const { PrismaClient } = require('@prisma/client-custom-v4');
const prisma = new PrismaClient();

describe('Address Model Optional Barangay', () => {
  let userId;

  beforeAll(async () => {
    const now = Date.now();
    const newUser = await prisma.user.create({
      data: {
        id: `user_optional_barangay_${now}`,
        name: 'Test User',
        email: `test_address_optional_${now}@example.com`,
        password: 'password123',
        phoneNumber: `09${now.toString().slice(-9)}`,
        image: 'default.jpg',
      },
    });
    userId = newUser.id;
  });

  afterAll(async () => {
    if (userId) {
      await prisma.address.deleteMany({ where: { userId } });
      await prisma.user.delete({ where: { id: userId } });
    }
    await prisma.$disconnect();
  });

  test('should create an address without barangay', async () => {
    const address = await prisma.address.create({
      data: {
        userId: userId,
        name: 'Test Address',
        phone: '09123456789',
        email: 'test@example.com',
        street: '123 Test St',
        city: 'Test City',
        state: 'Test State',
        zip: '1234',
        country: 'Philippines',
        // barangay is omitted
      },
    });

    expect(address).toHaveProperty('id');
    expect(address.barangay).toBeNull();

    // Cleanup
    await prisma.address.delete({
      where: { id: address.id },
    });
  });

  test('should create an address with null barangay', async () => {
    const address = await prisma.address.create({
      data: {
        user: { connect: { id: userId } },
        name: 'Test Address Null',
        phone: '09123456789',
        email: 'test@example.com',
        street: '123 Test St',
        city: 'Test City',
        state: 'Test State',
        zip: '1234',
        country: 'Philippines',
        barangay: null,
      },
    });

    expect(address).toHaveProperty('id');
    expect(address.barangay).toBeNull();

    // Cleanup
    await prisma.address.delete({
      where: { id: address.id },
    });
  });
});

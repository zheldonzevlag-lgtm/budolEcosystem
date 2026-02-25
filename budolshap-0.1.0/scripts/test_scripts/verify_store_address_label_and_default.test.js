/** @jest-environment node */
const { PrismaClient } = require('@prisma/client-custom-v4');
const prisma = new PrismaClient();

describe('Store Address Default Uniqueness', () => {
  let userId;
  let storeId;

  beforeAll(async () => {
    const now = Date.now();
    const user = await prisma.user.create({
      data: {
        id: `user_store_test_${now}`,
        name: 'Store Test User',
        email: `store_test_${now}@example.com`,
        password: 'password123',
        phoneNumber: `09${now.toString().slice(-9)}`,
        image: 'default.jpg',
      },
    });
    userId = user.id;

    const store = await prisma.store.create({
      data: {
        userId,
        name: 'Test Store',
        description: 'Store for testing default address logic',
        username: `test_store_${now}`,
        address: '123 Test St, Test City',
        logo: 'logo.png',
        email: `store_${now}@example.com`,
        contact: `09${(now + 1).toString().slice(-9)}`,
      },
    });
    storeId = store.id;
  });

  afterAll(async () => {
    if (storeId) {
      await prisma.storeAddress.deleteMany({ where: { storeId } });
      await prisma.store.delete({ where: { id: storeId } });
    }
    if (userId) {
      await prisma.user.delete({ where: { id: userId } });
    }
    await prisma.$disconnect();
  });

  test('ensures only one default store address after setting default', async () => {
    // Seed two addresses both marked default (simulate historical bad state)
    const addr1 = await prisma.storeAddress.create({
      data: {
        storeId,
        phone: '09111111111',
        city: 'Manila',
        detailedAddress: '123 Bad Default St',
        isDefault: true,
      },
    });
    const addr2 = await prisma.storeAddress.create({
      data: {
        storeId,
        phone: '09222222222',
        city: 'Makati',
        detailedAddress: '456 Bad Default Ave',
        isDefault: true,
      },
    });

    // Confirm bad state: 2 defaults
    const preDefaults = await prisma.storeAddress.count({
      where: { storeId, isDefault: true },
    });
    expect(preDefaults).toBe(2);

    // Simulate "Set as Default" on addr2 using transactional logic
    await prisma.$transaction(async (tx) => {
      await tx.storeAddress.updateMany({
        where: { storeId, isDefault: true, id: { not: addr2.id } },
        data: { isDefault: false },
      });
      await tx.storeAddress.update({
        where: { id: addr2.id },
        data: { isDefault: true },
      });
    });

    // Verify only one default remains and it is addr2
    const postDefaults = await prisma.storeAddress.findMany({
      where: { storeId, isDefault: true },
    });
    expect(postDefaults.length).toBe(1);
    expect(postDefaults[0].id).toBe(addr2.id);

    // Update addr1 label without changing default; ensure default is preserved
    const updatedAddr1 = await prisma.storeAddress.update({
      where: { id: addr1.id },
      data: { label: 'Warehouse' },
    });
    expect(updatedAddr1.label).toBe('Warehouse');

    const finalDefaults = await prisma.storeAddress.findMany({
      where: { storeId, isDefault: true },
    });
    expect(finalDefaults.length).toBe(1);
    expect(finalDefaults[0].id).toBe(addr2.id);
  });
});

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres:r00t@localhost:5432/budolpay?schema=public"
    }
  }
});

describe('Admin Role Verification', () => {
  const testEmail = 'reynaldomgalvez@gmail.com';

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('User should have ADMIN role in budolpay database', async () => {
    const user = await prisma.user.findUnique({
      where: { email: testEmail }
    });

    expect(user).toBeDefined();
    expect(user?.role).toBe('ADMIN');
    console.log(`Verification success: ${testEmail} role is ${user?.role}`);
  });
});

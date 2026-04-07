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

  test.skip('User should have ADMIN role in budolpay_db database', async () => {
    const prismaPayDb = new PrismaClient({
      datasources: {
        db: {
          url: "postgresql://postgres:r00t@localhost:5432/budolpay_db?schema=public"
        }
      }
    });
    
    const users: any[] = await prismaPayDb.$queryRaw`
      SELECT role FROM "User" WHERE email = ${testEmail}
    `;

    expect(users.length).toBeGreaterThan(0);
    expect(users[0].role).toBe('ADMIN');
    await prismaPayDb.$disconnect();
  });

  test('User should have ADMIN role in budolshap_1db (budolid schema)', async () => {
    const prismaShapDb = new PrismaClient({
      datasources: {
        db: {
          url: "postgresql://postgres:r00t@localhost:5432/budolshap_1db?schema=budolid"
        }
      }
    });
    
    // Using queryRaw because the schema might not be in the default client
    const users: any[] = await prismaShapDb.$queryRaw`
      SELECT role FROM "budolid"."User" WHERE email = ${testEmail}
    `;

    expect(users.length).toBeGreaterThan(0);
    expect(users[0].role).toBe('ADMIN');
    await prismaShapDb.$disconnect();
  });
});

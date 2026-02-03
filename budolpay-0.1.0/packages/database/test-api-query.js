const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Querying employees like the API does...');
    const employees = await prisma.user.findMany({
      where: {
        role: {
          in: ["ADMIN", "STAFF"]
        }
      },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { auditLogs: true }
        }
      }
    });

    console.log('Employees found:', JSON.stringify(employees, null, 2));

  } catch (error) {
    console.error('An error occurred:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();

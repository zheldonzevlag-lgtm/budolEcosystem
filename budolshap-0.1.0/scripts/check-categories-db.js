import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  try {
    const level1 = await prisma.category.findMany({
      where: { level: 1, isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
    console.log('--- LEVEL 1 (Main) CATEGORIES ---');
    console.log(JSON.stringify(level1, null, 2));

    const toysCats = await prisma.category.findMany({
      where: {
        OR: [
          { name: { contains: 'toy', mode: 'insensitive' } },
          { name: { contains: 'game', mode: 'insensitive' } },
          { name: { contains: 'collectible', mode: 'insensitive' } },
          { slug: { contains: 'toy', mode: 'insensitive' } }
        ]
      }
    });
    console.log('--- TOYS/GAMES/COLLECTIBLES CATEGORIES ---');
    console.log(JSON.stringify(toysCats, null, 2));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

run();

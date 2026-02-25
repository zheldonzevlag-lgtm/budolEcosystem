import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'reynaldomgalvez@gmail.com';
  const password = 'tr@1t0r2026!';
  const hashedPassword = await bcrypt.hash(password, 10);

  console.log('🧹 Cleaning budolShap...');
  try { await prisma.orderItem.deleteMany(); } catch(e) {}
  try { await prisma.order.deleteMany(); } catch(e) {}
  try { await prisma.product.deleteMany(); } catch(e) {}
  try { await prisma.store.deleteMany(); } catch(e) {}
  try { await prisma.user.deleteMany(); } catch(e) {}

  console.log('👤 Creating Master Admin...');
  await prisma.user.create({
    data: {
      id: 'admin-jon-galvez', // Constant ID for ecosystem consistency
      email,
      name: 'Jon Galvez',
      password: hashedPassword,
      phoneNumber: '09171234567',
      accountType: 'ADMIN',
      isAdmin: true,
      emailVerified: true,
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jon'
    }
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());

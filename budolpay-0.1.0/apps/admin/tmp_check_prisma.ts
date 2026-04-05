import { prisma } from "./lib/prisma.ts";

async function check() {
  console.log("Prisma Properties:", Object.keys(prisma).filter(k => !k.startsWith('$')));
  console.log("Base Prisma Properties:", Object.keys((prisma as any)._base).filter(k => !k.startsWith('$')));
}

check().catch(console.error);

import { prisma } from "./lib/prisma.ts";

async function checkDb() {
  try {
    // Check User columns
    const userTableInfo = await (prisma as any).$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'User'
    `;
    console.log("User Columns:", userTableInfo);

    // Check AuditLog columns
    const auditLogTableInfo = await (prisma as any).$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'AuditLog'
    `;
    console.log("AuditLog Columns:", auditLogTableInfo);
  } catch (e) {
    console.error("DB Check Failed:", e);
  }
}

checkDb().catch(console.error);

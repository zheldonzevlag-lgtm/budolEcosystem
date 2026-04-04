import { prisma } from '@/lib/prisma';

/**
 * Admin-specific audit log wrapper (v43.3).
 * Now leverages the Automatic Prisma Extension for synchronization.
 * 
 * Compliance: Ensures 100% telemetry coverage without redundant manual triggers.
 */
export async function createAuditLog(params: any) {
  // Use the extended prisma client from @/lib/prisma 
  // It automatically triggers AUSIT_LOG_CREATED and ANY_UPDATE signals.
  return await prisma.auditLog.create({
    data: {
      action: params.action,
      entity: params.entity,
      entityId: params.entityId,
      userId: params.userId,
      oldValue: params.oldValue,
      newValue: params.newValue,
      metadata: params.metadata,
      ipAddress: params.ipAddress
    }
  });
}

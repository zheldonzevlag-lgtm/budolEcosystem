import { prisma } from "./prisma";
import { triggerRealtimeEvent } from "./realtime-server";

interface AuditLogParams {
  action: string;
  entity: string;
  entityId: string;
  userId?: string | null;
  oldValue?: any;
  newValue?: any;
  metadata?: any;
  ipAddress?: string;
}

/**
 * Centralized audit log helper that also triggers real-time updates
 * Compliant with Budol Ecosystem Security Standard Phase 3
 */
export async function createAuditLog(params: AuditLogParams) {
  try {
    const { action, entity, entityId, userId, oldValue, newValue, metadata, ipAddress } = params;

    // 1. Create the log in database
    const auditLog = await prisma.auditLog.create({
      data: {
        action,
        entity,
        entityId,
        userId: userId || "SYSTEM",
        oldValue: oldValue || null,
        newValue: newValue || null,
        metadata: metadata || {},
        ipAddress: ipAddress || "Internal System"
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            role: true
          }
        }
      }
    });

    // 2. Trigger real-time event for the admin dashboard
    // We send the full log object so the UI can update immediately
    await triggerRealtimeEvent('admin', 'AUDIT_LOG_CREATED', {
      ...auditLog,
      timestamp: auditLog.createdAt.toISOString()
    });

    console.log(`[AuditLog] Created and broadcasted: ${action} on ${entity}:${entityId}`);
    return auditLog;
  } catch (error: any) {
    console.error("[AuditLog] Failed to create or broadcast audit log:", error.message);
    // We don't throw here to avoid breaking the main business logic
    return null;
  }
}

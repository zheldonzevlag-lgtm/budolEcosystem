import { prisma } from '@budolpay/database';

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
 * This version is shared between admin app and backend services
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

/**
 * Trigger real-time event for audit logs
 * This function handles the real-time broadcasting for audit events
 */
async function triggerRealtimeEvent(channel: string, event: string, data: any) {
  try {
    // For backend services, we need to notify the gateway
    // Always use gateway notification for server-side usage
    await notifyGateway(channel, event, data);
  } catch (error: any) {
    console.error("[AuditLog] Failed to trigger real-time event:", error.message);
  }
}

/**
 * Notify the API gateway about audit events
 * This is used by backend services to trigger real-time updates
 */
async function notifyGateway(channel: string, event: string, data: any) {
  try {
    const GATEWAY_URL = process.env.NODE_ENV === 'development' 
      ? `http://${process.env.LOCAL_IP || 'localhost'}:8080` 
      : (process.env.GATEWAY_URL || `http://${process.env.LOCAL_IP || 'localhost'}:8080`);

    console.log(`[AuditLog] Notifying gateway about ${event} for channel ${channel}`);
    
    const response = await fetch(`${GATEWAY_URL}/internal/notify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        isAdmin: channel === 'admin',
        event,
        data
      })
    });

    if (!response.ok) {
      console.error(`[AuditLog] Gateway notification failed: ${response.status}`);
    } else {
      console.log(`[AuditLog] Gateway notification successful for ${event}`);
    }
  } catch (error: any) {
    console.error("[AuditLog] Failed to notify gateway:", error.message);
  }
}
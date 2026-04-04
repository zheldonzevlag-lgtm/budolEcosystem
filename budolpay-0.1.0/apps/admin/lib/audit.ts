import { createAuditLog as baseCreateAuditLog } from '@budolpay/audit';
import { triggerRealtimeEvent } from './realtime-server';

/**
 * Admin-specific audit log wrapper.
 * Extends the shared @budolpay/audit functionality with direct Pusher triggers
 * to ensure the Admin Dashboard (v43.1) updates instantly without relying on
 * external microservice gateways.
 */
export async function createAuditLog(params: any) {
  // 1. Create the log in DB using the shared core
  const log = await baseCreateAuditLog(params);
  
  if (log) {
    // 2. TRIGGER REAL-TIME: Ensure the dashboard sees this IMMEDIATELY (v43.1 Fix)
    // We trigger directly from the Admin app for maximum reliability in Vercel.
    console.log(`[Admin-Audit] Broadcasting log of action ${log.action} to Admin Dashboard...`);
    await triggerRealtimeEvent('admin', 'AUDIT_LOG_CREATED', {
      ...log,
      timestamp: log.createdAt?.toISOString() || new Date().toISOString(),
      source: 'admin-app-direct'
    });
    
    // Also trigger a general ANY_UPDATE to be double-sure (v43.1 safety)
    await triggerRealtimeEvent('admin', 'ANY_UPDATE', { 
        sourceEvent: 'AUDIT_LOG_CREATED', 
        action: log.action 
    });
  }
  
  return log;
}

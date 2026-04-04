import { prisma } from '@/lib/prisma';

/**
 * Admin-specific audit log wrapper (v43.5).
 * Standardized for forensic compliance (PCI-DSS 10.2).
 * 
 * WHY: Ensures that ALL auth events (Login, OTP, PIN, Logout) 
 *      are captured with consistent metadata.
 */
export async function createAuditLog(params: {
  action: string;
  userId: string;
  entity: string;
  entityId: string;
  ipAddress?: string;
  oldValue?: string;
  newValue?: string;
  metadata?: any;
}) {
  // Ensure we always have a metadata object for forensic markers
  const metadata = {
    ...params.metadata,
    compliance: {
      pci_dss: params.metadata?.compliance?.pci_dss || '10.2',
      bsp_808: true
    },
    system: 'budolpay-admin-vercel'
  };

  return await prisma.auditLog.create({
    data: {
      action: params.action,
      entity: params.entity,
      entityId: params.entityId,
      userId: params.userId,
      oldValue: params.oldValue,
      newValue: params.newValue,
      metadata: metadata,
      ipAddress: params.ipAddress || 'UNKNOWN'
    }
  });
}

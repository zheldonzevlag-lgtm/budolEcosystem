import { prisma } from '@/lib/prisma';

/**
 * Admin-specific audit log wrapper (v45.1).
 * Standardized for forensic compliance (PCI-DSS 10.2).
 * 
 * WHY: Ensures that ALL auth events (Login, OTP, PIN, Logout) 
 *      are captured with consistent metadata.
 * 
 * FIX (v45.1): The AuditLog.User relation is a FK to the public.User table.
 *      Mobile users only exist in budolpay.User — they fail the FK check and
 *      Prisma silently stores null. 
 *      Solution: Store actorName + actorEmail in metadata so identity is always 
 *      captured regardless of schema/FK constraints.
 */
export async function createAuditLog(params: {
  action: string;
  userId?: string;
  actorName?: string;  // Display name for forensic trail (bypasses FK issue)
  actorEmail?: string; // Email fallback for forensic trail
  entity: string;
  entityId: string;
  ipAddress?: string;
  oldValue?: any;
  newValue?: any;
  metadata?: any;
}) {
  const requestedUserId = typeof params.userId === 'string' ? params.userId.trim() : '';
  let linkedUserId: string | null = null;
  if (requestedUserId && requestedUserId !== 'SYSTEM') {
    const existingUser = await prisma.user.findUnique({
      where: { id: requestedUserId },
      select: { id: true }
    });
    linkedUserId = existingUser?.id || null;
  }

  // Ensure we always have a metadata object for forensic markers
  const metadata = {
    ...params.metadata,
    // Store actor info denormalized for display purposes
    // WHY: FK constraint on AuditLog→User only covers public.User,
    //      so mobile users' identities must be stored directly in metadata
    ...(params.actorName && { actorName: params.actorName }),
    ...(params.actorEmail && { actorEmail: params.actorEmail }),
    ...(requestedUserId && !linkedUserId && { original_userId: requestedUserId }),
    compliance: {
      pci_dss: params.metadata?.compliance?.pci_dss || '10.2',
      bsp_808: true
    },
    system: 'budolpay-admin-vercel'
  };

  // Attempt to store userId for FK link (works for public schema users)
  // FIX (v45.1.1): FK constraint on AuditLog→User throws error (P2003) if userId 
  // doesn't exist. We catch this and store as null while preserving identity 
  // via actorName/actorEmail in metadata.
  try {
    return await prisma.auditLog.create({
      data: {
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        userId: linkedUserId,
        oldValue: params.oldValue,
        newValue: params.newValue,
        metadata: metadata,
        ipAddress: params.ipAddress || 'UNKNOWN'
      }
    });
  } catch (error: any) {
    // P2003 is Prisma's error code for foreign key constraint failure
    if (error.code === 'P2003') {
      console.warn(`[AuditLog] Foreign key constraint failed for userId: ${requestedUserId || 'N/A'}. Storing log with userId: null.`);
      return await prisma.auditLog.create({
        data: {
          action: params.action,
          entity: params.entity,
          entityId: params.entityId,
          userId: null,
          oldValue: params.oldValue,
          newValue: params.newValue,
          metadata: {
            ...metadata,
            original_userId: requestedUserId || null,
            warning: 'FK constraint failed - linked user not found in public schema'
          },
          ipAddress: params.ipAddress || 'UNKNOWN'
        }
      });
    }
    throw error; // Re-throw other errors
  }
}


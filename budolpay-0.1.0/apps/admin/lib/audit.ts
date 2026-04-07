import { prisma } from './prisma';

export async function createAuditLog(data: {
    action: string;
    userId: string;
    entity: string;
    entityId: string;
    ipAddress: string;
    metadata?: any;
}) {
    try {
        await prisma.auditLog.create({
            data: {
                action: data.action,
                userId: data.userId,
                entity: data.entity,
                entityId: data.entityId,
                ipAddress: data.ipAddress,
                metadata: data.metadata || {},
            }
        });
    } catch (e) {
        console.error("Audit log creation failed: ", e);
    }
}

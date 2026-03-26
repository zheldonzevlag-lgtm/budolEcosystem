// @budolpay/audit - inlined for standalone deployment
const { prisma } = require('../database');

async function createAuditLog({ action, entity, entityId, userId, oldValue, newValue, metadata, ipAddress }) {
    try {
        const auditLog = await prisma.auditLog.create({
            data: {
                action,
                entity,
                entityId,
                userId: userId || 'SYSTEM',
                oldValue: oldValue || null,
                newValue: newValue || null,
                metadata: metadata || {},
                ipAddress: ipAddress || 'Internal System'
            }
        });
        
        // Gateway notification removed for standalone deployment to prevent event loop hanging

        return auditLog;
    } catch (error) {
        console.error('[AuditLog] Failed to create audit log:', error.message);
        return null; // Don't block main flow
    }
}

module.exports = { createAuditLog };

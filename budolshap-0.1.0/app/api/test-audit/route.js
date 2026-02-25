
import { NextResponse } from 'next/server';
import { createAuditLog } from '@/lib/audit';
import { prisma } from '@/lib/prisma';

export async function GET(request) {
    try {
        console.log('Test Audit Route Called');
        
        // 1. Create a test log
        await createAuditLog(null, 'TEST_EVENT', request, {
            status: 'WARNING',
            details: 'Manual test of audit logging',
            entity: 'System',
            entityId: 'test-123'
        });
        
        // 2. Verify it exists
        const log = await prisma.auditLog.findFirst({
            where: { action: 'TEST_EVENT' },
            orderBy: { createdAt: 'desc' }
        });
        
        if (!log) {
            return NextResponse.json({ error: 'Log creation failed (not found in DB)' }, { status: 500 });
        }
        
        return NextResponse.json({ 
            message: 'Audit log created successfully', 
            log 
        });
        
    } catch (error) {
        console.error('Test Audit Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

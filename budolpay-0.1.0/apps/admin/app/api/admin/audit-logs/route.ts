import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Forensic Audit Logs API for BudolPay
 * Provides filtered and paginated system activity logs.
 */
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const action = searchParams.get('action');
        const entity = searchParams.get('entity');
        const status = searchParams.get('status');
        const search = searchParams.get('search');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        const skip = (page - 1) * limit;

        // Build Where Clause
        const where: any = {};
        
        if (action && action !== 'ALL') where.action = action;
        if (entity && entity !== 'ALL') where.entity = entity;
        // In BudolPay schema, status is often inside metadata or we use action tags
        // If status filter is passed, we check if it matches success/failure actions
        
        if (search) {
            where.OR = [
                { action: { contains: search, mode: 'insensitive' } },
                { entity: { contains: search, mode: 'insensitive' } },
                { ipAddress: { contains: search, mode: 'insensitive' } },
                { user: { email: { contains: search, mode: 'insensitive' } } },
                { user: { firstName: { contains: search, mode: 'insensitive' } } },
                { user: { lastName: { contains: search, mode: 'insensitive' } } },
            ];
        }

        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = new Date(startDate);
            if (endDate) where.createdAt.lte = new Date(endDate);
        }

        const [logs, total] = await Promise.all([
            prisma.auditLog.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            firstName: true,
                            lastName: true,
                            role: true
                        }
                    }
                }
            }),
            prisma.auditLog.count({ where })
        ]);

        return NextResponse.json({
            logs,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });

    } catch (error: any) {
        console.error('Audit Log API Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch audit logs', details: error.message },
            { status: 500 }
        );
    }
}

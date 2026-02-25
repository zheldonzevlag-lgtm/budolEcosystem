import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminAuth'; // Ensure this path is correct

export async function GET(request) {
    // 1. Auth Check
    // We assume requireAdmin handles the response if unauthorized, or returns a flag.
    // Based on previous read, it returns { authorized, errorResponse }
    const authResult = await requireAdmin(request);
    if (!authResult.authorized) return authResult.errorResponse;

    try {
        // 2. Parse Query Parameters
        const { searchParams } = new URL(request.url);
        const action = searchParams.get('action'); 
        const entity = searchParams.get('entity');
        const status = searchParams.get('status');
        const search = searchParams.get('search');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const skip = (page - 1) * limit;

        // 3. Build Query
        const where = {};

        if (action && action !== 'ALL') {
            where.action = action;
        }
        
        if (entity && entity !== 'ALL') {
            where.entity = entity;
        }

        if (status && status !== 'ALL') {
            where.status = status;
        }

        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = new Date(startDate);
            if (endDate) where.createdAt.lte = new Date(endDate);
        }

        if (search) {
            where.OR = [
                { details: { contains: search, mode: 'insensitive' } }, // Requires preview feature on some DBs but usually fine
                { ipAddress: { contains: search } },
                { entityId: { contains: search } },
                // We can search in related user fields
                { user: { email: { contains: search, mode: 'insensitive' } } },
                { user: { name: { contains: search, mode: 'insensitive' } } }
            ];
            
            // Note: If you want to search in JSON metadata, it's DB specific. 
            // Prisma supports JSON filtering but simple contains might not work as expected on all JSON structures.
        }

        // 4. Fetch Data
        const [logs, total] = await prisma.$transaction([
            prisma.auditLog.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: {
                        select: {
                            name: true,
                            email: true,
                            image: true,
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
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Error fetching audit logs:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

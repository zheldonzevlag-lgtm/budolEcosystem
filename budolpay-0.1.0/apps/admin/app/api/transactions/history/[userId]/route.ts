import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: { userId: string } }) {
    try {
        const userId = params.userId;
        
        if (!userId) {
            return NextResponse.json({ error: "userId is required" }, { status: 400 });
        }

        const transactions = await prisma.transaction.findMany({
            where: {
                OR: [
                    { senderId: userId },
                    { receiverId: userId }
                ]
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 50,
            include: {
                sender: { select: { email: true, firstName: true, lastName: true } },
                receiver: { select: { email: true, firstName: true, lastName: true } }
            }
        });
        
        return NextResponse.json(transactions);

    } catch (error: any) {
        console.error('[Transaction History API] Error:', error.message);
        return NextResponse.json({ error: 'Failed to fetch transaction history' }, { status: 500 });
    }
}

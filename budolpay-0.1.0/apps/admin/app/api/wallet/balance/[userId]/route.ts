import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: { userId: string } }) {
    try {
        const userId = params.userId;
        
        if (!userId) {
            return NextResponse.json({ error: "userId is required" }, { status: 400 });
        }

        const wallet = await prisma.wallet.findUnique({
            where: { userId }
        });

        if (!wallet) {
            return NextResponse.json({ balance: 0.0, currency: "PHP" });
        }
        
        return NextResponse.json({
            balance: wallet.balance,
            currency: wallet.currency
        });

    } catch (error: any) {
        console.error('[Wallet Balance API] Error:', error.message);
        return NextResponse.json({ error: 'Failed to fetch wallet balance' }, { status: 500 });
    }
}

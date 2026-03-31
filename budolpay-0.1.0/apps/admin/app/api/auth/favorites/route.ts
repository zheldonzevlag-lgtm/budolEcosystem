import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || 'GJ7Lxn0/kdV/KuZJ5xJ7Ip0RvMerrGW5n0gf44mfHgc=';

async function getUserIdFromToken() {
    const headerList = headers();
    const authHeader = headerList.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
    
    const token = authHeader.split(" ")[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        return decoded.userId;
    } catch (e) {
        return null;
    }
}

export async function GET() {
    try {
        const userId = await getUserIdFromToken();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const favorites = await prisma.favoriteRecipient.findMany({
            where: { userId },
            include: {
                recipient: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phoneNumber: true,
                        avatarUrl: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(favorites);
    } catch (error: any) {
        console.error('[Favorites GET API] Error:', error.message);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const userId = await getUserIdFromToken();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { recipientId, alias } = await req.json();
        if (!recipientId) return NextResponse.json({ error: "recipientId is required" }, { status: 400 });

        const favorite = await prisma.favoriteRecipient.upsert({
            where: {
                userId_recipientId: {
                    userId,
                    recipientId
                }
            },
            create: {
                userId,
                recipientId,
                alias
            },
            update: {
                alias
            },
            include: {
                recipient: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phoneNumber: true
                    }
                }
            }
        });

        return NextResponse.json(favorite);
    } catch (error: any) {
        console.error('[Favorites POST API] Error:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

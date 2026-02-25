import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthFromRequest } from '@/lib/auth';
import { triggerRealtimeEvent } from '@/lib/realtime';

export async function PATCH(request) {
    try {
        const auth = getAuthFromRequest(request);

        if (!auth) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { decoded } = auth;
        const userId = decoded.userId || decoded.id || decoded.sub;

        const body = await request.json();
        const { image } = body;

        if (!image) {
            return NextResponse.json(
                { error: 'Image URL is required' },
                { status: 400 }
            );
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { image },
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
                phoneNumber: true,
                accountType: true,
            }
        });

        // Broadcast realtime update
        await triggerRealtimeEvent('admin-notifications', 'user-updated', updatedUser);
        await triggerRealtimeEvent(`user-${userId}`, 'user-updated', updatedUser);

        return NextResponse.json({
            message: 'Profile updated successfully',
            user: updatedUser
        });

    } catch (error) {
        console.error('Profile update error:', error);
        return NextResponse.json(
            { error: 'Failed to update profile' },
            { status: 500 }
        );
    }
}

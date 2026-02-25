import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const orders = await prisma.order.findMany({
            orderBy: { createdAt: 'desc' },
            take: 5
        });

        const results = [];

        for (const order of orders) {
            if (order.shipping && order.shipping.bookingId) {
                const driverData = {
                    name: "Test Driver 34567",
                    phone: "+631001234567",
                    plateNumber: "VP9946964",
                    vehicleType: "VAN",
                    photo: "https://web.lalamove.com/assets/images/courier-placeholder.png"
                };

                const updatedShipping = {
                    ...order.shipping,
                    driverInfo: driverData,
                    driver: driverData,
                    status: 'ON_GOING'
                };

                await prisma.order.update({
                    where: { id: order.id },
                    data: {
                        shipping: updatedShipping,
                        status: 'ON_GOING'
                    }
                });
                results.push(`Fixed order ${order.id} (Booking: ${order.shipping.bookingId})`);
            }
        }

        return NextResponse.json({
            success: true,
            results
        });
    } catch (error) {
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET all addresses for a user
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        console.log('[ADDRESS API] Fetching addresses for userId:', userId);

        if (!userId) {
            console.error('[ADDRESS API] Missing userId query param');
            return NextResponse.json({ error: 'userId is required' }, { status: 400 });
        }

        // Verify the user exists
        try {
            const user = await prisma.user.findUnique({ where: { id: userId } });
            if (!user) {
                console.warn('[ADDRESS API] No user found for id:', userId);
                return NextResponse.json({ error: 'User not found' }, { status: 404 });
            }
        } catch (dbError) {
            console.error('[ADDRESS API] Database error verifying user:', dbError);
            return NextResponse.json({ error: 'Database error verifying user' }, { status: 500 });
        }

        const addresses = await prisma.address.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });
        console.log('[ADDRESS API] Fetched', addresses.length, 'addresses for userId:', userId);
        return NextResponse.json(addresses);
    } catch (error) {
        console.error('[ADDRESS API] Error fetching addresses:', error);
        return NextResponse.json({ error: 'Failed to fetch addresses', details: error.message }, { status: 500 });
    }
}

// POST create new address
export async function POST(request) {
    try {
        const body = await request.json()
        const {
            userId, name, email, street, city, state, zip, country, phone,
            houseNumber, barangay, subdivision, landmark, buildingName, floorUnit, notes,
            latitude, longitude, label, isDefault
        } = body

        // Clean phone number (remove spaces, dashes)
        const cleanPhone = phone ? phone.replace(/[\s-]/g, '') : ''

        // Barangay is optional
        if (!userId || !name || !email || !street || !city || !state || !country || !cleanPhone) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            )
        }

        // Validate email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { error: 'Invalid email address' },
                { status: 400 }
            )
        }

        // Validate phone (E.164 format expected)
        // We allow +639xxxxxxxxx for PH, or other international formats starting with +
        // We strip spaces and dashes before validation
        const phoneRegex = /^\+\d{10,15}$/
        if (!phoneRegex.test(cleanPhone)) {
            return NextResponse.json(
                { error: 'Invalid phone number. Must be in E.164 format (e.g., +639xxxxxxxxx)' },
                { status: 400 }
            )
        }

        // If this is set as default, unset other default addresses for this user
        if (isDefault) {
            await prisma.address.updateMany({
                where: { userId, isDefault: true },
                data: { isDefault: false }
            })
        }

        const address = await prisma.address.create({
            data: {
                userId,
                name,
                email,
                street,
                city,
                state,
                zip,
                country,
                phone: cleanPhone,
                houseNumber,
                barangay,
                subdivision,
                landmark,
                buildingName,
                floorUnit,
                notes,
                label,
                isDefault: isDefault || false,
                latitude: latitude ? parseFloat(latitude) : null,
                longitude: longitude ? parseFloat(longitude) : null
            }
        })

        return NextResponse.json(address, { status: 201 })
    } catch (error) {
        console.error('Error creating address:', error)
        return NextResponse.json(
            { error: 'Failed to create address' },
            { status: 500 }
        )
    }
}


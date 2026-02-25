import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * PATCH /api/stores/[storeId]/geocode
 * Geocode store address and cache coordinates
 */
export async function PATCH(request, { params }) {
    try {
        const { storeId } = params;

        // Fetch store
        const store = await prisma.store.findUnique({
            where: { id: storeId }
        });

        if (!store) {
            return NextResponse.json(
                { error: 'Store not found' },
                { status: 404 }
            );
        }

        // Check if already geocoded
        if (store.latitude && store.longitude) {
            return NextResponse.json({
                success: true,
                cached: true,
                coordinates: {
                    lat: store.latitude,
                    lng: store.longitude
                },
                address: store.address
            });
        }

        // Geocode the store address using Nominatim
        // Geocode the store address using Nominatim
        let addressToGeocode = store.address;
        if (!addressToGeocode.toLowerCase().includes('philippines')) {
            addressToGeocode += ', Philippines';
        }
        const query = encodeURIComponent(addressToGeocode);

        console.log('[Store Geocoding] Geocoding address:', store.address);

        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${query}`,
            {
                headers: {
                    'User-Agent': 'BudolShap/1.0'
                }
            }
        );

        if (!response.ok) {
            throw new Error('Geocoding service error');
        }

        let data = await response.json();

        // Fallback: If address contains "NCR - National Capital Region", try removing it
        if ((!data || data.length === 0) && addressToGeocode.includes('NCR - National Capital Region')) {
            console.log('[Store Geocoding] Retrying without NCR prefix...');
            const simplifiedAddress = addressToGeocode.replace('NCR - National Capital Region', '').replace(/^[,\s]+|[,\s]+$/g, '');
            const simplifiedQuery = encodeURIComponent(simplifiedAddress);

            const retryResponse = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${simplifiedQuery}`,
                {
                    headers: { 'User-Agent': 'BudolShap/1.0' }
                }
            );

            if (retryResponse.ok) {
                data = await retryResponse.json();
            }
        }

        if (!data || data.length === 0) {
            return NextResponse.json(
                {
                    error: 'Unable to geocode address',
                    message: 'Could not find coordinates for this address. Please verify the address is correct.'
                },
                { status: 400 }
            );
        }

        const coordinates = {
            lat: parseFloat(data[0].lat),
            lng: parseFloat(data[0].lon)
        };

        console.log('[Store Geocoding] Found coordinates:', coordinates);

        // Update store with coordinates
        const updatedStore = await prisma.store.update({
            where: { id: storeId },
            data: {
                latitude: coordinates.lat,
                longitude: coordinates.lng
            }
        });

        return NextResponse.json({
            success: true,
            cached: false,
            coordinates: {
                lat: updatedStore.latitude,
                lng: updatedStore.longitude
            },
            address: updatedStore.address
        });

    } catch (error) {
        console.error('[Store Geocoding Error]', error);
        return NextResponse.json(
            {
                error: 'Failed to geocode store address',
                message: error.message
            },
            { status: 500 }
        );
    }
}

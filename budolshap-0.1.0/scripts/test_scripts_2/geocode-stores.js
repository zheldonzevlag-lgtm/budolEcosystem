/**
 * Geocode Existing Stores Migration Script
 * 
 * This script geocodes all existing stores that don't have coordinates cached.
 * Run this after adding latitude/longitude fields to the Store model.
 * 
 * Usage: node scripts/geocode-stores.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Rate limiting delay (1 second between requests to respect Nominatim's usage policy)
const DELAY_MS = 1000;

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function geocodeAddress(address) {
    try {
        const query = encodeURIComponent(address + ', Philippines');

        console.log(`  Geocoding: ${address}`);

        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${query}`,
            {
                headers: {
                    'User-Agent': 'BudolShap/1.0'
                }
            }
        );

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        if (!data || data.length === 0) {
            console.log(`  ❌ No results found`);
            return null;
        }

        const coordinates = {
            lat: parseFloat(data[0].lat),
            lng: parseFloat(data[0].lon)
        };

        console.log(`  ✅ Found: ${coordinates.lat}, ${coordinates.lng}`);
        return coordinates;

    } catch (error) {
        console.error(`  ❌ Error: ${error.message}`);
        return null;
    }
}

async function geocodeStores() {
    console.log('🌍 Starting Store Geocoding Migration\n');

    try {
        // Fetch all stores without coordinates
        const stores = await prisma.store.findMany({
            where: {
                OR: [
                    { latitude: null },
                    { longitude: null }
                ]
            },
            select: {
                id: true,
                name: true,
                address: true,
                latitude: true,
                longitude: true
            }
        });

        console.log(`Found ${stores.length} stores to geocode\n`);

        if (stores.length === 0) {
            console.log('✅ All stores already have coordinates!');
            return;
        }

        let successCount = 0;
        let failCount = 0;

        for (let i = 0; i < stores.length; i++) {
            const store = stores[i];

            console.log(`[${i + 1}/${stores.length}] ${store.name}`);
            console.log(`  Address: ${store.address}`);

            // Geocode the address
            const coordinates = await geocodeAddress(store.address);

            if (coordinates) {
                // Update store with coordinates
                await prisma.store.update({
                    where: { id: store.id },
                    data: {
                        latitude: coordinates.lat,
                        longitude: coordinates.lng
                    }
                });

                successCount++;
                console.log(`  ✅ Updated store coordinates\n`);
            } else {
                failCount++;
                console.log(`  ⚠️  Skipped (could not geocode)\n`);
            }

            // Rate limiting: wait before next request
            if (i < stores.length - 1) {
                await delay(DELAY_MS);
            }
        }

        console.log('\n📊 Migration Summary:');
        console.log(`  ✅ Successfully geocoded: ${successCount}`);
        console.log(`  ⚠️  Failed to geocode: ${failCount}`);
        console.log(`  📍 Total processed: ${stores.length}`);

    } catch (error) {
        console.error('\n❌ Migration failed:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run the migration
geocodeStores()
    .then(() => {
        console.log('\n✅ Migration completed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Migration failed:', error);
        process.exit(1);
    });


const { PrismaClient } = require('@prisma/client-custom-v4');
const { readFileSync, existsSync } = require('fs');
const { resolve } = require('path');

// Load .env file manually if it exists
try {
    const envPath = resolve(process.cwd(), '.env');
    if (existsSync(envPath)) {
        const envFile = readFileSync(envPath, 'utf8');
        envFile.split('\n').forEach(line => {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#')) {
                const [key, ...valueParts] = trimmed.split('=');
                if (key && valueParts.length) {
                    const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
                    if (!process.env[key.trim()]) {
                        process.env[key.trim()] = value;
                    }
                }
            }
        });
    }
} catch (error) {
    // .env file not found or couldn't be read, that's okay
}

const prisma = new PrismaClient();

async function fixWayneEnterprise() {
    try {
        console.log('🔍 Searching for "Wayne Enterprise"...');
        const store = await prisma.store.findFirst({
            where: {
                name: {
                    contains: 'Wayne',
                    mode: 'insensitive'
                }
            }
        });

        if (!store) {
            console.log('❌ Store "Wayne Enterprise" not found.');
            return;
        }

        console.log(`✅ Found store: ${store.name} (${store.id})`);
        console.log(`📍 Current Address: ${store.address}`);
        console.log(`📍 Current Coordinates: ${store.latitude}, ${store.longitude}`);

        // Makati Coordinates (Approximate center)
        // Lat: 14.5547, Lng: 121.0244
        const updatedStore = await prisma.store.update({
            where: { id: store.id },
            data: {
                latitude: 14.5547,
                longitude: 121.0244
            }
        });

        console.log(`\n✅ Updated "Wayne Enterprise" coordinates to Makati:`);
        console.log(`   Lat: ${updatedStore.latitude}`);
        console.log(`   Lng: ${updatedStore.longitude}`);

    } catch (e) {
        console.error('❌ Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

fixWayneEnterprise();

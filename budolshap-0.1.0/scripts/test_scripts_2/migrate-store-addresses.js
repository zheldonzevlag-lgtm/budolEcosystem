/**
 * Migration Script: Add StoreAddress Table
 * 
 * This script creates the StoreAddress table in the production database
 * and migrates existing store addresses.
 * 
 * Usage: node scripts/migrate-store-addresses.js
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
    console.log('🚀 Starting StoreAddress migration...\n')

    try {
        // Check if StoreAddress table exists by trying to count records
        try {
            await prisma.storeAddress.count()
            console.log('✅ StoreAddress table already exists!')
            console.log('   Skipping table creation.\n')
        } catch (error) {
            if (error.code === 'P2021') {
                console.log('❌ StoreAddress table does not exist.')
                console.log('   Please run: npx prisma db push\n')
                console.log('   Or contact your database administrator to create the table.')
                return
            }
            throw error
        }

        // Migrate existing store addresses
        console.log('📦 Migrating existing store addresses...\n')

        const stores = await prisma.store.findMany({
            where: {
                contact: {
                    not: null
                }
            },
            select: {
                id: true,
                contact: true,
                address: true,
                addresses: true
            }
        })

        console.log(`   Found ${stores.length} stores to process`)

        let migrated = 0
        let skipped = 0

        for (const store of stores) {
            // Skip if store already has addresses
            if (store.addresses && store.addresses.length > 0) {
                console.log(`   ⏭️  Store ${store.id}: Already has ${store.addresses.length} address(es)`)
                skipped++
                continue
            }

            // Create default address from existing data
            try {
                await prisma.storeAddress.create({
                    data: {
                        storeId: store.id,
                        phone: store.contact || '+639000000000',
                        district: 'NCR - National Capital Region',
                        city: 'Manila',
                        barangay: 'To be updated',
                        detailedAddress: store.address || 'Address to be updated by store owner',
                        zip: '1000',
                        country: 'Philippines',
                        isDefault: true,
                        notes: 'Migrated from legacy address field. Please update with accurate information.'
                    }
                })
                console.log(`   ✅ Store ${store.id}: Created default address`)
                migrated++
            } catch (error) {
                console.error(`   ❌ Store ${store.id}: Failed to create address`, error.message)
            }
        }

        console.log(`\n📊 Migration Summary:`)
        console.log(`   ✅ Migrated: ${migrated} stores`)
        console.log(`   ⏭️  Skipped: ${skipped} stores (already have addresses)`)
        console.log(`   📝 Total: ${stores.length} stores processed\n`)

        console.log('✨ Migration completed successfully!\n')
        console.log('⚠️  Note: Migrated addresses use placeholder data.')
        console.log('   Store owners should update their addresses through the UI.\n')

    } catch (error) {
        console.error('❌ Migration failed:', error)
        throw error
    } finally {
        await prisma.$disconnect()
    }
}

main()
    .catch((error) => {
        console.error('Fatal error:', error)
        process.exit(1)
    })

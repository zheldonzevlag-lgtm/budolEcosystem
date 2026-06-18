#!/usr/bin/env node

/**
 * Universal Rate Limit Clearing Script
 * 
 * Clears rate limit entries from both budolpay and budolshap Neon databases.
 * 
 * Usage:
 *   node scripts/clear-rate-limits.js                      # Clear all rate limits
 *   node scripts/clear-rate-limits.js --key "login:..."    # Clear specific key
 *   node scripts/clear-rate-limits.js --service admin      # Clear only budolpay-admin
 *   node scripts/clear-rate-limits.js --service shap       # Clear only budolshap
 *   node scripts/clear-rate-limits.js --dry-run            # Show what would be deleted
 *   node scripts/clear-rate-limits.js --list               # List all rate limit entries
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { Client } = require('pg');

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const listMode = args.includes('--list');
const keyIndex = args.indexOf('--key');
const specificKey = keyIndex !== -1 ? args[keyIndex + 1] : null;
const serviceIndex = args.indexOf('--service');
const targetService = serviceIndex !== -1 ? args[serviceIndex + 1] : 'all';

const BUDOLPAY_DB_URL = process.env.BUDOLPAY_DATABASE_URL || 'postgresql://neondb_owner:npg_XLkrx73JNlRP@ep-wandering-breeze-aoin4z9c-pooler.c-2.ap-southeast-1.aws.neon.tech/budolpay?sslmode=require&schema=budolpay';
const BUDOLSHAP_DB_URL = process.env.BUDOLSHAP_DATABASE_URL || 'postgres://c0999becfdd24a3fdf0c431059e54af5b7f61cedbdd336a0c0b9ead004aa22bc:sk_m8mN6a7H1RaICj0gOw19i@db.prisma.io:5432/postgres?sslmode=require';

async function createClient(url) {
    const client = new Client({ connectionString: url });
    await client.connect();
    return client;
}

async function listEntries(client, schema, label) {
    const table = schema === 'public' ? '"RateLimit"' : '"budolpay"."RateLimit"';
    let query;
    if (schema === 'public') {
        // budolshap uses "expireAt" and "points"
        query = `
            SELECT key, 
                   to_timestamp("expireAt"::bigint / 1000)::text as expires,
                   "points" as hits
            FROM ${table}
            ORDER BY key
        `;
    } else {
        // budolpay uses "expiresAt" and "hits"
        query = `
            SELECT key, 
                   "expiresAt"::text as expires,
                   "hits"
            FROM ${table}
            ORDER BY key
        `;
    }
    
    try {
        const result = await client.query(query);
        if (result.rows.length === 0) {
            console.log(`   No entries found in ${label}`);
            return;
        }
        console.log(`\n   ${label} (${result.rows.length} entries):`);
        console.log('   ' + '-'.repeat(60));
        result.rows.forEach(row => {
            console.log(`   ${row.key} | Hits: ${row.hits} | Expires: ${row.expires}`);
        });
    } catch (error) {
        console.error(`   ❌ Error listing ${label}: ${error.message}`);
    }
}

async function clearEntries(client, schema, label, key = null) {
    const table = schema === 'public' ? '"RateLimit"' : '"budolpay"."RateLimit"';
    let query, params;
    if (key) {
        query = `DELETE FROM ${table} WHERE key = $1`;
        params = [key];
    } else {
        query = `DELETE FROM ${table}`;
        params = [];
    }
    
    try {
        if (dryRun) {
            const countQuery = key 
                ? `SELECT COUNT(*) as count FROM ${table} WHERE key = $1`
                : `SELECT COUNT(*) as count FROM ${table}`;
            const countResult = await client.query(countQuery, params);
            const count = parseInt(countResult.rows[0].count);
            console.log(`   Would delete ${count} entries from ${label}`);
            return count;
        } else {
            const result = await client.query(query, params);
            console.log(`   ✅ Deleted ${result.rowCount} entries from ${label}`);
            return result.rowCount;
        }
    } catch (error) {
        console.error(`   ❌ Error clearing ${label}: ${error.message}`);
        return 0;
    }
}

async function main() {
    console.log('🔧 Universal Rate Limit Clearing Script');
    console.log('=====================================\n');

    if (dryRun) {
        console.log('⚠️  DRY RUN MODE - No changes will be made\n');
    }

    const results = {
        budolpayAdmin: { cleared: 0, errors: [] },
        budolshap: { cleared: 0, errors: [] }
    };

    // Clear budolpay-admin rate limits (budolpay schema)
    if (targetService === 'all' || targetService === 'admin') {
        console.log('📊 budolpay-admin rate limits (budolpay schema)...');
        try {
            const client = await createClient(BUDOLPAY_DB_URL);
            
            if (listMode) {
                await listEntries(client, 'budolpay', 'budolpay-admin');
            } else {
                results.budolpayAdmin.cleared = await clearEntries(client, 'budolpay', 'budolpay-admin', specificKey);
            }
            
            await client.end();
        } catch (error) {
            console.error(`   ❌ Connection error: ${error.message}`);
            results.budolpayAdmin.errors.push(error.message);
        }
    }

    // Clear budolshap rate limits (public schema)
    if (targetService === 'all' || targetService === 'shap') {
        console.log('\n📊 budolshap rate limits (public schema)...');
        try {
            const client = await createClient(BUDOLSHAP_DB_URL);
            
            if (listMode) {
                await listEntries(client, 'public', 'budolshap');
            } else {
                results.budolshap.cleared = await clearEntries(client, 'public', 'budolshap', specificKey);
            }
            
            await client.end();
        } catch (error) {
            console.error(`   ❌ Connection error: ${error.message}`);
            results.budolshap.errors.push(error.message);
        }
    }

    // Summary
    if (!listMode) {
        console.log('\n📈 Summary');
        console.log('==========');
        console.log(`budolpay-admin: ${results.budolpayAdmin.cleared} entries cleared`);
        console.log(`budolshap: ${results.budolshap.cleared} entries cleared`);
        console.log(`Total: ${results.budolpayAdmin.cleared + results.budolshap.cleared} entries cleared`);

        if (results.budolpayAdmin.errors.length > 0 || results.budolshap.errors.length > 0) {
            console.log('\n⚠️  Errors encountered:');
            results.budolpayAdmin.errors.forEach(e => console.log(`   - budolpay-admin: ${e}`));
            results.budolshap.errors.forEach(e => console.log(`   - budolshap: ${e}`));
        }

        if (dryRun) {
            console.log('\n💡 Run without --dry-run to apply changes');
        }
    }
}

main().catch(console.error);

/**
 * Sync Sentry Configuration Script
 * Syncs error tracking settings from database to environment variables
 * 
 * Run this script after updating error tracking settings in admin panel
 * Then restart the application for changes to take effect
 * 
 * Usage: node scripts/sync-sentry-config.mjs
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

async function syncSentryConfig() {
    try {
        console.log('🔄 Syncing Sentry configuration from database...\n');

        // Get settings from database
        const settings = await prisma.systemSettings.findUnique({
            where: { id: 'default' }
        });

        if (!settings) {
            console.log('❌ No system settings found. Creating default settings...');
            await prisma.systemSettings.create({
                data: {
                    id: 'default',
                    realtimeProvider: 'POLLING',
                    sessionTimeout: 15,
                    sessionWarning: 1,
                    loginLimit: 10,
                    registerLimit: 5,
                    cacheProvider: 'MEMORY',
                    errorTrackingEnabled: false
                }
            });
            console.log('✅ Default settings created. Please configure error tracking in admin panel.');
            return;
        }

        // Read existing .env.local or create new
        const envPath = path.join(__dirname, '..', '.env.local');
        let envContent = '';
        
        if (fs.existsSync(envPath)) {
            envContent = fs.readFileSync(envPath, 'utf8');
        }

        // Update or add Sentry environment variables
        const updates = {
            'ERROR_TRACKING_ENABLED': settings.errorTrackingEnabled ? 'true' : 'false',
            'SENTRY_DSN': settings.sentryDsn || '',
            'NEXT_PUBLIC_SENTRY_DSN': settings.sentryDsn || '',
            'SENTRY_ENVIRONMENT': settings.sentryEnvironment || 'production',
            'NEXT_PUBLIC_SENTRY_ENVIRONMENT': settings.sentryEnvironment || 'production',
            'SENTRY_TRACES_SAMPLE_RATE': (settings.sentryTracesSampleRate || 0.1).toString(),
            'NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE': (settings.sentryTracesSampleRate || 0.1).toString()
        };

        // Update existing lines or add new ones
        let updated = false;
        for (const [key, value] of Object.entries(updates)) {
            const regex = new RegExp(`^${key}=.*$`, 'm');
            if (regex.test(envContent)) {
                envContent = envContent.replace(regex, `${key}=${value}`);
                updated = true;
            } else {
                envContent += `\n${key}=${value}`;
                updated = true;
            }
        }

        // Write back to .env.local
        if (updated) {
            fs.writeFileSync(envPath, envContent, 'utf8');
            console.log('✅ Sentry configuration synced to .env.local');
            console.log('\n📋 Configuration:');
            console.log(`   Error Tracking: ${settings.errorTrackingEnabled ? '✅ Enabled' : '❌ Disabled'}`);
            if (settings.errorTrackingEnabled) {
                console.log(`   Sentry DSN: ${settings.sentryDsn ? '✅ Configured' : '❌ Not set'}`);
                console.log(`   Environment: ${settings.sentryEnvironment || 'production'}`);
                console.log(`   Traces Sample Rate: ${(settings.sentryTracesSampleRate || 0.1) * 100}%`);
            }
            console.log('\n⚠️  Please restart your application for changes to take effect.');
        } else {
            console.log('ℹ️  No changes needed.');
        }

    } catch (error) {
        console.error('❌ Error syncing Sentry configuration:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

syncSentryConfig();


/**
 * Phase 1 Testing Script
 * Tests the service layer modularization
 * 
 * Run with: npm run test:phase1
 * 
 * Prerequisites:
 * 1. Local database running (MySQL/PostgreSQL)
 * 2. .env file configured with DATABASE_URL
 * 3. Prisma migrations run (npm run prisma:migrate)
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Prisma (will use DATABASE_URL from .env)
const prisma = new PrismaClient({
    log: ['error', 'warn'],
});

// Test results tracking
const testResults = {
    passed: 0,
    failed: 0,
    tests: []
};

function logTest(name, passed, message = '') {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} - ${name}${message ? ': ' + message : ''}`);
    testResults.tests.push({ name, passed, message });
    if (passed) {
        testResults.passed++;
    } else {
        testResults.failed++;
    }
}

async function testDatabaseConnection() {
    console.log('\n📊 Testing Database Connection...\n');
    try {
        await prisma.$connect();
        // Try to get database name (works for MySQL and PostgreSQL)
        try {
            const result = await prisma.$queryRaw`SELECT DATABASE() as db`;
            logTest('Database Connection', true, `Connected to: ${result[0]?.db || 'database'}`);
        } catch (e) {
            // PostgreSQL doesn't have DATABASE() function, try alternative
            try {
                const result = await prisma.$queryRaw`SELECT current_database() as db`;
                logTest('Database Connection', true, `Connected to: ${result[0]?.db || 'database'}`);
            } catch (e2) {
                // Just verify we can query
                await prisma.$queryRaw`SELECT 1`;
                logTest('Database Connection', true, 'Connected successfully');
            }
        }
        return true;
    } catch (error) {
        logTest('Database Connection', false, error.message);
        return false;
    }
}

async function testSystemSettingsDirect() {
    console.log('\n🔧 Testing SystemSettings Database Operations...\n');
    
    try {
        // Test 1: Get default settings
        console.log('Test 1: Get default settings');
        let settings = await prisma.systemSettings.findUnique({
            where: { id: "default" }
        });
        
        if (!settings) {
            settings = await prisma.systemSettings.create({
                data: {
                    id: "default",
                    realtimeProvider: "POLLING",
                    sessionTimeout: 15,
                    sessionWarning: 1,
                    loginLimit: 10,
                    registerLimit: 5
                }
            });
        }
        logTest('Get System Settings', !!settings, `Provider: ${settings.realtimeProvider}`);
        
        // Test 2: Update settings
        console.log('\nTest 2: Update settings');
        const testData = {
            realtimeProvider: 'POLLING',
            sessionTimeout: 20,
            loginLimit: 15
        };
        const updated = await prisma.systemSettings.update({
            where: { id: "default" },
            data: testData
        });
        logTest('Update System Settings', 
            updated.realtimeProvider === 'POLLING' && updated.sessionTimeout === 20,
            `Updated provider: ${updated.realtimeProvider}, timeout: ${updated.sessionTimeout}`
        );
        
        // Test 3: Verify update persisted
        console.log('\nTest 3: Verify update persisted');
        const refreshed = await prisma.systemSettings.findUnique({
            where: { id: "default" }
        });
        logTest('Settings Persistence', 
            refreshed.sessionTimeout === 20 && refreshed.loginLimit === 15,
            `Timeout: ${refreshed.sessionTimeout}, Login limit: ${refreshed.loginLimit}`
        );
        
        // Test 4: Restore original settings
        console.log('\nTest 4: Restore original settings');
        await prisma.systemSettings.update({
            where: { id: "default" },
            data: {
                realtimeProvider: 'POLLING',
                sessionTimeout: 15,
                loginLimit: 10
            }
        });
        logTest('Restore Settings', true, 'Settings restored to defaults');
        
        return true;
    } catch (error) {
        logTest('SystemSettings Tests', false, error.message);
        console.error('Error details:', error);
        return false;
    }
}

async function testServiceLayerStructure() {
    console.log('\n📁 Testing Service Layer Structure...\n');
    
    const servicesDir = path.join(__dirname, '..', 'lib', 'services');
    
    const requiredServices = [
        'authService.js',
        'ordersService.js',
        'paymentService.js',
        'shippingService.js',
        'catalogService.js',
        'adminService.js',
        'systemSettingsService.js'
    ];
    
    let allExist = true;
    for (const service of requiredServices) {
        const servicePath = path.join(servicesDir, service);
        const exists = fs.existsSync(servicePath);
        logTest(`Service File: ${service}`, exists, exists ? 'Found' : 'Missing');
        if (!exists) allExist = false;
    }
    
    return allExist;
}

async function testAPIRoutes() {
    console.log('\n🌐 Testing API Routes (via HTTP)...\n');
    
    const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000';
    
    try {
        // Test 1: GET /api/system/settings
        console.log('Test 1: GET /api/system/settings');
        const response1 = await fetch(`${baseUrl}/api/system/settings`);
        if (!response1.ok) {
            logTest('GET /api/system/settings', false, `Status: ${response1.status}`);
            console.log('⚠️  Skipping API tests - dev server not running');
            return false;
        }
        const data1 = await response1.json();
        logTest('GET /api/system/settings', 
            data1.realtimeProvider !== undefined,
            `Status: ${response1.status}, Provider: ${data1.realtimeProvider}`
        );
        
        // Test 2: GET /api/system/realtime
        console.log('\nTest 2: GET /api/system/realtime');
        const response2 = await fetch(`${baseUrl}/api/system/realtime`);
        if (!response2.ok) {
            logTest('GET /api/system/realtime', false, `Status: ${response2.status}`);
            return false;
        }
        const data2 = await response2.json();
        logTest('GET /api/system/realtime', 
            data2.provider !== undefined,
            `Status: ${response2.status}, Provider: ${data2.provider}`
        );
        
        return true;
    } catch (error) {
        // Don't fail the test suite if server isn't running
        console.log('⚠️  API route tests skipped - dev server not running');
        console.log('   To test API routes, start dev server: npm run dev');
        return true; // Return true so it doesn't fail the suite
    }
}

async function testDomainBoundaries() {
    console.log('\n🔒 Testing Domain Boundaries...\n');
    
    const servicesDir = path.join(__dirname, '..', 'lib', 'services');
    
    try {
        const systemSettingsService = fs.readFileSync(
            path.join(servicesDir, 'systemSettingsService.js'), 
            'utf8'
        );
        
        // Check that it imports from settings (which uses systemSettings)
        const usesSettings = systemSettingsService.includes('@/lib/settings') || 
                            systemSettingsService.includes('./settings') ||
                            systemSettingsService.includes('../settings');
        
        // Check that it doesn't directly access other models
        const usesOtherModels = systemSettingsService.includes('prisma.user') || 
                               systemSettingsService.includes('prisma.order') ||
                               systemSettingsService.includes('prisma.product') ||
                               systemSettingsService.includes('prisma.store');
        
        logTest('SystemSettingsService Boundaries', 
            usesSettings && !usesOtherModels,
            usesOtherModels ? 'Accesses other models (violation)' : 'Uses settings module correctly'
        );
        
        return true;
    } catch (error) {
        logTest('Domain Boundaries Test', false, error.message);
        return false;
    }
}

async function runAllTests() {
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║     Phase 1 Testing - Service Layer Modularization       ║');
    console.log('╚═══════════════════════════════════════════════════════════╝');
    
    // Test 1: Database Connection
    const dbConnected = await testDatabaseConnection();
    if (!dbConnected) {
        console.log('\n❌ Database connection failed. Please check your .env file and database setup.');
        console.log('   Run: npm run setup:local');
        await prisma.$disconnect();
        process.exit(1);
    }
    
    // Test 2: Service Layer Structure
    await testServiceLayerStructure();
    
    // Test 3: SystemSettings Database Operations
    await testSystemSettingsDirect();
    
    // Test 4: Domain Boundaries
    await testDomainBoundaries();
    
    // Test 5: API Routes (optional - requires dev server)
    console.log('\n⚠️  Note: API route tests require dev server to be running.');
    console.log('   Start with: npm run dev\n');
    const apiTestsPassed = await testAPIRoutes();
    
    // Summary
    console.log('\n╔═══════════════════════════════════════════════════════════╗');
    console.log('║                      Test Summary                         ║');
    console.log('╚═══════════════════════════════════════════════════════════╝');
    console.log(`\n✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);
    console.log(`📊 Total:  ${testResults.tests.length}`);
    
    if (testResults.failed > 0) {
        console.log('\n❌ Failed Tests:');
        testResults.tests
            .filter(t => !t.passed)
            .forEach(t => console.log(`   - ${t.name}: ${t.message}`));
    }
    
    // Count only critical failures (exclude API tests if server not running)
    const criticalFailures = testResults.tests.filter(t => 
        !t.passed && !t.name.includes('API Routes')
    ).length;
    const success = criticalFailures === 0;
    console.log(`\n${success ? '✅' : '❌'} Phase 1 Tests: ${success ? 'PASSED' : 'FAILED'}\n`);
    
    await prisma.$disconnect();
    process.exit(success ? 0 : 1);
}

// Run tests
runAllTests().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});

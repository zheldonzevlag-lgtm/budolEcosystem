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

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

// Configure database environment (using dynamic import for ES modules)
let configureDatabaseEnv;
async function setupDatabase() {
    const dbConfig = await import('../lib/db-config.js');
    configureDatabaseEnv = dbConfig.configureDatabaseEnv;
    configureDatabaseEnv();
}

const prisma = new PrismaClient({
    log: ['error', 'warn'],
});

// Import service functions (using dynamic import for ES modules)
let getSystemSettings, updateSystemSettings;

async function loadServices() {
    const systemSettingsService = await import('../lib/services/systemSettingsService.js');
    getSystemSettings = systemSettingsService.getSystemSettings;
    updateSystemSettings = systemSettingsService.updateSystemSettings;
}

const fs = require('fs');
const path = require('path');

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
                logTest('Database Connection', true, 'Connected (database name unavailable)');
            }
        }
        return true;
    } catch (error) {
        logTest('Database Connection', false, error.message);
        return false;
    }
}

async function testSystemSettingsService() {
    console.log('\n🔧 Testing SystemSettingsService...\n');
    
    try {
        // Test 1: Get default settings
        console.log('Test 1: Get default settings');
        const settings = await getSystemSettings();
        logTest('Get System Settings', !!settings, `Provider: ${settings.realtimeProvider}`);
        
        // Test 2: Update settings
        console.log('\nTest 2: Update settings');
        const testData = {
            realtimeProvider: 'POLLING',
            sessionTimeout: 20,
            loginLimit: 15
        };
        const updated = await updateSystemSettings(testData);
        logTest('Update System Settings', 
            updated.realtimeProvider === 'POLLING' && updated.sessionTimeout === 20,
            `Updated provider: ${updated.realtimeProvider}, timeout: ${updated.sessionTimeout}`
        );
        
        // Test 3: Verify update persisted
        console.log('\nTest 3: Verify update persisted');
        const refreshed = await getSystemSettings(true); // Force refresh
        logTest('Settings Persistence', 
            refreshed.sessionTimeout === 20 && refreshed.loginLimit === 15,
            `Timeout: ${refreshed.sessionTimeout}, Login limit: ${refreshed.loginLimit}`
        );
        
        // Test 4: Restore original settings
        console.log('\nTest 4: Restore original settings');
        await updateSystemSettings({
            realtimeProvider: 'POLLING',
            sessionTimeout: 15,
            loginLimit: 10
        });
        logTest('Restore Settings', true, 'Settings restored to defaults');
        
        return true;
    } catch (error) {
        logTest('SystemSettingsService Tests', false, error.message);
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
        logTest('API Routes Tests', false, error.message);
        console.log('⚠️  Note: Make sure dev server is running (npm run dev)');
        return false;
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
        
        // Check that it uses prisma correctly
        const usesPrisma = systemSettingsService.includes('prisma.systemSettings');
        const usesOtherModels = systemSettingsService.includes('prisma.user') || 
                               systemSettingsService.includes('prisma.order');
        
        logTest('SystemSettingsService Boundaries', 
            usesPrisma && !usesOtherModels,
            usesOtherModels ? 'Accesses other models (violation)' : 'Only accesses SystemSettings'
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
    
    // Setup database configuration
    await setupDatabase();
    
    // Load service modules
    await loadServices();
    
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
    
    // Test 3: SystemSettingsService
    await testSystemSettingsService();
    
    // Test 4: Domain Boundaries
    await testDomainBoundaries();
    
    // Test 5: API Routes (optional - requires dev server)
    console.log('\n⚠️  Note: API route tests require dev server to be running.');
    console.log('   Start with: npm run dev\n');
    await testAPIRoutes();
    
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
    
    const success = testResults.failed === 0;
    console.log(`\n${success ? '✅' : '❌'} Phase 1 Tests: ${success ? 'PASSED' : 'FAILED'}\n`);
    
    await prisma.$disconnect();
    process.exit(success ? 0 : 1);
}

// Run tests
runAllTests().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});

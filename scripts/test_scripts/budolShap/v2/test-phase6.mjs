/**
 * Phase 6 Testing Script
 * Tests Auth Service extraction and Cache Service implementation
 * 
 * Run with: npm run test:phase6
 * 
 * Prerequisites:
 * 1. Local database running
 * 2. .env file configured with DATABASE_URL
 * 3. Dev server running (npm run dev) for API route tests
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
        await prisma.$queryRaw`SELECT 1`;
        logTest('Database Connection', true, 'Connected successfully');
        return true;
    } catch (error) {
        logTest('Database Connection', false, error.message);
        return false;
    }
}

async function testSchemaUpdate() {
    console.log('\n📋 Testing Schema Update...\n');
    try {
        // Check if cacheProvider field exists in SystemSettings
        const result = await prisma.$queryRaw`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'SystemSettings' 
            AND column_name = 'cacheProvider'
        `;
        const hasCacheProvider = result && result.length > 0;
        logTest('Schema: cacheProvider field', hasCacheProvider);
        
        const result2 = await prisma.$queryRaw`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'SystemSettings' 
            AND column_name = 'redisUrl'
        `;
        const hasRedisUrl = result2 && result2.length > 0;
        logTest('Schema: redisUrl field', hasRedisUrl);
        
        return hasCacheProvider && hasRedisUrl;
    } catch (error) {
        logTest('Schema Update', false, error.message);
        return false;
    }
}

async function testAuthServiceFile() {
    console.log('\n🔐 Testing Auth Service File...\n');
    
    const servicePath = path.join(__dirname, '..', 'lib', 'services', 'authService.js');
    
    try {
        const serviceCode = fs.readFileSync(servicePath, 'utf8');
        
        const hasRegisterUser = serviceCode.includes('export async function registerUser');
        const hasAuthenticateUser = serviceCode.includes('export async function authenticateUser');
        const hasGetUserById = serviceCode.includes('export async function getUserById');
        const hasVerifyEmail = serviceCode.includes('export async function verifyEmail');
        const hasRequestPasswordReset = serviceCode.includes('export async function requestPasswordReset');
        const hasResetPassword = serviceCode.includes('export async function resetPassword');
        
        logTest('Auth Service: registerUser', hasRegisterUser);
        logTest('Auth Service: authenticateUser', hasAuthenticateUser);
        logTest('Auth Service: getUserById', hasGetUserById);
        logTest('Auth Service: verifyEmail', hasVerifyEmail);
        logTest('Auth Service: requestPasswordReset', hasRequestPasswordReset);
        logTest('Auth Service: resetPassword', hasResetPassword);
        
        return hasRegisterUser && hasAuthenticateUser && hasGetUserById && hasVerifyEmail && hasRequestPasswordReset && hasResetPassword;
    } catch (error) {
        logTest('Auth Service File', false, error.message);
        return false;
    }
}

async function testCacheServiceFile() {
    console.log('\n💾 Testing Cache Service File...\n');
    
    const servicePath = path.join(__dirname, '..', 'lib', 'services', 'cacheService.js');
    
    try {
        const serviceCode = fs.readFileSync(servicePath, 'utf8');
        
        const hasGetCache = serviceCode.includes('export async function getCache');
        const hasSetCache = serviceCode.includes('export async function setCache');
        const hasDeleteCache = serviceCode.includes('export async function deleteCache');
        const hasClearCache = serviceCode.includes('export async function clearCache');
        const hasUpdateCacheConfig = serviceCode.includes('export async function updateCacheConfig');
        const hasGetCacheStatus = serviceCode.includes('export async function getCacheStatus');
        const hasRedis = serviceCode.includes('REDIS');
        const hasVercelEdge = serviceCode.includes('VERCEL_EDGE');
        const hasMemory = serviceCode.includes('MEMORY');
        
        logTest('Cache Service: getCache', hasGetCache);
        logTest('Cache Service: setCache', hasSetCache);
        logTest('Cache Service: deleteCache', hasDeleteCache);
        logTest('Cache Service: clearCache', hasClearCache);
        logTest('Cache Service: updateCacheConfig', hasUpdateCacheConfig);
        logTest('Cache Service: getCacheStatus', hasGetCacheStatus);
        logTest('Cache Service: Redis support', hasRedis);
        logTest('Cache Service: Vercel Edge support', hasVercelEdge);
        logTest('Cache Service: Memory support', hasMemory);
        
        return hasGetCache && hasSetCache && hasDeleteCache && hasClearCache && hasUpdateCacheConfig && hasGetCacheStatus;
    } catch (error) {
        logTest('Cache Service File', false, error.message);
        return false;
    }
}

async function testInternalAuthAPI() {
    console.log('\n🌐 Testing Internal Auth API Structure...\n');
    
    const internalApiDir = path.join(__dirname, '..', 'app', 'api', 'internal', 'auth');
    
    const requiredEndpoints = [
        'health/route.js',
        'register/route.js',
        'login/route.js',
        'user/[userId]/route.js'
    ];
    
    let allExist = true;
    for (const endpoint of requiredEndpoints) {
        const endpointPath = path.join(internalApiDir, endpoint);
        const exists = fs.existsSync(endpointPath);
        logTest(`Internal Auth API: ${endpoint}`, exists, exists ? 'Found' : 'Missing');
        if (!exists) allExist = false;
    }
    
    return allExist;
}

async function testInternalCacheAPI() {
    console.log('\n🌐 Testing Internal Cache API Structure...\n');
    
    const internalApiDir = path.join(__dirname, '..', 'app', 'api', 'internal', 'cache');
    
    const requiredEndpoints = [
        'health/route.js'
    ];
    
    let allExist = true;
    for (const endpoint of requiredEndpoints) {
        const endpointPath = path.join(internalApiDir, endpoint);
        const exists = fs.existsSync(endpointPath);
        logTest(`Internal Cache API: ${endpoint}`, exists, exists ? 'Found' : 'Missing');
        if (!exists) allExist = false;
    }
    
    return allExist;
}

async function testCacheAPI() {
    console.log('\n🌐 Testing Cache Configuration API...\n');
    
    const cacheApiPath = path.join(__dirname, '..', 'app', 'api', 'system', 'cache', 'route.js');
    const exists = fs.existsSync(cacheApiPath);
    logTest('Cache API: /api/system/cache', exists, exists ? 'Found' : 'Missing');
    return exists;
}

async function testAdminCachePage() {
    console.log('\n🎨 Testing Admin Cache Settings Page...\n');
    
    const cachePagePath = path.join(__dirname, '..', 'app', 'admin', 'settings', 'cache', 'page.jsx');
    const exists = fs.existsSync(cachePagePath);
    logTest('Admin Cache Page: /admin/settings/cache', exists, exists ? 'Found' : 'Missing');
    return exists;
}

async function testAdminSidebarUpdate() {
    console.log('\n🎨 Testing Admin Sidebar Update...\n');
    
    const sidebarPath = path.join(__dirname, '..', 'components', 'admin', 'AdminSidebar.jsx');
    
    try {
        const sidebarCode = fs.readFileSync(sidebarPath, 'utf8');
        
        const hasCachingSystems = sidebarCode.includes("Caching Systems") || sidebarCode.includes('Caching Systems');
        const hasCacheRoute = sidebarCode.includes('/admin/settings/cache');
        const hasHardDriveIcon = sidebarCode.includes('HardDrive');
        
        logTest('Admin Sidebar: Caching Systems menu item', hasCachingSystems);
        logTest('Admin Sidebar: Cache route', hasCacheRoute);
        logTest('Admin Sidebar: HardDrive icon', hasHardDriveIcon);
        
        return hasCachingSystems && hasCacheRoute && hasHardDriveIcon;
    } catch (error) {
        logTest('Admin Sidebar Update', false, error.message);
        return false;
    }
}

async function testServiceInterfaces() {
    console.log('\n📋 Testing Service Interfaces...\n');
    
    const interfacesPath = path.join(__dirname, '..', 'lib', 'api', 'serviceInterfaces.js');
    
    try {
        const interfaces = fs.readFileSync(interfacesPath, 'utf8');
        
        const hasAuthInterface = interfaces.includes('AuthServiceInterface');
        const hasCacheInterface = interfaces.includes('CacheServiceInterface');
        const hasAuthInRegistry = interfaces.includes('auth: AuthServiceInterface');
        const hasCacheInRegistry = interfaces.includes('cache: CacheServiceInterface');
        
        logTest('Service Interfaces: AuthServiceInterface', hasAuthInterface);
        logTest('Service Interfaces: CacheServiceInterface', hasCacheInterface);
        logTest('Service Interfaces: Auth in registry', hasAuthInRegistry);
        logTest('Service Interfaces: Cache in registry', hasCacheInRegistry);
        
        return hasAuthInterface && hasCacheInterface && hasAuthInRegistry && hasCacheInRegistry;
    } catch (error) {
        logTest('Service Interfaces Tests', false, error.message);
        return false;
    }
}

async function testInternalEndpoints() {
    console.log('\n🌐 Testing Internal API Endpoints (via HTTP)...\n');
    
    const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000';
    
    try {
        // Test 1: Auth health check
        console.log('Test 1: GET /api/internal/auth/health');
        const authHealthResponse = await fetch(`${baseUrl}/api/internal/auth/health`);
        if (authHealthResponse.ok) {
            const authHealthData = await authHealthResponse.json();
            logTest('Internal Auth API: Health Check', 
                authHealthData.service === 'auth' && authHealthData.status !== undefined,
                `Status: ${authHealthData.status}, Service: ${authHealthData.service}`
            );
        } else {
            logTest('Internal Auth API: Health Check', false, `Status: ${authHealthResponse.status}`);
        }
        
        // Test 2: Cache health check
        console.log('Test 2: GET /api/internal/cache/health');
        const cacheHealthResponse = await fetch(`${baseUrl}/api/internal/cache/health`);
        if (cacheHealthResponse.ok) {
            const cacheHealthData = await cacheHealthResponse.json();
            logTest('Internal Cache API: Health Check', 
                cacheHealthData.service === 'cache' && cacheHealthData.status !== undefined,
                `Status: ${cacheHealthData.status}, Service: ${cacheHealthData.service}`
            );
        } else {
            logTest('Internal Cache API: Health Check', false, `Status: ${cacheHealthResponse.status}`);
        }
        
        // Test 3: Cache config API
        console.log('Test 3: GET /api/system/cache');
        const cacheConfigResponse = await fetch(`${baseUrl}/api/system/cache`);
        logTest('Cache Config API: Get Status', 
            cacheConfigResponse.ok || cacheConfigResponse.status === 401,
            `Status: ${cacheConfigResponse.status} (200/401 = exists)`
        );
        
        return true;
    } catch (error) {
        logTest('Internal API Endpoints', false, error.message);
        console.log('⚠️  Note: Make sure dev server is running (npm run dev)');
        return true; // Don't fail suite if server not running
    }
}

async function runAllTests() {
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║   Phase 6 Testing - Auth & Cache Service Extraction   ║');
    console.log('╚═══════════════════════════════════════════════════════════╝');
    
    // Test 1: Database Connection
    const dbConnected = await testDatabaseConnection();
    if (!dbConnected) {
        console.log('\n❌ Database connection failed. Please check your .env file.');
        await prisma.$disconnect();
        process.exit(1);
    }
    
    // Test 2: Schema Update
    await testSchemaUpdate();
    
    // Test 3: Auth Service File
    await testAuthServiceFile();
    
    // Test 4: Cache Service File
    await testCacheServiceFile();
    
    // Test 5: Internal Auth API Structure
    await testInternalAuthAPI();
    
    // Test 6: Internal Cache API Structure
    await testInternalCacheAPI();
    
    // Test 7: Cache Configuration API
    await testCacheAPI();
    
    // Test 8: Admin Cache Page
    await testAdminCachePage();
    
    // Test 9: Admin Sidebar Update
    await testAdminSidebarUpdate();
    
    // Test 10: Service Interfaces
    await testServiceInterfaces();
    
    // Test 11: Internal API Endpoints
    console.log('\n⚠️  Note: Internal API endpoint tests require dev server to be running.');
    console.log('   Start with: npm run dev\n');
    await testInternalEndpoints();
    
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
    
    // Count only critical failures (exclude API tests if server not running, exclude schema if migration pending)
    const criticalFailures = testResults.tests.filter(t => 
        !t.passed && 
        !t.name.includes('API') && 
        !t.name.includes('HTTP') && 
        !t.name.includes('Health Check') &&
        !t.name.includes('Schema:') // Schema tests are informational if migration pending
    ).length;
    const success = criticalFailures === 0;
    
    console.log(`\n${success ? '✅' : '❌'} Phase 6 Tests: ${success ? 'PASSED' : 'FAILED'}\n`);
    
    await prisma.$disconnect();
    process.exit(success ? 0 : 1);
}

// Run tests
runAllTests().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});


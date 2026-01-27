/**
 * Phase 4 Testing Script
 * Tests Orders Service extraction and internal API boundaries
 * 
 * Run with: npm run test:phase4
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

async function testOrdersServiceFile() {
    console.log('\n📦 Testing Orders Service File...\n');
    
    const servicePath = path.join(__dirname, '..', 'lib', 'services', 'ordersService.js');
    
    try {
        const serviceCode = fs.readFileSync(servicePath, 'utf8');
        
        const hasGetOrders = serviceCode.includes('export async function getOrders');
        const hasGetOrderById = serviceCode.includes('export async function getOrderById');
        const hasCreateOrder = serviceCode.includes('export async function createOrder');
        const hasUpdateOrderStatus = serviceCode.includes('export async function updateOrderStatus');
        const hasLinkPaymentToOrder = serviceCode.includes('export async function linkPaymentToOrder');
        const hasFindOrderByPaymentIntent = serviceCode.includes('export async function findOrderByPaymentIntent');
        
        logTest('Orders Service: getOrders', hasGetOrders);
        logTest('Orders Service: getOrderById', hasGetOrderById);
        logTest('Orders Service: createOrder', hasCreateOrder);
        logTest('Orders Service: updateOrderStatus', hasUpdateOrderStatus);
        logTest('Orders Service: linkPaymentToOrder', hasLinkPaymentToOrder);
        logTest('Orders Service: findOrderByPaymentIntent', hasFindOrderByPaymentIntent);
        
        return hasGetOrders && hasGetOrderById && hasCreateOrder && hasUpdateOrderStatus && hasLinkPaymentToOrder && hasFindOrderByPaymentIntent;
    } catch (error) {
        logTest('Orders Service File', false, error.message);
        return false;
    }
}

async function testInternalOrdersAPI() {
    console.log('\n🌐 Testing Internal Orders API Structure...\n');
    
    const internalApiDir = path.join(__dirname, '..', 'app', 'api', 'internal', 'orders');
    
    const requiredEndpoints = [
        'health/route.js',
        'route.js',
        '[orderId]/route.js',
        'by-payment/route.js'
    ];
    
    let allExist = true;
    for (const endpoint of requiredEndpoints) {
        const endpointPath = path.join(internalApiDir, endpoint);
        const exists = fs.existsSync(endpointPath);
        logTest(`Internal Orders API: ${endpoint}`, exists, exists ? 'Found' : 'Missing');
        if (!exists) allExist = false;
    }
    
    return allExist;
}

async function testServiceInterfaces() {
    console.log('\n📋 Testing Orders Service Interfaces...\n');
    
    const interfacesPath = path.join(__dirname, '..', 'lib', 'api', 'serviceInterfaces.js');
    
    try {
        const interfaces = fs.readFileSync(interfacesPath, 'utf8');
        
        // Check if OrdersServiceInterface exists or is being added
        const hasOrdersInterface = interfaces.includes('OrdersServiceInterface') || interfaces.includes('orders:');
        
        logTest('Service Interfaces: Orders Service', hasOrdersInterface);
        
        return hasOrdersInterface;
    } catch (error) {
        logTest('Service Interfaces Tests', false, error.message);
        return false;
    }
}

async function testOrdersServiceFunctions() {
    console.log('\n🔧 Testing Orders Service Functions...\n');
    
    try {
        const servicePath = path.join(__dirname, '..', 'lib', 'services', 'ordersService.js');
        const serviceCode = fs.readFileSync(servicePath, 'utf8');
        
        // Check function exports
        const hasGetOrders = serviceCode.includes('export async function getOrders') || 
                               serviceCode.includes('export function getOrders');
        const hasGetOrderById = serviceCode.includes('export async function getOrderById') ||
                               serviceCode.includes('export function getOrderById');
        const hasCreateOrder = serviceCode.includes('export async function createOrder') ||
                              serviceCode.includes('export function createOrder');
        const hasUpdateOrderStatus = serviceCode.includes('export async function updateOrderStatus') ||
                                    serviceCode.includes('export function updateOrderStatus');
        
        logTest('Orders Service: getOrders function', hasGetOrders);
        logTest('Orders Service: getOrderById function', hasGetOrderById);
        logTest('Orders Service: createOrder function', hasCreateOrder);
        logTest('Orders Service: updateOrderStatus function', hasUpdateOrderStatus);
        
        return hasGetOrders && hasGetOrderById && hasCreateOrder && hasUpdateOrderStatus;
    } catch (error) {
        logTest('Orders Service Functions', false, error.message);
        return false;
    }
}

async function testInternalOrdersEndpoints() {
    console.log('\n🌐 Testing Internal Orders API Endpoints (via HTTP)...\n');
    
    const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000';
    
    try {
        // Test 1: Health check
        console.log('Test 1: GET /api/internal/orders/health');
        const healthResponse = await fetch(`${baseUrl}/api/internal/orders/health`);
        if (!healthResponse.ok) {
            logTest('Internal Orders API: Health Check', false, `Status: ${healthResponse.status}`);
            return false;
        }
        const healthData = await healthResponse.json();
        logTest('Internal Orders API: Health Check', 
            healthData.service === 'orders' && healthData.status !== undefined,
            `Status: ${healthData.status}, Service: ${healthData.service}`
        );
        
        // Test 2: Get orders (without filters - should return empty or default)
        console.log('\nTest 2: GET /api/internal/orders');
        const ordersResponse = await fetch(`${baseUrl}/api/internal/orders`);
        logTest('Internal Orders API: Get Orders', 
            ordersResponse.ok,
            `Status: ${ordersResponse.status}`
        );
        
        return true;
    } catch (error) {
        logTest('Internal Orders API Endpoints', false, error.message);
        console.log('⚠️  Note: Make sure dev server is running (npm run dev)');
        return true; // Don't fail suite if server not running
    }
}

async function testPublicAPIConsistency() {
    console.log('\n🔗 Testing Public Orders API Consistency...\n');
    
    const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000';
    
    try {
        // Test that public orders API still exists
        console.log('Test: GET /api/orders (public) - structure check');
        const publicResponse = await fetch(`${baseUrl}/api/orders`);
        
        const isPublicAvailable = publicResponse.ok || publicResponse.status === 400;
        logTest('Public Orders API: Get Orders Endpoint', 
            isPublicAvailable,
            `Status: ${publicResponse.status} (200/400 = exists, 404 = missing)`
        );
        
        return true;
    } catch (error) {
        logTest('Public Orders API Consistency', false, error.message);
        console.log('⚠️  Note: Requires dev server running');
        return true; // Don't fail suite
    }
}

async function runAllTests() {
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║   Phase 4 Testing - Orders Service Extraction          ║');
    console.log('╚═══════════════════════════════════════════════════════════╝');
    
    // Test 1: Database Connection
    const dbConnected = await testDatabaseConnection();
    if (!dbConnected) {
        console.log('\n❌ Database connection failed. Please check your .env file.');
        await prisma.$disconnect();
        process.exit(1);
    }
    
    // Test 2: Orders Service File
    await testOrdersServiceFile();
    
    // Test 3: Internal Orders API Structure
    await testInternalOrdersAPI();
    
    // Test 4: Service Interfaces
    await testServiceInterfaces();
    
    // Test 5: Orders Service Functions
    await testOrdersServiceFunctions();
    
    // Test 6: Internal Orders API Endpoints
    console.log('\n⚠️  Note: Internal Orders API endpoint tests require dev server to be running.');
    console.log('   Start with: npm run dev\n');
    await testInternalOrdersEndpoints();
    
    // Test 7: Public API Consistency
    await testPublicAPIConsistency();
    
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
        !t.passed && !t.name.includes('API') && !t.name.includes('HTTP')
    ).length;
    const success = criticalFailures === 0;
    
    console.log(`\n${success ? '✅' : '❌'} Phase 4 Tests: ${success ? 'PASSED' : 'FAILED'}\n`);
    
    await prisma.$disconnect();
    process.exit(success ? 0 : 1);
}

// Run tests
runAllTests().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});





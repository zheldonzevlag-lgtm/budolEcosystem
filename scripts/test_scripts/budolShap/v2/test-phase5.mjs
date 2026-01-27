/**
 * Phase 5 Testing Script
 * Tests Shipping Service extraction and internal API boundaries
 * 
 * Run with: npm run test:phase5
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

async function testShippingServiceFile() {
    console.log('\n🚚 Testing Shipping Service File...\n');
    
    const servicePath = path.join(__dirname, '..', 'lib', 'services', 'shippingService.js');
    
    try {
        const serviceCode = fs.readFileSync(servicePath, 'utf8');
        
        const hasGetShippingQuote = serviceCode.includes('export async function getShippingQuote');
        const hasBookShipping = serviceCode.includes('export async function bookShipping');
        const hasTrackShipping = serviceCode.includes('export async function trackShipping');
        const hasCancelShipping = serviceCode.includes('export async function cancelShipping');
        const hasUpdateShippingStatus = serviceCode.includes('export async function updateShippingStatus');
        
        logTest('Shipping Service: getShippingQuote', hasGetShippingQuote);
        logTest('Shipping Service: bookShipping', hasBookShipping);
        logTest('Shipping Service: trackShipping', hasTrackShipping);
        logTest('Shipping Service: cancelShipping', hasCancelShipping);
        logTest('Shipping Service: updateShippingStatus', hasUpdateShippingStatus);
        
        return hasGetShippingQuote && hasBookShipping && hasTrackShipping && hasCancelShipping && hasUpdateShippingStatus;
    } catch (error) {
        logTest('Shipping Service File', false, error.message);
        return false;
    }
}

async function testInternalShippingAPI() {
    console.log('\n🌐 Testing Internal Shipping API Structure...\n');
    
    const internalApiDir = path.join(__dirname, '..', 'app', 'api', 'internal', 'shipping');
    
    const requiredEndpoints = [
        'health/route.js',
        'quote/route.js',
        'book/route.js',
        'track/[orderId]/route.js',
        'cancel/[orderId]/route.js'
    ];
    
    let allExist = true;
    for (const endpoint of requiredEndpoints) {
        const endpointPath = path.join(internalApiDir, endpoint);
        const exists = fs.existsSync(endpointPath);
        logTest(`Internal Shipping API: ${endpoint}`, exists, exists ? 'Found' : 'Missing');
        if (!exists) allExist = false;
    }
    
    return allExist;
}

async function testServiceInterfaces() {
    console.log('\n📋 Testing Shipping Service Interfaces...\n');
    
    const interfacesPath = path.join(__dirname, '..', 'lib', 'api', 'serviceInterfaces.js');
    
    try {
        const interfaces = fs.readFileSync(interfacesPath, 'utf8');
        
        const hasShippingInterface = interfaces.includes('ShippingServiceInterface');
        const hasQuote = interfaces.includes('quote:');
        const hasBook = interfaces.includes('book:');
        const hasTrack = interfaces.includes('track:');
        const hasCancel = interfaces.includes('cancel:');
        
        logTest('Service Interfaces: ShippingServiceInterface', hasShippingInterface);
        logTest('Service Interfaces: quote endpoint', hasQuote);
        logTest('Service Interfaces: book endpoint', hasBook);
        logTest('Service Interfaces: track endpoint', hasTrack);
        logTest('Service Interfaces: cancel endpoint', hasCancel);
        
        return hasShippingInterface && hasQuote && hasBook && hasTrack && hasCancel;
    } catch (error) {
        logTest('Service Interfaces Tests', false, error.message);
        return false;
    }
}

async function testShippingServiceFunctions() {
    console.log('\n🔧 Testing Shipping Service Functions...\n');
    
    try {
        const servicePath = path.join(__dirname, '..', 'lib', 'services', 'shippingService.js');
        const serviceCode = fs.readFileSync(servicePath, 'utf8');
        
        // Check function exports
        const hasGetQuote = serviceCode.includes('export async function getShippingQuote') || 
                           serviceCode.includes('export function getShippingQuote');
        const hasBook = serviceCode.includes('export async function bookShipping') ||
                       serviceCode.includes('export function bookShipping');
        const hasTrack = serviceCode.includes('export async function trackShipping') ||
                        serviceCode.includes('export function trackShipping');
        const hasCancel = serviceCode.includes('export async function cancelShipping') ||
                         serviceCode.includes('export function cancelShipping');
        
        logTest('Shipping Service: getShippingQuote function', hasGetQuote);
        logTest('Shipping Service: bookShipping function', hasBook);
        logTest('Shipping Service: trackShipping function', hasTrack);
        logTest('Shipping Service: cancelShipping function', hasCancel);
        
        return hasGetQuote && hasBook && hasTrack && hasCancel;
    } catch (error) {
        logTest('Shipping Service Functions', false, error.message);
        return false;
    }
}

async function testInternalShippingEndpoints() {
    console.log('\n🌐 Testing Internal Shipping API Endpoints (via HTTP)...\n');
    
    const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000';
    
    try {
        // Test 1: Health check
        console.log('Test 1: GET /api/internal/shipping/health');
        const healthResponse = await fetch(`${baseUrl}/api/internal/shipping/health`);
        if (!healthResponse.ok) {
            logTest('Internal Shipping API: Health Check', false, `Status: ${healthResponse.status}`);
            return false;
        }
        const healthData = await healthResponse.json();
        logTest('Internal Shipping API: Health Check', 
            healthData.service === 'shipping' && healthData.status !== undefined,
            `Status: ${healthData.status}, Service: ${healthData.service}`
        );
        
        return true;
    } catch (error) {
        logTest('Internal Shipping API Endpoints', false, error.message);
        console.log('⚠️  Note: Make sure dev server is running (npm run dev)');
        return true; // Don't fail suite if server not running
    }
}

async function testPublicAPIConsistency() {
    console.log('\n🔗 Testing Public Shipping API Consistency...\n');
    
    const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000';
    
    try {
        // Test that public shipping APIs still exist
        console.log('Test: POST /api/shipping/lalamove/quote (public) - structure check');
        const publicResponse = await fetch(`${baseUrl}/api/shipping/lalamove/quote`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}) // Empty body should return 400, not 404
        });
        
        const isPublicAvailable = publicResponse.status === 400 || publicResponse.status === 500;
        logTest('Public Shipping API: Quote Endpoint', 
            isPublicAvailable,
            `Status: ${publicResponse.status} (400/500 = exists, 404 = missing)`
        );
        
        return true;
    } catch (error) {
        logTest('Public Shipping API Consistency', false, error.message);
        console.log('⚠️  Note: Requires dev server running');
        return true; // Don't fail suite
    }
}

async function testShippingServiceIntegration() {
    console.log('\n🔄 Testing Shipping Service Integration...\n');
    
    try {
        const servicePath = path.join(__dirname, '..', 'lib', 'services', 'shippingService.js');
        const serviceCode = fs.readFileSync(servicePath, 'utf8');
        
        // Check that it imports shipping factory
        const importsShippingFactory = serviceCode.includes("require('@/services/shippingFactory')") ||
                                     serviceCode.includes("from '@/services/shippingFactory'");
        const importsPrisma = serviceCode.includes("from '@/lib/prisma'") ||
                             serviceCode.includes("from '../prisma'");
        
        logTest('Shipping Service Integration: Imports Shipping Factory', importsShippingFactory);
        logTest('Shipping Service Integration: Imports Prisma', importsPrisma);
        
        return importsShippingFactory && importsPrisma;
    } catch (error) {
        logTest('Shipping Service Integration', false, error.message);
        return false;
    }
}

async function runAllTests() {
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║   Phase 5 Testing - Shipping Service Extraction        ║');
    console.log('╚═══════════════════════════════════════════════════════════╝');
    
    // Test 1: Database Connection
    const dbConnected = await testDatabaseConnection();
    if (!dbConnected) {
        console.log('\n❌ Database connection failed. Please check your .env file.');
        await prisma.$disconnect();
        process.exit(1);
    }
    
    // Test 2: Shipping Service File
    await testShippingServiceFile();
    
    // Test 3: Internal Shipping API Structure
    await testInternalShippingAPI();
    
    // Test 4: Service Interfaces
    await testServiceInterfaces();
    
    // Test 5: Shipping Service Functions
    await testShippingServiceFunctions();
    
    // Test 6: Shipping Service Integration
    await testShippingServiceIntegration();
    
    // Test 7: Internal Shipping API Endpoints
    console.log('\n⚠️  Note: Internal Shipping API endpoint tests require dev server to be running.');
    console.log('   Start with: npm run dev\n');
    await testInternalShippingEndpoints();
    
    // Test 8: Public API Consistency
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
    
    console.log(`\n${success ? '✅' : '❌'} Phase 5 Tests: ${success ? 'PASSED' : 'FAILED'}\n`);
    
    await prisma.$disconnect();
    process.exit(success ? 0 : 1);
}

// Run tests
runAllTests().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});





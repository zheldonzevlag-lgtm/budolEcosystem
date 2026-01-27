import fs from 'fs';
import path from 'path';

const filePath = 'd:/IT Projects/budolEcosystem/budolshap-0.1.0/components/payment/QRCodeModal.jsx';

function runTest() {
    console.log('Starting Test: QR Modal UI Refinement (v519)');
    
    if (!fs.existsSync(filePath)) {
        console.error(`❌ Error: File not found at ${filePath}`);
        process.exit(1);
    }

    const content = fs.readFileSync(filePath, 'utf8');
    let allPassed = true;

    // Test 1: Check for "Store Name:" label
    if (content.includes('<span className="text-gray-600">Store Name:</span>')) {
        console.log('✅ Test Passed: "Store Name:" label found.');
    } else {
        console.error('❌ Test Failed: "Store Name:" label not found.');
        allPassed = false;
    }

    // Test 2: Check for "budolShap Owner:" label
    if (content.includes('<span className="text-gray-600">budolShap Owner:</span>')) {
        console.log('✅ Test Passed: "budolShap Owner:" label found.');
    } else {
        console.error('❌ Test Failed: "budolShap Owner:" label not found.');
        allPassed = false;
    }

    // Test 3: Check for hardcoded owner "Jon Galvez"
    if (content.includes('<span className="font-semibold text-gray-800 truncate ml-2">Jon Galvez</span>')) {
        console.log('✅ Test Passed: Hardcoded owner "Jon Galvez" found.');
    } else {
        console.error('❌ Test Failed: Hardcoded owner "Jon Galvez" not found.');
        allPassed = false;
    }

    // Test 4: Check for complete Payment ID (no truncation, has break-all)
    if (content.includes('break-all') && !content.includes('truncate max-w-[150px]')) {
        console.log('✅ Test Passed: Payment ID is configured for full display (break-all, no truncation).');
    } else {
        console.error('❌ Test Failed: Payment ID truncation or break-all logic is incorrect.');
        allPassed = false;
    }

    if (allPassed) {
        console.log('\n✨ All tests passed successfully for QR Modal v519!');
    } else {
        console.error('\n⚠️ Some tests failed. Please review the output.');
        process.exit(1);
    }
}

runTest();

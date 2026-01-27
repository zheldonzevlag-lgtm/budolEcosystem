import fs from 'fs';
import path from 'path';

const filePath = 'd:/IT Projects/budolEcosystem/budolshap-0.1.0/components/payment/QRCodeModal.jsx';

function testQRCodeModalLabels() {
    console.log('Starting UI Validation for QRCodeModal (v520)...');
    
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

    // Test 2: Check for "Store Owner:" label
    if (content.includes('<span className="text-gray-600">Store Owner:</span>')) {
        console.log('✅ Test Passed: "Store Owner:" label found.');
    } else {
        console.error('❌ Test Failed: "Store Owner:" label not found.');
        allPassed = false;
    }

    // Test 3: Check for hardcoded owner "Jon Galvez"
    if (content.includes('<span className="font-semibold text-gray-800 truncate ml-2">Jon Galvez</span>')) {
        console.log('✅ Test Passed: Hardcoded owner "Jon Galvez" found.');
    } else {
        console.error('❌ Test Failed: Hardcoded owner "Jon Galvez" not found.');
        allPassed = false;
    }

    // Test 4: Ensure "budolShap Owner:" is GONE
    if (!content.includes('budolShap Owner:')) {
        console.log('✅ Test Passed: "budolShap Owner:" label successfully removed.');
    } else {
        console.error('❌ Test Failed: "budolShap Owner:" label still exists.');
        allPassed = false;
    }

    if (allPassed) {
        console.log('\n✨ All UI tests passed for v520!');
        process.exit(0);
    } else {
        console.error('\n🛑 Some tests failed. Please review the output above.');
        process.exit(1);
    }
}

testQRCodeModalLabels();

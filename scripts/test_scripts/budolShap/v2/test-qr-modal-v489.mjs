import fs from 'fs';
import path from 'path';

/**
 * Test script to verify the UI changes in QRCodeModal.jsx
 * This script checks if the labels and hardcoded owner are correctly implemented.
 */

const filePath = path.join(process.cwd(), 'budolshap-0.1.0', 'components', 'payment', 'QRCodeModal.jsx');

function testQRCodeModal() {
    console.log('--- Starting QR Code Modal UI Test ---');
    
    if (!fs.existsSync(filePath)) {
        console.error(`Error: File not found at ${filePath}`);
        process.exit(1);
    }

    const content = fs.readFileSync(filePath, 'utf8');
    let passed = true;

    // Test 1: Check for "Store Name:" label
    if (content.includes('<span className="text-gray-600">Store Name:</span>')) {
        console.log('✅ Test Passed: "Store Name:" label found.');
    } else {
        console.error('❌ Test Failed: "Store Name:" label not found or incorrect.');
        passed = false;
    }

    // Test 2: Check for "Owner:" label
    if (content.includes('<span className="text-gray-600">Owner:</span>')) {
        console.log('✅ Test Passed: "Owner:" label found.');
    } else {
        console.error('❌ Test Failed: "Owner:" label not found or incorrect.');
        passed = false;
    }

    // Test 3: Check for hardcoded owner "Jon Galvez"
    if (content.includes('<span className="font-semibold text-gray-800 truncate ml-2">Jon Galvez</span>')) {
        console.log('✅ Test Passed: Hardcoded owner "Jon Galvez" found.');
    } else {
        console.error('❌ Test Failed: Hardcoded owner "Jon Galvez" not found or incorrect.');
        passed = false;
    }

    // Test 4: Verify the dynamic store name is still using qrCode.label
    // We expect it to be right after the "Store Name:" label
    const storeNamePattern = /<span className="text-gray-600">Store Name:<\/span>\s*<span className="font-semibold text-gray-800 truncate ml-2">\{qrCode\.label\}<\/span>/;
    if (storeNamePattern.test(content)) {
        console.log('✅ Test Passed: Dynamic store name using {qrCode.label} found.');
    } else {
        console.error('❌ Test Failed: Dynamic store name mapping is incorrect.');
        passed = false;
    }

    if (passed) {
        console.log('--- All UI Tests Passed successfully! ---');
        process.exit(0);
    } else {
        console.error('--- Some UI Tests Failed. ---');
        process.exit(1);
    }
}

testQRCodeModal();

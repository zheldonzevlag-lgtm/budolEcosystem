/**
 * Registration Modal UI Verification Test
 * 
 * This script verifies that the responsive design changes and scrollability
 * constraints are correctly implemented in LoginModal.jsx and AuthForm.jsx.
 * 
 * Run with: node scripts/test_scripts/budolShap/v2/verify-registration-modal-fix.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper for logging
const logTest = (name, passed, message = '') => {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} - ${name}${message ? ': ' + message : ''}`);
    return passed;
};

async function verifyLoginModal() {
    console.log('\n🔍 Verifying LoginModal.jsx responsive fixes...');
    
    const filePath = path.join(__dirname, '..', '..', '..', '..', 'budolshap-0.1.0', 'components', 'LoginModal.jsx');
    
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        
        const hasPadding4 = content.includes('p-4');
        const hasMaxWSmSmMaxWMd = content.includes('max-w-sm sm:max-w-md');
        const hasMaxH90vh = content.includes('max-h-[90vh]');
        const hasOverflowYAuto = content.includes('overflow-y-auto');
        const hasCustomScrollbar = content.includes('custom-scrollbar');
        const hasZ10OnClose = content.includes('z-10');
        
        logTest('Outer container padding (p-4)', hasPadding4);
        logTest('Responsive width (max-w-sm sm:max-w-md)', hasMaxWSmSmMaxWMd);
        logTest('Maximum height constraint (max-h-[90vh])', hasMaxH90vh);
        logTest('Vertical scrollability (overflow-y-auto)', hasOverflowYAuto);
        logTest('Custom scrollbar styling (custom-scrollbar)', hasCustomScrollbar);
        logTest('Close icon z-index (z-10)', hasZ10OnClose);
        
        return hasPadding4 && hasMaxWSmSmMaxWMd && hasMaxH90vh && hasOverflowYAuto && hasCustomScrollbar && hasZ10OnClose;
    } catch (error) {
        logTest('LoginModal.jsx Verification', false, error.message);
        return false;
    }
}

async function verifyAuthForm() {
    console.log('\n🔍 Verifying AuthForm.jsx responsive camera/selfie fixes...');
    
    const filePath = path.join(__dirname, '..', '..', '..', '..', 'budolshap-0.1.0', 'components', 'auth', 'AuthForm.jsx');
    
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        
        const hasResponsiveVideoContainer = content.includes('max-w-[280px] sm:max-w-[320px]');
        const hasResponsiveImageContainer = content.includes('max-w-[200px] sm:max-w-[240px]');
        
        logTest('Responsive camera video container', hasResponsiveVideoContainer);
        logTest('Responsive selfie image container', hasResponsiveImageContainer);
        
        return hasResponsiveVideoContainer && hasResponsiveImageContainer;
    } catch (error) {
        logTest('AuthForm.jsx Verification', false, error.message);
        return false;
    }
}

async function runTests() {
    console.log('🚀 Starting Registration Modal UI Verification...');
    
    const modalResults = await verifyLoginModal();
    const formResults = await verifyAuthForm();
    
    console.log('\n--- Final Verification Summary ---');
    if (modalResults && formResults) {
        console.log('✅ ALL UI CONSTRAINTS VERIFIED SUCCESSFULLY');
        process.exit(0);
    } else {
        console.log('❌ SOME VERIFICATIONS FAILED');
        process.exit(1);
    }
}

runTests();

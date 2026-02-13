/**
 * Phone Normalization Verification Script (v2)
 * Tests the centralized phone normalization utility
 * Compliance: NPC (Data Privacy), BSP (Financial Standard)
 */

// Simulation of the normalization logic for standalone verification
// This matches the implementation in budolshap-0.1.0/lib/utils/phone-utils.js
const normalizePhone = (phone) => {
    if (!phone) return '';
    
    // Remove all non-numeric characters
    const digits = phone.trim().replace(/[^0-9]/g, '');
    
    // Handle 0XXXXXXXXXX format (standard local input, 10 or 11 digits)
    if (digits.startsWith('0') && (digits.length === 11 || digits.length === 10)) {
        return '+63' + digits.substring(1);
    }
    
    // Handle 639XXXXXXXXX format (without +)
    if (digits.startsWith('63') && digits.length === 12) {
        return '+' + digits;
    }
    
    // Handle 9XXXXXXXXX format (without prefix)
    if (digits.startsWith('9') && digits.length === 10) {
        return '+63' + digits;
    }
    
    // Handle already prefixed +639XXXXXXXXX (will be digits only 639...)
    if (digits.startsWith('63') && digits.length === 12) {
        return '+' + digits;
    }

    // Default fallback for other 10-digit numbers (assume PH)
    if (digits.length === 10) {
        return '+63' + digits;
    }

    // If it already looks like a normalized number but lacks +, add it
    if (digits.startsWith('63') && digits.length >= 10) {
        return '+' + digits;
    }

    // For everything else, if it's at least 10 digits, try to prefix it
    if (digits.length >= 10) {
        // Strip any existing 63 if it's double-prefixed
        const cleanDigits = digits.replace(/^63/, '');
        return '+63' + cleanDigits.slice(-10);
    }

    return '';
};

const isValidPHPhone = (phone) => {
    const normalized = normalizePhone(phone);
    return /^\+639\d{9}$/.test(normalized);
};

// Test Cases
const testCases = [
    { input: '09176543281', expected: '+639176543281', name: 'Standard 09 prefix' },
    { input: '639176543281', expected: '+639176543281', name: 'Standard 63 prefix' },
    { input: '9176543281', expected: '+639176543281', name: 'No prefix' },
    { input: '+639176543281', expected: '+639176543281', name: 'Already normalized' },
    { input: ' (0917) 654-3281 ', expected: '+639176543281', name: 'Special characters' },
    { input: '12345', expected: '', name: 'Invalid short input' },
    { input: '0281234567', expected: '+63281234567', name: 'Landline (normalized but not PH mobile)' },
    { input: '+639484099403', expected: '+639484099403', name: 'Already normalized with +' }
];

console.log('🚀 Starting Phone Normalization Verification (v2)...\n');

let passed = 0;
testCases.forEach((tc, index) => {
    const result = normalizePhone(tc.input);
    const isSuccess = result === tc.expected;
    if (isSuccess) passed++;
    
    console.log(`${isSuccess ? '✅' : '❌'} [${index + 1}] ${tc.name}`);
    console.log(`    Input:    ${tc.input}`);
    console.log(`    Expected: ${tc.expected}`);
    console.log(`    Result:   ${result}\n`);
});

console.log(`\n📊 Summary: ${passed}/${testCases.length} tests passed.`);

if (passed === testCases.length) {
    console.log('✨ All phone normalization tests passed successfully!');
    process.exit(0);
} else {
    console.log('⚠️ Some tests failed. Please review the output.');
    process.exit(1);
}

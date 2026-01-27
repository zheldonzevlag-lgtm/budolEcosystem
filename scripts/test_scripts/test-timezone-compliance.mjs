
import { getNowUTC, formatManilaTime, getManilaDateString, getLegacyManilaISO } from '../../budolshap-0.1.0/lib/dateUtils.js';

function testTimezoneCompliance() {
    console.log('--- Timezone Compliance Test ---');
    
    const now = getNowUTC();
    console.log('1. getNowUTC():', now.toISOString());
    
    const manilaTime = formatManilaTime(now);
    console.log('2. formatManilaTime(now):', manilaTime);
    
    const dateString = getManilaDateString(now);
    console.log('3. getManilaDateString(now):', dateString);
    
    const legacyISO = getLegacyManilaISO();
    console.log('4. getLegacyManilaISO():', legacyISO);
    
    // Verify that formatManilaTime actually uses Asia/Manila
    const testDate = new Date('2026-01-22T00:00:00Z'); // Midnight UTC
    const formatted = formatManilaTime(testDate);
    console.log('5. formatManilaTime(Midnight UTC):', formatted);
    
    if (formatted.includes('8:00 AM') || formatted.includes('08:00')) {
        console.log('✅ SUCCESS: formatManilaTime correctly offset UTC by +8 hours.');
    } else {
        console.error('❌ FAILURE: formatManilaTime did not produce the expected +8 hour offset.');
    }

    console.log('6. formatManilaTime with dateStyle: "medium":');
    try {
        const styled = formatManilaTime(testDate, { dateStyle: 'medium' });
        console.log('   Result:', styled);
        console.log('✅ SUCCESS: formatManilaTime handled dateStyle without TypeError.');
    } catch (err) {
        console.error('❌ FAILURE: formatManilaTime threw error with dateStyle:', err.message);
    }
    console.log('--------------------------------');
}

testTimezoneCompliance();

// d:\IT Projects\budolEcosystem\scripts\test_scripts\auth_sync.test.js
const { describe, it, expect } = require('@jest/globals');

// Helper to normalize phone (simplified for test)
function normalizePhone(phone) {
    let normalized = phone.replace(/\D/g, '');
    if (normalized.startsWith('63') && normalized.length === 12) {
        return '+' + normalized;
    }
    if (normalized.startsWith('0') && normalized.length === 11) {
        return '+63' + normalized.substring(1);
    }
    return normalized;
}

describe('Auth Service Sync Logic', () => {
    it('should correctly normalize Philippine phone numbers', () => {
        expect(normalizePhone('09484099400')).toBe('+639484099400');
        expect(normalizePhone('639484099400')).toBe('+639484099400');
    });

    it('should mask PII for logs (Simulated)', () => {
        const email = 'ivarhanestad@gmail.com';
        const masked = email.replace(/^(.)(.*)(.@.*)$/, (m, p1, p2, p3) => p1 + '*'.repeat(p2.length) + p3);
        expect(masked).toContain('i**********d@gmail.com');
    });
});

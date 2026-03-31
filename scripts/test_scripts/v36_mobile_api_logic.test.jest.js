const { describe, it, expect } = require('@jest/globals');

/**
 * Ported Phone Normalization for Vercel Backend
 */
function normalizePhone(phone) {
    if (!phone) return null;
    let normalized = phone.replace(/\D/g, '');
    if (normalized.startsWith('0') && normalized.length === 11) {
        return '+63' + normalized.substring(1);
    }
    if (normalized.startsWith('63') && normalized.length === 12) {
        return '+' + normalized;
    }
    if (normalized.length === 10) {
        return '+63' + normalized;
    }
    return normalized.startsWith('+') ? normalized : '+' + normalized;
}

/**
 * Ported PII Masking for Vercel Logs
 */
function maskPII(value, type) {
    if (!value) return '***';
    if (type === 'EMAIL') {
        const [user, domain] = value.split('@');
        if (!domain) return value.charAt(0) + '***';
        return user.charAt(0) + '*'.repeat(user.length - 2) + user.slice(-1) + '@' + domain;
    }
    if (type === 'PHONE') {
        return value.slice(0, 3) + '*'.repeat(5) + value.slice(-3);
    }
    return '***';
}

describe('Vercel Mobile API Bridge Logic (v36)', () => {
    describe('Phone Normalization', () => {
        it('should convert 09-digit local to +63 format', () => {
            expect(normalizePhone('09484099400')).toBe('+639484099400');
        });
        it('should handle already normalized 63-digit to +63 format', () => {
            expect(normalizePhone('639484099400')).toBe('+639484099400');
        });
        it('should handle short 10-digit formats', () => {
            expect(normalizePhone('9484099400')).toBe('+639484099400');
        });
    });

    describe('PII Masking (Compliance/PCI DSS)', () => {
        it('should mask email addresses correctly', () => {
            const email = 'budoluser@gmail.com';
            const masked = maskPII(email, 'EMAIL');
            expect(masked).toBe('b*******r@gmail.com');
        });
        it('should mask phone numbers correctly', () => {
            const phone = '+639484099400';
            const masked = maskPII(phone, 'PHONE');
            expect(masked).toBe('+63*****400');
        });
    });
});

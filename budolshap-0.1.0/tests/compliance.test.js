import { maskPII, KYC_TIERS } from '../lib/compliance';

describe('Compliance Utilities', () => {
    
    test('maskPII should mask email', () => {
        expect(maskPII('user@example.com', 'EMAIL')).toBe('u***@example.com');
    });

    test('maskPII should mask phone', () => {
        expect(maskPII('09123456789', 'PHONE')).toBe('091*****789');
    });

    test('maskPII should auto-detect', () => {
        expect(maskPII('test@test.com')).toBe('t***@test.com');
        expect(maskPII('09171234567')).toBe('091*****567');
    });

    test('KYC Tiers should be defined', () => {
        expect(KYC_TIERS.VERIFIED).toBe('VERIFIED');
    });
});

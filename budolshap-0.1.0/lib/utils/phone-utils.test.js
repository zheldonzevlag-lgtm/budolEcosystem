import { normalizePhone, isValidPHPhone, formatPhoneForDisplay } from './phone-utils';

describe('Phone Normalization Utility', () => {
    describe('normalizePhone', () => {
        test('should normalize 09XXXXXXXXX format', () => {
            expect(normalizePhone('09176543281')).toBe('+639176543281');
        });

        test('should normalize 639XXXXXXXXX format', () => {
            expect(normalizePhone('639176543281')).toBe('+639176543281');
        });

        test('should normalize 9XXXXXXXXX format', () => {
            expect(normalizePhone('9176543281')).toBe('+639176543281');
        });

        test('should handle already normalized format', () => {
            expect(normalizePhone('+639176543281')).toBe('+639176543281');
        });

        test('should handle spaces and dashes', () => {
            expect(normalizePhone('0917-654-3281')).toBe('+639176543281');
            expect(normalizePhone('0917 654 3281')).toBe('+639176543281');
        });

        test('should return empty string for invalid input', () => {
            expect(normalizePhone('123')).toBe('');
            expect(normalizePhone('')).toBe('');
            expect(normalizePhone(null)).toBe('');
        });
    });

    describe('isValidPHPhone', () => {
        test('should return true for valid PH numbers', () => {
            expect(isValidPHPhone('09176543281')).toBe(true);
            expect(isValidPHPhone('+639176543281')).toBe(true);
            expect(isValidPHPhone('9176543281')).toBe(true);
        });

        test('should return false for invalid PH numbers', () => {
            expect(isValidPHPhone('08176543281')).toBe(false);
            expect(isValidPHPhone('1234567890')).toBe(false);
        });
    });

    describe('formatPhoneForDisplay', () => {
        test('should format for display', () => {
            expect(formatPhoneForDisplay('9176543281')).toBe('0917 654 3281');
            expect(formatPhoneForDisplay('+639176543281')).toBe('0917 654 3281');
        });
    });
});

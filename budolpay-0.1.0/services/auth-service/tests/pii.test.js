const { maskPII } = require('../index');

describe('PII Masking Compliance', () => {
    
    test('should mask email addresses correctly', () => {
        expect(maskPII('user@example.com', 'EMAIL')).toBe('u***@example.com');
        expect(maskPII('longname@test.co', 'EMAIL')).toBe('l*******@test.co');
    });

    test('should mask phone numbers correctly', () => {
        expect(maskPII('09123456789', 'PHONE')).toBe('091*****789');
        expect(maskPII('09123456789', 'AUTO')).toBe('091*****789');
    });

    test('should mask names correctly', () => {
        expect(maskPII('Juan', 'NAME')).toBe('J***');
        expect(maskPII('Dela Cruz', 'NAME')).toBe('D********');
    });

    test('should auto-detect types correctly', () => {
        expect(maskPII('test@email.com')).toBe('t***@email.com'); // Auto-detect Email
        expect(maskPII('09171234567')).toBe('091*****567');   // Auto-detect Phone
        expect(maskPII('Maria')).toBe('M****');                 // Fallback to Name
    });

    test('should handle edge cases', () => {
        expect(maskPII(null)).toBe('N/A');
        expect(maskPII(undefined)).toBe('N/A');
        expect(maskPII('')).toBe('N/A');
    });

});

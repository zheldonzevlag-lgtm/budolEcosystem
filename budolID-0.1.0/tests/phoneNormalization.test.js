// Test suite for phone number normalization utility
const { normalizePhilippinePhone, isValidE164Phone, formatPhoneForDisplay } = require('../utils/phoneNormalization');

describe('Phone Number Normalization', () => {
  describe('normalizePhilippinePhone', () => {
    test('should normalize local format 09XXXXXXXXX to +639XXXXXXXXX', () => {
      expect(normalizePhilippinePhone('09123456789')).toBe('+639123456789');
      expect(normalizePhilippinePhone('09987654321')).toBe('+639987654321');
    });

    test('should normalize format 639XXXXXXXXX to +639XXXXXXXXX', () => {
      expect(normalizePhilippinePhone('639123456789')).toBe('+639123456789');
      expect(normalizePhilippinePhone('639987654321')).toBe('+639987654321');
    });

    test('should normalize format 9XXXXXXXXX to +639XXXXXXXXX', () => {
      expect(normalizePhilippinePhone('9123456789')).toBe('+639123456789');
      expect(normalizePhilippinePhone('9987654321')).toBe('+639987654321');
    });

    test('should handle phone numbers with spaces and dashes', () => {
      expect(normalizePhilippinePhone('0912 345 6789')).toBe('+639123456789');
      expect(normalizePhilippinePhone('0912-345-6789')).toBe('+639123456789');
      expect(normalizePhilippinePhone('+63 912 345 6789')).toBe('+639123456789');
    });

    test('should return null for invalid phone numbers', () => {
      expect(normalizePhilippinePhone('123456789')).toBe(null); // Too short
      expect(normalizePhilippinePhone('091234567890')).toBe(null); // Too long
      expect(normalizePhilippinePhone('invalid')).toBe(null);
      expect(normalizePhilippinePhone('')).toBe(null);
      expect(normalizePhilippinePhone(null)).toBe(null);
      expect(normalizePhilippinePhone(undefined)).toBe(null);
    });

    test('should handle international format already in E.164', () => {
      expect(normalizePhilippinePhone('+639123456789')).toBe('+639123456789');
    });
  });

  describe('isValidE164Phone', () => {
    test('should validate correct E.164 format', () => {
      expect(isValidE164Phone('+639123456789')).toBe(true);
      expect(isValidE164Phone('+639987654321')).toBe(true);
    });

    test('should reject invalid formats', () => {
      expect(isValidE164Phone('09123456789')).toBe(false);
      expect(isValidE164Phone('639123456789')).toBe(false);
      expect(isValidE164Phone('9123456789')).toBe(false);
      expect(isValidE164Phone('+63912345678')).toBe(false); // Too short
      expect(isValidE164Phone('+6391234567890')).toBe(false); // Too long
      expect(isValidE164Phone('')).toBe(false);
      expect(isValidE164Phone(null)).toBe(false);
      expect(isValidE164Phone(undefined)).toBe(false);
    });
  });

  describe('formatPhoneForDisplay', () => {
    test('should format E.164 phone number for display', () => {
      expect(formatPhoneForDisplay('+639123456789')).toBe('+63 912 345 6789');
      expect(formatPhoneForDisplay('+639987654321')).toBe('+63 998 765 4321');
    });

    test('should return original input for invalid formats', () => {
      expect(formatPhoneForDisplay('09123456789')).toBe('09123456789');
      expect(formatPhoneForDisplay('invalid')).toBe('invalid');
      expect(formatPhoneForDisplay('')).toBe('');
      expect(formatPhoneForDisplay(null)).toBe(null);
    });
  });
});
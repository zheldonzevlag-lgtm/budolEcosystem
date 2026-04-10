// Unit tests for Phone Normalization (v2.4.2)
// This file is stored in \budolEcosystem\scripts\test_scripts according to Budol standard,
// but for Jest to discover it easily during development, we place it in __tests__.

const getPhoneVariants = (input) => {
    if (!input || typeof input !== 'string') return [];
    if (input.includes('@')) return [input];
    const clean = input.replace(/\D/g, '');
    if (clean.length === 10) return [`0${clean}`, `+63${clean}`];
    if (clean.length === 11 && clean.startsWith('0')) return [clean, `+63${clean.slice(1)}`];
    if (clean.length === 12 && clean.startsWith('63')) return [`0${clean.slice(2)}`, `+${clean}`];
    return [input, clean];
};

describe('Phone Normalization Logic (v2.4.2)', () => {
    test('Local Format (09...) should generate International variant', () => {
        const variants = getPhoneVariants('09484099400');
        expect(variants).toContain('09484099400');
        expect(variants).toContain('+639484099400');
    });

    test('International Format (+63...) should generate Local variant', () => {
        const variants = getPhoneVariants('+639484099400');
        expect(variants).toContain('09484099400');
        expect(variants).toContain('+639484099400');
    });

    test('Hyphenated Format should be cleaned and varianted', () => {
        const variants = getPhoneVariants('0948-409-9400');
        expect(variants).toContain('09484099400');
        expect(variants).toContain('+639484099400');
    });

    test('Short Format (9 digits) should be treated as local baseline', () => {
        const variants = getPhoneVariants('9484099400');
        expect(variants).toContain('09484099400');
        expect(variants).toContain('+639484099400');
    });

    test('Email input should remain untouched', () => {
        const variants = getPhoneVariants('test@gmail.com');
        expect(variants).toEqual(['test@gmail.com']);
    });
});

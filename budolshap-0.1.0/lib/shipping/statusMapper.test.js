/**
 * Test Suite for Universal Status Mapper
 * Run with: npm test lib/shipping/statusMapper.test.js
 */

import {
    normalizeStatus,
    getStatusLabel,
    isTerminalStatus,
    isActiveStatus,
    UNIVERSAL_STATUS
} from './statusMapper.js';

describe('Universal Status Mapper', () => {
    
    describe('Lalamove Regular Order Statuses', () => {
        const regularTests = [
            { input: 'ASSIGNING_DRIVER', expected: UNIVERSAL_STATUS.TO_SHIP },
            { input: 'ON_GOING', expected: UNIVERSAL_STATUS.TO_SHIP },
            { input: 'PICKED_UP', expected: UNIVERSAL_STATUS.SHIPPING },
            { input: 'IN_TRANSIT', expected: UNIVERSAL_STATUS.SHIPPING },
            { input: 'COMPLETED', expected: UNIVERSAL_STATUS.DELIVERED },
            { input: 'CANCELLED', expected: UNIVERSAL_STATUS.CANCELLED },
        ];

        regularTests.forEach(test => {
            it(`should map ${test.input} to ${test.expected}`, () => {
                const result = normalizeStatus(test.input, 'lalamove', false);
                expect(result).toBe(test.expected);
            });
        });
    });

    describe('Lalamove Return Statuses', () => {
        const returnTests = [
            { input: 'ASSIGNING_DRIVER', expected: UNIVERSAL_STATUS.TO_PICKUP },
            { input: 'ON_GOING', expected: UNIVERSAL_STATUS.TO_PICKUP },
            { input: 'PICKED_UP', expected: 'PICKED_UP' },
            { input: 'COMPLETED', expected: UNIVERSAL_STATUS.DELIVERED },
        ];

        returnTests.forEach(test => {
            it(`should map return status ${test.input} to ${test.expected}`, () => {
                const result = normalizeStatus(test.input, 'lalamove', true);
                expect(result).toBe(test.expected);
            });
        });
    });

    describe('Status Labels', () => {
        const labelTests = [
            { status: UNIVERSAL_STATUS.TO_SHIP, isReturn: false, expected: 'To Ship' },
            { status: UNIVERSAL_STATUS.TO_SHIP, isReturn: true, expected: 'To Pick Up' },
            { status: UNIVERSAL_STATUS.SHIPPING, isReturn: false, expected: 'Shipping' },
            { status: UNIVERSAL_STATUS.SHIPPING, isReturn: true, expected: 'Shipping to Seller' },
            { status: UNIVERSAL_STATUS.DELIVERED, isReturn: false, expected: 'Delivered' },
            { status: UNIVERSAL_STATUS.DELIVERED, isReturn: true, expected: 'Delivered to Seller' },
        ];

        labelTests.forEach(test => {
            it(`should provide label "${test.expected}" for status ${test.status} (isReturn: ${test.isReturn})`, () => {
                const result = getStatusLabel(test.status, test.isReturn);
                expect(result).toBe(test.expected);
            });
        });
    });

    describe('Terminal Status Detection', () => {
        const terminalTests = [
            { status: UNIVERSAL_STATUS.COMPLETED, expected: true },
            { status: UNIVERSAL_STATUS.CANCELLED, expected: true },
            { status: UNIVERSAL_STATUS.REFUNDED, expected: true },
            { status: UNIVERSAL_STATUS.TO_SHIP, expected: false },
            { status: UNIVERSAL_STATUS.SHIPPING, expected: false },
        ];

        terminalTests.forEach(test => {
            it(`should identify ${test.status} as ${test.expected ? 'terminal' : 'non-terminal'}`, () => {
                const result = isTerminalStatus(test.status);
                expect(result).toBe(test.expected);
            });
        });
    });

    describe('Active Status Detection', () => {
        const activeTests = [
            { status: UNIVERSAL_STATUS.TO_SHIP, expected: true },
            { status: UNIVERSAL_STATUS.SHIPPING, expected: true },
            { status: UNIVERSAL_STATUS.TO_PICKUP, expected: true },
            { status: UNIVERSAL_STATUS.DELIVERED, expected: false },
            { status: UNIVERSAL_STATUS.REFUNDED, expected: false },
        ];

        activeTests.forEach(test => {
            it(`should identify ${test.status} as ${test.expected ? 'active' : 'inactive'}`, () => {
                const result = isActiveStatus(test.status);
                expect(result).toBe(test.expected);
            });
        });
    });

    describe('Edge Cases', () => {
        const edgeCases = [
            { input: null, expected: null, desc: 'null input' },
            { input: '', expected: null, desc: 'empty string' },
            { input: 'UNKNOWN_STATUS', expected: null, desc: 'unknown status' },
            { input: 'assigning_driver', expected: UNIVERSAL_STATUS.TO_SHIP, desc: 'lowercase input' },
        ];

        edgeCases.forEach(test => {
            it(`should handle ${test.desc}`, () => {
                const result = normalizeStatus(test.input, 'lalamove', false);
                expect(result).toBe(test.expected);
            });
        });
    });
});
